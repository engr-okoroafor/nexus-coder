import React from 'react';
import { LightbulbIcon, LoadingIcon } from './Icons';

interface CodeSuggestionProps {
    suggestion: string | null | undefined;
    isLoading: boolean;
    onAccept: () => void;
    onDismiss: () => void;
}

export const CodeSuggestion: React.FC<CodeSuggestionProps> = ({ suggestion, isLoading, onAccept, onDismiss }) => {
    if (!suggestion && !isLoading) {
        return null;
    }

    return (
        <div className="mt-4 p-4 bg-purple-900/30 border border-purple-500/50 rounded-2xl relative">
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center mt-1">
                    {isLoading ? <LoadingIcon className="w-4 h-4 text-purple-300" /> : <LightbulbIcon className="w-4 h-4 text-purple-300" />}
                </div>
                <div className="flex-grow">
                    <h4 className="font-orbitron text-sm text-purple-200">
                        {isLoading ? 'Analyzing Code...' : 'AI Code Suggestion'}
                    </h4>
                    {suggestion && !isLoading && (
                        <>
                            <p className="text-sm text-gray-300 mt-1 font-fira-code">{suggestion}</p>
                            <div className="flex gap-2 mt-3">
                                <button onClick={onAccept} className="text-xs px-3 py-1 rounded-full font-semibold bg-green-500/20 text-green-300 hover:bg-green-500/30 transition-colors">
                                    Accept
                                </button>
                                <button onClick={onDismiss} className="text-xs px-3 py-1 rounded-full font-semibold bg-white/10 text-gray-300 hover:bg-white/20 transition-colors">
                                    Dismiss
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
