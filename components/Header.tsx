
import React, { useState, useEffect, useRef } from 'react';
import { GithubIcon, DownloadIcon, DeployIcon, ChevronIcon, SaveIcon, CopyIcon, HistoryIcon, ShareIcon, GitBranchIcon, CommitIcon } from './Icons';
import { Tooltip } from './Tooltip';
import { User } from '../types';

interface HeaderProps {
    user: User;
    isPwaInstallable: boolean;
    onInstallClick: () => void;
    onSaveAll: () => void;
    onCopyProject: () => void;
    onDownloadProject: () => void;
    onGitHubImport: () => void;
    onDeploy: () => void;
    onVersionHistory: () => void;
    onOpenProfile: () => void;
    onOpenSettings: () => void;
    onLogout: () => void;
    onShare: () => void;
    isRepoInitialized: boolean;
    onInitRepo: () => void;
    onCommit: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
    user, isPwaInstallable, onInstallClick, onSaveAll,
    onCopyProject, onDownloadProject, onGitHubImport, onDeploy, onVersionHistory,
    onOpenProfile, onOpenSettings, onLogout, onShare, isRepoInitialized, onInitRepo, onCommit
}) => {
  const [isMenuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="px-6 py-3 bg-black/30 backdrop-blur-sm border-b border-cyan-500/20 flex items-center justify-between flex-shrink-0 h-[72px] relative z-20">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-gradient-to-tr from-cyan-400 to-purple-500 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(0,255,255,0.5)]">
            <div className="w-4 h-4 bg-white rounded-full animate-pulse"></div>
        </div>
        <h1 className="text-2xl font-orbitron font-bold text-white tracking-widest">
          NEXUS <span className="text-cyan-400">CODER</span>
        </h1>
      </div>
      <div className="flex items-center gap-4">
        {isPwaInstallable && (
          <Tooltip text="Install as a Progressive Web App" position="bottom" align="center">
            <button onClick={onInstallClick} className="flex items-center gap-2 text-sm px-4 py-2 rounded-full font-semibold text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 transition-colors duration-300">
              <DownloadIcon className="w-4 h-4" />
              Install Nexus Coder
            </button>
          </Tooltip>
        )}

        <div className="h-6 w-px bg-white/10 mx-1"></div>

        {!isRepoInitialized ? (
            <Tooltip text="Initialize Git Repository" position="bottom" align="center">
                <button onClick={onInitRepo} className="text-gray-400 hover:text-white transition-colors">
                    <GitBranchIcon className="w-6 h-6" />
                </button>
            </Tooltip>
        ) : (
            <Tooltip text="Commit Changes" position="bottom" align="center">
                <button onClick={onCommit} className="text-gray-400 hover:text-white transition-colors">
                    <CommitIcon className="w-6 h-6" />
                </button>
            </Tooltip>
        )}

        <div className="h-6 w-px bg-white/10 mx-1"></div>

        <Tooltip text="Save All Changes (Ctrl+S)" position="bottom" align="center">
            <button onClick={onSaveAll} className="text-gray-400 hover:text-white transition-colors">
                <SaveIcon className="w-6 h-6" />
            </button>
        </Tooltip>
        <Tooltip text="Copy Project" position="bottom" align="center">
            <button onClick={onCopyProject} className="text-gray-400 hover:text-white transition-colors">
                <CopyIcon className="w-6 h-6" />
            </button>
        </Tooltip>
        <Tooltip text="Version History" position="bottom" align="center">
            <button onClick={onVersionHistory} className="text-gray-400 hover:text-white transition-colors">
                <HistoryIcon className="w-6 h-6" />
            </button>
        </Tooltip>
        <Tooltip text="Download Project as ZIP" position="bottom" align="center">
            <button onClick={onDownloadProject} className="text-gray-400 hover:text-white transition-colors">
                <DownloadIcon className="w-6 h-6" />
            </button>
        </Tooltip>
        <Tooltip text="Share Project" position="bottom" align="center">
            <button onClick={onShare} className="text-gray-400 hover:text-white transition-colors">
                <ShareIcon className="w-6 h-6" />
            </button>
        </Tooltip>
        
        <Tooltip text="Import from GitHub" position="bottom" align="center">
          <button onClick={onGitHubImport} className="text-gray-400 hover:text-white transition-colors">
            <GithubIcon className="w-6 h-6" />
          </button>
        </Tooltip>
        
        <Tooltip text="Deploy Project" position="bottom" align="center">
          <button
            onClick={onDeploy}
            className="group relative flex items-center gap-2 text-sm px-4 py-2 rounded-full font-semibold text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 transition-colors duration-300 overflow-hidden"
          >
            <DeployIcon className="w-4 h-4" />
            Deploy
            <div className="absolute top-0 left-0 h-full w-0 bg-purple-400/30 transition-all duration-300 group-hover:w-full"></div>
          </button>
        </Tooltip>
        
        <div className="relative" ref={menuRef}>
          <Tooltip text="User Account & Settings" position="bottom" align="end">
              <button onClick={() => setMenuOpen(!isMenuOpen)} className="flex items-center gap-2 text-gray-300 hover:bg-white/10 p-1 pr-2 rounded-full transition-colors">
                  <div className="w-8 h-8 bg-gradient-to-br from-gray-700 to-gray-800 rounded-full border border-white/20 flex items-center justify-center overflow-hidden">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt="User Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-bold text-sm">{user.name.charAt(0).toUpperCase()}</span>
                      )}
                  </div>
                  <span className="text-sm font-semibold hidden md:block">{user.name}</span>
                  <ChevronIcon direction="down" isOpen={isMenuOpen} className="w-4 h-4 text-gray-500" />
              </button>
          </Tooltip>

          {isMenuOpen && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-gray-800/80 backdrop-blur-md border border-white/20 rounded-lg shadow-2xl py-2 z-50">
                <a href="#" onClick={(e) => { e.preventDefault(); onOpenProfile(); setMenuOpen(false); }} className="block px-4 py-2 text-sm text-gray-200 hover:bg-white/10">Profile</a>
                <a href="#" onClick={(e) => { e.preventDefault(); onOpenSettings(); setMenuOpen(false); }} className="block px-4 py-2 text-sm text-gray-200 hover:bg-white/10">Settings</a>
                <div className="h-px bg-white/10 my-1" />
                <a href="#" onClick={(e) => { e.preventDefault(); onLogout(); setMenuOpen(false); }} className="block px-4 py-2 text-sm text-red-400 hover:bg-red-500/20">Log Out</a>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
