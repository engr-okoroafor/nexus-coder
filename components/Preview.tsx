
import React, { useState, useRef, useEffect, useCallback, useMemo, forwardRef, ForwardRefRenderFunction } from 'react';
import { DesktopIcon, TabletIcon, MobileIcon, ReloadIcon, FullScreenIcon } from './Icons';
import { Tooltip } from './Tooltip';
import { FileNode, AgentStatus } from '../types';
import { findFileByPath } from '../utils';

type DeviceMode = 'desktop' | 'tablet' | 'mobile';

const deviceWidths: Record<DeviceMode, string> = {
    desktop: '100%',
    tablet: '768px',
    mobile: '375px'
};

const DeviceButton: React.FC<{
    onClick: () => void;
    isActive: boolean;
    children: React.ReactNode;
    tooltipText: string;
}> = ({ onClick, isActive, children, tooltipText }) => (
    <Tooltip text={tooltipText} position="bottom" align="center">
        <button 
            onClick={onClick}
            className={`p-2 rounded-lg transition-colors ${isActive ? 'bg-cyan-500/30 text-cyan-300' : 'text-gray-400 hover:bg-white/10'}`}
        >
            {children}
        </button>
    </Tooltip>
);

const MobileFrame: React.FC<{children: React.ReactNode}> = ({ children }) => (
    <div className="w-[390px] h-[844px] bg-black border-4 border-gray-700 rounded-[2.5rem] shadow-2xl shadow-black/50 p-4 flex flex-col relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-xl flex justify-center items-center z-10">
             <div className="w-12 h-2 bg-gray-800 rounded-full"></div>
        </div>
        <div className="w-full h-full bg-white rounded-[2rem] overflow-hidden relative">
             {children}
        </div>
    </div>
);

interface PreviewProps {
    generatedMarkup: string;
    projectFiles: FileNode[];
    missionPrompt?: string;
    agentStatus?: AgentStatus;
}

const PreviewComponent: ForwardRefRenderFunction<HTMLIFrameElement, PreviewProps> = ({ generatedMarkup, projectFiles, missionPrompt, agentStatus }, ref) => {
    const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop');
    const [iframeKey, setIframeKey] = useState(0);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const previewContainerRef = useRef<HTMLDivElement>(null);

    // Active build states
    const isCoding = agentStatus === 'coding' || agentStatus === 'fixing' || agentStatus === 'refactoring' || agentStatus === 'debugging';
    const isPlanning = agentStatus === 'planning' || agentStatus === 'architecting';
    const isFinalizing = agentStatus === 'qa' || agentStatus === 'publishing' || agentStatus === 'evaluating';
    // Only show overlay during active work, NOT when idle or completed.
    const isBuilding = isCoding || isPlanning || isFinalizing;

    const isMobileProject = useMemo(() => {
        const isExpo = findFileByPath('/app.json', projectFiles) !== null;
        const isFlutter = findFileByPath('/pubspec.yaml', projectFiles) !== null;
        return isExpo || isFlutter;
    }, [projectFiles]);
    
    useEffect(() => {
        if(isMobileProject) {
            setDeviceMode('mobile');
            return;
        }

        if (missionPrompt) {
            const p = missionPrompt.toLowerCase();
            const explicitMobile = p.includes('mobile') || (p.includes('app') && (p.includes('ios') || p.includes('android') || p.includes('flutter')));
            const explicitWeb = p.includes('web');
            
            if (explicitMobile && !explicitWeb) {
                 setDeviceMode('mobile');
            } else {
                 setDeviceMode('desktop');
            }
        }
    }, [isMobileProject, missionPrompt]);

    const handleReload = () => {
        setIframeKey(prev => prev + 1);
    };

    const handleFullScreenToggle = () => {
        if (!document.fullscreenElement) {
            previewContainerRef.current?.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    };

    const onFullScreenChange = useCallback(() => {
        setIsFullScreen(!!document.fullscreenElement);
    }, []);

    useEffect(() => {
        document.addEventListener('fullscreenchange', onFullScreenChange);
        return () => document.removeEventListener('fullscreenchange', onFullScreenChange);
    }, [onFullScreenChange]);

    const IframeContent = generatedMarkup ? (
        <iframe
            ref={ref}
            key={iframeKey}
            srcDoc={generatedMarkup}
            title="Live Preview"
            sandbox="allow-scripts allow-forms allow-modals allow-popups allow-same-origin"
            className="w-full h-full border-none"
        />
    ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-[#0d0d0f] text-gray-400">
            {/* Minimal Placeholder only if no markup AND not actively building */}
            {!isBuilding && (
                <>
                    <div className="w-10 h-10 border-4 border-t-cyan-400 border-r-cyan-400 border-b-gray-800 border-l-gray-800 rounded-full animate-spin mb-4"></div>
                    <p className="font-orbitron text-sm text-cyan-300 animate-pulse">Initializing System...</p>
                    <p className="text-xs text-gray-600 mt-2">Waiting for index.html</p>
                </>
            )}
        </div>
    );

    return (
        <div className="bg-black/30 p-2 flex flex-col h-full w-full overflow-hidden" ref={previewContainerRef}>
            <div className="flex-shrink-0 flex items-center justify-between gap-2 p-2 bg-black/20 rounded-t-xl">
                <div className="flex items-center gap-2">
                    <Tooltip text="Reload preview" position="bottom" align="start">
                        <button onClick={handleReload} className="p-2 text-gray-400 hover:bg-white/10 rounded-lg transition-colors flex items-center gap-2">
                            <ReloadIcon className="w-5 h-5" />
                            {deviceMode === 'desktop' && <span className="text-xs font-bold font-orbitron text-gray-300">RELOAD</span>}
                        </button>
                    </Tooltip>
                     <Tooltip text={isFullScreen ? "Exit fullscreen" : "Enter fullscreen"} position="bottom" align="start">
                        <button onClick={handleFullScreenToggle} className="p-2 text-gray-400 hover:bg-white/10 rounded-lg transition-colors flex items-center gap-2">
                            <FullScreenIcon isFullScreen={isFullScreen} className="w-5 h-5" />
                            {deviceMode === 'desktop' && <span className="text-xs font-bold font-orbitron text-gray-300">{isFullScreen ? 'EXIT' : 'FULLSCREEN'}</span>}
                        </button>
                    </Tooltip>
                </div>
                 {!isMobileProject && (
                    <div className="flex items-center gap-2 pr-4">
                        <DeviceButton onClick={() => setDeviceMode('desktop')} isActive={deviceMode === 'desktop'} tooltipText="Desktop view"><DesktopIcon className="w-5 h-5" /></DeviceButton>
                        <DeviceButton onClick={() => setDeviceMode('tablet')} isActive={deviceMode === 'tablet'} tooltipText="Tablet view"><TabletIcon className="w-5 h-5" /></DeviceButton>
                        <DeviceButton onClick={() => setDeviceMode('mobile')} isActive={deviceMode === 'mobile'} tooltipText="Mobile view"><MobileIcon className="w-5 h-5" /></DeviceButton>
                    </div>
                )}
                {isMobileProject && <div className="w-24"></div>}
            </div>
            <div className="flex-grow flex items-center justify-center bg-black/20 rounded-b-xl overflow-auto relative">
                 {/* Adaptive Futuristic Overlay */}
                 {isBuilding && (
                    <div className={`absolute z-50 flex items-center justify-center pointer-events-none transition-all duration-500 ease-in-out ${
                        isCoding || isFinalizing
                        ? 'top-4 right-4 bottom-auto left-auto w-auto h-auto' // Small badge during coding/debugging
                        : 'inset-0 bg-black/40 backdrop-blur-[2px]' // Full screen during planning
                    }`}>
                        <div className={`bg-gray-900/90 backdrop-blur-md border border-cyan-500/50 rounded-2xl shadow-[0_0_30px_rgba(34,211,238,0.3)] flex flex-col items-center animate-pulse transition-all duration-500 ${
                            isCoding || isFinalizing ? 'p-3 scale-90' : 'p-6'
                        }`}>
                            <div className={`${isCoding || isFinalizing ? 'w-6 h-6 border-2' : 'w-12 h-12 border-4'} border-t-cyan-400 border-r-transparent border-b-cyan-400 border-l-transparent rounded-full animate-spin ${isCoding || isFinalizing ? 'mb-0' : 'mb-4'}`}></div>
                            {!(isCoding || isFinalizing) && (
                                <>
                                    <h3 className="font-orbitron text-cyan-300 text-lg tracking-widest">SYSTEM BUILDING...</h3>
                                    <p className="text-xs text-cyan-500/70 mt-1 font-fira-code">Compiling Neural Modules</p>
                                </>
                            )}
                        </div>
                    </div>
                 )}

                 {isMobileProject ? (
                    <MobileFrame>{IframeContent}</MobileFrame>
                ) : (
                    <div 
                        className="h-full bg-white transition-all duration-300 ease-in-out shadow-lg shadow-black/50 relative"
                        style={{ width: deviceWidths[deviceMode] }}
                    >
                        {IframeContent}
                    </div>
                )}
            </div>
        </div>
    );
};

export const Preview = forwardRef(PreviewComponent);
