
import React, { useState, useEffect, useRef } from 'react';
import { CodeEditor } from './CodeEditor';
import { Preview } from './Preview';
import { FileNode, ViewMode, AgentStatus, SearchResult } from '../types';
import { SplitIcon, CodeIcon, EyeIcon, CopyIcon, ChevronIcon, SearchIcon, CloseIcon, UndoIcon, RedoIcon } from './Icons';
import { Tooltip } from './Tooltip';
import { FileTree } from './FileTree';
import { GlobalSearch } from './GlobalSearch';

interface CodeViewProps {
  files: FileNode[];
  openFiles: FileNode[];
  activeFile: FileNode | null;
  selectedNodeIds: string[];
  clipboardNodeId: string | null;
  onNodeClick: (node: FileNode, event: React.MouseEvent) => void;
  onFileContentChange: (fileId: string, newContent: string) => void;
  onFileContentUpdate: (fileId: string, newContent: string) => void;
  onCloseFile: (file: FileNode) => void;
  onActivateFile: (file: FileNode) => void;
  agentStatus: AgentStatus;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  generatedMarkup: string;
  agentLogs: string[];
  review: string;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: SearchResult[];
  onSearchResultClick: (result: SearchResult) => void;
  fileFilter: string;
  onCreateNode: (name: string, type: 'file' | 'folder', parentId: string | null) => void;
  onDeleteNode: (nodeId: string) => void;
  onRenameNode: (nodeId: string, newName: string) => void;
  onMoveNode: (draggedId: string, targetId: string, position: 'before' | 'after' | 'inside') => void;
  onSetEditingNode: (nodeId: string) => void;
  onCopyPath: (path: string) => void;
  onCutNode: (node: FileNode) => void;
  onCopyNode: (node: FileNode) => void;
  onPasteNode: (parentId: string | null) => void;
  canPaste: boolean;
  onUndo: () => void;
  onRedo: () => void;
  missionPrompt: string;
  terminalHeight?: number;
  isTerminalCollapsed?: boolean;
  controlPanelWidth?: number;
}

const ViewModeButton: React.FC<{ 
    mode: ViewMode; 
    currentMode: ViewMode; 
    onClick: () => void; 
    icon: React.ReactNode; 
    label: string 
}> = ({ mode, currentMode, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`p-2 rounded-lg flex items-center gap-2 text-xs font-bold transition-all duration-200 ${
      currentMode === mode 
        ? 'bg-gray-800 text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.2)]' 
        : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'
    }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

// Helper to get preview window safely
const getSafePreviewWindow = (): Window | null => {
    const iframe = document.querySelector('iframe');
    return iframe?.contentWindow || null;
};

export const CodeView: React.FC<CodeViewProps> = ({
  files, openFiles, activeFile, selectedNodeIds, clipboardNodeId, onNodeClick, onFileContentChange, onFileContentUpdate, onCloseFile, onActivateFile,
  agentStatus, viewMode, setViewMode, generatedMarkup, agentLogs, review,
  searchQuery, setSearchQuery, searchResults, onSearchResultClick, fileFilter,
  onCreateNode, onDeleteNode, onRenameNode, onMoveNode, onSetEditingNode, onCopyPath, onCutNode, onCopyNode, onPasteNode, canPaste,
  onUndo, onRedo, missionPrompt, terminalHeight = 200, isTerminalCollapsed = false
}) => {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    try {
      const saved = localStorage.getItem('nexus-sidebar-width');
      return saved ? parseInt(saved) : 256;
    } catch {
      return 256;
    }
  });
  const [splitPosition, setSplitPosition] = useState(() => {
    try {
      const saved = localStorage.getItem('nexus-split-position');
      return saved ? parseFloat(saved) : 50;
    } catch {
      return 50;
    }
  });
  
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLIFrameElement>(null);
  const isSidebarResizing = useRef(false);
  const isSplitResizing = useRef(false);
  const [isResizing, setIsResizing] = useState(false);
  
  const isSyncingScroll = useRef(false);
  const syncTimeout = useRef<number | undefined>(undefined);
  let previewWindow: Window | null = null;

  useEffect(() => {
    const editorEl = editorRef.current;
    const previewIframe = previewRef.current;

    if (!editorEl || !previewIframe) return;

    const handleEditorScroll = () => {
        if (isSyncingScroll.current) return;
        isSyncingScroll.current = true;
        
        const win = getSafePreviewWindow();
        if (win) {
            try {
                const scrollPercent = editorEl.scrollTop / (editorEl.scrollHeight - editorEl.clientHeight);
                const previewHeight = win.document.body.scrollHeight - win.innerHeight;
                
                if (isFinite(scrollPercent) && isFinite(previewHeight)) {
                    win.scrollTo(0, previewHeight * scrollPercent);
                }
            } catch (e) {
                // Ignore cross-origin errors during initial load
            }
        }

        if (syncTimeout.current !== undefined) clearTimeout(syncTimeout.current);
        syncTimeout.current = window.setTimeout(() => { isSyncingScroll.current = false; }, 100);
    };

    const handlePreviewScroll = () => {
        if (isSyncingScroll.current) return;
        
        const win = getSafePreviewWindow();
        if (!win) return;

        isSyncingScroll.current = true;
        
        try {
            const scrollPercent = win.scrollY / ((win.document.body.scrollHeight || 0) - win.innerHeight);
            const editorScrollMax = editorEl.scrollHeight - editorEl.clientHeight;

            if (isFinite(scrollPercent) && isFinite(editorScrollMax)) {
                editorEl.scrollTop = editorScrollMax * scrollPercent;
            }
        } catch (e) {
            // Ignore errors
        }

        if (syncTimeout.current !== undefined) clearTimeout(syncTimeout.current);
        syncTimeout.current = window.setTimeout(() => { isSyncingScroll.current = false; }, 100);
    };

    // Use optional parameter to satisfy both manual call and event listener requirements
    // event listener will pass an argument, manual call will pass none.
    // By defining it as (_?: any) => void, we ignore arguments in both cases.
    const onPreviewLoad = (_?: any) => {
        const win = getSafePreviewWindow();
        if (win) {
            try {
                previewWindow = win;
                win.removeEventListener('scroll', handlePreviewScroll);
                win.addEventListener('scroll', handlePreviewScroll);
            } catch (e) {
                console.warn('Cannot bind scroll sync to preview iframe (likely cross-origin).');
            }
        }
    };

    editorEl.addEventListener('scroll', handleEditorScroll);
    previewIframe.addEventListener('load', onPreviewLoad);
    
    // Initial check - calling without args is valid given _?
    onPreviewLoad();

    return () => {
        editorEl.removeEventListener('scroll', handleEditorScroll);
        previewIframe.removeEventListener('load', onPreviewLoad);
        if (previewWindow) {
            try {
                previewWindow.removeEventListener('scroll', handlePreviewScroll);
            } catch (e) { /* ignore */ }
        }
        if (syncTimeout.current !== undefined) clearTimeout(syncTimeout.current);
    };
  }, [activeFile, generatedMarkup]); // Re-bind when file or content changes

  // Keyboard Shortcuts
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
              e.preventDefault();
              if (e.shiftKey) {
                  onRedo();
              } else {
                  onUndo();
              }
          }
      };
      
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onUndo, onRedo]);

  // Resizer handlers with touch support
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isSidebarResizing.current) {
        e.preventDefault();
        requestAnimationFrame(() => {
          const newWidth = Math.max(200, Math.min(e.clientX, 500));
          setSidebarWidth(newWidth);
        });
      }
      
      if (isSplitResizing.current && viewMode === 'split') {
        e.preventDefault();
        requestAnimationFrame(() => {
          const container = document.getElementById('split-container');
          if (container) {
            const rect = container.getBoundingClientRect();
            const mouseXInContainer = e.clientX - rect.left;
            const newPosition = Math.max(20, Math.min((mouseXInContainer / rect.width) * 100, 80));
            setSplitPosition(newPosition);
          }
        });
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isSidebarResizing.current) {
        e.preventDefault();
        const touch = e.touches[0];
        if (touch) {
          requestAnimationFrame(() => {
            const newWidth = Math.max(200, Math.min(touch.clientX, 500));
            setSidebarWidth(newWidth);
          });
        }
      }
      
      if (isSplitResizing.current && viewMode === 'split') {
        e.preventDefault();
        const touch = e.touches[0];
        if (touch) {
          requestAnimationFrame(() => {
            const container = document.getElementById('split-container');
            if (container) {
              const rect = container.getBoundingClientRect();
              const touchXInContainer = touch.clientX - rect.left;
              const newPosition = Math.max(20, Math.min((touchXInContainer / rect.width) * 100, 80));
              setSplitPosition(newPosition);
            }
          });
        }
      }
    };

    const handleEnd = () => {
      if (isSidebarResizing.current || isSplitResizing.current) {
        // Save to localStorage on end
        if (isSidebarResizing.current) {
          try {
            localStorage.setItem('nexus-sidebar-width', sidebarWidth.toString());
          } catch (error) {
            console.warn('Failed to save sidebar width:', error);
          }
        }
        if (isSplitResizing.current) {
          try {
            localStorage.setItem('nexus-split-position', splitPosition.toString());
          } catch (error) {
            console.warn('Failed to save split position:', error);
          }
        }
        
        isSidebarResizing.current = false;
        isSplitResizing.current = false;
        setIsResizing(false);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleEnd);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [viewMode, sidebarWidth, splitPosition]);

  return (
    <div className="flex h-full w-full bg-[#0d0d0f] text-gray-300 relative overflow-hidden">
      {/* Sidebar - Extends down to StatusBar with rounded corners */}
      <div 
        className={`${isSidebarCollapsed ? 'w-0' : ''} flex-shrink-0 transition-all duration-300 flex flex-row absolute left-0 top-0 z-20`}
        style={{ 
          width: isSidebarCollapsed ? 0 : `${sidebarWidth}px`,
          height: isTerminalCollapsed ? 'calc(100% + 24px)' : `calc(100% + ${terminalHeight}px + 24px)`
        }}
      >
        <div className="flex-grow flex flex-col bg-[#0a0a0c] border-r border-white/10 min-w-0 rounded-3xl overflow-hidden">
          <div className="flex items-center justify-between p-3 border-b border-white/10 flex-shrink-0">
              <span className="text-xs font-bold text-gray-400 font-orbitron tracking-wider">EXPLORER</span>
              <div className="flex items-center gap-1">
                  <Tooltip text="Search Files" position="bottom" align="end">
                      <button onClick={() => setIsSearchOpen(!isSearchOpen)} className={`p-1 hover:bg-white/10 rounded ${isSearchOpen ? 'text-cyan-400' : 'text-gray-500'}`}>
                          <SearchIcon className="w-4 h-4" />
                      </button>
                  </Tooltip>
                  <button onClick={() => setSidebarCollapsed(true)} className="p-1 hover:bg-white/10 rounded text-gray-500">
                      <CloseIcon className="w-4 h-4" />
                  </button>
              </div>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
              {isSearchOpen ? (
                  <div className="p-2 h-full flex flex-col">
                      <div className="relative mb-2">
                          <input 
                              type="text" 
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              placeholder="Search..." 
                              autoFocus
                              className="w-full bg-black/30 border border-white/20 rounded-md py-1.5 pl-8 pr-2 text-sm focus:outline-none focus:border-cyan-500/50 transition-colors"
                          />
                          <SearchIcon className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      </div>
                      <GlobalSearch results={searchResults} onResultClick={onSearchResultClick} />
                  </div>
              ) : (
                  <FileTree 
                      files={files} 
                      selectedNodeIds={selectedNodeIds} 
                      onNodeClick={onNodeClick}
                      onCreateNode={onCreateNode}
                      onDeleteNode={onDeleteNode}
                      onRenameNode={onRenameNode}
                      onSetEditingNode={onSetEditingNode}
                      onMoveNode={onMoveNode}
                      onCopyPath={onCopyPath}
                      onCutNode={onCutNode}
                      onCopyNode={onCopyNode}
                      onPasteNode={onPasteNode}
                      canPaste={canPaste}
                  />
              )}
          </div>
        </div>

        {/* Sidebar Resizer - On the right side of Explorer */}
        <div 
          onMouseDown={(e) => {
            e.preventDefault();
            isSidebarResizing.current = true;
            setIsResizing(true);
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
          }}
          onTouchStart={(e) => {
            e.preventDefault();
            isSidebarResizing.current = true;
            setIsResizing(true);
            document.body.style.userSelect = 'none';
          }}
          className={`group w-4 md:w-3 lg:w-2 h-full cursor-col-resize transition-all duration-150 z-10 flex items-center justify-center relative flex-shrink-0 touch-none ${
            isResizing && isSidebarResizing.current 
              ? 'bg-cyan-400/80 shadow-[0_0_20px_rgba(34,211,238,0.8)]' 
              : 'bg-cyan-500/30 hover:bg-cyan-500/50 md:hover:w-3.5 lg:hover:w-2.5 active:bg-cyan-400'
          }`}
        >
          <div className={`h-20 w-1 rounded-full transition-all duration-200 ${
            isSidebarResizing.current 
              ? 'bg-cyan-300 shadow-[0_0_15px_rgba(34,211,238,1)] scale-110' 
              : 'bg-cyan-400 group-hover:bg-cyan-300 group-active:bg-cyan-200 group-hover:shadow-[0_0_10px_rgba(34,211,238,0.8)]'
          }`} />
        </div>
      </div>

      {/* Main Content - Offset by sidebar width */}
      <div className="flex-grow flex flex-col min-w-0 bg-[#0d0d0f] relative" style={{ marginLeft: isSidebarCollapsed ? 0 : `${sidebarWidth + 8}px`, transition: 'margin-left 300ms' }}>
        {/* Toggle Sidebar Button (Visible when collapsed) */}
        {isSidebarCollapsed && (
            <button 
                onClick={() => setSidebarCollapsed(false)}
                className="absolute left-2 top-2 z-20 p-2 bg-gray-800/80 hover:bg-gray-700 backdrop-blur rounded-md border border-white/10 text-gray-400 hover:text-white transition-all shadow-lg"
            >
                <ChevronIcon direction="right" className="w-4 h-4" />
            </button>
        )}

        {/* Editor Tabs with Horizontal Scrolling - Hidden in preview-only mode */}
        {viewMode !== 'preview' && (
        <div className="relative flex h-9 bg-[#0a0a0c] border-b border-white/10 select-none group">
            {openFiles.length > 3 && (
                <>
                    <button 
                        onClick={() => {
                            const container = document.getElementById('tabs-container');
                            if (container) container.scrollBy({ left: -200, behavior: 'smooth' });
                        }}
                        className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 md:w-8 md:h-8 lg:w-6 lg:h-6 rounded-full bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-400 hover:bg-cyan-500/30 hover:shadow-[0_0_15px_rgba(6,182,212,0.5)] opacity-0 group-hover:opacity-100 transition-all touch-manipulation"
                    >
                        <ChevronIcon direction="left" className="w-3 h-3" />
                    </button>
                    <button 
                        onClick={() => {
                            const container = document.getElementById('tabs-container');
                            if (container) container.scrollBy({ left: 200, behavior: 'smooth' });
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 md:w-8 md:h-8 lg:w-6 lg:h-6 rounded-full bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-400 hover:bg-cyan-500/30 hover:shadow-[0_0_15px_rgba(6,182,212,0.5)] opacity-0 group-hover:opacity-100 transition-all touch-manipulation"
                    >
                        <ChevronIcon direction="right" className="w-3 h-3" />
                    </button>
                </>
            )}
            <div 
                id="tabs-container"
                className="flex overflow-x-auto hide-scrollbar w-full"
                onWheel={(e) => {
                    e.preventDefault();
                    const container = e.currentTarget;
                    container.scrollLeft += e.deltaY;
                }}
            >
                {openFiles.length > 0 ? openFiles.map((file: any, index: any) => (
                    <div 
                        key={`${file.id}-${index}`}
                        onClick={() => onActivateFile(file)}
                        className={`
                            group/tab flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer border-r border-white/5 transition-colors relative flex-shrink-0
                            ${activeFile?.id === file.id ? 'bg-[#0d0d0f] text-cyan-400 font-semibold' : 'bg-[#0a0a0c] text-gray-500 hover:bg-[#15151a] hover:text-gray-300'}
                        `}
                        style={{ minWidth: openFiles.length === 1 ? '200px' : '150px', maxWidth: '240px' }}
                    >
                        {activeFile?.id === file.id && <div className="absolute top-0 left-0 right-0 h-0.5 bg-cyan-500 shadow-[0_0_8px_#22d3ee]"></div>}
                        <span className="truncate flex-grow font-semibold text-[12px]">{file.name}</span>
                        <button 
                            onClick={(e: any) => { e.stopPropagation(); onCloseFile(file); }}
                            className={`p-0.5 rounded-sm ${openFiles.length === 1 ? 'opacity-100' : 'opacity-0 group-hover/tab:opacity-100'} hover:bg-white/10 flex-shrink-0 ${activeFile?.id === file.id ? 'text-cyan-600 hover:text-cyan-400' : 'text-gray-600 hover:text-gray-400'}`}
                        >
                            <CloseIcon className="w-3 h-3" />
                        </button>
                    </div>
                )) : (
                    <div className="px-3 py-1.5 text-xs text-gray-500">No files open</div>
                )}
            </div>
        </div>
        )}

        {/* Toolbar */}
        <div className="h-10 border-b border-white/10 flex items-center justify-between px-3 bg-[#0d0d0f]">
             <div className="flex items-center gap-2">
                 {viewMode !== 'preview' && activeFile && (
                     <>
                        <span className="text-xs text-gray-500">{activeFile.path}</span>
                        <div className="h-3 w-px bg-white/10 mx-2" />
                        <Tooltip text="Undo (Ctrl+Z)" position="bottom">
                            <button onClick={onUndo} className="p-1.5 text-gray-500 hover:text-white hover:bg-white/10 rounded transition-colors"><UndoIcon className="w-3.5 h-3.5" /></button>
                        </Tooltip>
                        <Tooltip text="Redo (Ctrl+Shift+Z)" position="bottom">
                            <button onClick={onRedo} className="p-1.5 text-gray-500 hover:text-white hover:bg-white/10 rounded transition-colors"><RedoIcon className="w-3.5 h-3.5" /></button>
                        </Tooltip>
                     </>
                 )}
             </div>
             
             <div className="flex items-center gap-1 bg-black/20 p-0.5 rounded-lg border border-white/5">
                <ViewModeButton 
                    mode="split" currentMode={viewMode} onClick={() => setViewMode('split')} 
                    icon={<SplitIcon className="w-3.5 h-3.5" />}
                    label="Split"
                />
                <ViewModeButton 
                    mode="code" currentMode={viewMode} onClick={() => setViewMode('code')} 
                    icon={<CodeIcon className="w-3.5 h-3.5" />}
                    label="Code"
                />
                <ViewModeButton 
                    mode="preview" currentMode={viewMode} onClick={() => setViewMode('preview')} 
                    icon={<EyeIcon className="w-3.5 h-3.5" />}
                    label="Preview"
                />
             </div>
        </div>

        {/* Workspace Content */}
        <div id="split-container" className="flex-grow flex relative overflow-hidden">
            {/* Editor Pane */}
            <div 
                className={`
                    flex-col h-full bg-[#0d0d0f] transition-all duration-300 relative
                    ${viewMode === 'code' ? 'w-full' : viewMode === 'split' ? 'border-r border-white/10' : 'w-0 hidden'}
                `}
                style={viewMode === 'split' ? { width: `${splitPosition}%` } : undefined}
            >
                <CodeEditor 
                    ref={editorRef}
                    file={activeFile} 
                    onContentChange={onFileContentChange}
                    onContentUpdate={onFileContentUpdate}
                />
            </div>

            {/* Split View Resizer */}
            {viewMode === 'split' && (
              <div 
                onMouseDown={(e) => {
                  e.preventDefault();
                  isSplitResizing.current = true;
                  setIsResizing(true);
                  document.body.style.cursor = 'col-resize';
                  document.body.style.userSelect = 'none';
                }}
                onTouchStart={(e) => {
                  e.preventDefault();
                  isSplitResizing.current = true;
                  setIsResizing(true);
                  document.body.style.userSelect = 'none';
                }}
                className={`group w-4 md:w-3 lg:w-2 h-full cursor-col-resize transition-all duration-150 z-10 flex items-center justify-center relative flex-shrink-0 touch-none ${
                  isResizing && isSplitResizing.current 
                    ? 'bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.8)]' 
                    : 'bg-gray-800/50 hover:bg-cyan-500/70 md:hover:w-3.5 lg:hover:w-2.5 active:bg-cyan-400'
                }`}
              >
                <div className={`h-16 w-1 rounded-full transition-all duration-200 ${
                  isResizing && isSplitResizing.current 
                    ? 'bg-cyan-300 shadow-[0_0_15px_rgba(34,211,238,1)] scale-110' 
                    : 'bg-gray-600 group-hover:bg-cyan-400 group-active:bg-cyan-300 group-hover:shadow-[0_0_10px_rgba(34,211,238,0.8)]'
                }`} />
              </div>
            )}

            {/* Preview Pane */}
            <div 
                className={`
                    flex-col h-full bg-[#050505] transition-all duration-300 relative
                    ${viewMode === 'preview' ? 'w-full' : viewMode === 'split' ? '' : 'w-0 hidden'}
                `}
                style={viewMode === 'split' ? { width: `${100 - splitPosition}%` } : undefined}
            >
                <Preview 
                    ref={previewRef}
                    generatedMarkup={generatedMarkup} 
                    projectFiles={files}
                    missionPrompt={missionPrompt}
                    agentStatus={agentStatus}
                />
            </div>
        </div>
      </div>
    </div>
  );
};
