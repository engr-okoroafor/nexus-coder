import React from 'react';
import type { AgentStatus } from '../types';
import { LoadingIcon, SuccessIcon, ErrorIcon, IdleIcon } from './Icons';

interface StatusBarProps {
    agentStatus: AgentStatus;
    message: string;
}

const StatusIcon: React.FC<{ status: AgentStatus }> = ({ status }) => {
    switch (status) {
        case 'planning':
        case 'coding':
        case 'reviewing':
        case 'fixing':
            return <LoadingIcon className="h-5 w-5 text-cyan-400" />;
        case 'completed':
            return <SuccessIcon className="h-5 w-5 text-green-400" />;
        case 'error':
             return <ErrorIcon className="h-5 w-5 text-red-500" />;
        case 'idle':
        default:
            return <IdleIcon className="h-5 w-5 text-gray-500" />;
    }
}

export const StatusBar: React.FC<StatusBarProps> = ({ agentStatus, message }) => {
    return (
        <footer className="h-8 bg-black/50 backdrop-blur-sm border-t border-cyan-500/20 flex items-center justify-between px-4 text-sm text-gray-300 font-fira-code flex-shrink-0">
           <div className="flex items-center gap-3 min-w-0">
             <StatusIcon status={agentStatus} />
             <span className="capitalize flex-shrink-0">{agentStatus}:</span>
             <span className="text-gray-400 truncate">{message}</span>
           </div>
        </footer>
    );
};
