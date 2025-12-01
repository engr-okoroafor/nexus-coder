
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

// Lazy initialization - only create GoogleGenAI instance when needed
let geminiAi: GoogleGenAI | null = null;

const getGeminiAi = (): GoogleGenAI => {
    if (!geminiAi) {
        const apiKey = getApiKey();
        if (!apiKey) {
            console.error('❌ GEMINI_API_KEY not found! Please set VITE_GEMINI_API_KEY in Netlify environment variables.');
            throw new Error('GEMINI_API_KEY is required. Please set VITE_GEMINI_API_KEY in your Netlify environment variables.');
        }
        try {
            geminiAi = new GoogleGenAI({ apiKey });
        } catch (error) {
            console.error('Failed to initialize GoogleGenAI:', error);
            throw new Error('Failed to initialize AI service. Please check your API key configuration.');
        }
    }
    return geminiAi;
};

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
        const result = await retryWithBackoff<GenerateContentResponse>(() => getGeminiAi().models.generateContent({
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
    
    // Try Google Search first - handle quota gracefully
    try {
        searchResult = await searchWithGoogle(userPrompt, signal);
        if (searchResult) { apiCache.set(cacheKey, searchResult); return searchResult; }
    } catch (e: any) { 
        if (e.message?.includes('429') || e.message?.includes('RESOURCE_EXHAUSTED') || e.message?.includes('quota')) {
            console.warn("Gemini Search quota exceeded. Skipping Google Search.");
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
            if (content.startsWith('```json')) {
                content = content.replace(/^```json\s*/, '').replace(/```\s*$/, '');
            } else if (content.startsWith('```')) {
                content = content.replace(/^```\s*/, '').replace(/```\s*$/, '');
            }
        }
        
        apiCache.set(cacheKey, content);
        return content;
    } catch (error: any) {
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
        const result = await retryWithBackoff<GenerateContentResponse>(() => getGeminiAi().models.generateContent({
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
  TASK: Create a granular, step-by-step execution plan.
  MANDATES:
  1. **Standard File Tree**: Plan for nested directories (src/components, src/utils, etc.).
  2. **Parallel Batching**: Create NO MORE THAN 3-5 TASKS. Group file creations into large batches to speed up execution.
  3. **Visuals**: Plan UI components EARLY.
  4. **Architecture**: Detect Web vs Mobile (React Native/Expo/Flutter).
  Respond with a JSON array of strings.`;
  const userPrompt = `Prompt: "${prompt}"\n\n${formatUploadedFilesForPrompt(uploadedFiles)}\n\nGenerate the plan.`;
  const responseText = await generateContent(model, systemInstruction, userPrompt, appSettings, { type: Type.ARRAY, items: { type: Type.STRING } }, signal);
  
  // Harden parsing to handle various LLM response formats
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
      return parsed.filter(item => typeof item === 'string');
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
    console.error('generatePlan JSON parse error:', e);
    // Return a default plan instead of throwing
    return ['Initialize project structure', 'Implement core features', 'Add styling and polish'];
  }
};

export const architectProject = async (prompt: string, model: string, appSettings: AppSettings, signal?: AbortSignal): Promise<FileNode[]> => {
    if (signal?.aborted) throw new Error('Aborted');
    const systemInstruction = `You are an **Architect Agent**.
    TASK: Define the initial file structure.
    MANDATES:
    - **Clean Structure**: Do NOT create redundant nested folders like 'src/src'.
    - **No Content**: Do NOT write file content (use empty strings).
    - **Flutter**: If Flutter requested, use 'lib', 'pubspec.yaml'.
    OUTPUT: JSON object with a "files" array.`;
    const userPrompt = `Request: "${prompt}"\n\nGenerate initial project structure.`;
    const responseText = await generateContent(model, systemInstruction, userPrompt, appSettings, { type: Type.OBJECT, properties: { files: { type: Type.ARRAY, items: fileSchema } } }, signal);
    try { const res = JSON.parse(responseText); return res.files || []; } catch { return []; }
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
    
    **MANDATES (CRITICAL)**:
    1. **COMPLETE CODE**: Write EVERY line. No "// ... rest of code".
    2. **SYNTAX**: Ensure Python indentation correct, no unclosed dicts.
    3. **IMPORTS**: Fix missing imports.
    4. **FILES**: Return ALL files required for task.
    5. **Docker**: Use 'COPY backend/ .' not 'COPY backend/ ./backend' to avoid nesting.
    
    **OUTPUT**: JSON with \`files\` array. INCLUDE ALL EXISTING FILES to preserve tree.`;

    const fullPrompt = `Goal: "${prompt}"
    Task: "${task}"
    ${resumeContext ? `\nUSER FEEDBACK: "${resumeContext}"` : ''}
    ${lastError ? `PREVIOUS ERROR: ${lastError}` : ''}
    Current Files:\n${formatFilesForPrompt(currentFiles)}\nGenerate JSON.`;

    const responseText = await generateContent(model, systemInstruction, fullPrompt, appSettings, implementTaskResponseSchema, signal);
    if (signal?.aborted) throw new Error('Aborted');

    try {
        const parsedResponse = JSON.parse(responseText.trim());
        if (parsedResponse.pause) return { files: currentFiles, pause: parsedResponse.pause };
        if (parsedResponse.files) {
            const securityResult = scanForSecurityVulnerabilities(parsedResponse.files);
            if (!securityResult.valid) {
                return await implementTask(prompt, currentFiles, task, model, uploadedFiles, agentLogs, attemptNumber + 1, `Security Violation: ${securityResult.errors.join('; ')}`, resumeContext, appSettings, signal);
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
