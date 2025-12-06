
// ... existing imports ...
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Groq } from 'groq-sdk';
import type { FileNode, Problem, UploadedFile, AppSettings, EvaluationResult } from '../types';
import { generateId, retryWithBackoff, RateLimiter } from '../utils';
import { MODEL_LIMITS, GROQ_FALLBACK_API_KEY } from '../constants';

// Define ResponseSchema type locally since it's not exported from @google/genai
type ResponseSchema = Record<string, any>;

// Get API key from environment - supports both local and production
const getApiKey = () => {
    const importMetaEnv = (import.meta as any).env;
    return process.env.API_KEY || process.env.GEMINI_API_KEY || importMetaEnv?.VITE_GEMINI_API_KEY || '';
};

// Initialize with API key - will throw error if not set, which is caught by ErrorBoundary
const API_KEY = getApiKey();
if (!API_KEY) {
    console.error('❌ CRITICAL: GEMINI_API_KEY not found!');
    console.error('Please set VITE_GEMINI_API_KEY in your Netlify environment variables.');
    console.error('The app will not function without an API key.');
}

const geminiAi = new GoogleGenAI({ apiKey: API_KEY || 'dummy-key-will-fail' });

// ... existing helper functions ...
// ... existing RateLimiter setup ...
const GROQ_MODELS: Record<string, string> = {
    'Llama 3 70B (Groq)': 'llama3-70b-8192',
    'Llama 4 Maverick (Groq)': 'llama-3.1-70b-versatile',
    'meta-llama/llama-4-maverick-17b-128e-instruct': 'meta-llama/llama-4-maverick-17b-128e-instruct'
};

const GENERIC_MODELS: Record<string, { id: string, baseUrl: string, keyName: keyof AppSettings['apiKeys'] }> = {
    'grok-1': { id: 'grok-1', baseUrl: 'https://api.x.ai/v1', keyName: 'grok' },
    'qwen-coder': { id: 'qwen-2.5-coder-32b-instruct', baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', keyName: 'qwen' },
    'claude-3-opus': { id: 'claude-3-opus-20240229', baseUrl: 'https://api.anthropic.com/v1', keyName: 'claude' },
    'meta-llama-3-70b': { id: 'meta-llama/Llama-3-70b-chat-hf', baseUrl: 'https://api.deepinfra.com/v1/openai', keyName: 'meta' }
};

type Provider = 'GOOGLE' | 'GROQ' | 'GENERIC';

const getModelProvider = (modelName: string): Provider => {
    if (modelName.includes('(Groq)') || modelName.toLowerCase().includes('llama')) return 'GROQ';
    if (GENERIC_MODELS[modelName]) return 'GENERIC';
    return 'GOOGLE';
};

const rateLimiters = new Map<string, RateLimiter>();

function getRateLimiter(model: string): RateLimiter {
    if (!rateLimiters.has(model)) {
        const rpm = MODEL_LIMITS[model]?.rpm || 15;
        rateLimiters.set(model, new RateLimiter(rpm));
    }
    return rateLimiters.get(model)!;
}

class RequestCache {
    private cache = new Map<string, string>();
    private maxEntries = 50;

    get(key: string): string | undefined {
        return this.cache.get(key);
    }

    set(key: string, value: string) {
        if (this.cache.size >= this.maxEntries) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        this.cache.set(key, value);
    }
}
const apiCache = new RequestCache();

const handleApiError = (error: any, provider: string): never => {
    let msg = error.message || error.toString();
    
    if (msg.includes('Aborted') || error.name === 'AbortError') {
        throw new Error('Aborted');
    }

    try {
        if (typeof msg === 'string' && (msg.trim().startsWith('{') || msg.includes('"{'))) {
            const jsonMatch = msg.match(/({.*})/);
            const jsonStr = jsonMatch ? jsonMatch[0] : msg;
            
            const parsed = JSON.parse(jsonStr);
            if (parsed.error) {
                if (parsed.error.code === 429 || parsed.error.status === 'RESOURCE_EXHAUSTED' || parsed.error.message?.includes('quota')) {
                    throw new Error('FALLBACK_TRIGGER');
                }
                msg = `${parsed.error.code ? parsed.error.code + ' ' : ''}${parsed.error.status || ''}: ${parsed.error.message}`;
            }
        }
    } catch (e) {
        if ((e as Error).message === 'FALLBACK_TRIGGER') throw e;
    }

    console.error(`${provider} API Error:`, error);

    if (msg.includes('429') || msg.includes('quota') || msg.includes('503') || msg.includes('500') || msg.includes('Rate limit exceeded') || msg.includes('RESOURCE_EXHAUSTED')) {
        throw new Error('FALLBACK_TRIGGER');
    }

    if (msg.includes('401') || msg.includes('403') || msg.includes('API key')) {
        throw new Error(`Invalid API Key for ${provider}. Please check your settings.`);
    }
    if (msg.includes('fetch') || msg.includes('network') || msg.includes('Failed to fetch')) {
        throw new Error("Network connection error. Please check your internet connection.");
    }
    
    throw new Error(`${provider} Error: ${msg}`);
};

interface SecurityScanResult {
    valid: boolean;
    errors: string[];
}

const scanForSecurityVulnerabilities = (files: FileNode[]): SecurityScanResult => {
    const errors: string[] = [];
    const scanNode = (node: FileNode) => {
        if (node.type === 'file' && node.content) {
            if (/\.(js|jsx|ts|tsx|vue)$/.test(node.name)) {
                if (/\.innerHTML\s*=\s*[^"']/.test(node.content)) {
                    errors.push(`Security Risk in ${node.name}: Unsafe innerHTML assignment detected. Use textContent or safe DOM methods.`);
                }
                if (/\beval\s*\(/.test(node.content)) {
                    errors.push(`Security Risk in ${node.name}: Usage of eval() is prohibited.`);
                }
            }
            if (/(const|let|var)\s+\w*(key|token|secret)\w*\s*=\s*['"][A-Za-z0-9\-_]{20,}['"]/i.test(node.content)) {
                 if (!node.content.includes('generateId') && !node.content.includes('process.env')) {
                     errors.push(`Security Risk in ${node.name}: Potential hardcoded secret/API key detected.`);
                 }
            }
        }
        if (node.children) node.children.forEach(scanNode);
    };
    files.forEach(scanNode);
    return { valid: errors.length === 0, errors };
};

// ... existing search functions ...
async function searchWithGoogle(userPrompt: string, signal?: AbortSignal): Promise<string> {
    const model = 'gemini-2.5-flash';
    // Removed rate limit schedule here to fail fast if quota is empty
    if (signal?.aborted) throw new Error('Aborted');

    try {
        const result = await retryWithBackoff<GenerateContentResponse>(() => geminiAi.models.generateContent({
            model,
            contents: `User Query: "${userPrompt}"
            
            Task: Determine if this query requires up-to-date external information.
            If YES: Use googleSearch to find it and summarize technical details.
            If NO: Return "NO_SEARCH_NEEDED".`,
            config: {
                tools: [{ googleSearch: {} }],
                systemInstruction: "You are a helpful research assistant."
            }
        }), 1, 1000, 2, (err) => { // Reduced retries for search
            const msg = err.toString();
            return !msg.includes('429') && !msg.includes('RESOURCE_EXHAUSTED');
        });

        if (result.text && !result.text.includes('NO_SEARCH_NEEDED')) {
            return `[Source: Google Search via Gemini]\n${result.text}`;
        }
        return '';
    } catch (e: any) {
        if (e.message?.includes('429') || e.message?.includes('RESOURCE_EXHAUSTED')) {
            console.warn("Gemini Search quota exceeded. Skipping Google Search.");
            return ''; // Soft fail for search
        }
        throw e;
    }
}

// ... existing Serper/Tavily/DDG search functions ...
async function searchWithSerper(query: string, apiKey: string, signal?: AbortSignal): Promise<string> {
    if (signal?.aborted) throw new Error('Aborted');
    try {
        const response = await fetch('https://google.serper.dev/search', {
            method: 'POST',
            headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' },
            body: JSON.stringify({ q: query, num: 3 }),
            signal
        });
        if (!response.ok) throw new Error(`Serper Error: ${response.status}`);
        const data = await response.json();
        const organic = data.organic || [];
        if (organic.length === 0) return '';
        const summary = organic.map((r: any) => `- ${r.title}: ${r.snippet}`).join('\n');
        return `[Source: Serper API]\n${summary}`;
    } catch (e) {
        console.warn("Serper search failed:", e);
        return '';
    }
}

async function searchWithTavily(query: string, apiKey: string, signal?: AbortSignal): Promise<string> {
    if (signal?.aborted) throw new Error('Aborted');
    try {
        const response = await fetch('https://api.tavily.com/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ api_key: apiKey, query: query, search_depth: "basic", max_results: 3 }),
            signal
        });
        if (!response.ok) throw new Error(`Tavily Error: ${response.status}`);
        const data = await response.json();
        const results = data.results || [];
        if (results.length === 0) return '';
        const summary = results.map((r: any) => `- ${r.title}: ${r.content}`).join('\n');
        return `[Source: Tavily AI]\n${summary}`;
    } catch (e) {
        console.warn("Tavily search failed:", e);
        return '';
    }
}

async function searchWithDDG(query: string, signal?: AbortSignal): Promise<string> {
    if (signal?.aborted) throw new Error('Aborted');
    try {
        const response = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`, { signal });
        if (!response.ok) throw new Error(`DDG Error: ${response.status}`);
        const data = await response.json();
        if (data.AbstractText) return `[Source: DuckDuckGo]\n${data.AbstractText}`;
        return '';
    } catch (e) {
        console.warn("DDG search failed:", e);
        return '';
    }
}

async function performRobustSearch(userPrompt: string, appSettings: AppSettings, signal?: AbortSignal): Promise<string> {
    const cacheKey = `SEARCH:${userPrompt}`;
    const cached = apiCache.get(cacheKey);
    if (cached) return cached;

    let searchResult = '';
    
    // Try Google Search first - handle quota gracefully (soft fail)
    try {
        searchResult = await searchWithGoogle(userPrompt, signal);
        if (searchResult) { apiCache.set(cacheKey, searchResult); return searchResult; }
    } catch (e: any) { 
        if (e.message?.includes('429') || e.message?.includes('RESOURCE_EXHAUSTED') || e.message?.includes('quota')) {
            console.warn("Gemini Search quota exceeded. Skipping Google Search.");
            // Return empty string instead of throwing - allows workflow to continue
            return '';
        } else {
            console.log("Primary search failed:", e);
        }
    }

    // Fallbacks
    if (appSettings.apiKeys.serper) {
        try {
            searchResult = await searchWithSerper(userPrompt, appSettings.apiKeys.serper, signal);
            if (searchResult) { apiCache.set(cacheKey, searchResult); return searchResult; }
        } catch (e) { console.warn("Serper search failed:", e); }
    }

    if (appSettings.apiKeys.tavily) {
        try {
            searchResult = await searchWithTavily(userPrompt, appSettings.apiKeys.tavily, signal);
            if (searchResult) { apiCache.set(cacheKey, searchResult); return searchResult; }
        } catch (e) { console.warn("Tavily search failed:", e); }
    }

    // Last resort
    try {
        searchResult = await searchWithDDG(userPrompt, signal);
        if (searchResult) { apiCache.set(cacheKey, searchResult); return searchResult; }
    } catch (e) { console.warn("DDG search failed:", e); }

    // Return empty string if all searches fail - graceful degradation
    return '';
}

// Implement Groq API using SDK for reliability
async function callGroqApi(modelId: string, systemInstruction: string, userPrompt: string, isJson: boolean, apiKey: string, signal?: AbortSignal): Promise<string> {
    const cacheKey = `GROQ:${modelId}:${systemInstruction}:${userPrompt}`;
    const cached = apiCache.get(cacheKey);
    if (cached) return cached;
    if (signal?.aborted) throw new Error('Aborted');

    try {
        const groq = new Groq({ apiKey, dangerouslyAllowBrowser: true });
        
        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: systemInstruction },
                { role: 'user', content: userPrompt }
            ],
            model: modelId,
            temperature: 0.5,
            max_completion_tokens: 4096,
            top_p: 1,
            stream: false,
            ...(isJson ? { response_format: { type: "json_object" } } : {})
        });

        let content = completion.choices[0]?.message?.content || '';
        if (!content) throw new Error("Empty response from Groq");
        
        // Sanitize Llama responses - strip markdown code blocks if JSON is expected
        if (isJson) {
            content = content.trim();
            // Strip markdown code blocks (common with Llama 4 Maverick)
            if (content.startsWith('```json')) {
                content = content.replace(/^```json\s*/, '').replace(/```\s*$/, '');
            } else if (content.startsWith('```')) {
                content = content.replace(/^```\s*/, '').replace(/```\s*$/, '');
            }
            // Additional cleanup for any remaining backticks
            content = content.replace(/^`+|`+$/g, '');
        }
        
        apiCache.set(cacheKey, content);
        return content;
    } catch (error: any) {
        // Better error handling for connection issues
        if (error.message?.includes('fetch') || error.message?.includes('network') || error.message?.includes('Connection')) {
            console.warn('Groq connection error, will try fallback models');
            throw new Error('FALLBACK_TRIGGER');
        }
        handleApiError(error, 'Groq');
        return '';
    }
}

async function callGeminiApi(model: string, systemInstruction: string, userPrompt: string, responseSchema?: ResponseSchema, signal?: AbortSignal): Promise<GenerateContentResponse> {
    const cacheKey = `GEMINI:${model}:${systemInstruction}:${userPrompt}`;
    const cached = apiCache.get(cacheKey);
    if (cached) return { text: cached } as GenerateContentResponse;
    if (signal?.aborted) throw new Error('Aborted');
    await getRateLimiter(model).schedule();
    if (signal?.aborted) throw new Error('Aborted');
    
    try {
        const result = await retryWithBackoff<GenerateContentResponse>(() => geminiAi.models.generateContent({
            model,
            contents: userPrompt,
            config: {
                systemInstruction,
                ...(responseSchema && { responseMimeType: "application/json", responseSchema }),
            },
        }), 3, 1000, 2, (err) => {
            const msg = err.toString();
            return !msg.includes('429') && !msg.includes('RESOURCE_EXHAUSTED') && !msg.includes('quota');
        });
        if (signal?.aborted) throw new Error('Aborted');
        if (result.text) {
            apiCache.set(cacheKey, result.text);
            if (result.usageMetadata) {
                window.dispatchEvent(new CustomEvent('gemini-api-usage', { detail: { model, tokens: result.usageMetadata.totalTokenCount || 0 } }));
            }
        }
        return result;
    } catch (error) {
        handleApiError(error, 'Gemini');
        return {} as GenerateContentResponse;
    }
}

async function generateContentWithFallback(startModel: string, systemInstruction: string, userPrompt: string, appSettings: AppSettings, responseSchema?: ResponseSchema, signal?: AbortSignal): Promise<string> {
    // Explicitly fallback to the user's requested Llama 4 model
    const modelsToTry = [startModel, 'meta-llama/llama-4-maverick-17b-128e-instruct', 'Llama 3 70B (Groq)'];
    const uniqueModels = Array.from(new Set(modelsToTry));
    let lastError: Error | null = null;

    for (const modelName of uniqueModels) {
        if (signal?.aborted) throw new Error('Aborted');
        try {
            console.log(`Attempting generation with model: ${modelName}`);
            const provider = getModelProvider(modelName);
            if (provider === 'GROQ' && !appSettings.apiKeys.grok && !GROQ_FALLBACK_API_KEY) continue;
            
            if (provider === 'GOOGLE') {
                const response = await callGeminiApi(modelName, systemInstruction, userPrompt, responseSchema, signal);
                return response.text || '';
            } else if (provider === 'GROQ') {
                const apiKey = appSettings.apiKeys.grok || GROQ_FALLBACK_API_KEY;
                const modelId = GROQ_MODELS[modelName] || modelName;
                return await callGroqApi(modelId, systemInstruction, userPrompt, !!responseSchema, apiKey, signal);
            }
        } catch (error: any) {
            if (error.message === 'Aborted') throw error;
            console.warn(`Model ${modelName} failed:`, error.message);
            lastError = error;
            if (error.message.includes('Invalid API Key') || error.message.includes('FALLBACK_TRIGGER')) {
                window.dispatchEvent(new CustomEvent('model-fallback', { detail: { fallbackModel: modelName, error: error.message } }));
                continue; 
            }
            window.dispatchEvent(new CustomEvent('model-fallback', { detail: { fallbackModel: modelName, error: error.message } }));
        }
    }
    throw new Error(`All models failed. Last error: ${lastError?.message}`);
}

async function generateContent(modelName: string, systemInstruction: string, userPrompt: string, appSettings: AppSettings, responseSchema?: ResponseSchema, signal?: AbortSignal): Promise<string> {
    if (signal?.aborted) throw new Error('Aborted');
    let searchContext = '';
    // Skip search if we suspect quota issues to speed up fallback
    if (!userPrompt.includes('Generate the JSON response')) { 
         try {
            searchContext = await performRobustSearch(userPrompt, appSettings, signal);
            if (searchContext) console.log("Search Context successfully retrieved.");
         } catch (e) {
             console.warn("Search augmentation failed, proceeding without search context:", e);
         }
    }
    const augmentedPrompt = searchContext ? `${searchContext}\n\n${userPrompt}` : userPrompt;
    return await generateContentWithFallback(modelName, systemInstruction, augmentedPrompt, appSettings, responseSchema, signal);
}

// ... existing format helper functions ...
const formatFilesForPrompt = (files: FileNode[]): string => {
  let fileString = '';
  const generateString = (nodes: FileNode[], prefix = '') => {
    for (const node of nodes) {
      if (node.type === 'file') {
        fileString += `\n\n\`\`\`${node.path}\n${node.content}\n\`\`\`\n\n`;
      }
      if (node.children) generateString(node.children, `${prefix}${node.name}/`);
    }
  };
  generateString(files);
  return fileString;
};

const formatUploadedFilesForPrompt = (uploadedFiles: UploadedFile[]): string => {
  if (uploadedFiles.length === 0) return '';
  let fileString = 'The user has also uploaded the following reference files:\n';
  uploadedFiles.forEach(file => { fileString += `- ${file.name} (${file.type})\n`; });
  return fileString;
};

// ... existing schemas ...
const simpleFileSchema = {
  type: Type.OBJECT,
  properties: { id: { type: Type.STRING }, name: { type: Type.STRING }, type: { type: Type.STRING, enum: ['file', 'folder'] }, path: { type: Type.STRING }, content: { type: Type.STRING, nullable: true }, },
  required: ['id', 'name', 'type', 'path'],
};
const fileSchema = {
    type: Type.OBJECT,
    properties: {
        id: { type: Type.STRING }, name: { type: Type.STRING }, type: { type: Type.STRING, enum: ['file', 'folder'] },
        path: { type: Type.STRING }, content: { type: Type.STRING, nullable: true },
        children: { type: Type.ARRAY, items: simpleFileSchema, nullable: true },
    },
    required: ['id', 'name', 'type', 'path'],
};

// ... existing agent functions ...
export const generatePlan = async (prompt: string, model: string, uploadedFiles: UploadedFile[], appSettings: AppSettings, signal?: AbortSignal): Promise<string[]> => {
  if (signal?.aborted) throw new Error('Aborted');
  const systemInstruction = `You are a Lead **Planner Agent**.
  TASK: Create a MINIMAL, high-level execution plan.
  MANDATES:
  1. **MAXIMUM 2-3 TASKS ONLY**: Batch ALL work into 2-3 large parallel tasks.
  2. **Task 1**: "Initialize project structure with complete, visible HTML content (hero, features, footer)"
  3. **Task 2**: "Implement all features, UI components, styling, and interactivity in parallel"
  4. **Task 3** (optional): "Add final polish, animations, testing, and deployment config"
  5. **Visuals FIRST**: Complete HTML with ALL sections visible must be in Task 1 for immediate preview.
  6. **Architecture**: Detect Web vs Mobile (React Native/Expo/Flutter).
  7. **NO LOADING STATES**: Task 1 must create COMPLETE, VISIBLE content (not "Loading..." placeholders).
  Respond with a JSON array of 2-3 strings ONLY.`;
  const userPrompt = `Prompt: "${prompt}"\n\n${formatUploadedFilesForPrompt(uploadedFiles)}\n\nGenerate the plan with MAXIMUM 2-3 tasks.`;
  const responseText = await generateContent(model, systemInstruction, userPrompt, appSettings, { type: Type.ARRAY, items: { type: Type.STRING } }, signal);
  
  // Harden parsing to handle various LLM response formats (especially Llama fallback)
  try {
    // Strip markdown code blocks if present (common with Llama models)
    let cleanedText = responseText.trim();
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/```\s*$/, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```\s*/, '').replace(/```\s*$/, '');
    }
    
    const parsed = JSON.parse(cleanedText);
    
    // Ensure we always return an array
    if (Array.isArray(parsed)) {
      const stringItems = parsed.filter(item => typeof item === 'string');
      return stringItems.length > 0 ? stringItems : ['Initialize project structure', 'Implement core features', 'Add styling and polish'];
    } else if (typeof parsed === 'object' && parsed !== null) {
      // If it's an object, try to extract an array property
      if (Array.isArray(parsed.plan)) return parsed.plan;
      if (Array.isArray(parsed.tasks)) return parsed.tasks;
      if (Array.isArray(parsed.steps)) return parsed.steps;
      // If it's a single object, wrap it in an array
      return [JSON.stringify(parsed)];
    } else if (typeof parsed === 'string') {
      // If it's a string, wrap it in an array
      return [parsed];
    }
    
    // Fallback: return a default plan
    console.warn('generatePlan received unexpected format, using default plan');
    return ['Initialize project structure', 'Implement core features', 'Add styling and polish'];
  } catch (e) {
    console.error('generatePlan JSON parse error:', e, 'Raw response:', responseText);
    // Return a default plan instead of throwing - GUARANTEES array return
    return ['Initialize project structure', 'Implement core features', 'Add styling and polish'];
  }
};

export const architectProject = async (prompt: string, model: string, appSettings: AppSettings, signal?: AbortSignal): Promise<FileNode[]> => {
    if (signal?.aborted) throw new Error('Aborted');
    const systemInstruction = `You are an **Architect Agent** - Expert in selecting optimal tech stacks.
    
    TASK: Analyze requirements and select the BEST architecture and technology stack.
    
    **TECHNOLOGY SELECTION CRITERIA**:
    1. **Web Apps**: React + Vite + Tailwind CSS (modern, fast, futuristic UI)
    2. **Mobile Apps**: 
       - React Native + Expo (cross-platform, fast development)
       - Flutter (high performance, beautiful UI)
    3. **Full-Stack**: Next.js (SSR, API routes, SEO)
    4. **Backend**: Node.js + Express (simple) OR Python + FastAPI (data-heavy)
    5. **Real-time**: Socket.io or WebSockets
    6. **Database**: Firebase (quick), PostgreSQL (production), MongoDB (flexible)
    
    **ARCHITECTURE PATTERNS**:
    - SPA (Single Page App) for dashboards
    - SSR (Server-Side Rendering) for SEO-critical sites
    - PWA (Progressive Web App) for offline capability
    - Microservices for scalable backends
    
    **FILE STRUCTURE MANDATES**:
    - **Clean Structure**: Do NOT create redundant nested folders like 'src/src'
    - **Basic Content**: Create files with MINIMAL boilerplate content (not empty)
    - **Essential Files**: Include index.html, package.json, README.md, tailwind.config.js
    - **Web Projects**: MUST include index.html with futuristic Tailwind CSS styling
    - **Mobile**: React Native (App.js, package.json) OR Flutter (lib/main.dart, pubspec.yaml)
    
    **FUTURISTIC STARTER TEMPLATE**:
    - Include Tailwind CSS with custom config (neon colors, glassmorphism)
    - Add basic components: Navbar (floating, rounded-3xl), Hero, Footer
    - Include animations and transitions
    - Mobile-responsive from the start
    
    **🚨 CRITICAL: COMPLETE VISIBLE CONTENT - NO LOADING SCREENS 🚨**:
    - ❌ NEVER EVER create "Loading..." screens or splash pages
    - ❌ NEVER use "Loading FuturEstate..." or "Your experience is about to begin"
    - ❌ NEVER create placeholder or waiting screens
    - ✅ index.html MUST have COMPLETE, VISIBLE, PRODUCTION-READY content immediately
    - ✅ Include hero section with headline, description, CTA button
    - ✅ Include features/services section with cards and images
    - ✅ Include footer with links and copyright
    - ✅ Use realistic content relevant to the project purpose (not Lorem Ipsum)
    - ✅ ALL sections must be visible immediately when preview loads
    - ✅ Show the ACTUAL website, not a loading screen
    
    **EXAMPLE - REAL ESTATE WEBSITE**:
    ✅ CORRECT: Hero with "Find Your Dream Home", property cards with images/prices, search filters
    ❌ WRONG: "Loading FuturEstate...Your next-gen real estate experience is about to begin"
    
    OUTPUT: JSON object with a "files" array containing the optimal architecture.`;
    const userPrompt = `Request: "${prompt}"\n\nAnalyze and select the best technology stack, then generate initial project structure with COMPLETE, VISIBLE content (hero, features, footer - NO loading screens).`;
    const responseText = await generateContent(model, systemInstruction, userPrompt, appSettings, { type: Type.OBJECT, properties: { files: { type: Type.ARRAY, items: fileSchema } } }, signal);
    try { 
        const res = JSON.parse(responseText); 
        const files = res.files || [];
        
        // Validate HTML files don't have loading screens
        const htmlFiles = files.filter((f: FileNode) => 
            f.type === 'file' && f.name.toLowerCase().endsWith('.html')
        );
        
        for (const htmlFile of htmlFiles) {
            const content = htmlFile.content || '';
            const loadingPatterns = [
                /loading\s+\w+\.\.\./i,
                /your\s+.*\s+experience\s+is\s+about\s+to\s+begin/i,
                /preparing\s+your/i
            ];
            
            const hasLoadingScreen = loadingPatterns.some(pattern => pattern.test(content));
            if (hasLoadingScreen) {
                console.warn('⚠️ Architecture generated loading screen - this should not happen');
                // Don't retry here, just log - the implementTask will catch it
            }
        }
        
        return files;
    } catch { return []; }
}

const implementTaskResponseSchema = {
    type: Type.OBJECT,
    properties: {
        files: { type: Type.ARRAY, items: fileSchema, nullable: true },
        pause: { type: Type.OBJECT, properties: { reason: { type: Type.STRING } }, nullable: true }
    }
};

export const implementTask = async (
    prompt: string, currentFiles: FileNode[], task: string, model: string, uploadedFiles: UploadedFile[],
    agentLogs: string[], attemptNumber: number, lastError: string | null, resumeContext: string | null, appSettings: AppSettings,
    signal?: AbortSignal
): Promise<{ files: FileNode[]; pause: { reason: string } | null }> => {
    if (signal?.aborted) throw new Error('Aborted');
    if (attemptNumber > 3) throw new Error(`Failed to implement task after 3 attempts. Last error: ${lastError}`);

    const systemInstruction = `You are an expert **Coder Agent** specializing in Full-Stack & Mobile Development.
    
    **ROLES**:
    - **UI Specialist**: Design beautiful, futuristic interfaces (Glassmorphism, Neon, Animations).
    - **Backend Engineer**: Secure, scalable APIs (Node/Python/Go).
    - **Mobile Dev**: Expert in React Native (Expo) AND Flutter (Dart).
    
    **🎨 FUTURISTIC UI REQUIREMENTS (MANDATORY FOR ALL WEB APPS)**:
    
    **1. CURVED ELEMENTS (rounded-3xl everywhere)**:
    - Buttons: rounded-3xl px-8 py-4 (large touch targets)
    - Cards: rounded-3xl overflow-hidden shadow-2xl
    - Inputs: rounded-3xl px-6 py-3 border-2
    - Modals: rounded-3xl backdrop-blur-xl
    - Containers: rounded-3xl border border-white/20
    - Images: rounded-3xl or rounded-2xl
    
    **2. NEON GLOW EFFECTS (box-shadow)**:
    - Primary buttons: shadow-[0_0_30px_rgba(6,182,212,0.6)] hover:shadow-[0_0_50px_rgba(6,182,212,0.8)]
    - Cards on hover: shadow-[0_0_40px_rgba(168,85,247,0.4)]
    - Success elements: shadow-[0_0_25px_rgba(34,197,94,0.5)]
    - Danger elements: shadow-[0_0_25px_rgba(239,68,68,0.5)]
    - Focus states: ring-4 ring-cyan-500/50
    
    **3. GLASSMORPHISM (backdrop-blur)**:
    - Navbar: backdrop-blur-xl bg-black/30 border-b border-white/10
    - Modals: backdrop-blur-2xl bg-white/10 border border-white/20
    - Cards: backdrop-blur-lg bg-gradient-to-br from-white/10 to-white/5
    - Floating elements: backdrop-blur-md bg-black/40
    
    **4. MULTI-COLOR GRADIENTS**:
    - Hero sections: bg-gradient-to-br from-purple-900 via-blue-900 to-cyan-900
    - CTA buttons: bg-gradient-to-r from-cyan-500 via-purple-500 to-emerald-500
    - Hover effects: hover:bg-gradient-to-l from-emerald-500 via-cyan-500 to-purple-500
    - Text gradients: bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent
    - Unless user specifies colors, use: cyan-400/500, purple-500/600, emerald-500, blue-500
    
    **5. SMOOTH ANIMATIONS & FRAMER MOTION**:
    - All transitions: transition-all duration-300 ease-in-out
    - Hover scale: hover:scale-105 active:scale-95
    - Fade in: animate-fade-in (define @keyframes if needed)
    - Slide up: animate-slide-up
    - Pulse on important elements: animate-pulse
    - Smooth scroll: scroll-behavior: smooth in CSS
    - **Framer Motion (for React projects)**: Use framer-motion for advanced animations
      - Fade in on scroll: <motion.div initial={{opacity:0}} whileInView={{opacity:1}} transition={{duration:0.5}}>
      - Slide up: <motion.div initial={{y:50}} whileInView={{y:0}} transition={{duration:0.5}}>
      - Stagger children: Use staggerChildren in parent variants
      - Page transitions: Use AnimatePresence for route changes
    - **CSS Animations (for HTML projects)**: Define custom @keyframes for complex animations
      - Floating effect: @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }
      - Rotate: @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      - Glow pulse: @keyframes glow { 0%, 100% { box-shadow: 0 0 20px rgba(6,182,212,0.5); } 50% { box-shadow: 0 0 40px rgba(6,182,212,0.8); } }
    
    **6. FLOATING NAVBAR (sticky/fixed)**:
    - Position: fixed top-0 w-full z-50
    - Style: backdrop-blur-xl bg-black/30 border-b border-white/10
    - Mobile: Hamburger menu (☰) that toggles sidebar
    - Desktop: Horizontal nav with rounded-3xl buttons
    - Logo: Left side with gradient text
    - Links: Smooth scroll to sections with active state
    
    **7. HAMBURGER MENU (mobile)**:
    - Icon: Three lines (☰) that animates to X when open
    - Sidebar: Fixed right-0 h-full backdrop-blur-2xl bg-black/90
    - Animation: Slide in from right with transition-transform
    - Close: Click outside or X button
    - Links: Large touch targets (py-4) with hover effects
    
    **8. BACK TO TOP BUTTON**:
    - Position: fixed bottom-8 right-8 z-50
    - Style: rounded-full w-14 h-14 bg-gradient-to-r from-emerald-500 to-cyan-500
    - Icon: ↑ or chevron-up
    - Behavior: Hidden until scroll > 300px, smooth scroll to top
    - Animation: hover:scale-110 shadow-[0_0_30px_rgba(34,197,94,0.6)]
    
    **9. FUTURISTIC MODALS & FORMS**:
    - Modal overlay: fixed inset-0 bg-black/70 backdrop-blur-sm z-50
    - Modal content: rounded-3xl backdrop-blur-2xl bg-gradient-to-br from-purple-900/90 to-blue-900/90
    - Form inputs: rounded-3xl bg-white/10 border-2 border-white/20 focus:border-cyan-500
    - Submit buttons: rounded-3xl bg-gradient-to-r from-cyan-500 to-purple-500 with neon glow
    - Close button: Absolute top-4 right-4 rounded-full hover:rotate-90 transition
    
    **10. DARK MODE & THEME**:
    - **Default**: Always use DARK theme with futuristic styling
    - **Background**: Dark gradients (from-purple-900 via-blue-900 to-cyan-900)
    - **Text**: Light colors (text-white, text-gray-300, text-cyan-400)
    - **Cards**: Dark with glassmorphism (bg-black/30 backdrop-blur-xl)
    - **Buttons**: Bright gradients on dark background
    - **Toggle (optional)**: Add dark/light mode toggle if user requests
    - **🚨 NEVER use plain white backgrounds** - always use dark, futuristic themes
    
    **11. RESPONSIVE DESIGN**:
    - Mobile first: Base styles for mobile
    - Breakpoints: sm:640px md:768px lg:1024px xl:1280px
    - Grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
    - Text: text-sm md:text-base lg:text-lg
    - Padding: p-4 md:p-6 lg:p-8
    - Hide/show: hidden md:block or block md:hidden
    
    **12. INTERACTIVE ELEMENTS (ALL MUST WORK)**:
    - Navigation links: Smooth scroll to sections (document.querySelector('#section').scrollIntoView())
    - Forms: Prevent default, validate, show success/error messages
    - Modals: Open/close with state, click outside to close
    - Mobile menu: Toggle open/close with animation
    - Back to top: window.scrollTo({ top: 0, behavior: 'smooth' })
    - Buttons: Visual feedback on click (active:scale-95)
    
    **13. PAGE STRUCTURE & NAVIGATION (CRITICAL)**:
    - **Multi-page apps**: Create separate HTML files (index.html, about.html, contact.html, etc.)
    - **Page Links**: Use RELATIVE paths: <a href="about.html"> NOT <a href="https://example.com/about">
    - **Internal Navigation**: For single-page apps, use smooth scroll: <a href="#section">
    - **Consistent Navbar**: Same navbar across all pages with active state highlighting
    - **Same Styling**: All pages must use the same futuristic theme
    - **🚨 NEVER link to external sites or apps** (especially not to Nexus Coder or similar tools)
    - **🚨 NEVER include links to GitHub, deployment platforms, or code repositories**
    - **🚨 ALL navigation must be INTERNAL to the project being built**
    
    **FUNCTIONAL REQUIREMENTS**:
    - Every button MUST have working onclick handlers
    - Forms must validate and show feedback
    - Navigation must work (smooth scroll or page links)
    - Mobile menu must toggle properly
    - All interactive elements must respond to user input
    - Add console.log for debugging if needed
    
    **🚨 CRITICAL: NO LOADING STATES OR PLACEHOLDERS 🚨**:
    - ❌ NEVER EVER show "Loading..." text as the main content
    - ❌ NEVER use "Loading FuturEstate..." or similar loading messages
    - ❌ NEVER show "Your next-gen experience is about to begin" or waiting messages
    - ❌ NEVER use placeholder text like "Content coming soon"
    - ❌ NEVER create empty sections waiting for data
    - ❌ NEVER show splash screens or loading animations as main content
    - ✅ ALWAYS show COMPLETE, VISIBLE, PRODUCTION-READY content immediately
    - ✅ ALWAYS include real text, images (use https://images.unsplash.com/), buttons, cards
    - ✅ ALWAYS render the FULL page with ALL sections visible from the start
    - ✅ Hero section, features, services, testimonials, footer - ALL must be visible immediately
    - ✅ Use realistic content (not Lorem Ipsum) relevant to the app purpose
    - ✅ Show the ACTUAL website, not a loading screen
    
    **EXAMPLES**:
    
    **REAL ESTATE WEBSITE**:
    ✅ CORRECT: Show hero with "Find Your Dream Home", property cards with images and prices, search filters, featured listings, agent profiles, contact form
    ❌ WRONG: Show "Loading FuturEstate...Your next-gen real estate experience is about to begin"
    
    **FOOD DISTRIBUTION WEBSITE**:
    ✅ CORRECT: Show hero with "Fresh Food Delivered Daily", feature cards with icons, menu items with prices, order form
    ❌ WRONG: Show "Loading Food Distribution Platform..." and nothing else
    
    **E-COMMERCE WEBSITE**:
    ✅ CORRECT: Show hero with "Shop the Latest Trends", product grid with images and prices, categories, cart icon
    ❌ WRONG: Show "Loading ShopHub..." or "Preparing your shopping experience"
    
    **MANDATES (CRITICAL)**:
    1. **COMPLETE CODE**: Write EVERY line. No "// ... rest of code" or placeholders.
    2. **PARALLEL WORK**: Generate ALL files for this task in ONE response. Work fast.
    3. **SYNTAX**: Ensure valid HTML/CSS/JS, proper indentation.
    4. **IMPORTS**: Include Tailwind CDN in HTML head.
    5. **HTML FIRST**: Create index.html FIRST for real-time preview.
    6. **FUNCTIONAL**: All interactive elements MUST work.
    7. **APP NAME**: Include app name in <title> and header/navbar.
    8. **VISIBLE CONTENT**: ALL page sections must be visible immediately - hero, features, services, testimonials, footer, etc.
    9. **REAL CONTENT**: Use realistic, relevant content (not Lorem Ipsum or "Loading...")
    10. **PRODUCTION READY**: Generate code that looks like a finished, deployed website from the start.
    
    **TAILWIND CDN (Add to every HTML file)**:
    <script src="https://cdn.tailwindcss.com"></script>
    
    **SPEED OPTIMIZATION**: 
    - Batch file creation - create 5-10 files at once
    - Write production-ready code immediately
    - No iterative refinement needed
    
    **OUTPUT**: JSON with \`files\` array. INCLUDE ALL EXISTING FILES to preserve tree.`;

    const fullPrompt = `Goal: "${prompt}"
    Task: "${task}"
    ${resumeContext ? `\n**USER REFINEMENT REQUEST**: "${resumeContext}"\n**IMPORTANT**: This is an INCREMENTAL improvement. DO NOT rebuild from scratch. ONLY modify the specific files/features mentioned by the user. Preserve ALL existing functionality and files.` : ''}
    ${lastError ? `PREVIOUS ERROR: ${lastError}` : ''}
    
    **Current Project State**:
    ${formatFilesForPrompt(currentFiles)}
    
    ${resumeContext ? '**INCREMENTAL MODE**: Only update/add files related to the user feedback. Keep everything else intact.' : '**BUILD MODE**: Generate all necessary files for this task.'}
    
    Generate JSON.`;

    const responseText = await generateContent(model, systemInstruction, fullPrompt, appSettings, implementTaskResponseSchema, signal);
    if (signal?.aborted) throw new Error('Aborted');

    try {
        const parsedResponse = JSON.parse(responseText.trim());
        if (parsedResponse.pause) return { files: currentFiles, pause: parsedResponse.pause };
        if (parsedResponse.files) {
            // Security validation
            const securityResult = scanForSecurityVulnerabilities(parsedResponse.files);
            if (!securityResult.valid) {
                return await implementTask(prompt, currentFiles, task, model, uploadedFiles, agentLogs, attemptNumber + 1, `Security Violation: ${securityResult.errors.join('; ')}`, resumeContext, appSettings, signal);
            }
            
            // Validate against loading screens in HTML files
            const htmlFiles = parsedResponse.files.filter((f: FileNode) => 
                f.type === 'file' && f.name.toLowerCase().endsWith('.html')
            );
            
            for (const htmlFile of htmlFiles) {
                const content = htmlFile.content || '';
                const lowerContent = content.toLowerCase();
                
                // Check for loading screen patterns
                const loadingPatterns = [
                    /loading\s+\w+\.\.\./i,
                    /your\s+.*\s+experience\s+is\s+about\s+to\s+begin/i,
                    /preparing\s+your/i,
                    /please\s+wait/i,
                    /coming\s+soon/i
                ];
                
                const hasLoadingScreen = loadingPatterns.some(pattern => pattern.test(content));
                
                // Also check if the HTML has minimal content (likely a loading screen)
                const hasHero = /<h1|<header|hero/i.test(content);
                const hasMultipleSections = (content.match(/<section|<div.*class/gi) || []).length > 3;
                const hasImages = /<img|unsplash/i.test(content);
                const hasButtons = /<button/i.test(content);
                
                const hasRealContent = hasHero && (hasMultipleSections || hasImages || hasButtons);
                
                if (hasLoadingScreen && !hasRealContent) {
                    console.warn('⚠️ Detected loading screen in', htmlFile.name, '- Requesting regeneration');
                    return await implementTask(
                        prompt, 
                        currentFiles, 
                        task, 
                        model, 
                        uploadedFiles, 
                        agentLogs, 
                        attemptNumber + 1, 
                        `CRITICAL ERROR: Generated a loading screen instead of real content in ${htmlFile.name}. You MUST generate COMPLETE, VISIBLE, PRODUCTION-READY content with hero section, features, images, buttons, and footer. NO "Loading..." text allowed.`, 
                        resumeContext, 
                        appSettings, 
                        signal
                    );
                }
            }
            
            return { files: parsedResponse.files, pause: null };
        }
        throw new Error("Invalid response structure.");
    } catch (e) {
        if ((e as Error).message === 'Aborted') throw e;
        return await implementTask(prompt, currentFiles, task, model, uploadedFiles, agentLogs, attemptNumber + 1, `JSON Error: ${(e as Error).message}`, resumeContext, appSettings, signal);
    }
};

export const performQA = async (files: FileNode[], model: string, appSettings: AppSettings, signal?: AbortSignal): Promise<{ passed: boolean, issues: string[] }> => {
    if (signal?.aborted) throw new Error('Aborted');
    const systemInstruction = `You are a **QA Agent**. 
    Review for logic errors, syntax errors (especially Python indentation/unclosed dicts), and missing dependencies.
    Return JSON: { passed: boolean, issues: string[] }`;
    const userPrompt = `Review files:\n${formatFilesForPrompt(files)}`;
    const responseText = await generateContent(model, systemInstruction, userPrompt, appSettings, { type: Type.OBJECT, properties: { passed: { type: Type.BOOLEAN }, issues: { type: Type.ARRAY, items: { type: Type.STRING } } } }, signal);
    try {
        const parsed = JSON.parse(responseText);
        return {
            passed: typeof parsed.passed === 'boolean' ? parsed.passed : true,
            issues: Array.isArray(parsed.issues) ? parsed.issues : []
        };
    } catch { return { passed: true, issues: [] }; }
}

export const evaluateProject = async (files: FileNode[], prompt: string, model: string, appSettings: AppSettings, signal?: AbortSignal): Promise<EvaluationResult> => {
    if (signal?.aborted) throw new Error('Aborted');
    const systemInstruction = `You are an **Evaluation Agent**. Assess based on user prompt. Return JSON: { score: number, quality: string, securityIssues: number, feedback: string }`;
    const userPrompt = `Prompt: "${prompt}"\nFiles:\n${formatFilesForPrompt(files)}`;
    const responseText = await generateContent(model, systemInstruction, userPrompt, appSettings, { type: Type.OBJECT, properties: { score: { type: Type.INTEGER }, quality: { type: Type.STRING }, securityIssues: { type: Type.INTEGER }, feedback: { type: Type.STRING } } }, signal);
    try {
        const parsed = JSON.parse(responseText);
        return {
            score: typeof parsed.score === 'number' ? parsed.score : 50,
            quality: parsed.quality || 'Fair',
            securityIssues: parsed.securityIssues || 0,
            feedback: parsed.feedback || 'No feedback provided.'
        };
    } catch { return { score: 0, quality: 'Poor', securityIssues: 0, feedback: 'Evaluation failed.' }; }
}

export const generateDevOpsFiles = async (currentFiles: FileNode[], model: string, appSettings: AppSettings, signal?: AbortSignal): Promise<FileNode[]> => {
    if (signal?.aborted) throw new Error('Aborted');
    const systemInstruction = `You are a **Deployment Agent** (DevOps). Task: Generate robust CI/CD config.
    MANDATES: 1. **Dockerfile**: Use 'COPY backend/ .' 2. **Platform**: Vercel/Netlify for web.
    Return JSON object with "files" array.`;
    const fullPrompt = `File List: ${currentFiles.map(f => f.path).join(', ')}\nGenerate CI/CD.`;
    const responseText = await generateContent(model, systemInstruction, fullPrompt, appSettings, { type: Type.OBJECT, properties: { files: { type: Type.ARRAY, items: fileSchema } } }, signal);
    try { const res = JSON.parse(responseText); return res.files || []; } catch (e) { return []; }
};

export const generateProjectName = async (prompt: string, model: string, appSettings: AppSettings): Promise<string> => {
    try {
        const name = await generateContent(model, "Creative naming agent. Short, futuristic, 2-3 words. No markup.", `Prompt: "${prompt}"`, appSettings, undefined);
        return name.replace(/['"]/g, '').trim() || "Genesis Project";
    } catch { return "Genesis Project"; }
};

export const detectProblems = async (files: FileNode[], model: string, appSettings: AppSettings): Promise<Problem[]> => {
    const systemInstruction = `You are a **Debugger Agent**. Analyze code for bugs (syntax, logic, imports). Return JSON array of objects { file, description }.`;
    const userPrompt = `Analyze:\n${formatFilesForPrompt(files)}`;
    const responseText = await generateContent(model, systemInstruction, userPrompt, appSettings, { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { file: { type: Type.STRING }, description: { type: Type.STRING } }, required: ['file', 'description'] } });
    try {
        const problems = JSON.parse(responseText);
        return problems.map((p: Omit<Problem, 'id'>) => ({ ...p, id: generateId() }));
    } catch { return []; }
};

export const fixProblem = async (currentFiles: FileNode[], problem: Problem, model: string, appSettings: AppSettings): Promise<{ files: FileNode[] }> => {
    // Strengthened prompt for self-healing
    const systemInstruction = `Fix the bug described. **CRITICAL**: Return the complete file tree in the "files" array, updated with the fix. Do not return partial files. Ensure syntax is valid.`;
    const fullPrompt = `Fix "${problem.description}" in "${problem.file}".\nFiles:\n${formatFilesForPrompt(currentFiles)}`;
    const responseText = await generateContent(model, systemInstruction, fullPrompt, appSettings, { type: Type.OBJECT, properties: { files: { type: Type.ARRAY, items: fileSchema } } }); // Updated schema to match implementTask
    try {
        const res = JSON.parse(responseText.trim());
        // Handle both array directly or object wrapper
        const files = Array.isArray(res) ? res : (res.files || []);
        if (files.length === 0) return { files: currentFiles }; // Fallback
        return { files };
    } catch {
        throw new Error("Fix failed.");
    }
};

export const reviewCode = async (files: FileNode[], model: string, appSettings: AppSettings): Promise<string> => {
    return await generateContent(model, "Review code for quality/security. Output Markdown.", `Review:\n${formatFilesForPrompt(files)}`, appSettings);
};

export const parseReviewForProblems = async (review: string, files: FileNode[], model: string, appSettings: AppSettings): Promise<Problem[]> => {
  const responseText = await generateContent(model, `Extract actionable tasks from review as JSON array { file, description }.`, `Review:\n${review}\nFiles: ${files.map(f => f.path).join(', ')}`, appSettings, { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { file: { type: Type.STRING }, description: { type: Type.STRING } }, required: ['file', 'description'] } });
  try {
      const problems = JSON.parse(responseText);
      return problems.map((p: Omit<Problem, 'id'>) => ({ ...p, id: generateId() }));
  } catch { return []; }
};
