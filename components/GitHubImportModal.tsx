
import React, { useState } from 'react';
import { GithubIcon, SearchIcon, LoadingIcon, CopyIcon } from './Icons';
import { FileNode } from '../types';
import { generateId } from '../utils';

interface GitHubImportModalProps {
    onClose: () => void;
    onImport: (files: FileNode[], repoName: string) => void;
}

type ImportStep = 'input' | 'connect' | 'select_repo' | 'importing' | 'success' | 'error';

const mockRepos = [
    { id: 1, name: 'nexus-coder-ui', isPrivate: false, lastUpdate: '2 days ago' },
    { id: 2, name: 'personal-portfolio', isPrivate: true, lastUpdate: '5 hours ago' },
    { id: 3, name: 'dotfiles', isPrivate: true, lastUpdate: '1 month ago' },
    { id: 4, name: 'ai-research-papers', isPrivate: false, lastUpdate: '1 week ago' },
];

export const GitHubImportModal: React.FC<GitHubImportModalProps> = ({ onClose, onImport }) => {
    const [step, setStep] = useState<ImportStep>('input');
    const [selectedRepo, setSelectedRepo] = useState<string | null>(null);
    const [repoUrl, setRepoUrl] = useState('');
    const [progress, setProgress] = useState(0);
    const [statusText, setStatusText] = useState('Initializing...');
    const [errorMsg, setErrorMsg] = useState('');

    const handleConnect = () => {
        // Simulate OAuth
        const popup = window.open('about:blank', 'github_auth', 'width=600,height=600');
        if(popup) {
            popup.document.write('<h1>Connecting to GitHub...</h1><p>Please wait while we verify your credentials.</p>');
            setTimeout(() => {
                popup.close();
                setStep('select_repo');
            }, 1500);
        } else {
            setStep('select_repo');
        }
    };

    // Recursive function to fetch files from GitHub API
    const fetchRepoContents = async (owner: string, repo: string, path = ''): Promise<FileNode[]> => {
        const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error(`Failed to fetch ${path}: ${response.statusText}`);
        
        const data = await response.json();
        const nodes: FileNode[] = [];

        if (Array.isArray(data)) {
            for (const item of data) {
                if (item.type === 'file') {
                    // Fetch file content (raw)
                    const contentRes = await fetch(item.download_url);
                    const content = await contentRes.text();
                    nodes.push({
                        id: generateId(),
                        name: item.name,
                        type: 'file',
                        path: `/${item.path}`,
                        content: content
                    });
                } else if (item.type === 'dir') {
                    const children = await fetchRepoContents(owner, repo, item.path);
                    nodes.push({
                        id: generateId(),
                        name: item.name,
                        type: 'folder',
                        path: `/${item.path}`,
                        children: children
                    });
                }
            }
        }
        return nodes;
    };

    const handleImportByUrl = async () => {
        if (!repoUrl) return;
        
        try {
            // Parse URL: https://github.com/owner/repo
            const urlParts = repoUrl.replace('https://github.com/', '').replace('.git', '').split('/');
            if (urlParts.length < 2) throw new Error("Invalid GitHub URL format");
            
            const owner = urlParts[0];
            const repo = urlParts[1];
            
            setSelectedRepo(repo);
            setStep('importing');
            setStatusText(`Connecting to ${owner}/${repo}...`);
            setProgress(10);

            // Start Fetching
            setStatusText("Fetching repository structure...");
            setProgress(30);
            
            const files = await fetchRepoContents(owner, repo);
            
            setProgress(100);
            setStatusText("Repository cloned successfully.");
            
            // Pass data back to App
            setTimeout(() => {
                onImport(files, repo);
            }, 500);

        } catch (err: any) {
            console.error(err);
            setErrorMsg(err.message || "Failed to clone repository");
            setStep('error');
        }
    };

    const handleImportByName = (repoName: string) => {
        // Mock fallback for the demo list
        setSelectedRepo(repoName);
        setStep('importing');
        setProgress(0);
        setStatusText(`Cloning ${repoName}...`);
        
        // Mock simulation for demo repos
        const stages = [
            { pct: 20, text: 'Resolving deltas...' },
            { pct: 40, text: 'Fetching objects...' },
            { pct: 60, text: 'Checking out files...' },
            { pct: 80, text: 'Analyzing project structure...' },
            { pct: 100, text: 'Done.' }
        ];

        let currentStage = 0;
        const interval = setInterval(() => {
            if (currentStage >= stages.length) {
                clearInterval(interval);
                onImport([
                    { id: generateId(), name: 'README.md', type: 'file', path: '/README.md', content: `# ${repoName}\n\nImported from GitHub.` }
                ], repoName);
                return;
            }
            const stage = stages[currentStage];
            setProgress(stage.pct);
            setStatusText(stage.text);
            currentStage++;
        }, 600);
    };

    const renderContent = () => {
        switch (step) {
            case 'input':
                return (
                    <>
                        <div className="text-center mb-6">
                            <GithubIcon className="w-12 h-12 text-white mx-auto mb-3" />
                            <h2 className="font-orbitron text-2xl mb-2 text-white">Import from GitHub</h2>
                            <p className="text-gray-400">Clone a repository to start coding immediately.</p>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="text-xs text-gray-400 mb-1 block uppercase tracking-wider">Repository URL</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={repoUrl}
                                        onChange={(e) => setRepoUrl(e.target.value)}
                                        placeholder="https://github.com/username/repo"
                                        className="flex-grow bg-black/30 p-3 rounded-xl border border-white/20 focus:ring-2 focus:ring-purple-500 focus:outline-none font-fira-code text-sm text-white placeholder:text-gray-600"
                                    />
                                    <button 
                                        onClick={handleImportByUrl}
                                        disabled={!repoUrl.includes('github.com')}
                                        className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 rounded-xl font-bold font-orbitron transition-all"
                                    >
                                        Clone
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="h-px bg-white/10 flex-grow"></div>
                                <span className="text-gray-500 text-xs uppercase">Or</span>
                                <div className="h-px bg-white/10 flex-grow"></div>
                            </div>

                            <button 
                                onClick={handleConnect}
                                className="w-full text-base font-semibold py-4 px-6 rounded-xl bg-[#24292F] text-white hover:bg-[#30363D] transition-colors flex items-center justify-center gap-3 border border-white/10"
                            >
                                <GithubIcon className="w-5 h-5" />
                                Connect GitHub Account
                            </button>
                            <p className="text-center text-xs text-gray-500">
                                Connect to access your private repositories securely.
                            </p>
                        </div>
                    </>
                );
            case 'select_repo':
                 return (
                    <>
                        <h2 className="font-orbitron text-2xl mb-2 text-white">Your Repositories</h2>
                        <p className="text-gray-400 mb-4">Select a repository to import into Nexus Coder.</p>
                        <div className="relative mb-4">
                            <input type="text" placeholder="Search repositories..." className="w-full bg-black/30 p-2 pl-8 rounded-lg border border-white/20 focus:ring-1 focus:ring-purple-500 focus:outline-none font-fira-code text-sm"/>
                            <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        </div>
                        <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                            {mockRepos.map(repo => (
                                <button key={repo.id} onClick={() => handleImportByName(repo.name)} className="w-full text-left p-3 bg-black/20 rounded-lg hover:bg-black/40 transition-colors border border-transparent hover:border-purple-500/30">
                                    <div className="flex justify-between items-center">
                                        <p className="font-semibold text-white">{repo.name}</p>
                                        {repo.isPrivate && <span className="text-[10px] bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full border border-gray-600">Private</span>}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">Updated {repo.lastUpdate}</p>
                                </button>
                            ))}
                        </div>
                        <button onClick={() => setStep('input')} className="mt-4 text-sm text-gray-400 hover:text-white underline">Back to URL</button>
                    </>
                );
            case 'importing':
                return (
                     <div className="text-center py-8">
                        <div className="relative w-16 h-16 mx-auto mb-6">
                            <div className="absolute inset-0 rounded-full border-4 border-gray-700"></div>
                            <div className="absolute inset-0 rounded-full border-4 border-t-cyan-400 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
                            <GithubIcon className="absolute inset-0 m-auto w-8 h-8 text-white" />
                        </div>
                        <h2 className="font-orbitron text-2xl mb-2 text-white">Cloning Repository...</h2>
                        <p className="text-gray-400 mb-6 font-mono text-sm">{statusText}</p>
                        <div className="w-full bg-black/30 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-gradient-to-r from-purple-500 to-cyan-500 h-full transition-all duration-300 ease-out" style={{ width: `${progress}%` }}></div>
                        </div>
                    </div>
                );
            case 'error':
                return (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/50">
                            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </div>
                        <h2 className="font-orbitron text-2xl mb-2 text-white">Import Failed</h2>
                        <p className="text-gray-400 mb-6">{errorMsg}</p>
                        <button 
                            onClick={() => setStep('input')} 
                            className="w-full py-3 rounded-xl bg-white/10 text-white font-bold hover:bg-white/20 transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                );
            case 'success':
                 return null; // Handled by App
        }
    };

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[100] p-4">
            <div className="bg-[#0d0d12] border border-purple-500/30 rounded-3xl p-8 max-w-lg w-full relative shadow-[0_0_50px_rgba(168,85,247,0.15)] overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                {renderContent()}
            </div>
        </div>
    );
};
