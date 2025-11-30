import React, { useState } from 'react';
import type { FileNode } from '../types';
import { NewFolderIcon, ReactIcon, VueIcon, NodeIcon, VercelIcon, PythonIcon } from './Icons';

interface ProjectTemplate {
    name: string;
    files: FileNode[];
    icon: React.ReactNode;
}

interface ProjectTemplateModalProps {
    templates: { name: string, files: FileNode[] }[];
    onSelect: (templateName: string) => void;
    onClose: () => void;
}

const getTemplateIcon = (name: string) => {
    const iconClass = "w-10 h-10 text-cyan-400 mb-3";
    if (name.includes('React Native')) return <ReactIcon className="w-10 h-10 mb-3" />;
    if (name.includes('React')) return <ReactIcon className="w-10 h-10 mb-3" />;
    if (name.includes('Vue')) return <VueIcon className="w-10 h-10 mb-3" />;
    if (name.includes('Node.js')) return <NodeIcon className="w-10 h-10 mb-3" />;
    if (name.includes('Next.js')) return <VercelIcon className="w-10 h-10 mb-3 text-white" />;
    if (name.includes('Python')) return <PythonIcon className="w-10 h-10 mb-3" />;
    return <NewFolderIcon className={iconClass} />;
};

export const ProjectTemplateModal: React.FC<ProjectTemplateModalProps> = ({ templates, onSelect, onClose }) => {
    const [selectedTemplate, setSelectedTemplate] = useState<{ name: string; files: FileNode[]; } | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleConfirm = () => {
        if (selectedTemplate) {
            setIsLoading(true);
            // Simulate a short delay for project setup
            setTimeout(() => {
                onSelect(selectedTemplate.name);
                setIsLoading(false);
            }, 500);
        }
    };

    if (isLoading) {
        return (
             <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-gray-900/70 border border-purple-500/30 rounded-3xl p-8 max-w-md w-full relative shadow-2xl shadow-purple-500/20 text-center">
                    <div className="w-8 h-8 border-4 border-t-cyan-400 border-r-cyan-400 border-b-gray-600 border-l-gray-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <h2 className="font-orbitron text-xl text-cyan-300">Creating Project...</h2>
                    <p className="text-gray-400 mt-2">Setting up the "{selectedTemplate?.name}" environment.</p>
                </div>
            </div>
        );
    }
    
    if (selectedTemplate) {
        return (
             <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-gray-900/70 border border-purple-500/30 rounded-3xl p-8 max-w-md w-full relative shadow-2xl shadow-purple-500/20 text-center">
                    <h2 className="font-orbitron text-2xl mb-2 text-white">Confirm Selection</h2>
                    <p className="text-gray-400 mb-6">
                        Starting a new project from the "{selectedTemplate.name}" template will replace all current files in your workspace. This action cannot be undone.
                    </p>
                    <div className="flex gap-4 justify-center">
                        <button 
                            onClick={() => setSelectedTemplate(null)}
                            className="w-full text-sm py-2 px-4 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
                        >
                            Back
                        </button>
                         <button 
                            onClick={handleConfirm}
                            className="w-full text-sm py-2 px-4 rounded-lg bg-cyan-600 text-white hover:bg-cyan-500 transition-colors"
                        >
                            Create Project
                        </button>
                    </div>
                </div>
            </div>
        );
    }
    

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gray-900/70 border border-purple-500/30 rounded-3xl p-8 max-w-2xl w-full relative shadow-2xl shadow-purple-500/20">
                 <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                <h2 className="font-orbitron text-2xl mb-2 text-white">New Project</h2>
                <p className="text-gray-400 mb-6">Select a production-grade template to start your project.</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {templates.map(template => (
                        <button 
                            key={template.name} 
                            onClick={() => setSelectedTemplate(template)}
                            className="p-6 bg-black/30 rounded-2xl border border-white/10 hover:border-cyan-400/50 hover:bg-cyan-900/30 transition-all text-center flex flex-col items-center justify-center"
                        >
                            {getTemplateIcon(template.name)}
                            <span className="font-semibold text-white">{template.name}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
