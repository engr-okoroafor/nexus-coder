import React, { useState } from 'react';
import { CopyIcon, ShareIcon } from './Icons';

interface ShareModalProps {
    onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ onClose }) => {
    const [copied, setCopied] = useState(false);
    const shareUrl = window.location.href;
    const shareText = "Check out this project I built with Nexus Coder, the autonomous AI agent!";

    const handleCopy = () => {
        navigator.clipboard.writeText(shareUrl).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gray-900/70 border border-purple-500/30 rounded-3xl p-8 max-w-md w-full relative shadow-2xl shadow-purple-500/20">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                <div className="text-center">
                    <ShareIcon className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
                    <h2 className="font-orbitron text-2xl mb-2 text-white">Share Project</h2>
                    <p className="text-gray-400 mb-6">Anyone with the link can view a copy of this project.</p>
                </div>
                <div className="flex items-center bg-black/30 p-2 rounded-lg border border-white/20">
                    <input 
                        type="text" 
                        readOnly 
                        value={shareUrl}
                        className="w-full bg-transparent focus:outline-none font-fira-code text-sm text-gray-300" 
                    />
                    <button 
                        onClick={handleCopy}
                        className={`text-sm px-4 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-2 ${copied ? 'bg-green-500/20 text-green-300' : 'bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30'}`}
                    >
                        <CopyIcon className="w-4 h-4" />
                        {copied ? 'Copied!' : 'Copy'}
                    </button>
                </div>
                <div className="mt-4 flex justify-center gap-4">
                    <a href={`mailto:?subject=Nexus Coder Project&body=${shareText}%0A%0A${shareUrl}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path></svg>
                    </a>
                    <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                       <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></svg>
                    </a>
                    <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38 1.11-2.5 2.48-2.5s2.48 1.12 2.48 2.5zM5 8.5H0v16h5v-16zM13 8.5h-5v16h5v-8.34c0-4.305 3.025-4.305 3.025 0V24.5h5V15.83c0-7.21-4.305-7.21-7.025-3.486z"></path></svg>
                    </a>
                </div>
            </div>
        </div>
    );
};