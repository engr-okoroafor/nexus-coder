import React from 'react';
import type { Commit } from '../types';
import { CommitIcon } from './Icons';
import { formatFullTimestamp, formatRelativeTime } from '../utils';
import { Tooltip } from './Tooltip';

interface VersionHistoryModalProps {
    commits: Commit[];
    onClose: () => void;
    onRestore: (commitId: string) => void;
}

export const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({ commits, onClose, onRestore }) => {
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gray-900/70 border border-purple-500/30 rounded-3xl p-8 max-w-2xl w-full h-3/4 flex flex-col relative shadow-2xl shadow-purple-500/20">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                <h2 className="font-orbitron text-2xl mb-2 text-white">Version History</h2>
                <p className="text-gray-400 mb-6">Review the commit history for this project.</p>
                
                <div className="flex-grow overflow-y-auto custom-scrollbar -mr-4 pr-4">
                    {commits.length > 0 ? (
                        <ul className="space-y-3">
                            {commits.map(commit => (
                                <li key={commit.id} className="p-4 bg-black/30 rounded-xl border border-white/10 hover:border-purple-400/50 transition-colors">
                                    <div className="flex items-start gap-4">
                                        <CommitIcon className="w-5 h-5 text-purple-400 mt-1 flex-shrink-0" />
                                        <div className="flex-grow">
                                            <p className="text-white font-semibold">{commit.message}</p>
                                            <div className="flex items-center gap-2 text-xs text-gray-500 font-fira-code mt-1">
                                                <span>commit {commit.id}</span>
                                                <span className="text-gray-600">·</span>
                                                <Tooltip text={formatFullTimestamp(commit.timestamp)} position="bottom" align="start">
                                                  <span>{formatRelativeTime(commit.timestamp)}</span>
                                                </Tooltip>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => onRestore(commit.id)}
                                            className="text-xs px-3 py-1 rounded-full font-semibold bg-white/10 text-gray-300 hover:bg-white/20 transition-colors"
                                        >
                                            Restore
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="h-full flex items-center justify-center text-gray-500">
                            No commits found.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};