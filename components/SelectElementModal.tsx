import React from 'react';

export const SelectElementModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gray-900/70 border border-purple-500/30 rounded-3xl p-8 max-w-md w-full relative shadow-2xl shadow-purple-500/20 text-center">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                <h2 className="font-orbitron text-2xl mb-2 text-white">Feature Coming Soon!</h2>
                <p className="text-gray-400 mb-6">
                    The 'Select Element' tool will allow you to click on parts of the live preview to provide specific visual context to the agent.
                </p>
                <button 
                    onClick={onClose}
                    className="text-sm px-5 py-2 rounded-full font-semibold text-black bg-white hover:bg-gray-200 transition-colors duration-300"
                >
                    Got it
                </button>
            </div>
        </div>
    );
};