
import React, { useState, useEffect } from 'react';
import { VercelIcon, NetlifyIcon, DeployIcon, LoadingIcon, SuccessIcon, AwsIcon, GcpIcon } from './Icons';

type DeployStep = 'select_provider' | 'configure' | 'deploying' | 'success';
type Provider = 'Vercel' | 'Netlify' | 'AWS' | 'GCP';

const mockLogs = [
    'Deploying with Nexus Coder Agent...',
    'Cloning repository...',
    'Building project...',
    'Running tests...',
    'Uploading build output...',
    'Finalizing deployment...',
    'Deployment successful!',
];

export const DeployModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [step, setStep] = useState<DeployStep>('select_provider');
    const [provider, setProvider] = useState<Provider | null>(null);
    const [logs, setLogs] = useState<string[]>([]);

    const handleSelectProvider = (p: Provider) => {
        setProvider(p);
        setStep('configure');
    };

    const handleDeploy = () => {
        setStep('deploying');
        setLogs([]);
        let logIndex = 0;
        const interval = setInterval(() => {
            setLogs(prev => [...prev, mockLogs[logIndex]]);
            logIndex++;
            if (logIndex >= mockLogs.length) {
                clearInterval(interval);
                setTimeout(() => setStep('success'), 500);
            }
        }, 700);
    };

    const renderContent = () => {
        switch (step) {
            case 'select_provider':
                return (
                    <div className="text-center">
                        <DeployIcon className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                        <h2 className="font-orbitron text-2xl mb-2 text-white">Deploy Project</h2>
                        <p className="text-gray-400 mb-8">
                            Connect your favorite hosting provider to deploy your project directly from Nexus Coder.
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={() => handleSelectProvider('Vercel')} className="w-full text-sm font-semibold py-4 px-4 rounded-xl bg-black text-white hover:bg-gray-800 border border-white/20 transition-colors flex flex-col items-center justify-center gap-2">
                                <VercelIcon className="w-8 h-8" /> <span>Vercel</span>
                            </button>
                            <button onClick={() => handleSelectProvider('Netlify')} className="w-full text-sm font-semibold py-4 px-4 rounded-xl bg-[#00C7B7]/10 text-[#00C7B7] hover:bg-[#00C7B7]/20 border border-[#00C7B7]/30 transition-colors flex flex-col items-center justify-center gap-2">
                                <NetlifyIcon className="w-8 h-8" /> <span>Netlify</span>
                            </button>
                            <button onClick={() => handleSelectProvider('AWS')} className="w-full text-sm font-semibold py-4 px-4 rounded-xl bg-[#FF9900]/10 text-[#FF9900] hover:bg-[#FF9900]/20 border border-[#FF9900]/30 transition-colors flex flex-col items-center justify-center gap-2">
                                <AwsIcon className="w-8 h-8" /> <span>AWS</span>
                            </button>
                            <button onClick={() => handleSelectProvider('GCP')} className="w-full text-sm font-semibold py-4 px-4 rounded-xl bg-[#4285F4]/10 text-[#4285F4] hover:bg-[#4285F4]/20 border border-[#4285F4]/30 transition-colors flex flex-col items-center justify-center gap-2">
                                <GcpIcon className="w-8 h-8" /> <span>Google Cloud</span>
                            </button>
                        </div>
                    </div>
                );
            case 'configure':
                return (
                    <div>
                        <h2 className="font-orbitron text-2xl mb-2 text-white">Configure & Deploy</h2>
                        <p className="text-gray-400 mb-6">Confirm settings for your deployment to {provider}.</p>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-gray-400 mb-1 block">Project Name</label>
                                <input type="text" defaultValue="nexus-coder-project" className="w-full bg-black/30 p-2 rounded-lg border border-white/20 font-fira-code text-sm"/>
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 mb-1 block">Domain</label>
                                <input type="text" defaultValue="nexus-coder.app" className="w-full bg-black/30 p-2 rounded-lg border border-white/20 font-fira-code text-sm"/>
                            </div>
                            {provider === 'AWS' && (
                                <div>
                                    <label className="text-xs text-gray-400 mb-1 block">Region</label>
                                    <input type="text" defaultValue="us-east-1" className="w-full bg-black/30 p-2 rounded-lg border border-white/20 font-fira-code text-sm"/>
                                </div>
                            )}
                        </div>
                        <button onClick={handleDeploy} className="w-full mt-8 text-base font-orbitron font-bold py-3 px-6 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 transition-all">
                            Deploy Now
                        </button>
                    </div>
                );
            case 'deploying':
                return (
                    <div className="text-center">
                        <LoadingIcon className="w-8 h-8 text-cyan-400 mx-auto mb-4"/>
                        <h2 className="font-orbitron text-2xl mb-2 text-white">Deployment in Progress...</h2>
                        <div className="mt-4 h-48 bg-black/40 rounded-lg p-3 text-left font-fira-code text-xs overflow-y-auto custom-scrollbar">
                            {logs.map((log, i) => <p key={i} className="whitespace-pre-wrap">{log}</p>)}
                        </div>
                    </div>
                );
            case 'success':
                 return (
                    <div className="text-center">
                        <SuccessIcon className="w-12 h-12 text-green-400 mx-auto mb-4"/>
                        <h2 className="font-orbitron text-2xl mb-2 text-white">Deployment Successful!</h2>
                        <p className="text-gray-400 mb-6">Your project is now live on {provider}.</p>
                        <a href="#" className="font-fira-code text-cyan-400 bg-cyan-900/50 px-4 py-2 rounded-lg">https://nexus-coder.app</a>
                        <button onClick={onClose} className="w-full mt-6 text-sm py-2 px-4 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors">
                            Done
                        </button>
                    </div>
                );
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
                {renderContent()}
            </div>
        </div>
    );
};
