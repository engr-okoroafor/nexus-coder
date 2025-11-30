import React, { useState } from 'react';

interface NewItemModalProps {
    itemType: 'file' | 'folder';
    onConfirm: (name: string) => void;
    onCancel: () => void;
}

export const NewItemModal: React.FC<NewItemModalProps> = ({ itemType, onConfirm, onCancel }) => {
    const [name, setName] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onConfirm(name.trim());
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
            <form onSubmit={handleSubmit} className="bg-gray-900/70 border border-purple-500/30 rounded-3xl p-8 max-w-md w-full relative shadow-2xl shadow-purple-500/20">
                <button type="button" onClick={onCancel} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                <h2 className="font-orbitron text-2xl mb-2 text-white">Create New {itemType}</h2>
                <p className="text-gray-400 mb-6">Please enter a name for the new {itemType}.</p>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={itemType === 'file' ? 'new-file.js' : 'new-folder'}
                    autoFocus
                    className="w-full bg-black/30 p-2 rounded-lg border border-white/20 focus:ring-1 focus:ring-purple-500 focus:outline-none font-fira-code text-sm"
                />
                <div className="flex gap-4 justify-end mt-6">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="text-sm px-5 py-2 rounded-full font-semibold text-gray-300 bg-white/10 hover:bg-white/20 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={!name.trim()}
                        className="text-sm px-5 py-2 rounded-full font-semibold text-black bg-white hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Create
                    </button>
                </div>
            </form>
        </div>
    );
};
