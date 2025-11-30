

export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  path: string;
  content?: string;
  children?: FileNode[];
  isEditing?: boolean;
  isCut?: boolean;
}

export type ViewMode = 'split' | 'code' | 'preview';

export type AgentStatus = 'idle' | 'planning' | 'architecting' | 'coding' | 'reviewing' | 'qa' | 'refactoring' | 'fixing' | 'debugging' | 'paused' | 'final-review' | 'publishing' | 'evaluating' | 'completed' | 'error';

export interface Task {
  description: string;
  status: 'pending' | 'in-progress' | 'completed';
}

export interface Problem {
  id: string;
  file: string;
  description: string;
}

export interface UploadedFile {
  name: string;
  type: string;
  content: string; // base64 encoded
}

export interface Commit {
  id: string;
  message: string;
  timestamp: string;
  fileTree: FileNode[];
}

export interface TokenUsage {
  used: number;
  limit: number;
  totalTokens?: number;
  costEstimate?: number;
}

export type SearchResult =
  | { type: 'file'; file: FileNode; lineNumber: number; content: string }
  | { type: 'log'; logIndex: number; content: string }
  | { type: 'commit'; commit: Commit; content: string };

export interface ModelLimits {
    rpm: number;
}

export interface IconProps {
    className?: string;
    isOpen?: boolean;
    isFullScreen?: boolean;
    direction?: 'right' | 'left' | 'up' | 'down';
}

export interface User {
  name: string;
  email: string;
  avatarUrl?: string;
  bio?: string;
}

export interface AppSettings {
  apiKeys: {
    gemini: string;
    claude: string;
    meta: string;
    grok: string;
    qwen: string;
    serper: string;
    serpApi: string;
    tavily: string;
    [key: string]: string;
  };
  enableNotifications: boolean;
  enableAiSuggestions: boolean;
}

export interface Mission {
    id: string;
    prompt: string;
    timestamp: number;
    model: string;
}

export interface AgentTrace {
    id: string;
    agent: string; // 'Planner', 'Architect', 'Coder', 'QA', etc.
    action: string; // 'Observation', 'Action', 'Handoff'
    message: string;
    timestamp: number;
    metadata?: any;
}

export interface EvaluationResult {
    score: number; // 0-100
    quality: 'Excellent' | 'Good' | 'Fair' | 'Poor';
    securityIssues: number;
    feedback: string;
}

export interface WorkflowState {
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
  traces: AgentTrace[]; // For detailed observability
  evaluation?: EvaluationResult; // For agent performance assessment
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