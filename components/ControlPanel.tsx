
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Task, Problem, AgentStatus, UploadedFile, Commit, Mission, FileNode } from '../types';
import { AI_MODELS } from '../constants';
import { ProblemCard } from './ProblemCard';
import { TaskInProgressIcon, TaskPendingIcon, TaskSuccessIcon, PlanIcon, ProblemsIcon, PaperclipIcon, ReviewIcon, MicrophoneIcon, CursorIcon, ChatIcon, NewFolderIcon, EditIcon, LightbulbIcon, ChevronIcon, CopyIcon, ErrorIcon, ReloadIcon, HistoryIcon, LoadingIcon } from './Icons';
import { Tooltip } from './Tooltip';
import { SelectElementModal } from './SelectElementModal';
import { DiscussWithAgentModal } from './DiscussWithAgentModal';
import { CustomSelect } from './CustomSelect';
import { Terminal } from './Terminal';
import { formatRelativeTime } from '../utils';
import { LEGACY_TEMPLATES } from '../templates';

interface ControlPanelProps {
  tasks: Task[];
  problems: Problem[];
  activeProblemId: string | null;
  prompt: string;
  setPrompt: (prompt: string) => void;
  missionPrompt: string;
  statusMessage: string;
  projectName: string;
  setProjectName: (name: string) => void;
  onGenerate: (prompt?: string) => void;
  agentStatus: AgentStatus;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  onFileUpload: (files: FileList) => void;
  uploadedFiles: UploadedFile[];
  pauseReason: string | null;
  userInputForPause: string;
  setUserInputForPause: (input: string) => void;
  onResume: () => void;
  onReset: () => void;
  onStop: () => void;
  onNewProject: () => void;
  onBillingClick: () => void;
  onAddDiscussionLog: (message: string) => void;
  missionHistory: Mission[];
  onRestoreMission: (prompt: string) => void;
  onDeleteMission: (missionId: string) => void;
  onLoadLegacyProject: (template: { name: string, files: FileNode[] }) => void;
  agentLogs: string[];
}

const ImagePreview: React.FC<{ src: string; onRemove: () => void }> = ({ src, onRemove }) => (
    <div className="relative inline-block mr-2 mb-2">
        <img src={src} alt="Pasted" className="w-20 h-20 object-cover rounded-lg border border-cyan-500/30" />
        <button 
            onClick={onRemove}
            className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs hover:bg-red-600 transition-colors"
        >
            ×
        </button>
    </div>
);

const placeholderPrompts = [
  "Let's build a prototype to validate...",
  "Let's build a dashboard to track real-time KPIs for...",
  "Let's build a customer portal where users can...",
  "Let's build an enterprise solution that...",
  "Initiating project: A quantum analytics engine for...",
  "Developing an adaptive AI interface that...",
  "Engineering a cognitive security sentinel for...",
  "Assembling a synthetic data generation hub for...",
];

const getContextAwareSuggestions = (missionPrompt: string, agentStatus: AgentStatus) => {
    // Default suggestions with more options
    const defaultSuggestions = [
        { short: "Add Dark Mode", full: "Implement a dark mode theme toggle that saves the user's preference in local storage." },
        { short: "Make it Responsive", full: "Ensure the application is fully responsive and looks great on mobile, tablet, and desktop screens." },
        { short: "Add Animations", full: "Add subtle animations to key components like buttons and cards to improve user experience." },
        { short: "Add Loading States", full: "Implement loading spinners and skeleton screens for better perceived performance." },
        { short: "Error Handling", full: "Add comprehensive error handling with user-friendly error messages and retry mechanisms." },
        { short: "Add Search", full: "Implement a search functionality with autocomplete and filtering capabilities." },
        { short: "Accessibility", full: "Ensure WCAG 2.1 AA compliance with proper ARIA labels, keyboard navigation, and screen reader support." },
        { short: "Performance", full: "Optimize bundle size, implement code splitting, and add lazy loading for images." },
        { short: "Add Tests", full: "Write unit tests and integration tests using Jest and React Testing Library." },
        { short: "Documentation", full: "Add comprehensive README with setup instructions, API documentation, and usage examples." },
    ];
    
    // If no mission, show generic suggestions
    if (!missionPrompt) return defaultSuggestions;
    
    const prompt = missionPrompt.toLowerCase();
    const suggestions = [];
    
    // Context-aware suggestions based on project type
    if (prompt.includes('dashboard') || prompt.includes('analytics')) {
        suggestions.push(
            { short: "Add Charts", full: "Integrate Chart.js or Recharts for data visualization with interactive charts and graphs." },
            { short: "Real-time Updates", full: "Implement WebSocket connections for real-time data updates in the dashboard." },
            { short: "Export Data", full: "Add functionality to export dashboard data as CSV, PDF, or Excel files." },
            { short: "Filters", full: "Add date range filters, category filters, and custom filter options." },
            { short: "KPI Cards", full: "Create interactive KPI cards with trend indicators and drill-down capabilities." },
            { short: "Data Tables", full: "Implement sortable, filterable data tables with pagination and search." },
            { short: "Notifications", full: "Add real-time notifications for important metrics and threshold alerts." },
            { short: "User Roles", full: "Implement role-based access control for different dashboard views." }
        );
    } else if (prompt.includes('e-commerce') || prompt.includes('shop') || prompt.includes('store')) {
        suggestions.push(
            { short: "Add Cart", full: "Implement a shopping cart with add/remove items, quantity updates, and checkout flow." },
            { short: "Payment Gateway", full: "Integrate Stripe or PayPal for secure payment processing." },
            { short: "Product Search", full: "Add advanced product search with filters, sorting, and autocomplete." },
            { short: "Wishlist", full: "Add wishlist functionality so users can save products for later." },
            { short: "Reviews", full: "Implement product reviews and ratings with photo uploads." },
            { short: "Inventory", full: "Add real-time inventory tracking and low stock notifications." },
            { short: "Coupons", full: "Implement discount codes and promotional campaigns." },
            { short: "Order Tracking", full: "Add order tracking with email notifications and status updates." }
        );
    } else if (prompt.includes('blog') || prompt.includes('cms') || prompt.includes('content')) {
        suggestions.push(
            { short: "Rich Text Editor", full: "Add a WYSIWYG editor like TinyMCE or Quill for content creation." },
            { short: "SEO Optimization", full: "Implement meta tags, sitemaps, and structured data for better SEO." },
            { short: "Comments System", full: "Add a commenting system with moderation and reply functionality." },
            { short: "Categories", full: "Implement content categories and tags for better organization." },
            { short: "Media Library", full: "Add a media library for managing images, videos, and documents." },
            { short: "Drafts", full: "Implement draft saving and scheduled publishing features." },
            { short: "Social Sharing", full: "Add social media sharing buttons and Open Graph tags." },
            { short: "Analytics", full: "Integrate Google Analytics or similar for content performance tracking." }
        );
    } else if (prompt.includes('auth') || prompt.includes('login') || prompt.includes('user')) {
        suggestions.push(
            { short: "OAuth Login", full: "Add social login with Google, GitHub, or Facebook OAuth." },
            { short: "2FA Security", full: "Implement two-factor authentication for enhanced security." },
            { short: "Password Reset", full: "Add forgot password functionality with email verification." },
            { short: "Email Verification", full: "Implement email verification for new user registrations." },
            { short: "Session Management", full: "Add secure session management with automatic timeout." },
            { short: "Profile Management", full: "Allow users to update their profile information and preferences." },
            { short: "Activity Log", full: "Track and display user login history and account activity." },
            { short: "CAPTCHA", full: "Add CAPTCHA protection against bots and automated attacks." }
        );
    } else if (prompt.includes('real estate') || prompt.includes('property') || prompt.includes('listing')) {
        suggestions.push(
            { short: "Map Integration", full: "Add Google Maps or Mapbox to show property locations with markers." },
            { short: "Image Gallery", full: "Implement a lightbox image gallery for property photos with zoom and slideshow." },
            { short: "Filter & Search", full: "Add advanced filters for price range, bedrooms, location, and property type." },
            { short: "Virtual Tours", full: "Integrate 360° virtual tours and video walkthroughs." },
            { short: "Mortgage Calculator", full: "Add a mortgage calculator with customizable rates and terms." },
            { short: "Favorites", full: "Allow users to save favorite properties and get notifications." },
            { short: "Contact Forms", full: "Add property-specific contact forms with agent information." },
            { short: "Comparison", full: "Implement side-by-side property comparison feature." }
        );
    } else {
        // Generic improvements with more options
        suggestions.push(
            { short: "Add Dark Mode", full: "Implement a dark mode theme toggle that saves the user's preference." },
            { short: "Improve UX", full: "Add loading states, error handling, and success feedback for better user experience." },
            { short: "Mobile First", full: "Optimize the UI for mobile devices with touch-friendly controls." },
            { short: "Add Animations", full: "Implement smooth transitions and micro-interactions." },
            { short: "Accessibility", full: "Ensure WCAG compliance with keyboard navigation and screen reader support." },
            { short: "Performance", full: "Optimize loading times with code splitting and lazy loading." },
            { short: "PWA Features", full: "Add offline support and install prompts for Progressive Web App." },
            { short: "Internationalization", full: "Add multi-language support with i18n." }
        );
    }
    
    // Add status-specific suggestions
    if (agentStatus === 'completed') {
        suggestions.push({ short: "Deploy Now", full: "Deploy this application to Vercel, Netlify, or your preferred hosting platform." });
    }
    
    return suggestions.slice(0, 12); // Max 12 suggestions to ensure scroll buttons appear
};

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

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [text, isDeleting, wordIndex, words, speed, delay]);

    return text;
};


const GlassCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={`bg-gray-900/50 backdrop-blur-lg border border-cyan-400/20 rounded-3xl p-6 ${className}`}>
    {children}
  </div>
);

const SectionTitle: React.FC<{ children: React.ReactNode; icon?: React.ReactNode }> = ({ children, icon }) => (
    <div className="flex items-center gap-3 mb-3">
        {icon}
        <h2 className="text-base font-orbitron text-cyan-300 tracking-wide">{children}</h2>
    </div>
);

const TaskCard: React.FC<{ task: Task; index: number }> = ({ task, index }) => {
    const isCompleted = task.status === 'completed';
    const isInProgress = task.status === 'in-progress';
    const isPending = task.status === 'pending';
    const isError = task.status === 'error';

    // Get action icon
    const getActionIcon = () => {
        switch (task.action) {
            case 'read': return '📖';
            case 'write': return '✍️';
            case 'search': return '🔍';
            case 'edit': return '✏️';
            case 'analyze': return '🔬';
            case 'build': return '🔨';
            case 'test': return '🧪';
            case 'deploy': return '🚀';
            default: return '⚡';
        }
    };

    return (
        <div 
            className={`
                relative p-4 rounded-3xl border transition-all duration-500 ease-out transform max-w-[96%] mx-auto
                ${isCompleted 
                    ? 'bg-green-500/10 border-green-500/40 shadow-[0_0_20px_rgba(34,197,94,0.15)]' 
                    : isInProgress 
                        ? 'bg-cyan-500/10 border-cyan-400/50 shadow-[0_0_25px_rgba(6,182,212,0.2)] scale-[1.02] ring-1 ring-cyan-400/30' 
                        : isError
                        ? 'bg-red-500/10 border-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.15)]'
                        : 'bg-black/20 border-white/5 text-gray-500 opacity-80 hover:opacity-100 hover:bg-black/30'
                }
            `}
        >
            {isInProgress && (
                <div className="absolute top-3 right-3 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
                </div>
            )}
            
            {isCompleted && (
                <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shadow-[0_0_10px_rgba(34,197,94,0.5)]">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
            )}
            
            <div className="flex items-start gap-4">
                <div className={`
                    flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border font-fira-code font-bold text-xs
                    ${isCompleted ? 'bg-green-500 text-black border-green-400 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 
                      isInProgress ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 animate-pulse shadow-[0_0_10px_rgba(6,182,212,0.5)]' : 
                      isError ? 'bg-red-500/20 text-red-300 border-red-400' :
                      'bg-gray-800 text-gray-500 border-gray-700'}
                `}>
                    {(index + 1).toString().padStart(2, '0')}
                </div>
                <div className="flex-grow min-w-0">
                    <h4 className={`text-sm font-medium leading-relaxed break-words ${
                        isCompleted ? 'text-green-200' : 
                        isInProgress ? 'text-cyan-100' : 
                        isError ? 'text-red-200' :
                        'text-gray-400'
                    }`}>
                        {task.description}
                    </h4>
                    <div className="mt-2 flex items-center gap-2">
                        <span className={`text-[10px] uppercase tracking-wider font-bold font-orbitron px-2 py-0.5 rounded-full ${
                             isCompleted ? 'bg-green-500/20 text-green-400' : 
                             isInProgress ? 'bg-cyan-500/20 text-cyan-400' : 
                             isError ? 'bg-red-500/20 text-red-400' :
                             'bg-gray-800 text-gray-600'
                        }`}>
                            {task.status}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

const TokenUsageBanner: React.FC<{onBillingClick: () => void}> = ({ onBillingClick }) => (
    <div className="bg-gray-800/60 rounded-lg px-2 py-2 text-center flex-grow">
        <p className="text-gray-400 text-[10px] leading-tight">300k tokens remaining; <button onClick={onBillingClick} className="font-semibold text-purple-400 hover:text-purple-300 transition-colors underline">Upgrade to Pro</button></p>
    </div>
);

const CommandBarButton: React.FC<{tooltip: string, children: React.ReactNode, onClick?: () => void, disabled?: boolean}> = ({ tooltip, children, onClick, disabled }) => (
    <Tooltip text={tooltip} position="top" align="center">
        <button 
            onClick={onClick}
            disabled={disabled}
            className="flex items-center gap-1.5 text-gray-400 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
        >
            {children}
        </button>
    </Tooltip>
);

const SuggestionBubble: React.FC<{ text: string; onClick: () => void }> = ({ text, onClick }) => (
    <button
        onClick={onClick}
        className="flex-shrink-0 flex items-center justify-center gap-1 bg-purple-500/10 text-purple-200 px-2.5 py-1 rounded-full text-[10px] font-semibold hover:bg-purple-500/20 transition-colors whitespace-nowrap h-6"
    >
        <LightbulbIcon className="w-2.5 h-2.5 flex-shrink-0"/>
        <span className="leading-none">{text}</span>
    </button>
);

const PlanningCard: React.FC = () => (
    <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-900/30 to-cyan-900/30 border border-cyan-500/30 shadow-[0_0_30px_rgba(34,211,238,0.1)] flex flex-col items-center justify-center text-center animate-pulse">
        <div className="w-12 h-12 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin mb-4"></div>
        <h3 className="font-orbitron text-lg text-cyan-300 tracking-wider">Architecting Solution...</h3>
        <p className="text-sm text-gray-400 mt-2">Analyzing requirements and designing system structure.</p>
    </div>
);

export const ControlPanel: React.FC<ControlPanelProps> = ({ 
    tasks, problems, activeProblemId, prompt, setPrompt, missionPrompt, statusMessage, projectName, setProjectName, onGenerate, agentStatus, selectedModel, setSelectedModel,
    onFileUpload, uploadedFiles, 
    pauseReason, userInputForPause, setUserInputForPause, onResume, onReset, onStop, onNewProject, onBillingClick,
    onAddDiscussionLog, missionHistory, onRestoreMission, onDeleteMission, onLoadLegacyProject, agentLogs
}) => {
  
  const isAgentActive = agentStatus === 'planning' || agentStatus === 'coding' || agentStatus === 'reviewing' || agentStatus === 'fixing' || agentStatus === 'debugging';
  const isPaused = agentStatus === 'paused';
  const isIdle = agentStatus === 'idle';
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hitlInputRef = useRef<HTMLTextAreaElement>(null);
  const historyMenuRef = useRef<HTMLDivElement>(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [missionToDelete, setMissionToDelete] = useState<{ id: string; prompt: string } | null>(null);
  const [pastedImages, setPastedImages] = useState<string[]>([]);

  const [isSelectModalOpen, setSelectModalOpen] = useState(false);
  const [isDiscussModalOpen, setDiscussModalOpen] = useState(false);
  const [isEditingProjectName, setIsEditingProjectName] = useState(false);
  const [currentProjectName, setCurrentProjectName] = useState(projectName);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const typewriterPlaceholder = useTypewriter(placeholderPrompts);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Auto-focus HITL input when agent pauses
  useEffect(() => {
    if (agentStatus === 'paused' && hitlInputRef.current) {
        setTimeout(() => {
            hitlInputRef.current?.focus();
            hitlInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
    }
  }, [agentStatus]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (historyMenuRef.current && !historyMenuRef.current.contains(event.target as Node)) {
            setIsHistoryOpen(false);
        }
    };
    if (isHistoryOpen) {
        document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isHistoryOpen]);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) {
        const checkScroll = () => {
            setCanScrollLeft(el.scrollLeft > 2);
            setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 2);
        };
        checkScroll();
        el.addEventListener('scroll', checkScroll);
        return () => el.removeEventListener('scroll', checkScroll);
    }
  }, []);

  const handleSuggestionsScroll = (direction: 'left' | 'right') => {
    const el = scrollContainerRef.current;
    if (el) {
        const scrollAmount = el.clientWidth * 0.8;
        el.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    setCurrentProjectName(projectName);
  }, [projectName]);


  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
        textarea.style.height = 'auto';
        const scrollHeight = textarea.scrollHeight;
        textarea.style.height = `${Math.min(scrollHeight, 120)}px`;
        textarea.style.overflowY = scrollHeight > 120 ? 'auto' : 'hidden';
    }
  }, [prompt]);
  
  const handleProjectNameSave = () => {
    if (currentProjectName.trim()) {
        setProjectName(currentProjectName.trim());
    } else {
        setCurrentProjectName(projectName);
    }
    setIsEditingProjectName(false);
  };

  const handleCopyMissionPrompt = () => {
      navigator.clipboard.writeText(missionPrompt).then(() => {
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 2000);
      });
  };

  const handleVoiceInput = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[event.results.length - 1][0].transcript;
        setPrompt(transcript);
        setIsListening(false);
    };
    recognitionRef.current.start();
    setIsListening(true);
  };
  
  const handlePaste = async (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      
      for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
              e.preventDefault();
              const blob = items[i].getAsFile();
              if (blob) {
                  const reader = new FileReader();
                  reader.onload = (event) => {
                      const imageData = event.target?.result as string;
                      setPastedImages(prev => [...prev, imageData]);
                      if (!prompt.trim()) {
                          setPrompt('Build this UI from the image');
                      }
                  };
                  reader.readAsDataURL(blob);
              }
          }
      }
  };

  return (
    <>
      {isSelectModalOpen && <SelectElementModal onClose={() => setSelectModalOpen(false)} />}
      {isDiscussModalOpen && <DiscussWithAgentModal onClose={() => setDiscussModalOpen(false)} onSendMessage={onAddDiscussionLog} />}

      <GlassCard className="h-full flex flex-col pb-6 overflow-hidden">
        {/* Sticky Header - Compact */}
        <div className="flex-shrink-0 pb-2 border-b border-cyan-500/10 px-2 bg-gray-900/50 sticky top-0 z-10 overflow-visible">
            <div className="flex justify-between items-center mb-2 gap-2">
                <div className="flex-grow min-w-0">
                    <h2 className="text-[10px] font-orbitron text-cyan-300/70 tracking-widest mb-0.5">Mission Control</h2>
                    {isEditingProjectName ? (
                        <input
                            type="text"
                            value={currentProjectName}
                            onChange={(e) => setCurrentProjectName(e.target.value)}
                            onBlur={handleProjectNameSave}
                            onKeyDown={(e) => e.key === 'Enter' && handleProjectNameSave()}
                            autoFocus
                            className="text-xl font-orbitron text-white bg-transparent border-b-2 border-purple-500 focus:outline-none w-full"
                        />
                    ) : (
                        <div onClick={() => setIsEditingProjectName(true)} className="group flex items-center gap-1.5 cursor-pointer">
                            <h3 className="text-base font-orbitron text-white truncate max-w-[200px]">{projectName}</h3>
                            <EditIcon className="w-3.5 h-3.5 text-gray-500 group-hover:text-white transition-colors"/>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <div ref={historyMenuRef} className="relative">
                        {!isHistoryOpen && (
                            <Tooltip text="Mission History" position="bottom" align="center">
                                <button 
                                    onClick={() => setIsHistoryOpen(!isHistoryOpen)} 
                                    className={`p-2 rounded-lg transition-colors ${isHistoryOpen ? 'bg-purple-500/30 text-purple-200' : 'hover:bg-white/10 text-gray-400'}`}
                                >
                                    <HistoryIcon className="w-5 h-5" />
                                </button>
                            </Tooltip>
                        )}
                        {isHistoryOpen && (
                            <button 
                                onClick={() => setIsHistoryOpen(!isHistoryOpen)} 
                                className="p-2 rounded-lg transition-colors bg-purple-500/30 text-purple-200"
                            >
                                <HistoryIcon className="w-5 h-5" />
                            </button>
                        )}
                        
                        {isHistoryOpen && (
                            <div className="absolute z-[9999] top-full left-1/2 mt-2 w-72 max-w-[calc(100vw-2rem)] bg-[#0d0d12] border border-purple-500/30 rounded-2xl shadow-xl max-h-64 overflow-y-auto custom-scrollbar p-2 animate-fade-in" style={{ transform: 'translateX(-50%)' }}>
                                <h4 className="text-xs font-orbitron text-gray-400 px-2 py-1 mb-1">Previous Missions</h4>
                                {missionHistory.length === 0 ? (
                                    <div className="text-center p-4 text-xs text-gray-500 italic">No previous missions.</div>
                                ) : (
                                    missionHistory.map((m) => (
                                        <div key={m.id} className="p-2 hover:bg-white/5 rounded-lg group transition-colors flex items-start gap-2">
                                            <div onClick={() => { onRestoreMission(m.prompt); setIsHistoryOpen(false); }} className="flex-grow cursor-pointer min-w-0">
                                                <p className="text-xs text-gray-300 line-clamp-3 break-words" title={m.prompt}>{m.prompt}</p>
                                                <span className="text-[10px] text-gray-500">{formatRelativeTime(new Date(m.timestamp).toISOString())}</span>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setMissionToDelete({ id: m.id, prompt: m.prompt });
                                                }}
                                                className="p-1 hover:bg-red-500/20 rounded text-red-400 hover:text-red-300 transition-colors"
                                                title="Delete mission"
                                            >
                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    <div className="relative">
                        <Tooltip text="Create a new project from a template" position="bottom" align="end">
                            <button 
                                onClick={onNewProject} 
                                className="text-xs font-bold font-orbitron py-2 px-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 text-white hover:from-purple-500 hover:to-cyan-400 transition-all shadow-lg flex items-center gap-1.5 whitespace-nowrap flex-shrink-0"
                            >
                                <NewFolderIcon className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">New Template</span>
                                <span className="sm:hidden">New</span>
                            </button>
                        </Tooltip>
                    </div>
                </div>
            </div>

             {agentStatus === 'error' && (
                <div className="my-4 p-5 bg-red-500/10 border border-red-500/30 rounded-3xl animate-pulse overflow-y-auto max-h-40 custom-scrollbar">
                    <div className="flex items-start gap-3">
                        <ErrorIcon className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
                        <div className="flex-grow min-w-0">
                            <h4 className="text-sm font-orbitron text-red-300 tracking-widest font-bold">MISSION INTERRUPTION</h4>
                            <div className="text-sm text-red-200 break-words mt-1 font-fira-code text-xs">
                                {statusMessage}
                            </div>
                            
                            <div className="mt-4 flex gap-3">
                                <button 
                                    onClick={() => onGenerate(prompt)}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-full text-sm font-bold transition-colors border border-red-500/30"
                                >
                                    <ReloadIcon className="w-4 h-4" /> Retry
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
             
             {missionPrompt && (
                <div className="relative my-2 p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl">
                    <div className="flex justify-between items-center mb-1">
                        <h4 className="text-[10px] font-orbitron text-purple-300 tracking-widest flex items-center gap-2">
                            ACTIVE MISSION
                            {missionHistory.length > 0 && <span className="text-[9px] text-purple-400/60 font-mono">{new Date(missionHistory[0].timestamp).toLocaleTimeString()}</span>}
                        </h4>
                        <Tooltip text={isCopied ? "Copied!" : "Copy Mission"} position="top" align="end">
                            <button onClick={handleCopyMissionPrompt} className="text-gray-500 hover:text-white transition-colors">
                                <CopyIcon className="w-3 h-3" />
                            </button>
                        </Tooltip>
                    </div>
                    <p className="text-xs font-fira-code text-gray-300 max-h-20 overflow-y-auto custom-scrollbar leading-relaxed">
                        {missionPrompt}
                    </p>
                </div>
            )}
        </div>


        <div className="flex-grow flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-2 -mr-2 min-h-0 pt-2">
          {agentStatus === 'paused' && (
              <div className="border border-purple-500/50 bg-purple-500/10 rounded-2xl p-4 animate-fade-in ring-1 ring-purple-400/30 shadow-[0_0_20px_rgba(168,85,247,0.2)] flex-shrink-0">
                  <SectionTitle icon={<ReviewIcon className="w-5 h-5 text-purple-400" />}>
                      {pauseReason ? 'Agent Input Required' : 'Agent Paused'}
                  </SectionTitle>
                  <p className="text-xs text-gray-300 mt-2 mb-3">{pauseReason || "Workflow halted. You can provide input to guide the next step or simply resume."}</p>
                  <textarea
                      ref={hitlInputRef}
                      value={userInputForPause}
                      onChange={(e) => setUserInputForPause(e.target.value)}
                      placeholder="Provide input or guidance..."
                      className="w-full bg-black/30 p-2 rounded-xl border border-white/20 focus:ring-2 focus:ring-purple-500 focus:outline-none font-fira-code text-xs resize-none"
                      rows={2}
                  />
                  <div className="flex gap-2 mt-3">
                      <Tooltip text="Continue the workflow" position="top" align="center">
                        <button onClick={onResume} className="flex-1 text-xs font-bold py-2 px-3 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 text-white hover:from-purple-500 hover:to-cyan-500 transition-all shadow-lg flex items-center justify-center gap-2">
                            Resume Mission
                        </button>
                      </Tooltip>
                      <Tooltip text="Abort and reset the agent" position="top" align="center">
                        <button onClick={onReset} className="flex-1 text-xs font-bold py-2 px-3 rounded-xl bg-red-600/20 text-red-300 border border-red-500/30 hover:bg-red-600/30 transition-all shadow-lg flex items-center justify-center gap-2">
                            Abort Mission
                        </button>
                      </Tooltip>
                  </div>
              </div>
          )}
          
          {/* Scrollable Content Area */}
          <div className="flex-grow overflow-y-auto custom-scrollbar px-2">
              <SectionTitle icon={<PlanIcon className="w-5 h-5 text-cyan-400" />}>Execution Plan</SectionTitle>
              <div className="mt-3 space-y-2">
                  {agentStatus === 'planning' ? (
                      <PlanningCard />
                  ) : tasks.length > 0 ? tasks.map((task, index) => (
                      <div key={index} className="animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                          <TaskCard task={task} index={index} />
                      </div>
                  )) : (
                      <>
                        <div className="text-center p-8 border-2 border-dashed border-gray-700 rounded-3xl mb-6">
                            <p className="text-gray-500 italic">Agent plan will materialize here...</p>
                        </div>
                        
                        {/* Legacy Project Launch Boxes */}
                        {isIdle && (
                            <div>
                                <h3 className="text-xs font-orbitron text-purple-400 uppercase tracking-widest mb-3">Legacy Prototypes</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    {Object.entries(LEGACY_TEMPLATES).map(([key, t]) => {
                                        const isActive = t.name === projectName;
                                        return (
                                            <div 
                                                key={key}
                                                onClick={() => onLoadLegacyProject(t)}
                                                className={`group relative cursor-pointer overflow-hidden rounded-2xl border bg-black/20 transition-all duration-300 hover:-translate-y-1 ${
                                                    isActive 
                                                    ? 'border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.3)] ring-1 ring-cyan-400/50' 
                                                    : 'border-white/10 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/20'
                                                }`}
                                            >
                                                {/* Gradient Background */}
                                                <div className={`absolute inset-0 bg-gradient-to-br ${t.color} opacity-5 group-hover:opacity-10 transition-opacity`}></div>
                                                
                                                <div className="p-4 flex flex-col items-center text-center h-full">
                                                    <div className={`text-2xl mb-2 transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>{t.icon}</div>
                                                    <h4 className={`text-xs font-bold font-orbitron mb-1 ${isActive ? 'text-cyan-300' : 'text-white'}`}>{t.name}</h4>
                                                    {!isActive && (
                                                        <div className="mt-auto opacity-0 group-hover:opacity-100 transition-opacity absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                                                            <span className="text-xs font-bold text-cyan-400 border border-cyan-400 px-3 py-1 rounded-full uppercase tracking-wider">Launch</span>
                                                        </div>
                                                    )}
                                                    {isActive && (
                                                        <div className="absolute top-2 right-2">
                                                            <span className="relative flex h-2 w-2">
                                                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                                                              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                      </>
                  )}
              </div>
          </div>

          {problems.length > 0 && (
            <div>
                <SectionTitle icon={<ProblemsIcon className="w-5 h-5 text-cyan-400" />}>Detected Problems</SectionTitle>
                <div className="mt-4 space-y-3">
                    {problems.map((problem) => (
                        <ProblemCard 
                            key={problem.id} 
                            problem={problem} 
                            isFixing={agentStatus === 'debugging' && problem.id === activeProblemId}
                        />
                    ))}
                </div>
            </div>
          )}
        </div>
        
        <div className="mt-2 flex-shrink-0">
            <div className="relative mb-1 flex items-center">
                {canScrollLeft && (
                    <Tooltip text="Scroll left" position="top" align="center">
                        <button 
                            onClick={() => handleSuggestionsScroll('left')}
                            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 w-8 h-8 md:w-6 md:h-6 bg-purple-500/50 rounded-full flex items-center justify-center text-purple-200 hover:bg-purple-500 shadow-lg shadow-purple-500/30 transition-all touch-manipulation"
                        >
                            <ChevronIcon direction="left" className="w-3 h-3 md:w-2 md:h-2" />
                        </button>
                    </Tooltip>
                )}
                <div 
                    ref={scrollContainerRef}
                    className="hide-scrollbar overflow-x-auto flex-1"
                    onWheel={(e) => {
                        e.preventDefault();
                        const container = e.currentTarget;
                        container.scrollLeft += e.deltaY;
                    }}
                >
                    <div className="flex items-center gap-1.5 h-8">
                            {getContextAwareSuggestions(missionPrompt, agentStatus).map(sugg => (
                                <SuggestionBubble 
                                    key={sugg.short}
                                    text={sugg.short}
                                    onClick={() => setPrompt(sugg.full)}
                                />
                            ))}
                    </div>
                </div>
                {canScrollRight && (
                    <Tooltip text="Scroll right" position="top" align="center">
                        <button 
                            onClick={() => handleSuggestionsScroll('right')}
                            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 w-8 h-8 md:w-6 md:h-6 bg-purple-500/50 rounded-full flex items-center justify-center text-purple-200 hover:bg-purple-500 shadow-lg shadow-purple-500/30 transition-all touch-manipulation"
                        >
                            <ChevronIcon direction="right" className="w-3 h-3 md:w-2 md:h-2" />
                        </button>
                    </Tooltip>
                )}
            </div>

          <div className="relative p-2 bg-gray-800/50 rounded-3xl border border-white/10 focus-within:border-purple-500/50 transition-colors">
               {pastedImages.length > 0 && (
                   <div className="mb-2 flex flex-wrap">
                       {pastedImages.map((img, idx) => (
                           <ImagePreview 
                               key={idx} 
                               src={img} 
                               onRemove={() => setPastedImages(prev => prev.filter((_, i) => i !== idx))} 
                           />
                       ))}
                   </div>
               )}
               <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onPaste={handlePaste}
                  onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && !isAgentActive && !isPaused) {
                          e.preventDefault();
                          onGenerate(prompt);
                      }
                  }}
                  placeholder={typewriterPlaceholder + '|'}
                  className="w-full bg-transparent focus:outline-none transition-all duration-300 font-fira-code text-xs text-gray-300 placeholder:text-gray-500 py-0.5"
                  disabled={isAgentActive || isPaused}
              />
              <div className="mt-1.5 pt-1.5 border-t border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-sm">
                      <CommandBarButton tooltip="Attach files" onClick={() => fileInputRef.current?.click()} disabled={isAgentActive || isPaused}>
                          <PaperclipIcon className="h-4 w-4" />
                      </CommandBarButton>
                      <CommandBarButton tooltip="Select element (coming soon)" onClick={() => setSelectModalOpen(true)}>
                          <CursorIcon className="h-4 w-4" />
                          <span className="text-xs">Select</span>
                      </CommandBarButton>
                      <CommandBarButton tooltip="Discuss with agent" onClick={() => setDiscussModalOpen(true)}>
                          <ChatIcon className="h-4 w-4" />
                          <span className="text-xs">Discuss</span>
                      </CommandBarButton>
                  </div>
                  <div className="flex items-center gap-2">
                      <Tooltip text={isListening ? 'Stop listening' : 'Use voice input'} position="top" align="end">
                          <button onClick={handleVoiceInput} disabled={isAgentActive || isPaused} className={`p-1.5 rounded-full transition-colors ${isListening ? 'text-red-400 bg-red-500/20 animate-pulse' : 'text-gray-400 hover:text-cyan-300 hover:bg-cyan-500/10'}`}>
                              <MicrophoneIcon className="h-4 w-4" />
                          </button>
                      </Tooltip>
                      {!isModelDropdownOpen && (
                          <Tooltip text="Select AI model" position="right" align="center">
                              <div>
                                  <CustomSelect
                                      value={selectedModel}
                                      onChange={setSelectedModel}
                                      options={AI_MODELS}
                                      disabled={isAgentActive}
                                      onOpenChange={setIsModelDropdownOpen}
                                  />
                              </div>
                          </Tooltip>
                      )}
                      {isModelDropdownOpen && (
                          <CustomSelect
                              value={selectedModel}
                              onChange={setSelectedModel}
                              options={AI_MODELS}
                              disabled={isAgentActive}
                              onOpenChange={setIsModelDropdownOpen}
                          />
                      )}
                  </div>
              </div>
              <input type="file" multiple ref={fileInputRef} onChange={(e) => e.target.files && onFileUpload(e.target.files)} className="hidden" />
            </div>

            {uploadedFiles.length > 0 && (
              <div className="mt-2 text-xs text-gray-400">
                  Attached: {uploadedFiles.map(f => f.name).join(', ')}
              </div>
            )}
            
            {/* Launch Button and Token Card Section - Switched positions */}
            <div className="mt-4 mb-4 px-2 flex items-start gap-2">
                <TokenUsageBanner onBillingClick={onBillingClick} />
                <Tooltip text={isAgentActive ? "Pause the agent" : isPaused ? "Resume Mission" : "Launch Agent (Cmd/Ctrl+Enter)"} position="top" align="center">
                    <button
                      onClick={() => {
                        if (isAgentActive) {
                          onStop();
                        } else if (isPaused) {
                          onGenerate(prompt);
                        } else if (!prompt.trim()) {
                          // Show alert/toast to prompt user
                          alert('Please enter a prompt to launch the agent');
                        } else {
                          onGenerate(prompt);
                        }
                      }}
                      className={`flex-shrink-0 text-xs font-orbitron font-bold py-3 px-5 md:py-2.5 md:px-4 rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(0,255,255,0.3)] hover:shadow-[0_0_25px_rgba(0,255,255,0.5)] whitespace-nowrap touch-manipulation ${
                          isAgentActive 
                          ? 'bg-yellow-600/80 text-white hover:bg-yellow-500 active:bg-yellow-600' 
                          : isPaused
                          ? 'bg-orange-600/80 text-white hover:bg-orange-500 active:bg-orange-600 animate-pulse'
                          : 'bg-gradient-to-r from-purple-600 to-cyan-500 text-white hover:from-purple-500 hover:to-cyan-400 active:from-purple-700 active:to-cyan-600'
                      }`}
                    >
                      {isAgentActive ? 'Pause Agent' : isPaused ? '▶ Resume Mission' : 'Launch Agent'}
                    </button>
                </Tooltip>
            </div>
        </div>
      </GlassCard>

      {/* Glassmorphic Delete Confirmation Modal */}
      {missionToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in" onClick={() => setMissionToDelete(null)}>
          <div onClick={(e) => e.stopPropagation()} className="relative rounded-3xl backdrop-blur-xl bg-gray-900/80 border border-cyan-500/20 shadow-[0_0_30px_rgba(6,182,212,0.15)] p-6 max-w-sm w-full mx-4 animate-scale-in">
            {/* Subtle glow effect */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-cyan-500/5 to-purple-500/5 blur-xl -z-10"></div>
            
            {/* Warning Icon - Smaller and subtle */}
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                <svg className="w-6 h-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>

            {/* Title - Smaller */}
            <h3 className="text-lg font-orbitron font-bold text-center mb-3 text-white">
              Delete Mission?
            </h3>

            {/* Message - Compact */}
            <p className="text-gray-400 text-center mb-3 text-xs">
              This action cannot be undone.
            </p>
            <div className="bg-black/40 rounded-2xl p-2.5 mb-4 border border-cyan-500/10">
              <p className="text-xs text-gray-400 line-clamp-2">"{missionToDelete.prompt}"</p>
            </div>

            {/* Buttons - Compact */}
            <div className="flex gap-2">
              <button
                onClick={() => setMissionToDelete(null)}
                className="flex-1 rounded-3xl px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 text-sm font-medium transition-all duration-300 border border-white/10 hover:border-cyan-500/30"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteMission(missionToDelete.id);
                  setMissionToDelete(null);
                }}
                className="flex-1 rounded-3xl px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-sm font-medium transition-all duration-300 border border-cyan-500/30 hover:border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.2)] hover:shadow-[0_0_20px_rgba(6,182,212,0.3)]"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
