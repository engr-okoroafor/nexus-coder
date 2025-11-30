import React, { useState } from 'react';

interface DiscussWithAgentModalProps {
    onClose: () => void;
    onSendMessage: (message: string) => void;
}

export const DiscussWithAgentModal: React.FC<DiscussWithAgentModalProps> = ({ onClose, onSendMessage }) => {
    const [message, setMessage] = useState('');

    const handleSend = () => {
        if (message.trim()) {
            onSendMessage(message);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gray-900/70 border border-purple-500/30 rounded-3xl p-8 max-w-lg w-full relative shadow-2xl shadow-purple-500/20">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                <h2 className="font-orbitron text-2xl mb-2 text-white">Discuss with Agent</h2>
                <p className="text-gray-400 mb-6">
                    Send a message to the agent to provide additional context or clarification. This will be added to its logs.
                </p>
                <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message here..."
                    className="w-full h-32 bg-black/30 p-3 rounded-lg border border-white/20 focus:ring-1 focus:ring-purple-500 focus:outline-none font-fira-code text-sm resize-none"
                />
                <button 
                    onClick={handleSend}
                    className="w-full mt-6 text-base font-orbitron font-bold py-3 px-6 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 disabled:opacity-50 transition-all duration-300"
                    disabled={!message.trim()}
                >
                    Send Message
                </button>
            </div>
        </div>
    );
};