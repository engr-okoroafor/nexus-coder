import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { ChevronIcon } from './Icons';
import { Tooltip } from './Tooltip';

interface TerminalProps {
    logs: string[];
    isCollapsed: boolean;
    onToggleCollapse: () => void;
    sidebarWidth?: number;
    isSidebarCollapsed?: boolean;
}

type TerminalTab = 'logs' | 'terminal';

const LOG_LINE_HEIGHT = 20; // text-xs + leading-relaxed
const TERMINAL_LINE_HEIGHT = 23; // text-sm + leading-relaxed
const OVERSCAN_LINES = 15;

const VirtualizedList: React.FC<{
    lines: string[];
    lineHeight: number;
    className: string;
    renderLine: (line: string, index: number) => React.ReactNode;
}> = ({ lines, lineHeight, className, renderLine }) => {
    const [scrollTop, setScrollTop] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const totalHeight = lines.length * lineHeight;

    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTop = totalHeight;
        }
    }, [lines, totalHeight]);

    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop: currentScrollTop } = e.currentTarget;
        requestAnimationFrame(() => {
            setScrollTop(currentScrollTop);
        });
    }, []);

    const { virtualItems, startIndex } = useMemo(() => {
        const containerHeight = containerRef.current?.clientHeight || 0;
        const startIdx = Math.max(0, Math.floor(scrollTop / lineHeight) - OVERSCAN_LINES);
        const endIdx = Math.min(lines.length, startIdx + Math.ceil(containerHeight / lineHeight) + (2 * OVERSCAN_LINES));

        const items = [];
        for (let i = startIdx; i < endIdx; i++) {
            items.push({ index: i, content: lines[i] });
        }
        return { virtualItems: items, startIndex: startIdx };
    }, [lines, scrollTop, lineHeight]);

    return (
        <div ref={containerRef} onScroll={handleScroll} className={className}>
            <div style={{ height: `${totalHeight}px`, position: 'relative' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, transform: `translateY(${startIndex * lineHeight}px)` }}>
                    {virtualItems.map(item => (
                        <div key={item.index}>
                            {renderLine(item.content, item.index)}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};


export const Terminal: React.FC<TerminalProps> = ({ logs, isCollapsed, onToggleCollapse, sidebarWidth = 256, isSidebarCollapsed = false }) => {
    const [activeTab, setActiveTab] = useState<TerminalTab>('logs');
    const [lines, setLines] = useState<string[]>([
        'Nexus Coder Terminal v1.0.0',
        'Type `help` for available commands.',
        '',
    ]);
    const [command, setCommand] = useState('');
    const [commandHistory, setCommandHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleCommandSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && command.trim()) {
            e.preventDefault();
            const cmd = command.trim();
            const newLines: string[] = [...lines, `$ ${cmd}`];
            
            // Add to history
            setCommandHistory(prev => [...prev, cmd]);
            setHistoryIndex(-1);
            
            switch(cmd.toLowerCase()) {
                case 'help':
                    newLines.push('Available commands:');
                    newLines.push('  help       - Show this help message');
                    newLines.push('  clear      - Clear terminal output');
                    newLines.push('  logs       - Switch to Agent Logs tab');
                    newLines.push('  echo <msg> - Print a message');
                    newLines.push('  date       - Show current date and time');
                    newLines.push('  pwd        - Print working directory');
                    newLines.push('  ls         - List project files');
                    break;
                case 'clear':
                    setLines([]);
                    setCommand('');
                    return;
                case 'logs':
                    setActiveTab('logs');
                    newLines.push('Switched to Agent Logs');
                    break;
                case 'date':
                    newLines.push(new Date().toString());
                    break;
                case 'pwd':
                    newLines.push('/workspace/nexus-coder');
                    break;
                case 'ls':
                    newLines.push('index.html  App.tsx  components/  services/  utils.ts');
                    break;
                default:
                    if (cmd.startsWith('echo ')) {
                        newLines.push(cmd.substring(5));
                    } else {
                        newLines.push(`bash: ${cmd}: command not found`);
                        newLines.push('Type `help` for available commands');
                    }
            }

            setLines(newLines);
            setCommand('');
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (commandHistory.length > 0) {
                const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
                setHistoryIndex(newIndex);
                setCommand(commandHistory[newIndex]);
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (historyIndex !== -1) {
                const newIndex = historyIndex + 1;
                if (newIndex >= commandHistory.length) {
                    setHistoryIndex(-1);
                    setCommand('');
                } else {
                    setHistoryIndex(newIndex);
                    setCommand(commandHistory[newIndex]);
                }
            }
        } else if (e.key === 'Tab') {
            e.preventDefault();
            // Basic autocomplete
            const availableCommands = ['help', 'clear', 'logs', 'echo', 'date', 'pwd', 'ls'];
            const matches = availableCommands.filter(c => c.startsWith(command.toLowerCase()));
            if (matches.length === 1) {
                setCommand(matches[0]);
            }
        }
    }
    
    const TabButton: React.FC<{tab: TerminalTab; children: React.ReactNode}> = ({ tab, children }) => (
        <button 
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs font-fira-code border-b-2 -mb-px ${activeTab === tab ? 'text-purple-300 border-purple-400' : 'text-gray-500 border-transparent hover:text-purple-300'}`}
        >
            {children}
        </button>
    );

    return (
        <div className="h-full w-full flex flex-col bg-black/40">
            <div className="flex-shrink-0 px-3 pr-4 border-b border-purple-500/20 flex items-center justify-between h-10 bg-black/60 min-w-0">
                <div className="flex items-center min-w-0 flex-shrink">
                    <TabButton tab="logs">AGENT LOGS</TabButton>
                    <TabButton tab="terminal">TERMINAL</TabButton>
                </div>
                <div className="flex-shrink-0 ml-2">
                    <Tooltip text={isCollapsed ? "Expand Terminal" : "Collapse Terminal"} position="top" align="center">
                        <button 
                            onClick={onToggleCollapse} 
                            className="p-1.5 text-purple-400 hover:text-purple-300 rounded-md bg-purple-500/20 hover:bg-purple-500/30 transition-all border border-purple-500/40 shadow-[0_0_8px_rgba(168,85,247,0.4)]"
                            aria-label={isCollapsed ? "Expand Terminal" : "Collapse Terminal"}
                        >
                            <ChevronIcon direction={isCollapsed ? 'up' : 'down'} className="w-4 h-4" />
                        </button>
                    </Tooltip>
                </div>
            </div>
            
            {!isCollapsed && (
              <>
                {activeTab === 'logs' && (
                     <VirtualizedList
                        lines={logs}
                        lineHeight={LOG_LINE_HEIGHT}
                        className="flex-grow p-4 font-fira-code text-xs text-gray-400 overflow-y-auto custom-scrollbar min-h-0 relative"
                        renderLine={(line, index) => (
                            <p key={index} className="leading-relaxed whitespace-pre-wrap">{line}</p>
                        )}
                    />
                )}

                {activeTab === 'terminal' && (
                    <div className="h-full flex flex-col min-h-0">
                        <VirtualizedList
                            lines={lines}
                            lineHeight={TERMINAL_LINE_HEIGHT}
                            className="flex-grow p-4 font-fira-code text-sm text-gray-300 overflow-y-auto custom-scrollbar relative"
                            renderLine={(line, index) => (
                                <p key={index} className="leading-relaxed">
                                    {line.startsWith('>') && <span className="text-cyan-400">nexus-coder </span>}
                                    {line}
                                </p>
                            )}
                        />
                        <div className="flex-shrink-0 p-2 border-t border-purple-500/20 flex items-center gap-2">
                            <span className="text-cyan-400 font-fira-code text-sm">nexus &gt;</span>
                            <input 
                                type="text"
                                value={command}
                                onChange={(e) => setCommand(e.target.value)}
                                onKeyDown={handleCommandSubmit}
                                className="flex-grow bg-transparent font-fira-code text-sm text-white focus:outline-none"
                                placeholder="Type a command..."
                            />
                        </div>
                    </div>
                )}
              </>
            )}
        </div>
    )
}