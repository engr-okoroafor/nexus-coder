
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ControlPanel } from './components/ControlPanel';
import { CodeView } from './components/CodeView';
import { Header } from './components/Header';
import type { FileNode, ViewMode, AgentStatus, Task, Problem, UploadedFile, Commit, TokenUsage, SearchResult, User, AppSettings, Mission, AgentTrace } from './types';
import { generatePlan, implementTask, detectProblems, fixProblem, reviewCode, parseReviewForProblems, generateDevOpsFiles, generateProjectName, architectProject, performQA, evaluateProject } from './services/geminiService';
import { MOCK_INITIAL_FILES, AI_MODELS, MODEL_LIMITS, DEFAULT_APP_SETTINGS } from './constants';
import { ALL_TEMPLATES, LEGACY_TEMPLATES } from './templates';
import { Billing } from './components/Billing';
import { fileToBase64, addNodeToTree, removeNodeFromTree, updateNodeInTree, moveNodeInTree, generateId, downloadProjectAsZip, duplicateNode, findFileByPath, removeEmptyFolders } from './utils';
import { StatusBar } from './components/StatusBar';
import { Terminal } from './components/Terminal';
import { ProjectTemplateModal } from './components/ProjectTemplateModal';
import { LandingPage } from './components/LandingPage';
import { ProfileModal } from './components/ProfileModal';
import { SettingsModal } from './components/SettingsModal';
import { GitHubImportModal } from './components/GitHubImportModal';
import { DeployModal } from './components/DeployModal';
import { VersionHistoryModal } from './components/VersionHistoryModal';
import { AuthModal } from './components/AuthModal';
import { ShareModal } from './components/ShareModal';
import { CopyProjectModal } from './components/CopyProjectModal';
import { trackEvent } from './services/analyticsService';
import { previewUpdateAgent } from './services/previewUpdateAgent';

// Helper function to find index.html for preview
const findHtmlFile = (nodes: FileNode[]): FileNode | undefined => {
    for (const node of nodes) {
        if (node.name.toLowerCase() === 'index.html' && node.type === 'file') return node;
        if (node.children) {
            const found = findHtmlFile(node.children);
            if (found) return found;
        }
    }
    return undefined;
};

interface WorkflowState {
  prompt: string;
  projectName: string;
  projectFiles: FileNode[];
  openFiles: FileNode[];
  activeFileId: string | null;
  selectedNodeIds: string[];
  tasks: Task[];
  currentTaskIndex: number;
  problems: Problem[];
  agentLogs: string[];
  traces: AgentTrace[];
  evaluation?: any;
  activeProblemId: string | null;
  uploadedFiles: UploadedFile[];
  isRepoInitialized: boolean;
  commits: Commit[];
  agentStatus: AgentStatus;
  statusMessage: string;
  pauseReason: string | null;
  finalReview: string;
  missionHistory: Mission[];
}

interface FileHistory {
    past: string[];
    future: string[];
    lastSaved: string;
}

const getInitialState = (): WorkflowState => {
    try {
        const savedSession = localStorage.getItem('nexus-coder-session');
        if (savedSession) {
            const parsed = JSON.parse(savedSession);
            if (parsed.workflowState) {
                return {
                    ...parsed.workflowState,
                    // Reset transient states that shouldn't persist across reloads
                    agentStatus: parsed.workflowState.agentStatus === 'coding' ? 'paused' : parsed.workflowState.agentStatus,
                    statusMessage: parsed.workflowState.agentStatus === 'coding' ? 'Session restored. Agent paused.' : parsed.workflowState.statusMessage
                };
            }
        }
    } catch (e) {
        console.warn("Failed to restore session:", e);
    }

    return {
        prompt: '',
        projectName: 'Real Estate (Kings)', // Default to Legacy Real Estate project
        projectFiles: MOCK_INITIAL_FILES,
        openFiles: [],
        activeFileId: null,
        selectedNodeIds: [],
        tasks: [],
        currentTaskIndex: 0,
        problems: [],
        agentLogs: ['Agent initialized.'],
        traces: [],
        activeProblemId: null,
        uploadedFiles: [],
        isRepoInitialized: false,
        commits: [],
        agentStatus: 'idle',
        statusMessage: 'Agent is ready. Provide a prompt to begin.',
        pauseReason: null,
        finalReview: '',
        missionHistory: [],
    };
};

const App: React.FC = () => {
  const [workflowState, setWorkflowState] = useState<WorkflowState>(getInitialState);
  
  // Persist authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      const savedAuth = localStorage.getItem('nexus-auth-state');
      return savedAuth ? JSON.parse(savedAuth).isAuthenticated : false;
    } catch {
      return false;
    }
  });
  const [user, setUser] = useState<User>(() => {
    try {
      const savedAuth = localStorage.getItem('nexus-auth-state');
      return savedAuth ? JSON.parse(savedAuth).user : { name: 'Demo User', email: 'demo@user.com', bio: 'AI enthusiast & developer.' };
    } catch {
      return { name: 'Demo User', email: 'demo@user.com', bio: 'AI enthusiast & developer.' };
    }
  });
  
  // Save auth state to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('nexus-auth-state', JSON.stringify({ isAuthenticated, user }));
    } catch (error) {
      console.error('Failed to save auth state:', error);
    }
  }, [isAuthenticated, user]);
  
  // Modal States
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  const [isBillingOpen, setBillingOpen] = useState(false);
  const [isTemplateModalOpen, setTemplateModalOpen] = useState(false);
  const [isProfileModalOpen, setProfileModalOpen] = useState(false);
  const [isSettingsModalOpen, setSettingsModalOpen] = useState(false);
  const [isGitHubImportModalOpen, setGitHubImportModalOpen] = useState(false);
  const [isDeployModalOpen, setDeployModalOpen] = useState(false);
  const [isVersionHistoryModalOpen, setVersionHistoryModalOpen] = useState(false);
  const [isShareModalOpen, setShareModalOpen] = useState(false);
  const [isCopyProjectModalOpen, setCopyProjectModalOpen] = useState(false);

  const [appSettings, setAppSettings] = useState<AppSettings>(() => {
    try {
      const savedSettings = localStorage.getItem('nexus-coder-settings');
      return savedSettings ? JSON.parse(savedSettings) : DEFAULT_APP_SETTINGS;
    } catch {
      return DEFAULT_APP_SETTINGS;
    }
  });
  
  const [selectedModel, setSelectedModel] = useState<string>(AI_MODELS[0]);
  
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [generatedMarkup, setGeneratedMarkup] = useState<string>(() => {
    // Initialize preview immediately with MOCK_INITIAL_FILES
    console.log('🚀 Initializing preview with MOCK_INITIAL_FILES...');
    const initialState = getInitialState();
    console.log('📁 Initial state has', initialState.projectFiles.length, 'files');
    
    if (initialState.projectFiles.length > 0) {
      console.log('📄 Files:', initialState.projectFiles.map(f => f.name).join(', '));
      const bundle = previewUpdateAgent.processFiles(initialState.projectFiles);
      console.log('📦 Bundle result:', { hasHtml: !!bundle.html, htmlLength: bundle.html?.length || 0 });
      
      if (bundle.html && bundle.html.trim().length > 0) {
        console.log('✅ Initial preview initialized with', bundle.html.length, 'characters');
        console.log('📄 First 200 chars:', bundle.html.substring(0, 200));
        return bundle.html;
      } else {
        console.warn('⚠️ Bundle HTML is empty or missing');
      }
    } else {
      console.warn('⚠️ No initial files found');
    }
    
    console.log('❌ Returning empty string for generatedMarkup');
    return '';
  });
  
  const [installPromptEvent, setInstallPromptEvent] = useState<Event | null>(null);
  const [requestTimestamps, setRequestTimestamps] = useState<number[]>([]);
  const [tokenUsage, setTokenUsage] = useState<TokenUsage>({
    used: 0,
    limit: MODEL_LIMITS[selectedModel]?.rpm || 15,
  });
  
  const [userInputForPause, setUserInputForPause] = useState('');
  const [missionPrompt, setMissionPrompt] = useState<string>('');

  // --- Search & Clipboard State ---
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [fileFilter, setFileFilter] = useState('');
  const [clipboard, setClipboard] = useState<{ node: FileNode | null; operation: 'copy' | 'cut' | null }>({ node: null, operation: null });
  
  const isRunningRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const unsavedChangesRef = useRef<Map<string, string>>(new Map());
  
  // History Ref
  const fileHistoriesRef = useRef<Record<string, FileHistory>>({});
  const historyDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Restore history from session if available
  useEffect(() => {
      try {
          const savedSession = localStorage.getItem('nexus-coder-session');
          if (savedSession) {
              const parsed = JSON.parse(savedSession);
              if (parsed.fileHistories) {
                  fileHistoriesRef.current = parsed.fileHistories;
              }
          }
      } catch (e) {
          console.warn("Failed to restore history:", e);
      }
  }, []);

  // --- UI State ---
  const [controlPanelWidth, setControlPanelWidth] = useState(() => {
    try {
      const saved = localStorage.getItem('nexus-control-panel-width');
      return saved ? parseInt(saved) : window.innerWidth / 3;
    } catch {
      return window.innerWidth / 3;
    }
  });
  const isControlResizing = useRef(false);
  const [isResizingControl, setIsResizingControl] = useState(false);
  const [isTerminalCollapsed, setIsTerminalCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem('nexus-terminal-collapsed');
      return saved ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });
  const [terminalHeight, setTerminalHeight] = useState(() => {
    try {
      const saved = localStorage.getItem('nexus-terminal-height');
      return saved ? parseInt(saved) : 200;
    } catch {
      return 200;
    }
  });
  const isTerminalResizing = useRef(false);
  const [isResizingTerminal, setIsResizingTerminal] = useState(false);
  
  // Sidebar width for Terminal offset - synced from CodeView
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    try {
      const saved = localStorage.getItem('nexus-sidebar-width');
      return saved ? parseInt(saved) : 256;
    } catch {
      return 256;
    }
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // Sync sidebar state from localStorage periodically
  useEffect(() => {
    const syncSidebarState = () => {
      try {
        const savedWidth = localStorage.getItem('nexus-sidebar-width');
        if (savedWidth) {
          const width = parseInt(savedWidth);
          if (width !== sidebarWidth) {
            setSidebarWidth(width);
          }
        }
      } catch (error) {
        console.warn('Failed to sync sidebar width:', error);
      }
    };
    
    const interval = setInterval(syncSidebarState, 500);
    return () => clearInterval(interval);
  }, [sidebarWidth]);
  
  const initialLaunchInfoRef = useRef({ prompt: '', model: AI_MODELS[0] });
  
  const { 
    agentStatus, statusMessage, projectFiles, openFiles, activeFileId, 
    tasks, problems, activeProblemId, prompt, uploadedFiles, 
    isRepoInitialized, commits, agentLogs, pauseReason, finalReview,
    currentTaskIndex, selectedNodeIds, projectName, missionHistory
  } = workflowState;
  
  const activeFile = activeFileId ? openFiles.find(f => f.id === activeFileId) ?? null : null;
  
  const setState = (updater: (prevState: WorkflowState) => WorkflowState) => {
    setWorkflowState(updater);
  };
  
  const addLog = useCallback((message: string) => {
    setState(prev => ({...prev, agentLogs: [...prev.agentLogs, `[${new Date().toLocaleTimeString()}] ${message}`]}));
  }, []);

  const saveSessionToStorage = useCallback(() => {
      try {
          const sessionData = {
              workflowState,
              fileHistories: fileHistoriesRef.current,
              appSettings
          };
          localStorage.setItem('nexus-coder-session', JSON.stringify(sessionData));
      } catch (error) {
          console.error("Failed to save session:", error);
      }
  }, [workflowState, appSettings]);

  // Autosave session on state change
  useEffect(() => {
      const timeout = setTimeout(saveSessionToStorage, 2000);
      return () => clearTimeout(timeout);
  }, [saveSessionToStorage]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            if (clipboard.node) {
                setClipboard({ node: null, operation: null });
                addLog('Clipboard cleared.');
            }
        }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [clipboard, addLog]);

  const getFileHistory = (fileId: string, initialContent: string = ''): FileHistory => {
    if (!fileHistoriesRef.current[fileId]) {
        fileHistoriesRef.current[fileId] = { past: [], future: [], lastSaved: initialContent };
    }
    return fileHistoriesRef.current[fileId];
  };

  const pushToHistory = (fileId: string, content: string) => {
      const history = getFileHistory(fileId);
      if (history.lastSaved !== content) {
          history.past.push(history.lastSaved);
          history.lastSaved = content;
          history.future = [];
      }
  };

  useEffect(() => {
    const handleModelFallback = (event: CustomEvent) => {
      const { fallbackModel, error } = event.detail;
      if (fallbackModel) {
        addLog(`Notice: Switched to ${fallbackModel} due to ${error || 'error'}.`);
      }
    };
    
    window.addEventListener('model-fallback', handleModelFallback as EventListener);
    return () => {
      window.removeEventListener('model-fallback', handleModelFallback as EventListener);
    };
  }, [addLog]);

  const addDiscussionLog = (message: string) => {
    addLog(`[User Context]: ${message}`);
  };

  const handleControlMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isControlResizing.current = true;
    setIsResizingControl(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const handleControlTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    isControlResizing.current = true;
    setIsResizingControl(true);
    document.body.style.userSelect = 'none';
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isControlResizing.current) {
        requestAnimationFrame(() => {
          const newWidth = Math.max(280, Math.min(e.clientX, window.innerWidth * 0.5));
          setControlPanelWidth(newWidth);
        });
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (isControlResizing.current) {
        e.preventDefault();
        const touch = e.touches[0];
        if (touch) {
            requestAnimationFrame(() => {
              const newWidth = Math.max(280, Math.min(touch.clientX, window.innerWidth * 0.5));
              setControlPanelWidth(newWidth);
            });
        }
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    // Always cleanup, regardless of which resizer was active
    if (isControlResizing.current) {
      try {
        localStorage.setItem('nexus-control-panel-width', controlPanelWidth.toString());
      } catch (error) {
        console.warn('Failed to save panel width:', error);
      }
      isControlResizing.current = false;
      setIsResizingControl(false);
    }
    
    if (isTerminalResizing.current) {
      try {
        localStorage.setItem('nexus-terminal-height', terminalHeight.toString());
      } catch (error) {
        console.warn('Failed to save terminal height:', error);
      }
      isTerminalResizing.current = false;
      setIsResizingTerminal(false);
    }
    
    // Always reset cursor and selection
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, [controlPanelWidth, terminalHeight]);

  const handleTerminalMouseMove = useCallback((e: MouseEvent) => {
    if (isTerminalResizing.current) {
        requestAnimationFrame(() => {
          const windowHeight = window.innerHeight;
          const newHeight = Math.max(100, Math.min(windowHeight - e.clientY - 72, windowHeight * 0.6));
          setTerminalHeight(newHeight);
        });
    }
  }, []);

  const handleTerminalTouchMove = useCallback((e: TouchEvent) => {
    if (isTerminalResizing.current) {
        e.preventDefault();
        const touch = e.touches[0];
        if (touch) {
            requestAnimationFrame(() => {
              const windowHeight = window.innerHeight;
              const newHeight = Math.max(100, Math.min(windowHeight - touch.clientY - 72, windowHeight * 0.6));
              setTerminalHeight(newHeight);
            });
        }
    }
  }, []);

  useEffect(() => {
    // Unified event listeners for all resizers
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousemove', handleTerminalMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchmove', handleTerminalTouchMove, { passive: false });
    window.addEventListener('touchend', handleMouseUp);
    
    // Ensure cleanup on mouse leave window
    const handleMouseLeave = () => {
      if (isControlResizing.current || isTerminalResizing.current) {
        handleMouseUp();
      }
    };
    document.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mousemove', handleTerminalMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchmove', handleTerminalTouchMove);
        window.removeEventListener('touchend', handleMouseUp);
        document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [handleMouseMove, handleMouseUp, handleTouchMove, handleTerminalMouseMove, handleTerminalTouchMove]);
  
  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
        event.preventDefault();
        setInstallPromptEvent(event);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('nexus-coder-settings', JSON.stringify(appSettings));
    } catch (error) {
      console.error('Failed to save settings to localStorage:', error);
    }
  }, [appSettings]);


  const handleInstallClick = () => {
    if (installPromptEvent && 'prompt' in installPromptEvent) {
      trackEvent('pwa_install_prompted', {});
      (installPromptEvent as any).prompt();
      (installPromptEvent as any).userChoice.then((choiceResult: { outcome: 'accepted' | 'dismissed' }) => {
        if (choiceResult.outcome === 'accepted') {
          addLog('User accepted the PWA installation.');
          trackEvent('pwa_install_accepted', {});
        } else {
          addLog('User dismissed the PWA installation.');
          trackEvent('pwa_install_dismissed', {});
        }
        setInstallPromptEvent(null);
      });
    }
  };

  useEffect(() => {
    const handleApiCall = () => setRequestTimestamps(prev => [...prev, Date.now()]);
    window.addEventListener('gemini-api-call-success', handleApiCall);
    return () => window.removeEventListener('gemini-api-call-success', handleApiCall);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const oneMinuteAgo = Date.now() - 60000;
      setRequestTimestamps(prev => prev.filter(ts => ts > oneMinuteAgo));
      setTokenUsage(prev => ({ ...prev, used: requestTimestamps.length }));
    }, 2000);
    return () => clearInterval(interval);
  }, [requestTimestamps]);

  useEffect(() => {
    setTokenUsage(prev => ({ ...prev, limit: MODEL_LIMITS[selectedModel]?.rpm || 15 }));
  }, [selectedModel]);
  
  // Preview Update Agent - Real-time monitoring of all files
  useEffect(() => {
    console.log('🔍 Preview Update Agent triggered - Files:', projectFiles.length, 'Status:', agentStatus);
    
    if (projectFiles.length === 0) {
      console.log('⚠️ No project files to process');
      if (agentStatus !== 'idle' && agentStatus !== 'completed') {
        // Keep construction mode if files are empty during a build
      }
      return;
    }

    // Use Preview Update Agent to process all files
    console.log('⚙️ Processing files with Preview Update Agent...');
    console.log('📁 Project files:', projectFiles.map(f => f.name).join(', '));
    
    const bundle = previewUpdateAgent.processFiles(projectFiles);
    console.log('📦 Bundle created:', { 
      hasHtml: !!bundle.html, 
      htmlLength: bundle.html?.length || 0,
      cssFiles: bundle.css.length,
      jsFiles: bundle.js.length 
    });
    
    // Always update if we have HTML content (not just when hasChanges is true)
    if (bundle.html && bundle.html.trim().length > 0) {
      console.log('✅ Updating preview - HTML length:', bundle.html.length);
      console.log('📄 First 300 chars of HTML:', bundle.html.substring(0, 300));
      setGeneratedMarkup(bundle.html);
      console.log('🔄 Preview updated with new content');
      addLog(`📺 Preview updated: ${bundle.html.length} chars, ${bundle.css.length} CSS, ${bundle.js.length} JS`);
      
      // Get file statistics
      const stats = previewUpdateAgent.getFileStats(projectFiles);
      
      // Always log updates (not just during coding)
      console.log(`🎨 Preview Update Agent: Processing ${stats.totalFiles} files`);
      
      if (stats.htmlCount > 0) {
        console.log(`📄 HTML files: ${stats.htmlCount}`);
      }
      
      if (bundle.css.length > 0) {
        console.log(`💅 CSS files injected: ${bundle.css.join(', ')}`);
      }
      
      if (bundle.js.length > 0) {
        console.log(`⚡ JS files injected: ${bundle.js.join(', ')}`);
      }
      
      // Count UI components
      const componentMatches = bundle.html.match(/<(button|div|nav|header|footer|form|input|select|table|ul|ol|section|article|aside|card|modal|menu)[^>]*>/gi);
      if (componentMatches && componentMatches.length > 0) {
        console.log(`🎨 ${componentMatches.length} UI elements rendered in preview`);
      }
      
      // Detect styling
      const hasStyles = bundle.html.includes('<style') || bundle.css.length > 0;
      const hasTailwind = bundle.html.match(/class="[^"]*(?:bg-|text-|flex|grid|p-|m-|rounded)/);
      if (hasStyles || hasTailwind) {
        const styleTypes = [];
        if (bundle.css.length > 0) styleTypes.push(`${bundle.css.length} CSS file(s)`);
        if (hasTailwind) styleTypes.push('Tailwind CSS');
        if (bundle.html.includes('<style')) styleTypes.push('inline styles');
        console.log(`✨ Styling applied: ${styleTypes.join(', ')}`);
      }
    } else {
      console.warn('⚠️ Bundle has no HTML content or is empty');
    }
  }, [projectFiles, agentStatus]);
  
  const handleFileContentChange = useCallback((fileId: string, newContent: string) => {
    unsavedChangesRef.current.delete(fileId);
    pushToHistory(fileId, newContent); 
    
    // Check if index.html updated for preview
    const isIndexHtml = projectFiles.some(f => {
        const find = (nodes: FileNode[]): boolean => {
            for (const n of nodes) {
                if (n.id === fileId && n.name.toLowerCase() === 'index.html') return true;
                if (n.children && find(n.children)) return true;
            }
            return false;
        }
        return find([f]);
    }) || (activeFile?.name.toLowerCase() === 'index.html' && activeFile.id === fileId);

    if (isIndexHtml) {
        setGeneratedMarkup(newContent);
    }

    const updateNodes = (nodes: FileNode[]): FileNode[] => nodes.map(node => {
      if (node.id === fileId) return { ...node, content: newContent };
      if (node.children) return { ...node, children: updateNodes(node.children) };
      return node;
    });
    
    setState(prev => ({
        ...prev,
        projectFiles: updateNodes(prev.projectFiles),
        openFiles: prev.openFiles.map(f => f.id === fileId ? { ...f, content: newContent } : f),
    }));
  }, [activeFile, projectFiles]);

  const handleNodeClick = (node: FileNode, event: React.MouseEvent) => {
    const currentActiveFileId = workflowState.activeFileId;
    if (currentActiveFileId && unsavedChangesRef.current.has(currentActiveFileId)) {
        handleFileContentChange(currentActiveFileId, unsavedChangesRef.current.get(currentActiveFileId)!);
    }
    
    const isMultiSelect = event.ctrlKey || event.metaKey;

    setState(prev => {
        const newSelectedIds = isMultiSelect
            ? prev.selectedNodeIds.includes(node.id)
                ? prev.selectedNodeIds.filter(id => id !== node.id)
                : [...prev.selectedNodeIds, node.id]
            : [node.id];

        if (!isMultiSelect && node.type === 'file') {
            const newOpenFiles = !prev.openFiles.find(f => f.id === node.id) 
                ? [...prev.openFiles, node] 
                : prev.openFiles;
            
            getFileHistory(node.id, node.content || '');
            
            return { 
                ...prev, 
                openFiles: newOpenFiles, 
                activeFileId: node.id,
                selectedNodeIds: newSelectedIds
            };
        }
        
        return { ...prev, selectedNodeIds: newSelectedIds };
    });
  };

  const handleCloseFile = (fileToClose: FileNode) => {
    if (unsavedChangesRef.current.has(fileToClose.id)) {
        handleFileContentChange(fileToClose.id, unsavedChangesRef.current.get(fileToClose.id)!);
    }

    setState(prev => {
        const newOpenFiles = prev.openFiles.filter(f => f.id !== fileToClose.id);
        let newActiveFileId = prev.activeFileId;
        if (prev.activeFileId === fileToClose.id) {
            newActiveFileId = newOpenFiles[newOpenFiles.length - 1]?.id || null;
        }
        return { ...prev, openFiles: newOpenFiles, activeFileId: newActiveFileId };
    });
  };
  
  const handleFileContentUpdate = useCallback((fileId: string, newContent: string) => {
      unsavedChangesRef.current.set(fileId, newContent);
      
      if (activeFile?.name.toLowerCase() === 'index.html' && activeFile.id === fileId) {
          setGeneratedMarkup(newContent);
      }

       const updateOpenFiles = (files: FileNode[]): FileNode[] => files.map(f => {
        if (f.id === fileId) return { ...f, content: newContent };
        return f;
      });
      setState(prev => ({ ...prev, openFiles: updateOpenFiles(prev.openFiles) }));

      if (historyDebounceRef.current) clearTimeout(historyDebounceRef.current);
      historyDebounceRef.current = setTimeout(() => {
          pushToHistory(fileId, newContent);
      }, 1000);

  }, [activeFile]);

  const applyHistoryState = useCallback((fileId: string, content: string) => {
    unsavedChangesRef.current.delete(fileId);
    const updateNodes = (nodes: FileNode[]): FileNode[] => nodes.map(node => {
        if (node.id === fileId) return { ...node, content: content };
        if (node.children) return { ...node, children: updateNodes(node.children) };
        return node;
    });
    
    const isIndexHtml = activeFile?.name.toLowerCase() === 'index.html' && activeFile.id === fileId;
    if (isIndexHtml) setGeneratedMarkup(content);

    setState(prev => ({
        ...prev,
        projectFiles: updateNodes(prev.projectFiles),
        openFiles: prev.openFiles.map(f => f.id === fileId ? { ...f, content: content } : f),
    }));
  }, [activeFile]);

  const handleUndo = useCallback(() => {
      if (!activeFileId) return;
      const history = getFileHistory(activeFileId);
      if (history.past.length === 0) return;

      const previous = history.past.pop();
      if (previous !== undefined) {
          history.future.push(history.lastSaved);
          history.lastSaved = previous;
          applyHistoryState(activeFileId, previous);
      }
  }, [activeFileId, activeFile, applyHistoryState]); 

  const handleRedo = useCallback(() => {
      if (!activeFileId) return;
      const history = getFileHistory(activeFileId);
      if (history.future.length === 0) return;

      const next = history.future.pop();
      if (next !== undefined) {
          history.past.push(history.lastSaved);
          history.lastSaved = next;
          applyHistoryState(activeFileId, next);
      }
  }, [activeFileId, activeFile, applyHistoryState]);


  const handleSaveAll = useCallback(() => {
    if (unsavedChangesRef.current.size === 0) {
        addLog('No unsaved changes to save.');
        return;
    }
    let savedFilesCount = 0;
    const fileNames: string[] = [];

    const findNode = (nodes: FileNode[], id: string): FileNode | null => {
        for (const node of nodes) {
            if (node.id === id) return node;
            if (node.children) {
                const found = findNode(node.children, id);
                if (found) return found;
            }
        }
        return null;
    }

    for (const [fileId, content] of unsavedChangesRef.current.entries()) {
        handleFileContentChange(fileId, content);
        savedFilesCount++;
        const fileNode = findNode(projectFiles, fileId);
        if(fileNode) fileNames.push(fileNode.name);
    }

    if (savedFilesCount > 0) {
        addLog(`Saved ${savedFilesCount} file(s): ${fileNames.join(', ')}`);
        trackEvent('files_saved', { count: savedFilesCount });
    }
  }, [addLog, handleFileContentChange, projectFiles]);

  const handleConfirmCopyProject = useCallback((newProjectName: string) => {
    const copiedFiles = JSON.parse(JSON.stringify(projectFiles));
    const regenerateIds = (nodes: FileNode[]): FileNode[] => {
        return nodes.map(node => {
            const newNode: FileNode = { ...node, id: generateId() };
            if (newNode.children) {
                newNode.children = regenerateIds(newNode.children);
            }
            return newNode;
        });
    };
    const newFiles = regenerateIds(copiedFiles);
    
    const initialCommit: Commit = {
        id: generateId(),
        message: `Branch: Copied from '${projectName}'`,
        timestamp: new Date().toISOString(),
        fileTree: JSON.parse(JSON.stringify(newFiles)),
    };

    setWorkflowState({
        ...getInitialState(),
        projectFiles: newFiles,
        projectName: newProjectName,
        isRepoInitialized: true,
        commits: [initialCommit],
        agentLogs: [`Agent initialized. Project branched from "${projectName}".`],
    });
    fileHistoriesRef.current = {};

    addLog(`Project copied to "${newProjectName}".`);
    trackEvent('project_copied', { newName: newProjectName, from: projectName });
    setCopyProjectModalOpen(false);
  }, [projectFiles, projectName, addLog]);

  const handleGitHubImport = useCallback((importedFiles: FileNode[], repoName: string) => {
      saveSessionToStorage();
      setWorkflowState({
          ...getInitialState(),
          projectFiles: importedFiles,
          projectName: repoName,
          isRepoInitialized: true,
          agentLogs: [`Imported repository: ${repoName}`, 'Agent initialized.'],
          commits: [{
              id: generateId(),
              message: `Initial import from GitHub: ${repoName}`,
              timestamp: new Date().toISOString(),
              fileTree: JSON.parse(JSON.stringify(importedFiles))
          }]
      });
      fileHistoriesRef.current = {};
      setGitHubImportModalOpen(false);
      addLog(`Successfully imported ${repoName} from GitHub.`);
      trackEvent('github_import', { repoName });
  }, [addLog, saveSessionToStorage]);

  const handleDownloadProject = useCallback(() => {
      downloadProjectAsZip(projectFiles, projectName);
      addLog('Project download initiated.');
      trackEvent('project_downloaded', { projectName });
  }, [projectFiles, addLog, projectName]);

  const handleCreateNode = (name: string, type: 'file' | 'folder', parentId: string | null) => {
    const newPath = parentId ? (projectFiles.find(f => f.id === parentId)?.path || '') + `/${name}` : `/${name}`;
    const newNode: FileNode = {
        id: generateId(),
        name,
        type,
        path: newPath,
        content: type === 'file' ? '' : undefined,
        children: type === 'folder' ? [] : undefined,
    };
    setState(prev => ({
        ...prev,
        projectFiles: addNodeToTree(prev.projectFiles, parentId, newNode),
    }));
  };

  const handleDeleteNode = (nodeId: string) => {
      setState(prev => ({
          ...prev,
          projectFiles: removeNodeFromTree(prev.projectFiles, nodeId),
          openFiles: prev.openFiles.filter(f => f.id !== nodeId),
          activeFileId: prev.activeFileId === nodeId ? null : prev.activeFileId,
          selectedNodeIds: prev.selectedNodeIds.filter(id => id !== nodeId),
      }));
  };

  const handleRenameNode = (nodeId: string, newName: string) => {
      setState(prev => ({
          ...prev,
          projectFiles: updateNodeInTree(prev.projectFiles, nodeId, { name: newName, isEditing: false }),
           openFiles: prev.openFiles.map(f => f.id === nodeId ? { ...f, name: newName } : f),
      }));
  };
  
  const handleMoveNode = (draggedId: string, targetId: string, position: 'before' | 'after' | 'inside') => {
      setState(prev => ({
          ...prev,
          projectFiles: moveNodeInTree(prev.projectFiles, draggedId, targetId, position)
      }));
  };
  
  const findNodeById = (nodes: FileNode[], id: string): FileNode | null => {
      for (const node of nodes) {
          if (node.id === id) return node;
          if (node.children) {
              const found = findNodeById(node.children, id);
              if (found) return found;
          }
      }
      return null;
  };

  const handleCutNode = (node: FileNode) => {
      setClipboard({ node, operation: 'cut' });
  };
  
  const handleCopyNode = (node: FileNode) => {
      setClipboard({ node, operation: 'copy' });
  };
  
  const handlePasteNode = (parentId: string | null) => {
      if (!clipboard.node) return;

      setState(prev => {
        let newFiles = prev.projectFiles;
        
        if (clipboard.operation === 'cut') {
           const realNodeToMove = findNodeById(prev.projectFiles, clipboard.node!.id);
           
           if (!realNodeToMove) return prev;
           if (parentId === realNodeToMove.id) {
               addLog("Cannot move a folder into itself.");
               return prev;
           }

           newFiles = removeNodeFromTree(newFiles, realNodeToMove.id);
           const nodeToPaste = { ...realNodeToMove, isCut: false };
           newFiles = addNodeToTree(newFiles, parentId, nodeToPaste);
           setClipboard({ node: null, operation: null });
        } else {
           const nodeToPaste = duplicateNode(clipboard.node!);
           newFiles = addNodeToTree(newFiles, parentId, nodeToPaste);
        }
        
        return { ...prev, projectFiles: newFiles };
      });
  };

  const handleCopyPath = (path: string) => {
    navigator.clipboard.writeText(path).then(() => {
        addLog(`Copied to clipboard: ${path}`);
    }).catch(err => {
        addLog(`Failed to copy path: ${err}`);
    });
  };

  const handleFileUpload = async (files: FileList) => {
    const newUploadedFiles: UploadedFile[] = [];
    for (const file of Array.from(files)) {
      const content = await fileToBase64(file);
      newUploadedFiles.push({ name: file.name, type: file.type, content });
    }
    setState(prev => ({ ...prev, uploadedFiles: [...prev.uploadedFiles, ...prev.uploadedFiles] }));
    addLog(`Uploaded ${newUploadedFiles.length} file(s).`);
  };
  
  const resetWorkflow = () => {
    if (isRunningRef.current && abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
        isRunningRef.current = false;
        addLog("Workflow stopped by user.");
    }
    saveSessionToStorage();
    
    // Reset to Kings Realtors legacy template and clear mission control
    const legacyTemplate = LEGACY_TEMPLATES.realEstate;
    const initialState = getInitialState();
    
    setWorkflowState({
        ...initialState,
        projectFiles: JSON.parse(JSON.stringify(legacyTemplate.files)), // Deep clone
        projectName: legacyTemplate.name,
        agentLogs: ['Agent initialized. Reset to Kings Realtors template.'],
        tasks: [], // Clear execution plan
        problems: [], // Clear problems
        prompt: '', // Clear prompt
        agentStatus: 'idle',
        statusMessage: 'Agent is ready. Provide a prompt to begin.',
        missionHistory: [], // Clear mission history
        openFiles: [],
        activeFileId: null
    });
    
    // Update preview with Kings Realtors index.html
    const htmlFile = findHtmlFile(legacyTemplate.files);
    if (htmlFile?.content) {
        setGeneratedMarkup(htmlFile.content);
    }
    
    setMissionPrompt('');
    fileHistoriesRef.current = {};
    setViewMode('preview'); // Show the legacy template
    addLog('Reset complete. Showing Kings Realtors legacy template.');
  };
  
  const handleReloadApp = () => {
      // Save current session to history
      if (workflowState.projectFiles.length > 0 && workflowState.projectName) {
          const currentSession = {
              projectName: workflowState.projectName,
              projectFiles: workflowState.projectFiles,
              missionPrompt: missionPrompt,
              tasks: workflowState.tasks,
              agentStatus: workflowState.agentStatus,
              timestamp: Date.now()
          };
          const existingSessions = JSON.parse(localStorage.getItem('nexus-coder-session-history') || '[]');
          existingSessions.unshift(currentSession);
          // Keep only last 20 sessions
          localStorage.setItem('nexus-coder-session-history', JSON.stringify(existingSessions.slice(0, 20)));
          addLog(`✓ Session saved to history: "${workflowState.projectName}"`);
      }
      
      // Reload to default legacy template
      const legacyTemplate = LEGACY_TEMPLATES.realEstate;
      setWorkflowState({
          ...getInitialState(),
          projectFiles: JSON.parse(JSON.stringify(legacyTemplate.files)),
          projectName: legacyTemplate.name,
          agentLogs: ['🔄 App reloaded. Previous session saved to history.', 'Agent ready.'],
      });
      
      const htmlFile = findHtmlFile(legacyTemplate.files);
      if (htmlFile?.content) {
          setGeneratedMarkup(htmlFile.content);
      }
      
      setMissionPrompt('');
      fileHistoriesRef.current = {};
      setViewMode('preview');
      addLog('🔄 App reloaded successfully. Access previous sessions from history.');
  };

  const stopAgent = () => {
      if (isRunningRef.current) {
          // PAUSE the agent, don't reset everything
          isRunningRef.current = false;
          
          setState(prev => ({ 
              ...prev,
              agentStatus: 'paused', 
              statusMessage: 'Agent paused by user.',
              pauseReason: 'User requested pause. You can provide guidance or resume.'
          }));
          
          addLog("Agent workflow paused. Click Resume to continue.");
      }
  };

  const handleSearch = useCallback((query: string) => {
    const results: SearchResult[] = [];
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const lowerCaseQuery = query.toLowerCase();
    const searchInFiles = (nodes: FileNode[]) => {
      for (const node of nodes) {
        if (node.type === 'file') {
          if (node.name.toLowerCase().includes(lowerCaseQuery)) {
            results.push({ type: 'file', file: node, lineNumber: 1, content: `Filename match: ${node.name}` });
          }
          node.content?.split('\n').forEach((line, index) => {
            if (line.toLowerCase().includes(lowerCaseQuery)) {
              results.push({ type: 'file', file: node, lineNumber: index + 1, content: line.trim() });
            }
          });
        }
        if (node.children) {
          searchInFiles(node.children);
        }
      }
    };
    searchInFiles(projectFiles);
    agentLogs.forEach((log, index) => {
      if (log.toLowerCase().includes(lowerCaseQuery)) {
        results.push({ type: 'log', logIndex: index, content: log });
      }
    });
    commits.forEach((commit) => {
      if (commit.message.toLowerCase().includes(lowerCaseQuery)) {
        results.push({ type: 'commit', commit, content: commit.message });
      }
    });
    setSearchResults(results);
  }, [projectFiles, agentLogs, commits]);

  useEffect(() => {
    const handler = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery, handleSearch]);

  const handleSearchResultClick = (result: SearchResult) => {
    if (result.type === 'file') {
      handleNodeClick(result.file, {} as React.MouseEvent);
    } else if (result.type === 'commit') {
      alert(`Commit: ${result.commit.id}\nMessage: ${result.commit.message}`);
    } else if (result.type === 'log') {
      addLog(`Search result clicked: Navigating to logs (feature placeholder).`);
    }
    setSearchQuery('');
  };
  
  const handleRestoreCommit = (commitId: string) => {
    const commitToRestore = commits.find(c => c.id === commitId);
    if (commitToRestore && confirm(`Are you sure you want to restore the project to the state of commit "${commitToRestore.message}"? All current unsaved changes will be lost.`)) {
        const restoredFiles = JSON.parse(JSON.stringify(commitToRestore.fileTree));
        unsavedChangesRef.current.clear();
        fileHistoriesRef.current = {};
        setState(prev => ({
            ...prev,
            projectFiles: restoredFiles,
            openFiles: [], 
            activeFileId: null,
        }));
        addLog(`Project restored to commit: ${commitToRestore.id}`);
        trackEvent('commit_restored', { commitId });
        setVersionHistoryModalOpen(false);
    }
  };

  const findFirstModifiedFile = (oldFiles: FileNode[], newFiles: FileNode[]): FileNode | null => {
      const flatten = (nodes: FileNode[], map = new Map<string, string>()) => {
          nodes.forEach(n => {
              if (n.type === 'file' && n.content) map.set(n.path, n.content);
              if (n.children) flatten(n.children, map);
          });
          return map;
      };
      const oldMap = flatten(oldFiles);
      const newMap = flatten(newFiles);
      for (const [path, content] of newMap.entries()) {
          if (!oldMap.has(path) || oldMap.get(path) !== content) {
              const findNode = (nodes: FileNode[]): FileNode | null => {
                  for (const n of nodes) {
                      if (n.path === path) return n;
                      if (n.children) {
                          const f = findNode(n.children);
                          if (f) return f;
                      }
                  }
                  return null;
              }
              return findNode(newFiles);
          }
      }
      return null;
  };

  const handleInitRepo = () => {
      const initialCommit: Commit = {
          id: generateId(),
          message: 'Initial commit',
          timestamp: new Date().toISOString(),
          fileTree: JSON.parse(JSON.stringify(projectFiles))
      };
      setState(prev => ({
          ...prev,
          isRepoInitialized: true,
          commits: [initialCommit],
          agentLogs: [...prev.agentLogs, '[Git] Repository initialized.']
      }));
      addLog('Git repository initialized.');
  };

  const handleCommit = () => {
      if (!isRepoInitialized) return;
      const message = window.prompt("Enter commit message:", "Update project files");
      
      if (message) {
          const newCommit: Commit = {
              id: generateId(),
              message,
              timestamp: new Date().toISOString(),
              fileTree: JSON.parse(JSON.stringify(projectFiles))
          };
          setState(prev => ({
              ...prev,
              commits: [newCommit, ...prev.commits],
              agentLogs: [...prev.agentLogs, `[Git] Commit: ${message}`]
          }));
          addLog(`Changes committed: ${message}`);
      }
  };

  const handleLoadLegacyProject = useCallback((template: { name: string, files: FileNode[] }) => {
      saveSessionToStorage();
      setWorkflowState({
          ...getInitialState(),
          projectFiles: template.files,
          projectName: template.name,
          isRepoInitialized: true,
          agentLogs: [`Loaded Legacy Project: ${template.name}`, 'Agent initialized.'],
          commits: [{
              id: generateId(),
              message: `Loaded ${template.name}`,
              timestamp: new Date().toISOString(),
              fileTree: JSON.parse(JSON.stringify(template.files))
          }]
      });
      setGeneratedMarkup('');
      addLog(`Loaded legacy project prototype: ${template.name}`);
      setViewMode('preview');
  }, [addLog, saveSessionToStorage]);

  const runAgentWorkflow = useCallback(async (resumeInput: string | null = null, startPrompt: string | null = null) => {
    if (isRunningRef.current) return;
    
    // Natural language handling for greetings and capability questions
    const checkPrompt = (startPrompt || resumeInput || workflowState.prompt).trim().toLowerCase();
    const isGreeting = /^(hi|hello|hey|greetings|good\s+(morning|afternoon|evening))[\s!.?]*$/i.test(checkPrompt);
    const isCapabilityQuestion = /what (can|do) you (do|build|create)|your capabilities|what are you|who are you|help me/i.test(checkPrompt);
    
    if (isGreeting || isCapabilityQuestion) {
        const responseMessage = `👋 Hello! I'm Nexus Coder, your autonomous AI software engineer.

🚀 MY CAPABILITIES:
• Build full-stack web applications (React, Vue, Next.js)
• Create mobile apps (React Native, Flutter, Expo)
• Develop backend services (Node.js, Python, Go)
• Set up CI/CD pipelines and DevOps automation
• Debug and fix code issues automatically
• Generate comprehensive documentation

💡 HOW TO USE ME:
Simply describe what you want to build, and I'll:
1. Create a detailed execution plan
2. Architect the project structure
3. Write all the code
4. Test and debug automatically
5. Deploy your application

✨ Try saying: 'Build a todo app with React' or 'Create a real estate website'`;
        
        // Show as single task card
        const responseTask = {
            id: 'bot-response',
            description: responseMessage,
            status: 'completed' as const,
            progress: 100
        };
        
        setState(prev => ({
            ...prev, 
            tasks: [responseTask],
            agentStatus: 'idle',
            statusMessage: 'Ready to build your next project!',
            prompt: ''
        }));
        
        addLog(responseMessage);
        return;
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    isRunningRef.current = true;
    
    let state = { ...workflowState };
    
    if (state.agentStatus === 'error' || state.agentStatus === 'paused') {
        state.agentStatus = 'coding';
        state.statusMessage = `Resuming workflow...`;
        
        if (resumeInput) {
            const resumeMsg = `[System]: Agent Paused. Workflow halted. User provided input: "${resumeInput}"`;
            state.agentLogs.push(resumeMsg);
            setUserInputForPause('');
        } else {
            state.agentLogs.push(`[System]: Resuming workflow...`);
        }

        setState(prev => ({
             ...prev,
             agentStatus: 'coding',
             statusMessage: state.statusMessage,
             agentLogs: [...prev.agentLogs, ...state.agentLogs.slice(prev.agentLogs.length)],
             pauseReason: null
        }));
    } else if (state.agentStatus === 'idle' || state.agentStatus === 'completed') {
      const promptToUse = startPrompt || state.prompt;
      if (!promptToUse.trim()) {
        addLog('Error: Prompt cannot be empty.');
        setState(prev => ({...prev, statusMessage: 'Error: Prompt cannot be empty.'}));
        isRunningRef.current = false;
        return;
      }
      
      const newMission: Mission = {
          id: generateId(),
          prompt: promptToUse,
          timestamp: Date.now(),
          model: selectedModel
      };

      setMissionPrompt(promptToUse);
      
      generateProjectName(promptToUse, selectedModel, appSettings).then(name => {
          setState(prev => ({...prev, projectName: name}));
      });

      setGeneratedMarkup('');
      
      setState(prev => ({ 
          ...prev, 
          agentStatus: 'planning', 
          statusMessage: 'Agent is generating a plan...',
          projectFiles: [], 
          openFiles: [],
          activeFileId: null,
          prompt: '', 
          missionHistory: [newMission, ...prev.missionHistory]
      }));

      state = { ...state, projectFiles: [], prompt: promptToUse, agentStatus: 'planning' };
      addLog('Planning started...');
    }

    try {
      // Detect if this is an incremental improvement (user has existing project files)
      const isIncrementalImprovement = state.projectFiles.length > 0 && state.agentStatus === 'planning';
      
      if (state.agentStatus === 'planning') {
        if (isIncrementalImprovement) {
          // Incremental mode: Create focused tasks for refinement
          addLog('🔄 Incremental Improvement Mode: Analyzing existing project...');
          setState(prev => ({ ...prev, statusMessage: 'Analyzing existing project for improvements...' }));
          
          const plan = await generatePlan(
            `INCREMENTAL IMPROVEMENT: ${state.prompt}\n\nExisting project has ${state.projectFiles.length} files. Only modify/add what's needed for this specific request.`, 
            selectedModel, 
            state.uploadedFiles, 
            appSettings, 
            controller.signal
          );
          if (controller.signal.aborted) throw new Error('Aborted');
          
          state.tasks = plan.map(task => ({ description: task, status: 'pending' as const }));
          setState(prev => ({ ...prev, agentStatus: 'coding', tasks: state.tasks }));
          addLog('✓ Incremental improvement plan created. Preserving existing files.');
        } else {
          // Fresh build mode
          const plan = await generatePlan(state.prompt, selectedModel, state.uploadedFiles, appSettings, controller.signal);
          if (controller.signal.aborted) throw new Error('Aborted');
          
          state.tasks = plan.map(task => ({ description: task, status: 'pending' as const }));
          
          setState(prev => ({ ...prev, agentStatus: 'architecting', statusMessage: 'Architect Agent: Designing system structure...', tasks: state.tasks }));
          addLog('Architect Agent: Defining project structure...');
          const structure = await architectProject(state.prompt, selectedModel, appSettings, controller.signal);
          state.projectFiles = structure;
          
          setState(prev => ({ ...prev, projectFiles: structure, agentStatus: 'coding' }));
        }
      }

      // --- PARALLEL TASK EXECUTION for faster builds ---
      while (state.currentTaskIndex < state.tasks.length) {
        if (controller.signal.aborted) throw new Error('Aborted');

        const task = state.tasks[state.currentTaskIndex];
        const prevFiles = state.projectFiles;
        
        state.tasks = state.tasks.map((t, idx) => idx === state.currentTaskIndex ? { ...t, status: 'in-progress' } : t);
        setState(prev => ({ ...prev, agentStatus: 'coding', statusMessage: `Implementing: ${task.description}`, tasks: state.tasks }));

        // Execute task with real-time updates
        const result = await implementTask(
             state.prompt,
             state.projectFiles,
             task.description,
             selectedModel,
             state.uploadedFiles,
             state.agentLogs,
             1,
             null,
             resumeInput,
             appSettings,
             controller.signal
        );

        resumeInput = null;

        if (controller.signal.aborted) throw new Error('Aborted');

        if (result.pause) {
            setState(prev => ({
                ...prev,
                agentStatus: 'paused',
                pauseReason: result.pause?.reason || "Agent requested input",
                statusMessage: "Agent paused for input.",
                projectFiles: result.files
            }));
            isRunningRef.current = false;
            return;
        }

        state.projectFiles = result.files;
        
        // --- INSTANT Preview Updates (Real-time as code generates) ---
        const htmlFile = findHtmlFile(result.files);
        console.log('🔍 Looking for HTML file...', htmlFile ? 'Found!' : 'Not found');
        
        if (htmlFile) {
            console.log('📄 HTML file content length:', htmlFile.content?.length || 0);
            if (htmlFile.content && htmlFile.content.trim().length > 0) {
                // Use Preview Update Agent to process files with CSS/JS injection
                console.log('✅ Processing files with Preview Update Agent - REAL-TIME UPDATE');
                const bundle = previewUpdateAgent.processFiles(result.files);
                
                if (bundle.html) {
                    setGeneratedMarkup(bundle.html);
                    setViewMode('split'); // Auto-switch to split view for live preview
                    console.log(`💅 Injected ${bundle.css.length} CSS file(s) and ${bundle.js.length} JS file(s)`);
                }
                
                // Force immediate state update for real-time feel
                setState(prev => ({
                    ...prev,
                    projectFiles: result.files
                }));
                
                // Enhanced component detection with more UI elements
                const componentTypes = [
                    'button', 'card', 'modal', 'menu', 'navbar', 'nav', 'form', 'input', 
                    'table', 'header', 'footer', 'sidebar', 'hamburger', 'dropdown', 
                    'accordion', 'tab', 'carousel', 'slider', 'tooltip', 'badge', 
                    'alert', 'toast', 'dialog', 'drawer', 'popover', 'select', 
                    'checkbox', 'radio', 'switch', 'textarea', 'progress', 'spinner',
                    'avatar', 'chip', 'divider', 'list', 'grid', 'flex'
                ];
                const foundComponents = componentTypes.filter(comp => 
                    htmlFile.content?.toLowerCase().includes(comp)
                );
                if (foundComponents.length > 0) {
                    const displayComponents = foundComponents.slice(0, 5).join(', ');
                    const moreCount = foundComponents.length > 5 ? ` +${foundComponents.length - 5} more` : '';
                    addLog(`🎨 Real-time preview: ${displayComponents}${moreCount} rendered`);
                } else {
                    addLog('🎨 Real-time preview: UI structure updated');
                }
                
                // Check for styling updates with more detail
                const hasInlineStyles = htmlFile.content?.includes('<style');
                const hasClasses = htmlFile.content?.includes('class=');
                const hasTailwind = htmlFile.content?.match(/class="[^"]*(?:bg-|text-|flex|grid|p-|m-|rounded)/);
                
                // Find CSS files in project
                const findCssFiles = (nodes: FileNode[]): FileNode[] => {
                    const cssFiles: FileNode[] = [];
                    const traverse = (items: FileNode[]) => {
                        items.forEach(item => {
                            if (item.type === 'file' && item.name.endsWith('.css') && item.content) {
                                cssFiles.push(item);
                            }
                            if (item.children) traverse(item.children);
                        });
                    };
                    traverse(nodes);
                    return cssFiles;
                };
                const cssFiles = findCssFiles(result.files);
                
                if (hasInlineStyles || hasClasses || cssFiles.length > 0) {
                    const styleTypes = [];
                    if (hasTailwind) styleTypes.push('Tailwind CSS');
                    if (hasInlineStyles) styleTypes.push('inline CSS');
                    if (cssFiles.length > 0) styleTypes.push(`${cssFiles.length} CSS file(s)`);
                    if (hasClasses && !hasTailwind) styleTypes.push('CSS classes');
                    
                    addLog(`✨ Styling applied: ${styleTypes.join(', ')}`);
                    if (cssFiles.length > 0) {
                        addLog(`📄 CSS files: ${cssFiles.map(f => f.name).join(', ')}`);
                    }
                }
                
                // Check for interactivity with more detail
                const hasScripts = htmlFile.content?.includes('<script');
                const hasEventHandlers = htmlFile.content?.match(/on(click|change|submit|load|input|focus|blur)/i);
                if (hasScripts || hasEventHandlers) {
                    addLog('⚡ Interactive elements and event handlers added');
                }
                
                // Check for responsive design
                if (htmlFile.content?.includes('viewport') || htmlFile.content?.includes('media')) {
                    addLog('📱 Responsive design elements detected');
                }
            } else {
                console.warn('⚠️ HTML file found but content is empty');
            }
        } else {
            // Check if ANY HTML file exists in the tree
            const allFiles = result.files.flatMap(function flatten(node: FileNode): FileNode[] {
                if (node.type === 'file') return [node];
                return node.children ? node.children.flatMap(flatten) : [];
            });
            const anyHtml = allFiles.find(f => f.name.toLowerCase().endsWith('.html'));
            if (anyHtml && anyHtml.content) {
                console.log('✅ Found HTML file in tree:', anyHtml.name);
                setGeneratedMarkup(anyHtml.content);
                setViewMode('split');
                addLog('🎨 Preview updated with latest UI components');
            }
        }
        
        // --- Auto-open modified files ---
        const modifiedFile = findFirstModifiedFile(prevFiles, result.files);
        let newActiveFileId = state.activeFileId;
        let newOpenFiles = [...state.openFiles];
        
        if (modifiedFile) {
            newActiveFileId = modifiedFile.id;
            if (!newOpenFiles.find(f => f.id === modifiedFile.id)) {
                newOpenFiles.push(modifiedFile);
            }
            newOpenFiles = newOpenFiles.map(openFile => {
                const foundNode = findNodeById(state.projectFiles, openFile.id);
                return foundNode ? { ...openFile, content: foundNode.content } : openFile;
            });
        }

        // Mark task as completed - create new arrays to ensure React detects changes
        const updatedTasks = state.tasks.map((t, idx) => 
            idx === state.currentTaskIndex ? { ...t, status: 'completed' as const } : t
        );
        const updatedLogs = [...state.agentLogs, `✓ Task completed: ${task.description}`];
        
        // Update state with all changes - use immutable updates
        setState(prev => ({
            ...prev,
            projectFiles: state.projectFiles,
            tasks: updatedTasks,
            currentTaskIndex: state.currentTaskIndex + 1,
            agentLogs: updatedLogs,
            openFiles: newOpenFiles,
            activeFileId: newActiveFileId || prev.activeFileId
        }));
        
        // Update local state for next iteration
        state.tasks = updatedTasks;
        state.currentTaskIndex++;
        state.agentLogs = updatedLogs;
        
        // Small delay to allow UI to update between tasks (improves perceived real-time feel)
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // --- Quick QA Check (Non-blocking) ---
      if (!controller.signal.aborted) {
          setState(prev => ({ ...prev, agentStatus: 'qa', statusMessage: 'QA Agent: Quick verification...' }));
          
          try {
              // Single pass QA - don't get stuck in loops
              const qaResult = await performQA(state.projectFiles, selectedModel, appSettings, controller.signal);
              const problems = await detectProblems(state.projectFiles, selectedModel, appSettings);
              
              if (qaResult.passed && problems.length === 0) {
                  addLog("✓ QA Verification Passed.");
              } else if (problems.length > 0 && problems.length <= 3) {
                  // Only fix if there are 3 or fewer critical issues
                  addLog(`Debugger Agent: Fixing ${problems.length} critical issues...`);
                  setState(prev => ({ 
                      ...prev, 
                      agentStatus: 'debugging', 
                      statusMessage: `Debugger Agent: Fixing ${problems.length} issues...` 
                  }));

                  for (const issue of problems.slice(0, 3)) { // Max 3 fixes
                      if (controller.signal.aborted) throw new Error('Aborted');
                      try {
                          const fixResult = await fixProblem(state.projectFiles, issue, selectedModel, appSettings);
                          state.projectFiles = fixResult.files;
                          addLog(`✓ Fixed: ${issue.description}`);
                      } catch (e) {
                          console.warn("Fix skipped:", issue.description);
                      }
                  }
                  
                  setState(prev => ({ ...prev, projectFiles: state.projectFiles }));
              } else {
                  addLog("QA: Minor issues detected but proceeding with build.");
              }
          } catch (e) {
              console.warn("QA check failed, proceeding anyway:", e);
              addLog("QA check skipped. Proceeding to completion.");
          }

          setState(prev => ({ ...prev, agentStatus: 'publishing', statusMessage: 'DevOps Agent: Generating CI/CD pipelines...' }));
          const devOpsFiles = await generateDevOpsFiles(state.projectFiles, selectedModel, appSettings, controller.signal);
          
          let newProjectFiles = [...state.projectFiles];
          if (devOpsFiles.length > 0) {
              devOpsFiles.forEach(f => {
                  if (!findNodeById(newProjectFiles, f.id)) {
                      newProjectFiles = addNodeToTree(newProjectFiles, null, f);
                  }
              });
              addLog('Generated Dockerfile and CI workflow.');
          }
          
          const evaluationResult = await evaluateProject(newProjectFiles, state.prompt, selectedModel, appSettings, controller.signal);
          
          state.projectFiles = newProjectFiles;
          
          const score = evaluationResult?.score ?? 'N/A';
          const quality = evaluationResult?.quality ?? 'Unknown';

          // Clean up empty folders before completing
          const cleanedFiles = removeEmptyFolders(state.projectFiles);
          
          setState(prev => ({ 
              ...prev, 
              projectFiles: cleanedFiles, 
              agentStatus: 'completed',
              statusMessage: `Mission Complete. Score: ${score}/100 (${quality})` 
          }));
          
          const indexHtml = findHtmlFile(cleanedFiles);
          if (indexHtml) setGeneratedMarkup(indexHtml.content || '');
      }

    } catch (error: any) {
      if (error.message === 'Aborted' || controller.signal.aborted) {
          addLog('Workflow paused by user.');
          const tasksWithRevert = state.tasks.map((t, i) =>
              i === state.currentTaskIndex ? { ...t, status: 'pending' as const } : t
          );
          setState(prev => ({ 
              ...prev, 
              agentStatus: 'paused', 
              statusMessage: 'Agent paused. Click Resume to continue.',
              tasks: tasksWithRevert 
          }));
      } else {
          console.error(error);
          const friendlyError = error.message.includes('429') ? "Rate limit exceeded. Please wait a moment." 
            : error.message.includes('401') ? "Authentication failed. Check API Keys."
            : error.message;
            
          setState(prev => ({ ...prev, agentStatus: 'error', statusMessage: `Error: ${friendlyError}` }));
          addLog(`Error: ${friendlyError}`);
      }
    } finally {
      isRunningRef.current = false;
      abortControllerRef.current = null;
    }
  }, [workflowState, selectedModel, appSettings, addLog, handleLoadLegacyProject]);

  const restoreMission = (prompt: string) => {
      setMissionPrompt(prompt);
      setState(prev => ({ ...prev, prompt }));
  };

  const deleteMission = (missionId: string) => {
      setState(prev => ({
          ...prev,
          missionHistory: prev.missionHistory.filter(m => m.id !== missionId)
      }));
  };

  return (
     <div className="flex flex-col h-screen bg-[#0d0d0f] text-white overflow-hidden font-sans selection:bg-purple-500/30">
        {isAuthModalOpen && (
          <AuthModal 
            onClose={() => setAuthModalOpen(false)} 
            onLoginSuccess={() => { 
              setIsAuthenticated(true); 
              setAuthModalOpen(false);
              if (initialLaunchInfoRef.current.prompt) {
                  setTimeout(() => runAgentWorkflow(null, initialLaunchInfoRef.current.prompt), 100);
              }
            }} 
          />
        )}
        {isBillingOpen && <Billing onClose={() => setBillingOpen(false)} />}
        {isTemplateModalOpen && <ProjectTemplateModal templates={ALL_TEMPLATES} onClose={() => setTemplateModalOpen(false)} onSelect={(name) => { 
             // Save current project to history before creating new one
             if (workflowState.projectFiles.length > 0 && workflowState.projectName) {
                 const currentProjectSession = {
                     projectName: workflowState.projectName,
                     projectFiles: workflowState.projectFiles,
                     missionPrompt: missionPrompt,
                     timestamp: Date.now()
                 };
                 const existingSessions = JSON.parse(localStorage.getItem('nexus-coder-project-history') || '[]');
                 existingSessions.unshift(currentProjectSession);
                 // Keep only last 10 projects
                 localStorage.setItem('nexus-coder-project-history', JSON.stringify(existingSessions.slice(0, 10)));
                 addLog(`✓ Saved "${workflowState.projectName}" to project history.`);
             }
             
             saveSessionToStorage();
             const template = ALL_TEMPLATES.find(t => t.name === name);
             if(template) {
                // Initialize fresh dashboard
                setWorkflowState({ 
                    ...getInitialState(), 
                    projectFiles: template.files, 
                    projectName: name,
                    agentLogs: [`New project initialized: ${name}`, 'Agent ready. Provide a prompt to begin.'],
                    tasks: [],
                    problems: []
                });
                setMissionPrompt('');
                setGeneratedMarkup('');
                setTemplateModalOpen(false);
                addLog(`🚀 New project "${name}" initialized. Dashboard reset.`);
             }
        }} />}
        {isProfileModalOpen && <ProfileModal user={user} onClose={() => setProfileModalOpen(false)} onSave={(u) => setUser(u)} />}
        {isSettingsModalOpen && <SettingsModal settings={appSettings} onClose={() => setSettingsModalOpen(false)} onSave={setAppSettings} />}
        {isGitHubImportModalOpen && <GitHubImportModal onClose={() => setGitHubImportModalOpen(false)} onImport={handleGitHubImport} />}
        {isDeployModalOpen && <DeployModal onClose={() => setDeployModalOpen(false)} />}
        {isVersionHistoryModalOpen && <VersionHistoryModal commits={commits} onClose={() => setVersionHistoryModalOpen(false)} onRestore={handleRestoreCommit} />}
        {isShareModalOpen && <ShareModal onClose={() => setShareModalOpen(false)} />}
        {isCopyProjectModalOpen && <CopyProjectModal currentProjectName={projectName} onClose={() => setCopyProjectModalOpen(false)} onCopy={handleConfirmCopyProject} />}

        {!isAuthenticated && (
            <LandingPage onLaunch={(initialPrompt, model) => {
                 setWorkflowState(prev => ({ ...prev, prompt: initialPrompt }));
                 setSelectedModel(model);
                 initialLaunchInfoRef.current = { prompt: initialPrompt, model };
                 setAuthModalOpen(true);
            }} />
        )}

        {isAuthenticated && (
            <>
            <Header 
                user={user}
                isPwaInstallable={!!installPromptEvent}
                onInstallClick={handleInstallClick}
                onSaveAll={handleSaveAll}
                onCopyProject={() => setCopyProjectModalOpen(true)}
                onDownloadProject={handleDownloadProject}
                onGitHubImport={() => setGitHubImportModalOpen(true)}
                onDeploy={() => setDeployModalOpen(true)}
                onReloadApp={handleReloadApp}
                onVersionHistory={() => setVersionHistoryModalOpen(true)}
                onOpenProfile={() => setProfileModalOpen(true)}
                onOpenSettings={() => setSettingsModalOpen(true)}
                onLogout={() => {
                  saveSessionToStorage();
                  try {
                    localStorage.removeItem('nexus-auth-state');
                  } catch (error) {
                    console.error('Failed to clear auth state:', error);
                  }
                  setIsAuthenticated(false);
                  setUser({ name: 'Demo User', email: 'demo@user.com', bio: 'AI enthusiast & developer.' });
                  setViewMode('preview');
                  addLog('User logged out successfully.');
                }}
                onShare={() => setShareModalOpen(true)}
                isRepoInitialized={isRepoInitialized}
                onInitRepo={handleInitRepo}
                onCommit={handleCommit}
            />
            
            {/* Main content area with ControlPanel extending to bottom */}
            <div className="flex flex-grow overflow-hidden relative">
                {/* Mission Control Panel - Extends to bottom of screen */}
                <div 
                    className="flex-shrink-0 transition-all duration-100 ease-out overflow-hidden" 
                    style={{ width: controlPanelWidth, height: 'calc(100vh - 72px)' }}
                >
                    <ControlPanel 
                        tasks={tasks}
                        problems={problems}
                        activeProblemId={activeProblemId}
                        prompt={prompt}
                        setPrompt={(p) => setState(prev => ({ ...prev, prompt: p }))}
                        missionPrompt={missionPrompt}
                        statusMessage={statusMessage}
                        projectName={projectName}
                        setProjectName={(n) => setState(prev => ({ ...prev, projectName: n }))}
                        onGenerate={(promptOverride) => runAgentWorkflow(null, promptOverride)}
                        agentStatus={agentStatus}
                        selectedModel={selectedModel}
                        setSelectedModel={setSelectedModel}
                        onFileUpload={handleFileUpload}
                        uploadedFiles={uploadedFiles}
                        pauseReason={pauseReason}
                        userInputForPause={userInputForPause}
                        setUserInputForPause={setUserInputForPause}
                        onResume={() => runAgentWorkflow(userInputForPause)}
                        onReset={resetWorkflow}
                        onStop={stopAgent}
                        onNewProject={() => setTemplateModalOpen(true)}
                        onBillingClick={() => setBillingOpen(true)}
                        onAddDiscussionLog={addDiscussionLog}
                        missionHistory={missionHistory}
                        onRestoreMission={restoreMission}
                        onDeleteMission={deleteMission}
                        onLoadLegacyProject={handleLoadLegacyProject}
                        agentLogs={agentLogs}
                    />
                </div>
                
                {/* Resizer - Visible and extends to StatusBar */}
                <div 
                    onMouseDown={handleControlMouseDown}
                    onTouchStart={handleControlTouchStart}
                    className={`group w-4 md:w-3 lg:w-2 cursor-col-resize transition-all duration-150 z-30 flex items-center justify-center relative touch-none ${
                      isResizingControl 
                        ? 'bg-cyan-400/80 shadow-[0_0_20px_rgba(34,211,238,0.8)]' 
                        : 'bg-cyan-500/30 hover:bg-cyan-500/50 md:hover:w-3.5 lg:hover:w-2.5 active:bg-cyan-400'
                    }`}
                    style={{ height: 'calc(100vh - 72px)' }}
                >
                    <div className={`h-20 w-1 rounded-full transition-all duration-200 ${
                      isResizingControl 
                        ? 'bg-cyan-300 shadow-[0_0_15px_rgba(34,211,238,1)] scale-110' 
                        : 'bg-cyan-400 group-hover:bg-cyan-300 group-active:bg-cyan-200 group-hover:shadow-[0_0_10px_rgba(34,211,238,0.8)]'
                    }`} />
                </div>
                
                {/* Sidebar - Positioned to extend from top to StatusBar */}
                <div 
                    className={`${isSidebarCollapsed ? 'w-0' : ''} flex-shrink-0 bg-[#0a0a0c] transition-all duration-300 absolute left-0 z-20`}
                    style={{ 
                        width: isSidebarCollapsed ? 0 : `${sidebarWidth + 8}px`,
                        top: 0,
                        bottom: '24px',
                        marginLeft: `${controlPanelWidth}px`
                    }}
                >
                    {/* Sidebar content will be rendered here */}
                </div>

                {/* CodeView + Terminal container - Constrained to CodeView width */}
                <div className="flex-grow flex flex-col min-w-0 bg-[#0d0d0f] relative">
                    {/* CodeView area */}
                    <div className="flex-grow overflow-hidden" style={{ height: isTerminalCollapsed ? 'calc(100vh - 72px)' : `calc(100vh - 72px - ${terminalHeight}px)` }}>
                        <CodeView 
                            files={projectFiles}
                            openFiles={openFiles}
                            activeFile={activeFile}
                            selectedNodeIds={selectedNodeIds}
                            clipboardNodeId={clipboard.node?.id || null}
                            onNodeClick={handleNodeClick}
                            onFileContentChange={handleFileContentChange}
                            onFileContentUpdate={handleFileContentUpdate}
                            onCloseFile={handleCloseFile}
                            onActivateFile={(file) => setState(prev => ({ ...prev, activeFileId: file.id }))}
                            agentStatus={agentStatus}
                            viewMode={viewMode}
                            setViewMode={setViewMode}
                            generatedMarkup={generatedMarkup}
                            agentLogs={agentLogs}
                            review={finalReview}
                            searchQuery={searchQuery}
                            setSearchQuery={setSearchQuery}
                            searchResults={searchResults}
                            onSearchResultClick={handleSearchResultClick}
                            fileFilter={fileFilter}
                            onCreateNode={handleCreateNode}
                            onDeleteNode={handleDeleteNode}
                            onRenameNode={handleRenameNode}
                            onMoveNode={handleMoveNode}
                            onSetEditingNode={(id) => setState(prev => ({ ...prev, projectFiles: updateNodeInTree(prev.projectFiles, id, { isEditing: true }) }))}
                            onCopyPath={handleCopyPath}
                            onCutNode={handleCutNode}
                            onCopyNode={handleCopyNode}
                            onPasteNode={handlePasteNode}
                            canPaste={!!clipboard.node}
                            onUndo={handleUndo}
                            onRedo={handleRedo}
                            missionPrompt={missionPrompt}
                            projectName={projectName}
                            terminalHeight={terminalHeight}
                            isTerminalCollapsed={isTerminalCollapsed}
                        />
                    </div>
                    
                    {/* Terminal Section - Aligned with CodeView content, offset by sidebar */}
                    <div 
                        className="flex-shrink-0 flex flex-col overflow-visible transition-all duration-300"
                        style={{
                            marginLeft: isSidebarCollapsed ? 0 : `${sidebarWidth + 8}px`,
                            width: isSidebarCollapsed ? '100%' : `calc(100% - ${sidebarWidth + 8}px)`,
                            transition: 'margin-left 300ms, width 300ms'
                        }}
                    >
                        {/* Terminal Resizer - Subtle and refined */}
                        {!isTerminalCollapsed && (
                          <div 
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              isTerminalResizing.current = true;
                              setIsResizingTerminal(true);
                              document.body.style.cursor = 'row-resize';
                              document.body.style.userSelect = 'none';
                            }}
                            onTouchStart={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              isTerminalResizing.current = true;
                              setIsResizingTerminal(true);
                              document.body.style.userSelect = 'none';
                            }}
                            className={`group w-full h-4 md:h-3 lg:h-2 cursor-row-resize flex-shrink-0 transition-all duration-200 flex items-center justify-center relative touch-none bg-black/40 hover:bg-purple-500/50 ${
                              isResizingTerminal 
                                ? 'bg-purple-500/60' 
                                : ''
                            }`}
                          >
                            <div className={`w-16 h-1 rounded-full transition-all duration-200 bg-purple-500/30 group-hover:bg-purple-400 ${
                              isResizingTerminal 
                                ? 'bg-purple-400' 
                                : ''
                            }`} />
                          </div>
                        )}
                        
                        {/* Terminal at bottom */}
                        <div className="flex-shrink-0 transition-all duration-300 border-t border-purple-500/20 overflow-visible" style={{ height: isTerminalCollapsed ? '40px' : `${terminalHeight}px` }}>
                            <Terminal 
                                logs={agentLogs}
                                isCollapsed={isTerminalCollapsed}
                                onToggleCollapse={() => {
                                  const newCollapsed = !isTerminalCollapsed;
                                  setIsTerminalCollapsed(newCollapsed);
                                  try {
                                    localStorage.setItem('nexus-terminal-collapsed', JSON.stringify(newCollapsed));
                                  } catch (error) {
                                    console.warn('Failed to save terminal state:', error);
                                  }
                                }}
                                sidebarWidth={sidebarWidth}
                                isSidebarCollapsed={isSidebarCollapsed}
                            />
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Status Bar at bottom - Full width */}
            <StatusBar 
                agentStatus={agentStatus} 
                message={statusMessage}
            />
            </>
        )}
     </div>
  );
};

export default App;
