import React from 'react';

interface ConfirmationModalProps {
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ title, message, onConfirm, onCancel }) => {
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gray-900/70 border border-red-500/30 rounded-3xl p-8 max-w-md w-full relative shadow-2xl shadow-red-500/20 text-center">
                 <button onClick={onCancel} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                <h2 className="font-orbitron text-2xl mb-2 text-white">{title}</h2>
                <p className="text-gray-400 mb-6">{message}</p>
                <div className="flex gap-4 justify-center">
                    <button 
                        onClick={onCancel}
                        className="w-full text-sm py-2 px-4 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
                    >
                        Cancel
                    </button>
                     <button 
                        onClick={onConfirm}
                        className="w-full text-sm py-2 px-4 rounded-lg bg-red-600 text-white hover:bg-red-500 transition-colors"
                    >
                        Confirm Delete
                    </button>
                </div>
            </div>
        </div>
    );
};
