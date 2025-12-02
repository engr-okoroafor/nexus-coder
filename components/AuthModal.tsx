
import React, { useState } from 'react';

interface AuthModalProps {
    onClose: () => void;
    onLoginSuccess: () => void;
}

type AuthTab = 'signin' | 'signup';

const InputField: React.FC<{ label: string; placeholder: string; type?: string, value: string, onChange: (val: string) => void }> = 
    ({ label, placeholder, type = "text", value, onChange }) => (
    <div>
        <label className="text-xs text-gray-400 mb-1 block">{label}</label>
        <input 
            type={type} 
            placeholder={placeholder} 
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-black/30 p-2 rounded-lg border border-white/20 focus:ring-1 focus:ring-purple-500 focus:outline-none font-fira-code text-sm" 
        />
    </div>
);

const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
    <button type="button" onClick={onClick} className={`px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 transition-colors w-full ${active ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-gray-400 hover:text-white hover:border-cyan-400/50'}`}>
        {children}
    </button>
);

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, onLoginSuccess }) => {
    const [activeTab, setActiveTab] = useState<AuthTab>('signin');
    const [email, setEmail] = useState('demo@user.com');
    const [password, setPassword] = useState('password123');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        // Simulate authentication delay
        setTimeout(() => {
            onLoginSuccess();
            setIsLoading(false);
        }, 800);
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-gray-900/70 border border-purple-500/30 rounded-3xl p-6 sm:p-8 max-w-sm w-full relative shadow-2xl shadow-purple-500/20 animate-scale-in">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                <div className="text-center">
                    <h2 className="font-orbitron text-xl sm:text-2xl mb-2 text-white">Welcome to Nexus Coder</h2>
                    <p className="text-gray-400 text-sm sm:text-base mb-4 sm:mb-6">Sign in to launch your AI agent.</p>
                </div>
                
                <div className="flex border-b border-white/10 mb-6">
                    <TabButton active={activeTab === 'signin'} onClick={() => setActiveTab('signin')}>Sign In</TabButton>
                    <TabButton active={activeTab === 'signup'} onClick={() => setActiveTab('signup')}>Sign Up</TabButton>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {activeTab === 'signup' && (
                         <InputField label="Full Name" placeholder="John Doe" value={""} onChange={() => {}} />
                    )}
                    <InputField label="Email Address" placeholder="you@example.com" type="email" value={email} onChange={setEmail} />
                    <InputField label="Password" placeholder="••••••••" type="password" value={password} onChange={setPassword} />
                    
                    <button 
                        type="submit"
                        disabled={isLoading}
                        className="w-full mt-6 text-sm sm:text-base font-orbitron font-bold py-3 px-6 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                    >
                        {isLoading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Authenticating...</span>
                            </>
                        ) : (
                            activeTab === 'signin' ? 'Sign In' : 'Create Account'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};
