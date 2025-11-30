
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Task, Problem, AgentStatus, UploadedFile, Commit, Mission, FileNode } from '../types';
import { AI_MODELS } from '../constants';
import { ProblemCard } from './ProblemCard';
import { TaskInProgressIcon, TaskPendingIcon, TaskSuccessIcon, PlanIcon, ProblemsIcon, PaperclipIcon, ReviewIcon, MicrophoneIcon, CursorIcon, ChatIcon, NewFolderIcon, EditIcon, LightbulbIcon, ChevronIcon, CopyIcon, ErrorIcon, ReloadIcon, HistoryIcon, LoadingIcon } from './Icons';
import { Tooltip } from './Tooltip';
import { SelectElementModal } from './SelectElementModal';
import { DiscussWithAgentModal } from './DiscussWithAgentModal';
import { CustomSelect } from './CustomSelect';
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
  onLoadLegacyProject: (template: { name: string, files: FileNode[] }) => void;
}

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

const codeUpgradeSuggestions = [
    { short: "Add Dark Mode", full: "Implement a dark mode theme toggle that saves the user's preference in local storage." },
    { short: "Improve Accessibility", full: "Audit and improve the application's accessibility (ARIA attributes, keyboard navigation, color contrast)." },
    { short: "Animate Components", full: "Add subtle animations to key components like buttons and cards to improve user experience." },
    { short: "Make it Responsive", full: "Ensure the application is fully responsive and looks great on mobile, tablet, and desktop screens." },
    { short: "Add a Loading State", full: "Implement a global loading state for asynchronous actions to provide better user feedback." },
    { short: "Refactor CSS", full: "Refactor the CSS to use variables for colors and spacing to improve maintainability."},
    { short: "Implement Caching", full: "Add a caching layer for API responses to improve performance and reduce load times."}
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

    return (
        <div 
            className={`
                relative p-4 rounded-3xl border transition-all duration-500 ease-out transform max-w-[96%] mx-auto
                ${isCompleted 
                    ? 'bg-green-500/10 border-green-500/40 shadow-[0_0_20px_rgba(34,197,94,0.15)]' 
                    : isInProgress 
                        ? 'bg-cyan-500/10 border-cyan-400/50 shadow-[0_0_25px_rgba(6,182,212,0.2)] scale-[1.02] ring-1 ring-cyan-400/30' 
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
            
            <div className="flex items-start gap-4">
                <div className={`
                    flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border font-fira-code font-bold text-xs
                    ${isCompleted ? 'bg-green-500 text-black border-green-400 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 
                      isInProgress ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 animate-pulse shadow-[0_0_10px_rgba(6,182,212,0.5)]' : 
                      'bg-gray-800 text-gray-500 border-gray-700'}
                `}>
                    {(index + 1).toString().padStart(2, '0')}
                </div>
                <div className="flex-grow min-w-0">
                    <h4 className={`text-sm font-medium leading-relaxed break-words ${isCompleted ? 'text-green-200 line-through decoration-green-500/30' : isInProgress ? 'text-cyan-100' : 'text-gray-400'}`}>
                        {task.description}
                    </h4>
                    <div className="mt-2 flex items-center gap-2">
                        <span className={`text-[10px] uppercase tracking-wider font-bold font-orbitron px-2 py-0.5 rounded-full ${
                             isCompleted ? 'bg-green-500/20 text-green-400' : 
                             isInProgress ? 'bg-cyan-500/20 text-cyan-400' : 
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
    <div className="bg-gray-800/60 rounded-xl px-4 py-2 flex-grow text-center lg:text-left">
        <p className="text-gray-300 text-sm">300K daily tokens remaining.</p>
        <button onClick={onBillingClick} className="font-semibold text-blue-400 hover:text-blue-300 transition-colors text-sm">
            Switch to Pro
        </button>
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
        className="flex-shrink-0 flex items-center gap-2 bg-purple-500/10 text-purple-200 px-3 py-1.5 rounded-full text-xs font-semibold hover:bg-purple-500/20 transition-colors"
    >
        <LightbulbIcon className="w-4 h-4"/>
        <span>{text}</span>
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
    onAddDiscussionLog, missionHistory, onRestoreMission, onLoadLegacyProject
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

  const [isSelectModalOpen, setSelectModalOpen] = useState(false);
  const [isDiscussModalOpen, setDiscussModalOpen] = useState(false);
  const [isEditingProjectName, setIsEditingProjectName] = useState(false);
  const [currentProjectName, setCurrentProjectName] = useState(projectName);
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

  return (
    <>
      {isSelectModalOpen && <SelectElementModal onClose={() => setSelectModalOpen(false)} />}
      {isDiscussModalOpen && <DiscussWithAgentModal onClose={() => setDiscussModalOpen(false)} onSendMessage={onAddDiscussionLog} />}

      <GlassCard className="h-full flex flex-col">
        <div className="flex-shrink-0 pb-4 border-b border-cyan-500/10">
            <div className="flex justify-between items-center mb-4">
                <div className="flex-grow">
                    <h2 className="text-xs font-orbitron text-cyan-300/70 tracking-widest mb-1">Mission Control</h2>
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
                        <div onClick={() => setIsEditingProjectName(true)} className="group flex items-center gap-2 cursor-pointer">
                            <h3 className="text-xl font-orbitron text-white truncate max-w-[200px]">{projectName}</h3>
                            <EditIcon className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors"/>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    <div ref={historyMenuRef} className="relative">
                        <Tooltip text="Mission History" position="bottom" align="end">
                            <button 
                                onClick={() => setIsHistoryOpen(!isHistoryOpen)} 
                                className={`p-2 rounded-lg transition-colors ${isHistoryOpen ? 'bg-purple-500/30 text-purple-200' : 'hover:bg-white/10 text-gray-400'}`}
                            >
                                <HistoryIcon className="w-5 h-5" />
                            </button>
                        </Tooltip>
                        
                        {isHistoryOpen && (
                            <div className="absolute z-20 top-full right-0 mt-2 w-72 bg-[#0d0d12] border border-purple-500/30 rounded-2xl shadow-xl max-h-64 overflow-y-auto custom-scrollbar p-2 animate-fade-in">
                                <h4 className="text-xs font-orbitron text-gray-400 px-2 py-1 mb-1">Previous Missions</h4>
                                {missionHistory.length === 0 ? (
                                    <div className="text-center p-4 text-xs text-gray-500 italic">No previous missions.</div>
                                ) : (
                                    missionHistory.map((m) => (
                                        <div key={m.id} onClick={() => { onRestoreMission(m.prompt); setIsHistoryOpen(false); }} className="p-2 hover:bg-white/5 rounded-lg cursor-pointer group transition-colors">
                                            <p className="text-xs text-gray-300 line-clamp-2">{m.prompt}</p>
                                            <span className="text-[10px] text-gray-500">{formatRelativeTime(new Date(m.timestamp).toISOString())}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    <Tooltip text="Create a new project from a template" position="bottom" align="end">
                        <button 
                            onClick={onNewProject} 
                            className="text-xs font-bold font-orbitron py-2 px-3 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 text-white hover:from-purple-500 hover:to-cyan-400 transition-all shadow-lg flex items-center gap-2 whitespace-nowrap"
                        >
                            <NewFolderIcon className="w-4 h-4" />
                            New Template Project
                        </button>
                    </Tooltip>
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
                <div className="relative my-4 p-4 bg-purple-500/10 border border-purple-500/30 rounded-2xl">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="text-xs font-orbitron text-purple-300 tracking-widest flex items-center gap-2">
                            ACTIVE MISSION
                            {missionHistory.length > 0 && <span className="text-[10px] text-purple-400/60 font-mono">{new Date(missionHistory[0].timestamp).toLocaleTimeString()}</span>}
                        </h4>
                        <Tooltip text={isCopied ? "Copied!" : "Copy Mission"} position="top" align="end">
                            <button onClick={handleCopyMissionPrompt} className="text-gray-500 hover:text-white transition-colors">
                                <CopyIcon className="w-4 h-4" />
                            </button>
                        </Tooltip>
                    </div>
                    <p className="text-sm font-fira-code text-gray-300 max-h-32 overflow-y-auto custom-scrollbar leading-relaxed">
                        {missionPrompt}
                    </p>
                </div>
            )}
        </div>


        <div className="flex-grow flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2 -mr-2 min-h-0 pt-4">
          {agentStatus === 'paused' && (
              <div className="border border-purple-500/50 bg-purple-500/10 rounded-3xl p-6 animate-fade-in ring-1 ring-purple-400/30 shadow-[0_0_20px_rgba(168,85,247,0.2)]">
                  <SectionTitle icon={<ReviewIcon className="w-5 h-5 text-purple-400" />}>
                      {pauseReason ? 'Agent Input Required' : 'Agent Paused'}
                  </SectionTitle>
                  <p className="text-sm text-gray-300 mt-2 mb-4">{pauseReason || "Workflow halted. You can provide input to guide the next step or simply resume."}</p>
                  <textarea
                      ref={hitlInputRef}
                      value={userInputForPause}
                      onChange={(e) => setUserInputForPause(e.target.value)}
                      placeholder="Provide input or guidance..."
                      className="w-full bg-black/30 p-3 rounded-xl border border-white/20 focus:ring-2 focus:ring-purple-500 focus:outline-none font-fira-code text-sm resize-none"
                      rows={3}
                  />
                  <div className="flex gap-3 mt-4">
                      <Tooltip text="Continue the workflow" position="top" align="center">
                        <button onClick={onResume} className="flex-1 text-sm font-bold py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 text-white hover:from-purple-500 hover:to-cyan-500 transition-all shadow-lg flex items-center justify-center gap-2">
                            Resume Mission
                        </button>
                      </Tooltip>
                      <Tooltip text="Abort and reset the agent" position="top" align="center">
                        <button onClick={onReset} className="flex-1 text-sm font-bold py-3 px-4 rounded-xl bg-red-600/20 text-red-300 border border-red-500/30 hover:bg-red-600/30 transition-all shadow-lg flex items-center justify-center gap-2">
                            Abort Mission
                        </button>
                      </Tooltip>
                  </div>
              </div>
          )}
          
          <div className="flex-grow">
              <SectionTitle icon={<PlanIcon className="w-5 h-5 text-cyan-400" />}>Execution Plan</SectionTitle>
              <div className="mt-4 space-y-3">
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
        
        <div className="mt-6 flex-shrink-0">
            <div className="relative">
                {canScrollLeft && (
                    <button 
                        onClick={() => handleSuggestionsScroll('left')}
                        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 w-6 h-6 bg-purple-500/50 rounded-full flex items-center justify-center text-purple-200 hover:bg-purple-500 shadow-lg shadow-purple-500/30 transition-all"
                    >
                        <ChevronIcon direction="left" className="w-4 h-4" />
                    </button>
                )}
                <div 
                    ref={scrollContainerRef}
                    className="mb-3 hide-scrollbar overflow-x-auto"
                >
                    <div className="flex items-center gap-2 pb-2 px-1">
                            {codeUpgradeSuggestions.map(sugg => (
                                <SuggestionBubble 
                                    key={sugg.short}
                                    text={sugg.short}
                                    onClick={() => setPrompt(sugg.full)}
                                />
                            ))}
                    </div>
                </div>
                {canScrollRight && (
                    <button 
                        onClick={() => handleSuggestionsScroll('right')}
                        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 w-6 h-6 bg-purple-500/50 rounded-full flex items-center justify-center text-purple-200 hover:bg-purple-500 shadow-lg shadow-purple-500/30 transition-all"
                    >
                        <ChevronIcon direction="right" className="w-4 h-4" />
                    </button>
                )}
            </div>

          <div className="relative p-3 bg-gray-800/50 rounded-3xl border border-white/10 focus-within:border-purple-500/50 transition-colors">
               <textarea
                  ref={textareaRef}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={typewriterPlaceholder + '|'}
                  className="w-full bg-transparent focus:outline-none transition-all duration-300 font-fira-code text-sm resize-none text-gray-300 placeholder:text-gray-500 custom-scrollbar"
                  rows={3}
                  disabled={isAgentActive || isPaused}
              />
              <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm">
                      <CommandBarButton tooltip="Attach files" onClick={() => fileInputRef.current?.click()} disabled={isAgentActive || isPaused}>
                          <PaperclipIcon className="h-5 w-5" />
                      </CommandBarButton>
                      <CommandBarButton tooltip="Select element (coming soon)" onClick={() => setSelectModalOpen(true)}>
                          <CursorIcon className="h-5 w-5" />
                          <span>Select</span>
                      </CommandBarButton>
                      <CommandBarButton tooltip="Discuss with agent" onClick={() => setDiscussModalOpen(true)}>
                          <ChatIcon className="h-5 w-5" />
                          <span>Discuss</span>
                      </CommandBarButton>
                  </div>
                  <div className="flex items-center gap-2">
                      <Tooltip text={isListening ? 'Stop listening' : 'Use voice input'} position="top" align="end">
                          <button onClick={handleVoiceInput} disabled={isAgentActive || isPaused} className={`p-2 rounded-full transition-colors ${isListening ? 'text-red-400 bg-red-500/20 animate-pulse' : 'text-gray-400 hover:text-cyan-300 hover:bg-cyan-500/10'}`}>
                              <MicrophoneIcon className="h-5 w-5" />
                          </button>
                      </Tooltip>
                      <Tooltip text="Select AI model" position="bottom" align="end">
                           <CustomSelect
                                value={selectedModel}
                                onChange={setSelectedModel}
                                options={AI_MODELS}
                                disabled={isAgentActive}
                           />
                      </Tooltip>
                  </div>
              </div>
              <input type="file" multiple ref={fileInputRef} onChange={(e) => e.target.files && onFileUpload(e.target.files)} className="hidden" />
            </div>

            {uploadedFiles.length > 0 && (
              <div className="mt-2 text-xs text-gray-400">
                  Attached: {uploadedFiles.map(f => f.name).join(', ')}
              </div>
            )}
            
            <div className="mt-3 flex flex-col lg:flex-row items-center gap-3">
                <Tooltip text={isAgentActive ? "Pause the agent" : isPaused ? "Resume Mission" : "Launch Agent (Cmd/Ctrl+Enter)"} position="top" align="start">
                  {!isPaused ? (
                      <button
                        onClick={() => isAgentActive ? onStop() : onGenerate(prompt)}
                        className={`w-full lg:w-auto flex-grow text-base font-orbitron font-bold py-3 px-6 rounded-3xl transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(0,255,255,0.3)] hover:shadow-[0_0_25px_rgba(0,255,255,0.5)] ${
                            isAgentActive 
                            ? 'bg-yellow-600/80 text-white hover:bg-yellow-500' 
                            : 'bg-gradient-to-r from-purple-600 to-cyan-500 text-white hover:from-purple-500 hover:to-cyan-400'
                        }`}
                      >
                        {isAgentActive ? 'Pause Agent' : 'Launch Agent'}
                      </button>
                  ) : (
                      <div className="w-full lg:w-auto flex-grow p-3 rounded-3xl bg-gray-800 text-center text-gray-400 text-sm italic border border-white/10">
                          Agent is paused. Use controls above.
                      </div>
                  )}
                </Tooltip>
                <TokenUsageBanner onBillingClick={onBillingClick} />
            </div>
        </div>
      </GlassCard>
    </>
  );
};
