import React, { useState, useRef } from 'react';
import type { User } from '../types';
import { EditIcon } from './Icons';

interface ProfileModalProps {
    user: User;
    onClose: () => void;
    onSave: (user: User) => void;
}

const InputField: React.FC<{ label: string; value: string; onChange: (val: string) => void; type?: string }> = ({ label, value, onChange, type = "text" }) => (
    <div>
        <label className="text-xs text-gray-400 mb-1 block">{label}</label>
        <input 
            type={type} 
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-black/30 p-2 rounded-lg border border-white/20 focus:ring-1 focus:ring-purple-500 focus:outline-none font-fira-code text-sm" 
        />
    </div>
);

export const ProfileModal: React.FC<ProfileModalProps> = ({ user, onClose, onSave }) => {
    const [name, setName] = useState(user.name);
    const [email, setEmail] = useState(user.email);
    const [bio, setBio] = useState(user.bio || '');
    const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatarUrl || null);
    const avatarInputRef = useRef<HTMLInputElement>(null);

    const handleSave = () => {
        onSave({ ...user, name, email, bio, avatarUrl: avatarPreview || undefined });
        onClose();
    };

    const handleAvatarUpload = () => {
        avatarInputRef.current?.click();
    };
    
    const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gray-900/70 border border-purple-500/30 rounded-3xl p-8 max-w-md w-full relative shadow-2xl shadow-purple-500/20">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                
                <div className="flex flex-col items-center text-center">
                    <div className="relative group w-24 h-24 mb-4">
                        <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 rounded-full border-2 border-white/20 flex items-center justify-center overflow-hidden">
                            {avatarPreview ? (
                                <img src={avatarPreview} alt="Avatar Preview" className="w-full h-full object-cover" />
                            ) : (
                                <span className="font-bold text-4xl text-white">{user.name.charAt(0).toUpperCase()}</span>
                            )}
                        </div>
                        <button onClick={handleAvatarUpload} className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <EditIcon className="w-6 h-6 text-white"/>
                        </button>
                         <input
                            type="file"
                            ref={avatarInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleAvatarFileChange}
                        />
                    </div>
                    <h2 className="font-orbitron text-2xl text-white">{name}</h2>
                    <p className="text-gray-400 mb-6">{email}</p>
                </div>

                <div className="space-y-4">
                    <InputField label="Full Name" value={name} onChange={setName} />
                    <InputField label="Email Address" value={email} onChange={setEmail} type="email" />
                    <div>
                        <label className="text-xs text-gray-400 mb-1 block">Bio</label>
                        <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            rows={3}
                            className="w-full bg-black/30 p-2 rounded-lg border border-white/20 focus:ring-1 focus:ring-purple-500 focus:outline-none font-fira-code text-sm resize-none"
                        />
                    </div>
                </div>
                
                <div className="flex gap-4 justify-end mt-8">
                    <button
                        onClick={onClose}
                        className="text-sm px-5 py-2 rounded-full font-semibold text-gray-300 bg-white/10 hover:bg-white/20 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="text-sm px-5 py-2 rounded-full font-semibold text-black bg-white hover:bg-gray-200 transition-colors"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};