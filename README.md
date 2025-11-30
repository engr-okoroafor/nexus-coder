# Nexus Coder - Autonomous Multi-Agent System

## 🚀 Quick Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/engr-okoroafor/nexus-coder.git
cd nexus-coder
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Add your API keys to `.env.local`:
```env
GEMINI_API_KEY=your_gemini_api_key_here
VITE_GROQ_FALLBACK_API_KEY=your_groq_api_key_here  # Optional
```

5. Start the development server:
```bash
npm run dev
```

6. Open http://localhost:3000 in your browser

### Getting API Keys
- **Gemini API**: Get your free key at [Google AI Studio](https://makersuite.google.com/app/apikey)
- **Groq API** (optional): Get your key at [Groq Console](https://console.groq.com/)

## 🌐 Deploying to Netlify

### Option 1: Deploy via Netlify Dashboard

1. Push your code to GitHub
2. Go to [Netlify](https://app.netlify.com/)
3. Click "Add new site" → "Import an existing project"
4. Connect your GitHub repository
5. **Important**: Set environment variables in Netlify:
   - Go to Site settings → Environment variables
   - Add `GEMINI_API_KEY` with your Gemini API key
   - Add `VITE_GROQ_FALLBACK_API_KEY` with your Groq API key (optional)
6. Deploy!

### Option 2: Deploy via Netlify CLI

```bash
npm install -g netlify-cli
netlify login
netlify init
netlify env:set GEMINI_API_KEY "your_key_here"
netlify env:set VITE_GROQ_FALLBACK_API_KEY "your_key_here"
netlify deploy --prod
```

### Troubleshooting Blank Page on Netlify

If you see a blank page after deployment:

1. **Check Environment Variables**: Make sure `GEMINI_API_KEY` is set in Netlify Dashboard
2. **Check Browser Console**: Open DevTools (F12) and look for errors
3. **Rebuild**: Trigger a new deploy after setting environment variables
4. **Check Build Logs**: Look for any build errors in Netlify's deploy logs

---

**### Problem Statement**

Building software is slow, expensive, and requires large coordinated teams. Businesses lose weeks waiting for prototypes, testing cycles, or code fixes. Even with modern tools, most founders and teams still struggle to go from idea → working product.

I designed Nexus Coder to solve this:
An autonomous multi-agent AI system that architects, writes, debugs, and deploys full-stack software—including:

✔ Web apps

✔ Backend services

✔ Cross-platform mobile apps (Flutter / React Native / Expo)

✔ API integrations

✔ CI/CD automation

The problem is urgent because AI-driven engineering is becoming essential for business productivity. Companies want accelerated development, fewer bugs, faster iteration cycles, and intelligent systems that self-correct.


**### Why Agents?**

Traditional LLM “chatbots” cannot:
❌ Maintain long-term engineering context
❌ Collaborate across roles (architect, dev, tester)
❌ Execute code or tools
❌ Recover from errors
❌ Manage long workflows
❌ Provide autonomous self-direction

Agents solve this:

🔹 **Multi-Agent Collaboration**

Nexus Coder uses a team of AI agents, each with specialization:

**Agent**	                                  **Responsibility**

Architect Agent	    -            Converts user idea → Technical architecture + stack
Coder Agent	            -            Generates full project structure + modular code
Debugger Agent	    -            Detects and fixes errors, runtime failures, and build crashes
QA Agent	            -            Writes tests, validates reliability
Deployment Agent     -            Builds and deploys apps using tools + CLI
Memory Agent	    -            Stores long-term preferences, project state & components
Planner Agent	    -            Breaks requests into tasks and orchestrates the others

🔹 **Tool Execution (Essential for Enterprise Agents)**
The agents use:
✔ MCP tools
✔ Code execution (Node, Python, Bash)
✔ File system tools
✔ Git tools
✔ Google Web search when needed
✔ Long-running operations for deployments

🔹 **Sessions & Memory**
All sessions are persistent via:
✔ InMemorySessionService
✔ Memory Bank (Long-term memory)
✔ Context compaction so the agent never “forgets your codebase”

🔹 **Resilient Model Fallback (100% Operational Uptime)**
If Gemini hits limits, errors, or rate limits:
✔ Gemini 2.5 Flash / Gemini 3 Pro → if fails
✔ Groq Llama-4 Maverick 17B → if fails
✔ Local fallback models (optional)

This ensures the agent never stops coding.


**### What I Created — Architecture Overview**

**1. Mission Control UI**
A clean engineering dashboard where all development happens:
* **Chat interface** – talk to the agent
* **Code editor** – live file editing
* **Agent logs** – see what each agent is doing
* **Terminal** – runs installs, builds, tests
* **Model selector & fallback status** – shows active model and auto-switch alerts
* **Build & deploy panels** – run builds or push deployments
* **Preview window** – displays the live UI of the web or mobile app being generated


**2. Website Pages**
* **Landing Page:** Introduces the product, highlights features, and provides a clean first impression.
* **Pricing Page:** Presents subscription tiers and feature differences clearly.


**3. Multi-Agent Pipeline**
Every request passes through an organized chain:

**User Request**
    ↓
**Planner Agent** → breaks request into tasks
    ↓
**Architect Agent** → defines tech stack & project structure
    ↓
**Coder Agent** → generates all frontend, backend, and mobile code
    ↓
**Debugger Agent** → detects & fixes errors
    ↓
**QA Agent** → writes tests and checks correctness
    ↓
**Deployment Agent** → builds and deploys the app
    ↓
**Memory Agent** → stores progress, context, and preferences


**4. Resilient Multi-Model AI Layer**

Ensures the system never stops coding:

* **Primary:** Gemini 3 Pro / Gemini 2.5 Flash → fast, accurate, handles heavy coding

✔ Secondary: Groq Llama-4 Maverick 17B → automatic fallback using your key

✔ Retries + Exponential Backoff: Automatically retries transient failures with gradually increasing wait times to handle rate limits/timeouts, prevent overload, enable smooth model switching, and provide full transparency through observability logs.

✔ Fallback triggers: rate limits, timeouts, token exhaustion, server errors, or explicit “FALLBACK_TRIGGER”

✔ UI Alert: “Gemini unavailable — switching to Groq Llama-4 Maverick 17B.”


**5. Observability**

Full visibility into system behavior:

✔ Agent logs for every agent

✔ Traces for each task

✔ Model-switch history

✔ Tool execution logs

✔ Error detection and resolution steps


**6. Deployment**

Supports multiple hosting paths for both web and mobile builds:

✔ AWS

✔ Google Cloud Run

✔ Vercel / Netlify

✔ Google Cloud Build

✔ Expo EAS (cross-platform mobile)


**### Demo (What the Agent Can Do)**

The agent's capabilities include:

✔ Build a full website (Next.js, React, Vue, Astro, etc.) from a single sentence prompt

✔ Create complete mobile apps using
   - React Native, Expo, Flutter, or any modern framework — including onboarding flows, navigation, auth screens, dashboards, and API integration

✔ Generate backend APIs in Node.js (Express/Nest), Django, FastAPI, Flask, Go, or Python microservices

✔ Auto-fix build errors and retry until the app compiles successfully

✔ Add authentication using Clerk, Firebase, Supabase, or custom JWT

✔ Integrate payments (Stripe, Paystack)

✔ Add AI features — chatbots, embeddings, vector search, RAG pipelines

✔ Deploy to production (Vercel, Netlify, Cloud Run, AWS, Expo EAS, etc.)

✔ Generate documentation (README, architecture docs, setup guides)

✔ Maintain long-term project memory that persists across sessions


**### The Build — Tools & Technologies**

**Languages & Frameworks**

✔ TypeScript / Node.js

✔ Python (debugger + analysis tools)

✔ React + Next.js

✔ React Native (mobile)

✔ Vue.js (web alternative)

✔ Flutter

✔ Django / FastAPI

✔ TailwindCSS & Shadcn

✔ Expo (for mobile builds & deployments)

**AI / Models Used**

✔ Gemini 2.5 Flash

✔ Gemini 3 Pro

✔ Groq Meta-Llama 4 Maverick 17B (fallback)

✔ Optional: Llama local inference

**Agent Engine**

✔ Google ADK

✔ MCP tools

✔ A2A Protocol

**Memory Layer**

✔ Memory Bank

✔ Session State Manager

✔ Context Compression

✔ Project Knowledge Persistence

**Agents**

✔ Planner Agent

✔ Architect Agent

✔ Coder Agent

✔ Debugger Agent

✔ QA Agent

✔ Deployment Agent

✔ Memory Agent

**Tooling**

✔ Code Execution Sandbox

✔ File Operations

✔ Git Operations

✔ OpenAPI / Swagger tools

✔ Search & Retrieval Tools

✔ Long-running Operation Manager

**Observability**

✔ Complete Logging

✔ Metrics & Performance Tracking

✔ Full Execution Traces

✔ Agent-by-Agent Timeline

✔ Model-switch + fallback logs


**### If I Had More Time**

Here’s what I would add next:

✔ A full “voice conversation mode” for hands-free system design

✔ More fine-grained agent personalities and specialized reasoning modes

✔ Integrated UI wireframing agent

✔ Auto-generating 3D components using Three.js

✔ Automatic end-to-end CI/CD pipelines

✔ Live pair programming mode

✔ Billing & cost-optimization agent
