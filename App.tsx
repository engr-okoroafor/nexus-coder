
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ControlPanel } from './components/ControlPanel';
import { CodeView } from './components/CodeView';
import { Header } from './components/Header';
import type { FileNode, ViewMode, AgentStatus, Task, Problem, UploadedFile, Commit, TokenUsage, SearchResult, User, AppSettings, Mission, AgentTrace } from './types';
import { generatePlan, implementTask, detectProblems, fixProblem, reviewCode, parseReviewForProblems, generateDevOpsFiles, generateProjectName, architectProject, performQA, evaluateProject } from './services/geminiService';
import { MOCK_INITIAL_FILES, AI_MODELS, MODEL_LIMITS, DEFAULT_APP_SETTINGS } from './constants';
import { ALL_TEMPLATES, LEGACY_TEMPLATES } from './templates';
import { Billing } from './components/Billing';
import { fileToBase64, addNodeToTree, removeNodeFromTree, updateNodeInTree, moveNodeInTree, generateId, downloadProjectAsZip, duplicateNode, findFileByPath } from './utils';
import { StatusBar } from './components/StatusBar';
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
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User>({ name: 'Demo User', email: 'demo@user.com', bio: 'AI enthusiast & developer.' });
  
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
  const [generatedMarkup, setGeneratedMarkup] = useState<string>('');
  
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
  const [controlPanelWidth, setControlPanelWidth] = useState(window.innerWidth / 3);
  const isControlResizing = useRef(false);
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
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isControlResizing.current) {
        requestAnimationFrame(() => {
            const newWidth = Math.max(320, Math.min(e.clientX, window.innerWidth * 0.6));
            setControlPanelWidth(newWidth);
        });
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    isControlResizing.current = false;
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);
  
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
  
  useEffect(() => {
    const projectHtmlFile = findHtmlFile(projectFiles);
    if (projectHtmlFile) {
        if (!generatedMarkup || generatedMarkup !== projectHtmlFile.content) {
            setGeneratedMarkup(projectHtmlFile.content || '');
        }
    } else if (projectFiles.length === 0 && agentStatus !== 'idle' && agentStatus !== 'completed') {
        // Keep construction mode if files are empty during a build, unless complete
        // Intentionally empty logic here, handled by Preview overlay
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
                // Update preview IMMEDIATELY - don't wait for task completion
                console.log('✅ Updating preview with HTML content');
                setGeneratedMarkup(htmlFile.content);
                setViewMode('split'); // Auto-switch to split view for live preview
                
                // Force immediate state update for real-time feel
                setState(prev => ({
                    ...prev,
                    projectFiles: result.files
                }));
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

        state.tasks = state.tasks.map((t, idx) => idx === state.currentTaskIndex ? { ...t, status: 'completed' } : t);
        state.currentTaskIndex++;
        state.agentLogs.push(`✓ Task completed: ${task.description}`);
        
        // Update state with all changes
        setState(prev => ({
            ...prev,
            projectFiles: state.projectFiles,
            tasks: state.tasks,
            currentTaskIndex: state.currentTaskIndex,
            agentLogs: state.agentLogs,
            openFiles: newOpenFiles,
            activeFileId: newActiveFileId || prev.activeFileId
        }));
        
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

          setState(prev => ({ 
              ...prev, 
              projectFiles: state.projectFiles, 
              agentStatus: 'completed',
              statusMessage: `Mission Complete. Score: ${score}/100 (${quality})` 
          }));
          
          const indexHtml = findHtmlFile(state.projectFiles);
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
                onLogout={() => setIsAuthenticated(false)}
                onShare={() => setShareModalOpen(true)}
                isRepoInitialized={isRepoInitialized}
                onInitRepo={handleInitRepo}
                onCommit={handleCommit}
            />
            
            <div className="flex flex-grow overflow-hidden relative">
                <div 
                    className="flex-shrink-0 h-full transition-all duration-100 ease-out overflow-hidden" 
                    style={{ width: controlPanelWidth }}
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
                        onLoadLegacyProject={handleLoadLegacyProject}
                    />
                </div>
                
                <div 
                    onMouseDown={handleControlMouseDown}
                    className="w-1.5 h-full cursor-col-resize bg-gray-800 hover:bg-cyan-500/50 transition-colors z-10 flex items-center justify-center"
                >
                    <div className="h-8 w-0.5 bg-gray-600 rounded-full" />
                </div>
                
                <div className="flex-grow h-full min-w-0 bg-[#0d0d0f]">
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
                     />
                </div>
            </div>
            <StatusBar agentStatus={agentStatus} message={statusMessage} />
            </>
        )}
     </div>
  );
};

export default App;
