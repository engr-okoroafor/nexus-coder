

import React, { useState, useEffect } from 'react';
import { AppSettings } from '../types';

interface SettingsModalProps {
    settings: AppSettings;
    onSave: (settings: AppSettings) => void;
    onClose: () => void;
}

const SettingsRow: React.FC<{ title: string; description: string; children: React.ReactNode }> = ({ title, description, children }) => (
    <div className="flex items-center justify-between py-4 border-b border-white/10">
        <div>
            <h4 className="text-white font-semibold">{title}</h4>
            <p className="text-sm text-gray-400">{description}</p>
        </div>
        <div>
            {children}
        </div>
    </div>
);

const Toggle: React.FC<{ enabled: boolean; onToggle: () => void }> = ({ enabled, onToggle }) => (
    <button onClick={onToggle} className={`w-12 h-6 rounded-full p-1 transition-colors ${enabled ? 'bg-cyan-500' : 'bg-gray-700'}`}>
        <div className={`w-4 h-4 rounded-full bg-white transform transition-transform ${enabled ? 'translate-x-6' : 'translate-x-0'}`} />
    </button>
);

const APIKeyInput: React.FC<{ label: string; value: string; onChange: (value: string) => void }> = ({ label, value, onChange }) => (
    <div className="flex items-center gap-3">
        <label className="w-20 text-sm text-gray-300 flex-shrink-0">{label}</label>
        <input
            type="password"
            placeholder={`Enter your ${label} API Key`}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-black/30 p-2 rounded-lg border border-white/20 focus:ring-1 focus:ring-purple-500 focus:outline-none font-fira-code text-sm"
        />
    </div>
);

export const SettingsModal: React.FC<SettingsModalProps> = ({ settings, onSave, onClose }) => {
    const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
    
    useEffect(() => {
        setLocalSettings(settings);
    }, [settings]);

    const handleSave = () => {
        onSave(localSettings);
        onClose();
    };

    const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
        setLocalSettings(prev => ({ ...prev, [key]: value }));
    };

    const updateApiKey = (model: keyof AppSettings['apiKeys'], value: string) => {
        setLocalSettings(prev => ({
            ...prev,
            apiKeys: {
                ...prev.apiKeys,
                [model]: value
            }
        }));
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[10000] p-4">
            <div className="bg-gray-900/95 border border-purple-500/30 rounded-3xl p-8 max-w-2xl w-full relative shadow-2xl shadow-purple-500/20 max-h-[85vh] overflow-y-auto custom-scrollbar my-auto">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                <h2 className="font-orbitron text-2xl mb-2 text-white">Settings</h2>
                <p className="text-gray-400 mb-6">Customize your Nexus Coder experience.</p>

                <div>
                    <SettingsRow title="Email Notifications" description="Receive updates about your projects.">
                        <Toggle 
                            enabled={localSettings.enableNotifications} 
                            onToggle={() => updateSetting('enableNotifications', !localSettings.enableNotifications)}
                        />
                    </SettingsRow>
                    <SettingsRow title="AI Suggestions" description="Get real-time code suggestions from the AI.">
                        <Toggle 
                            enabled={localSettings.enableAiSuggestions} 
                            onToggle={() => updateSetting('enableAiSuggestions', !localSettings.enableAiSuggestions)}
                        />
                    </SettingsRow>
                    <div className="py-4">
                        <div>
                            <h4 className="text-white font-semibold">Model API Keys</h4>
                            <p className="text-sm text-gray-400">Manage your keys for LLM providers.</p>
                            <p className="text-xs text-yellow-400 mt-1 bg-yellow-900/30 p-2 rounded-lg">Note: Gemini API key is managed by the execution environment.</p>
                        </div>
                        <div className="mt-4 space-y-3">
                            <APIKeyInput label="Claude" value={localSettings.apiKeys.claude} onChange={(v) => updateApiKey('claude', v)} />
                            <APIKeyInput label="LLaMA" value={localSettings.apiKeys.meta} onChange={(v) => updateApiKey('meta', v)} />
                            <APIKeyInput label="Grok" value={localSettings.apiKeys.grok} onChange={(v) => updateApiKey('grok', v)} />
                            <APIKeyInput label="Qwen" value={localSettings.apiKeys.qwen} onChange={(v) => updateApiKey('qwen', v)} />
                        </div>
                    </div>
                    <div className="py-4 border-t border-white/10">
                        <div>
                            <h4 className="text-white font-semibold">Search Tool API Keys</h4>
                            <p className="text-sm text-gray-400">Configure search providers for better agent context.</p>
                        </div>
                        <div className="mt-4 space-y-3">
                            <APIKeyInput label="Serper" value={localSettings.apiKeys.serper} onChange={(v) => updateApiKey('serper', v)} />
                            <APIKeyInput label="SerpAPI" value={localSettings.apiKeys.serpApi} onChange={(v) => updateApiKey('serpApi', v)} />
                            <APIKeyInput label="Tavily" value={localSettings.apiKeys.tavily} onChange={(v) => updateApiKey('tavily', v)} />
                        </div>
                    </div>
                </div>
                 <div className="flex justify-end mt-8">
                    <button
                        onClick={handleSave}
                        className="text-sm px-5 py-2 rounded-full font-semibold text-black bg-white hover:bg-gray-200 transition-colors"
                    >
                        Save & Close
                    </button>
                </div>
            </div>
        </div>
    );
};