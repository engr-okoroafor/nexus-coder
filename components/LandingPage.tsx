
import React, { useState, useEffect, useRef } from 'react';
import { PaperclipIcon, CursorIcon, ChatIcon, MicrophoneIcon } from './Icons';
import { Tooltip } from './Tooltip';
import { AI_MODELS } from '../constants';
import { CustomSelect } from './CustomSelect';
import { PaymentModal } from './PaymentModal';

interface LandingPageProps {
  onLaunch: (prompt: string, model: string) => void;
}

const placeholderPrompts = [
  "Build a dashboard to track real-time KPIs for...",
  "Create a customer portal where users can...",
  "Design an admin panel to manage...",
  "Develop an enterprise solution that...",
  "Architect a data visualisation tool for...",
  "Initiate project: a quantum analytics engine for...",
  "Develop an adaptive AI interface that...",
  "Architect a neural data fabric to...",
  "Construct a predictive logistics platform for...",
  "Deploy a holographic collaboration suite for...",
  "Code a decentralized autonomous organization (DAO) for...",
  "Engineer a cognitive security sentinel for...",
  "Assemble a synthetic data generation hub for...",
  "Build a bio-integrated health monitoring system..."
];

const useTypewriter = (words: string[], speed = 50, delay = 2000) => {
    const [text, setText] = useState('');
    const [wordIndex, setWordIndex] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);
    const timeoutRef = useRef<number | null>(null);

    useEffect(() => {
        const handleTyping = () => {
            const currentWord = words[wordIndex];
            const updatedText = isDeleting
                ? currentWord.substring(0, text.length - 1)
                : currentWord.substring(0, text.length + 1);

            setText(updatedText);

            if (!isDeleting && updatedText === currentWord) {
                timeoutRef.current = window.setTimeout(() => setIsDeleting(true), delay);
            } else if (isDeleting && updatedText === '') {
                setIsDeleting(false);
                setWordIndex((prev) => (prev + 1) % words.length);
            } else {
                timeoutRef.current = window.setTimeout(handleTyping, isDeleting ? speed / 2 : speed);
            }
        };
        timeoutRef.current = window.setTimeout(handleTyping, speed);

        return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
    }, [text, isDeleting, wordIndex, words, speed, delay]);

    return text;
};

const CommandBarButton: React.FC<{tooltip: string, children: React.ReactNode, onClick?: () => void, isActive?: boolean}> = ({ tooltip, children, onClick, isActive }) => (
    <Tooltip text={tooltip} position="top" align="center">
        <button 
            type="button"
            onClick={onClick}
            className={`flex items-center gap-1.5 transition-colors ${isActive ? 'text-cyan-300' : 'text-gray-400 hover:text-white'}`}
        >
            {children}
        </button>
    </Tooltip>
);

const PricingModal: React.FC<{ onClose: () => void, onLaunch: () => void }> = ({ onClose, onLaunch }) => {
    const [currency, setCurrency] = useState<'USD' | 'NGN'>('USD');
    const [selectedPlan, setSelectedPlan] = useState<{name: string, price: number} | null>(null);
    
    // Exchange rate approximation
    const RATES = { USD: 1, NGN: 1500 };
    const formatPrice = (price: number) => {
        if (price === 0) return 'Free';
        if (currency === 'USD') return `$${price}/mo`;
        return `₦${(price * RATES.NGN).toLocaleString()}/mo`;
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
             {selectedPlan && (
                <PaymentModal 
                    onClose={() => setSelectedPlan(null)} 
                    planName={selectedPlan.name} 
                    monthlyPrice={selectedPlan.price} 
                />
             )}
             
             <div className="relative w-full max-w-6xl bg-[#0d0d12] border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-cyan-500 to-emerald-500"></div>
                
                {/* Header Section */}
                <div className="p-6 md:p-8 flex justify-between items-center border-b border-white/5 bg-white/5 backdrop-blur-md sticky top-0 z-10">
                    <button 
                        onClick={onClose} 
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        <span className="font-orbitron text-sm font-bold tracking-wider">BACK TO HOME</span>
                    </button>
                    
                     <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="overflow-y-auto p-6 md:p-10 custom-scrollbar">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-5xl font-orbitron font-bold text-white mb-4 tracking-wider">
                            CHOOSE YOUR <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">POWER</span>
                        </h2>
                        <p className="text-gray-400 text-lg">Scale your autonomous development capabilities.</p>
                        
                        {/* Currency Switcher */}
                        <div className="flex justify-center mt-8">
                            <div className="bg-gray-900/80 p-1 rounded-full border border-purple-500/30 flex relative">
                                <button 
                                    onClick={() => setCurrency('USD')}
                                    className={`px-6 py-2 rounded-full text-sm font-bold font-orbitron transition-all duration-300 ${currency === 'USD' ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]' : 'text-gray-400 hover:text-white'}`}
                                >
                                    USD
                                </button>
                                <button 
                                    onClick={() => setCurrency('NGN')}
                                    className={`px-6 py-2 rounded-full text-sm font-bold font-orbitron transition-all duration-300 ${currency === 'NGN' ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'text-gray-400 hover:text-white'}`}
                                >
                                    NGN
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Free Tier */}
                        <div className="relative group h-full">
                            <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 to-transparent rounded-[2rem] blur-xl group-hover:blur-2xl transition-all opacity-0 group-hover:opacity-100"></div>
                            <div className="relative bg-[#13131f] border border-white/10 rounded-[2rem] p-8 hover:border-cyan-500/50 transition-all duration-300 h-full flex flex-col">
                                <div className="mb-6">
                                    <h3 className="text-xl font-orbitron text-cyan-300 mb-2">SPARK</h3>
                                    <div className="text-4xl font-bold text-white mb-2">{formatPrice(0)}</div>
                                    <p className="text-gray-400 text-sm">For hobbyists and prototypes.</p>
                                </div>
                                <ul className="space-y-4 mb-8 flex-grow">
                                    <li className="flex items-center gap-3 text-gray-300 text-sm">
                                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400"></div>
                                        300,000 Daily Tokens
                                    </li>
                                    <li className="flex items-center gap-3 text-gray-300 text-sm">
                                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400"></div>
                                        Standard Generation Speed
                                    </li>
                                    <li className="flex items-center gap-3 text-gray-300 text-sm">
                                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400"></div>
                                        Public Templates
                                    </li>
                                </ul>
                                <button 
                                    onClick={onLaunch}
                                    className="w-full py-3 rounded-xl border border-white/20 text-white font-bold font-orbitron hover:bg-white/10 transition-all hover:scale-[1.02] text-sm"
                                >
                                    START FREE
                                </button>
                            </div>
                        </div>

                        {/* Pro Tier */}
                        <div className="relative group h-full transform md:-translate-y-4">
                            <div className="absolute inset-0 bg-gradient-to-b from-purple-500/20 to-transparent rounded-[2rem] blur-xl group-hover:blur-2xl transition-all opacity-100"></div>
                            <div className="relative bg-[#1a1a2e] border border-purple-500/50 rounded-[2rem] p-8 hover:border-purple-400 transition-all duration-300 h-full flex flex-col shadow-2xl">
                                <div className="absolute top-0 right-0 bg-gradient-to-l from-purple-600 to-cyan-600 text-white text-[10px] font-bold px-4 py-1.5 rounded-bl-xl rounded-tr-[1.8rem] tracking-wider">
                                    POPULAR
                                </div>
                                <div className="mb-6">
                                    <h3 className="text-xl font-orbitron text-purple-300 mb-2">NEXUS</h3>
                                    <div className="text-4xl font-bold text-white mb-2 flex items-baseline gap-1">
                                        {formatPrice(20)}
                                    </div>
                                    <p className="text-gray-400 text-sm">For professional autonomous development.</p>
                                </div>
                                <ul className="space-y-4 mb-8 flex-grow">
                                    <li className="flex items-center gap-3 text-white font-medium text-sm">
                                        <div className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_5px_#a855f7]"></div>
                                        10,000,000 Monthly Tokens
                                    </li>
                                    <li className="flex items-center gap-3 text-white font-medium text-sm">
                                        <div className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_5px_#a855f7]"></div>
                                        Access to Gemini 1.5 Pro
                                    </li>
                                    <li className="flex items-center gap-3 text-white font-medium text-sm">
                                        <div className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_5px_#a855f7]"></div>
                                        Private GitHub Repo Sync
                                    </li>
                                    <li className="flex items-center gap-3 text-white font-medium text-sm">
                                        <div className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_5px_#a855f7]"></div>
                                        Priority Processing
                                    </li>
                                </ul>
                                <button 
                                    onClick={() => setSelectedPlan({name: 'Pro', price: 20})}
                                    className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-bold font-orbitron hover:from-purple-500 hover:to-cyan-400 transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] hover:scale-[1.02] text-sm"
                                >
                                    UPGRADE NOW
                                </button>
                            </div>
                        </div>

                        {/* Ultimate Tier */}
                        <div className="relative group h-full">
                            <div className="absolute inset-0 bg-gradient-to-b from-yellow-500/10 to-transparent rounded-[2rem] blur-xl group-hover:blur-2xl transition-all opacity-0 group-hover:opacity-100"></div>
                            <div className="relative bg-[#13131f] border border-white/10 rounded-[2rem] p-8 hover:border-yellow-500/50 transition-all duration-300 h-full flex flex-col">
                                 <div className="absolute top-0 right-0 bg-gradient-to-l from-yellow-600 to-orange-600 text-white text-[10px] font-bold px-4 py-1.5 rounded-bl-xl rounded-tr-[1.8rem] tracking-wider">
                                    ULTIMATE
                                </div>
                                <div className="mb-6">
                                    <h3 className="text-xl font-orbitron text-yellow-300 mb-2">TITAN</h3>
                                    <div className="text-4xl font-bold text-white mb-2 flex items-baseline gap-1">
                                        {formatPrice(50)}
                                    </div>
                                    <p className="text-gray-400 text-sm">For teams and enterprise scaling.</p>
                                </div>
                                <ul className="space-y-4 mb-8 flex-grow">
                                    <li className="flex items-center gap-3 text-gray-200 font-medium text-sm">
                                        <div className="w-1.5 h-1.5 rounded-full bg-yellow-400"></div>
                                        Unlimited Monthly Tokens
                                    </li>
                                    <li className="flex items-center gap-3 text-gray-200 font-medium text-sm">
                                        <div className="w-1.5 h-1.5 rounded-full bg-yellow-400"></div>
                                        Dedicated GPU Cluster
                                    </li>
                                    <li className="flex items-center gap-3 text-gray-200 font-medium text-sm">
                                        <div className="w-1.5 h-1.5 rounded-full bg-yellow-400"></div>
                                        Team Collaboration Tools
                                    </li>
                                    <li className="flex items-center gap-3 text-gray-200 font-medium text-sm">
                                        <div className="w-1.5 h-1.5 rounded-full bg-yellow-400"></div>
                                        24/7 Priority Support
                                    </li>
                                </ul>
                                <button 
                                    onClick={() => setSelectedPlan({name: 'Titan', price: 50})}
                                    className="w-full py-3 rounded-xl border border-yellow-500/30 text-yellow-300 font-bold font-orbitron hover:bg-yellow-500/10 transition-all hover:scale-[1.02] text-sm"
                                >
                                    GO TITAN
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const LandingPage: React.FC<LandingPageProps> = ({ onLaunch }) => {
    const [isSelecting, setIsSelecting] = useState(false);
    const [hoveredElement, setHoveredElement] = useState<string | null>(null);
    const [prompt, setPrompt] = useState('');
    const [selectedModel, setSelectedModel] = useState<string>(AI_MODELS[0]);
    const [isListening, setIsListening] = useState(false);
    const [isPricingOpen, setIsPricingOpen] = useState(false);
    
    const tooltipRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const recognitionRef = useRef<any>(null);
    const typewriterPlaceholder = useTypewriter(placeholderPrompts);
    
    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${textarea.scrollHeight}px`;
        }
    }, [prompt]);

    useEffect(() => {
        if (!isSelecting) return;

        const handleMouseOver = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (target === document.body || target.id === 'element-selector-tooltip' || target.parentElement?.id === 'element-selector-tooltip') {
                setHoveredElement(null);
                return;
            };
            target.style.outline = '2px solid #06B6D4';
            const tagName = target.tagName.toLowerCase();
            const id = target.id ? `#${target.id}` : '';
            const classes = Array.from(target.classList).slice(0, 2).map(c => `.${c}`).join('');
            setHoveredElement(`${tagName}${id}${classes}`);
        };

        const handleMouseOut = (e: MouseEvent) => {
            (e.target as HTMLElement).style.outline = '';
            setHoveredElement(null);
        };
        
        const handleClick = (e: MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            alert(`Selected element: ${hoveredElement || 'none'}. In the app, this would provide context to the agent.`);
            setIsSelecting(false);
        };
        
        const handleMouseMove = (e: MouseEvent) => {
            if (tooltipRef.current) {
                tooltipRef.current.style.left = `${e.clientX + 15}px`;
                tooltipRef.current.style.top = `${e.clientY + 15}px`;
            }
        };

        document.body.addEventListener('mouseover', handleMouseOver);
        document.body.addEventListener('mouseout', handleMouseOut);
        document.body.addEventListener('click', handleClick, true);
        document.body.addEventListener('mousemove', handleMouseMove);
        document.body.style.cursor = 'crosshair';

        return () => {
            document.body.removeEventListener('mouseover', handleMouseOver);
            document.body.removeEventListener('mouseout', handleMouseOut);
            document.body.removeEventListener('click', handleClick, true);
            document.body.removeEventListener('mousemove', handleMouseMove);
            document.body.style.cursor = 'default';
            document.querySelectorAll('*').forEach(el => (el as HTMLElement).style.outline = '');
        };
    }, [isSelecting, hoveredElement]);

    const handleVoiceInput = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            return;
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Voice recognition is not supported in your browser.");
            return;
        }

        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;

        recognitionRef.current.onstart = () => setIsListening(true);
        recognitionRef.current.onend = () => {
            setIsListening(false);
            recognitionRef.current = null;
        };
        recognitionRef.current.onerror = (event: any) => {
            console.error("Speech recognition error", event.error);
            setIsListening(false);
        };

        let finalTranscript = '';
        recognitionRef.current.onresult = (event: any) => {
            let interimTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }
            setPrompt(finalTranscript + interimTranscript);
        };

        recognitionRef.current.start();
    };

    return (
        <div className="bg-[#0A0A0A] text-white h-screen flex flex-col font-poppins relative overflow-hidden">
            {isPricingOpen && <PricingModal onClose={() => setIsPricingOpen(false)} onLaunch={() => { setIsPricingOpen(false); onLaunch('', selectedModel); }} />}
            
            {isSelecting && hoveredElement && (
                <div ref={tooltipRef} id="element-selector-tooltip" className="fixed z-50 px-3 py-1 bg-cyan-500 text-black text-sm font-fira-code rounded-full pointer-events-none">
                    {hoveredElement}
                </div>
            )}
            <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-cyan-900/20"></div>

            {/* Floating Glassmorphic Menu Bar */}
            <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-2xl transition-all duration-300">
                <div className="bg-[#0a0a1a]/80 backdrop-blur-xl border border-cyan-500/30 rounded-3xl p-3 flex items-center justify-between shadow-[0_0_30px_rgba(0,243,255,0.15)] ring-1 ring-white/10 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 pointer-events-none"></div>
                    
                    <div className="pl-4 flex items-center gap-3">
                         <div className="relative">
                            <div className="w-8 h-8 bg-gradient-to-tr from-cyan-400 to-purple-500 rounded-full flex items-center justify-center animate-pulse shadow-[0_0_15px_#22d3ee]">
                                <div className="w-3 h-3 bg-white rounded-full"></div>
                            </div>
                         </div>
                        <span className="font-orbitron font-bold text-lg tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-white drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]">
                            NEXUS CODER
                        </span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setIsPricingOpen(true)}
                            className="hidden sm:block px-6 py-2.5 rounded-3xl text-sm font-bold font-orbitron text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/10 hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(34,211,238,0.3)] transition-all duration-300"
                        >
                            PRICING
                        </button>
                        <button 
                            onClick={() => onLaunch('', selectedModel)}
                            className="px-6 py-2.5 rounded-3xl text-sm font-bold bg-gradient-to-r from-purple-600 to-cyan-500 text-white hover:shadow-[0_0_20px_rgba(0,255,255,0.5)] transition-all duration-300 transform hover:scale-105"
                        >
                            Sign In / Sign Up
                        </button>
                    </div>
                </div>
            </nav>

            <main className="flex-grow flex flex-col items-center justify-center text-center p-4 z-10 mt-20">
                <h2 className="font-orbitron text-4xl md:text-6xl font-bold text-white mb-6 animate-fade-in-down leading-tight">
                    The Autonomous <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-cyan-400 to-emerald-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]">AI Coding Agent</span>
                </h2>
                <p className="max-w-2xl text-gray-300 text-lg md:text-xl mb-10 animate-fade-in-up leading-relaxed px-4">
                    Describe your application in plain English, and watch Nexus Coder build it in real-time. From complex logic to pixel-perfect UIs, bring your ideas to life instantly.
                </p>

                <div className="w-full max-w-3xl px-4">
                    {/* Increased border thickness via p-[4px] and padding adjustment */}
                    <div className="relative p-[4px] bg-gradient-to-r from-purple-500/80 to-cyan-500/80 rounded-[2rem] shadow-[0_0_40px_rgba(168,85,247,0.25)] animate-fade-in-up" style={{animationDelay: '0.2s'}}>
                        <div className="bg-[#0d0d12] rounded-[1.7rem] p-4 relative">
                             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50"></div>
                            <textarea
                                ref={textareaRef}
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder={typewriterPlaceholder + '|'}
                                className="w-full bg-transparent focus:outline-none transition-all duration-300 font-fira-code text-base resize-none text-gray-200 placeholder:text-gray-600 overflow-y-hidden min-h-[80px]"
                                rows={3}
                            />
                            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between flex-wrap gap-2">
                                <div className="flex items-center gap-4 text-sm">
                                    <CommandBarButton tooltip="Attach files">
                                        <PaperclipIcon className="h-5 w-5" />
                                    </CommandBarButton>
                                    <CommandBarButton tooltip="Select an element to give the AI visual context" onClick={() => setIsSelecting(prev => !prev)} isActive={isSelecting}>
                                        <CursorIcon className="h-5 w-5" />
                                        <span className="hidden sm:inline">Select</span>
                                    </CommandBarButton>
                                    <CommandBarButton tooltip="Discuss with agent">
                                        <ChatIcon className="h-5 w-5" />
                                        <span className="hidden sm:inline">Discuss</span>
                                    </CommandBarButton>
                                </div>
                                <div className="flex items-center gap-3 ml-auto">
                                    <Tooltip text={isListening ? 'Stop listening' : 'Use voice input'} position="top" align="end">
                                        <button onClick={handleVoiceInput} className={`p-2 rounded-full transition-colors ${isListening ? 'text-red-400 bg-red-500/20 animate-pulse' : 'text-gray-400 hover:text-cyan-300 hover:bg-cyan-500/10'}`}>
                                            <MicrophoneIcon className="h-5 w-5" />
                                        </button>
                                    </Tooltip>
                                    <Tooltip text="Select AI model" position="bottom" align="end">
                                        <div className="w-32 sm:w-48 z-20 relative">
                                            <CustomSelect
                                                value={selectedModel}
                                                onChange={setSelectedModel}
                                                options={AI_MODELS}
                                                direction="top"
                                            />
                                        </div>
                                    </Tooltip>
                                </div>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => onLaunch(prompt, selectedModel)}
                        className="w-full mt-6 text-lg font-orbitron font-bold py-4 px-6 rounded-3xl bg-gradient-to-r from-purple-600 via-cyan-600 to-emerald-500 hover:from-purple-500 hover:to-emerald-400 text-white transition-all duration-300 transform hover:scale-[1.02] shadow-[0_0_25px_rgba(0,255,255,0.3)] hover:shadow-[0_0_40px_rgba(0,255,255,0.5)] animate-fade-in-up"
                        style={{animationDelay: '0.4s'}}
                    >
                        LAUNCH AGENT
                    </button>
                    
                    {/* Mobile Only Pricing Button */}
                     <button 
                        onClick={() => setIsPricingOpen(true)}
                        className="sm:hidden w-full mt-4 py-3 rounded-3xl text-sm font-bold font-orbitron text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/10 animate-fade-in-up"
                        style={{animationDelay: '0.5s'}}
                    >
                        VIEW PRICING PLANS
                    </button>
                </div>
            </main>
            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
                @keyframes fade-in-down {
                    from { opacity: 0; transform: translateY(-30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-down { animation: fade-in-down 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                .animate-fade-in-up { animation: fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                .bg-grid-pattern {
                    background-image:
                        linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px);
                    background-size: 50px 50px;
                }
            `}</style>
        </div>
    );
};
