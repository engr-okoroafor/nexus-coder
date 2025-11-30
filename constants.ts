

import type { FileNode, ModelLimits, AppSettings } from './types';

export const AI_MODELS: string[] = [
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'Llama 3 70B (Groq)',
  'Llama 4 Maverick (Groq)',
  'meta-llama/llama-4-maverick-17b-128e-instruct',
  'claude-3-opus',
  'meta-llama-3-70b',
  'grok-1',
  'qwen-coder',
];

export const MODEL_LIMITS: { [key: string]: ModelLimits } = {
  'gemini-2.5-flash': { rpm: 15 },
  'gemini-2.5-pro': { rpm: 5 },
  'Llama 3 70B (Groq)': { rpm: 25 },
  'Llama 4 Maverick (Groq)': { rpm: 25 },
  'meta-llama/llama-4-maverick-17b-128e-instruct': { rpm: 30 },
};

// Use environment variable for fallback API key (never commit actual keys)
export const GROQ_FALLBACK_API_KEY = import.meta.env.VITE_GROQ_FALLBACK_API_KEY || '';

export const DEFAULT_APP_SETTINGS: AppSettings = {
    apiKeys: {
        gemini: '',
        claude: '',
        meta: '',
        grok: '', // Users should provide their own API keys
        qwen: '',
        serper: '',
        serpApi: '',
        tavily: '',
    },
    enableNotifications: true,
    enableAiSuggestions: true,
};

// Default Real Estate Template Content for Preview
const MOCK_HTML_CONTENT = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kings Realtors - Futuristic Real Estate</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Exo+2:wght@300;600;800&display=swap');
        body { font-family: 'Exo 2', sans-serif; background-color: #050b0a; color: #FFF; }
        .neon-border { box-shadow: 0 0 10px #10B981, inset 0 0 5px #10B981; }
        .property-card:hover { transform: scale(1.02); box-shadow: 0 0 20px rgba(16, 185, 129, 0.3); border-color: #10B981; }
    </style>
</head>
<body class="bg-[#050b0a] min-h-screen flex flex-col">
    <!-- Navbar -->
    <header class="p-6 flex justify-between items-center sticky top-0 z-50 bg-[#050b0a]/90 backdrop-blur border-b border-emerald-900/50">
        <div class="text-3xl font-extrabold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">
            KINGS<span class="text-white">REALTORS</span>
        </div>
        <div class="hidden md:flex gap-8 text-sm font-bold uppercase text-gray-400 tracking-wider">
            <a href="#" class="hover:text-emerald-400 transition">Listings</a>
            <a href="#" class="hover:text-emerald-400 transition">Virtual Tours</a>
            <a href="#" class="hover:text-emerald-400 transition">Smart Homes</a>
        </div>
        <button class="bg-emerald-600 hover:bg-emerald-500 text-black px-6 py-2 rounded-none -skew-x-12 font-bold transition transform hover:-translate-y-1 shadow-[0_0_15px_rgba(16,185,129,0.4)]">
            <span class="block skew-x-12">CONNECT WALLET</span>
        </button>
    </header>

    <!-- Hero -->
    <div class="relative h-[600px] flex items-center justify-center overflow-hidden">
        <div class="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-30"></div>
        <div class="absolute inset-0 bg-gradient-to-t from-[#050b0a] via-[#050b0a]/50 to-transparent"></div>
        
        <div class="text-center z-10 max-w-4xl px-4">
            <h1 class="text-7xl font-black mb-6 leading-tight">
                LIVING IN <br>
                <span class="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">THE FUTURE</span>
            </h1>
            <p class="text-xl text-emerald-100/70 mb-10 max-w-2xl mx-auto">
                Discover blockchain-verified smart homes with integrated AI environmental controls in Lagos' most exclusive zones.
            </p>
            <div class="flex justify-center gap-4">
                <button class="bg-white text-black px-8 py-4 font-bold text-lg hover:bg-emerald-400 transition">VIEW MAP</button>
                <button class="border border-emerald-500 text-emerald-400 px-8 py-4 font-bold text-lg hover:bg-emerald-900/30 transition backdrop-blur-md">3D TOUR</button>
            </div>
        </div>
    </div>

    <!-- Properties -->
    <main class="max-w-7xl mx-auto px-6 py-12 w-full">
        <div class="flex justify-between items-end mb-8">
            <h2 class="text-3xl font-bold border-l-4 border-emerald-500 pl-4">PRIME SECTORS</h2>
            <div class="text-emerald-500 font-mono text-xs">LIVE MARKET FEED ●</div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            <!-- Card 1 -->
            <div class="property-card bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden transition duration-300 group">
                <div class="h-64 bg-gray-800 relative overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1600596542815-37a9a200ce10?q=80&w=2075&auto=format&fit=crop" class="w-full h-full object-cover group-hover:scale-110 transition duration-700 opacity-80 group-hover:opacity-100" alt="Villa">
                    <div class="absolute top-4 right-4 bg-emerald-500 text-black text-xs font-bold px-3 py-1">VERIFIED</div>
                </div>
                <div class="p-6">
                    <div class="flex justify-between items-start mb-2">
                        <h3 class="text-xl font-bold text-white">Neo-Lekki Villa</h3>
                        <span class="text-emerald-400 font-mono">₦250M</span>
                    </div>
                    <p class="text-gray-400 text-sm mb-4">5 Beds • 4 Baths • AI Security Core</p>
                    <div class="flex gap-2">
                        <span class="text-[10px] bg-gray-800 px-2 py-1 text-gray-300 border border-gray-700">SOLAR</span>
                        <span class="text-[10px] bg-gray-800 px-2 py-1 text-gray-300 border border-gray-700">SMART</span>
                    </div>
                </div>
            </div>

            <!-- Card 2 -->
            <div class="property-card bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden transition duration-300 group">
                <div class="h-64 bg-gray-800 relative overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=2053&auto=format&fit=crop" class="w-full h-full object-cover group-hover:scale-110 transition duration-700 opacity-80 group-hover:opacity-100" alt="Penthouse">
                    <div class="absolute top-4 right-4 bg-cyan-500 text-black text-xs font-bold px-3 py-1">NEW</div>
                </div>
                <div class="p-6">
                    <div class="flex justify-between items-start mb-2">
                        <h3 class="text-xl font-bold text-white">Eko Atlantic Sky-Pod</h3>
                        <span class="text-emerald-400 font-mono">₦480M</span>
                    </div>
                    <p class="text-gray-400 text-sm mb-4">3 Beds • Panoramic Ocean View</p>
                    <div class="flex gap-2">
                        <span class="text-[10px] bg-gray-800 px-2 py-1 text-gray-300 border border-gray-700">AUTO-CLIMATE</span>
                    </div>
                </div>
            </div>

            <!-- Card 3 -->
            <div class="property-card bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden transition duration-300 group">
                <div class="h-64 bg-gray-800 relative overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1512915922686-57c11dde9b6b?q=80&w=2073&auto=format&fit=crop" class="w-full h-full object-cover group-hover:scale-110 transition duration-700 opacity-80 group-hover:opacity-100" alt="Mansion">
                </div>
                <div class="p-6">
                    <div class="flex justify-between items-start mb-2">
                        <h3 class="text-xl font-bold text-white">Maitama Fortress</h3>
                        <span class="text-emerald-400 font-mono">₦850M</span>
                    </div>
                    <p class="text-gray-400 text-sm mb-4">8 Beds • Underground Bunker</p>
                    <div class="flex gap-2">
                        <span class="text-[10px] bg-gray-800 px-2 py-1 text-gray-300 border border-gray-700">SECURE</span>
                        <span class="text-[10px] bg-gray-800 px-2 py-1 text-gray-300 border border-gray-700">HELIPAD</span>
                    </div>
                </div>
            </div>
        </div>
    </main>

    <footer class="bg-gray-900 border-t border-gray-800 py-8 mt-auto">
        <div class="max-w-7xl mx-auto px-6 flex justify-between items-center text-sm text-gray-500">
            <p>&copy; 2077 Kings Realtors. Secured on Ethereum.</p>
            <div class="flex gap-4">
                <a href="#" class="hover:text-emerald-400">Terms</a>
                <a href="#" class="hover:text-emerald-400">Privacy</a>
            </div>
        </div>
    </footer>
</body>
</html>`;

export const MOCK_INITIAL_FILES: FileNode[] = [
    {
        id: '1',
        name: 'index.html',
        type: 'file',
        path: '/index.html',
        content: MOCK_HTML_CONTENT,
    }
];