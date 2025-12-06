
import React, { useState } from 'react';
import { CreditCardIcon, CalendarIcon, UserIcon } from './Icons';

type PaymentTab = 'card' | 'bank';

interface PaymentModalProps {
    onClose: () => void;
    planName?: string;
    monthlyPrice?: number;
}

const PaymentTabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
    <button onClick={onClick} className={`px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 transition-colors flex items-center gap-2 ${active ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-gray-400 hover:text-white hover:border-cyan-400/50'}`}>
        {children}
    </button>
);

const InputField: React.FC<{ 
    label: string; 
    placeholder: string; 
    type?: string; 
    value: string; 
    onChange: (val: string) => void;
    icon?: React.ReactNode;
    error?: string;
    maxLength?: number;
}> = ({ label, placeholder, type = "text", value, onChange, icon, error, maxLength }) => (
    <div className="relative">
        <label className="text-xs text-gray-400 mb-1 block">{label}</label>
        <div className="relative">
             {icon && (
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    {icon}
                </div>
            )}
            <input 
                type={type} 
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                maxLength={maxLength}
                className={`w-full bg-black/30 p-2 rounded-lg border focus:ring-1 focus:outline-none font-fira-code text-sm transition-colors ${icon ? 'pl-10' : ''} ${error ? 'border-red-500 focus:ring-red-500' : 'border-white/20 focus:ring-purple-500'}`}
            />
        </div>
        {error && <span className="text-xs text-red-400 absolute -bottom-5 left-0">{error}</span>}
    </div>
);

export const PaymentModal: React.FC<PaymentModalProps> = ({ onClose, planName = 'Pro', monthlyPrice = 20 }) => {
    const [activeTab, setActiveTab] = useState<PaymentTab>('card');
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

    const [cardNumber, setCardNumber] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvc, setCvc] = useState('');
    const [name, setName] = useState('');
    const [errors, setErrors] = useState<{[key: string]: string}>({});
    const [isProcessing, setIsProcessing] = useState(false);
    const [isCopied, setIsCopied] = useState(false);

    // Bank details for copying
    const bankDetails = `INTERNATIONAL WIRE TRANSFER DETAILS

Correspondent Bank: CITIBANK, NEW YORK
Swift Code: CITIUS33
Sort Code: N/A
Fedwire/ABA No: 021000089

For Credit Of: GUARANTY TRUST BANK PLC, LAGOS NIGERIA
GTBank Swift Code: GTBINGLA
GTBank A/C (Correspondent): 36129295

Beneficiary Name: OKOROAFOR, CHUKWUDIFU UZOMA
Beneficiary A/C No: 0123088915

Reference: NEX-${planName.toUpperCase()}`;

    const handleCopyBankDetails = () => {
        navigator.clipboard.writeText(bankDetails).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        });
    };

    // Calculate Price logic
    const yearlyDiscount = 0.20; // 20%
    const currentPrice = billingCycle === 'yearly' ? monthlyPrice * 12 * (1 - yearlyDiscount) : monthlyPrice;
    const displayPrice = billingCycle === 'yearly' ? `$${(currentPrice / 12).toFixed(2)}` : `$${monthlyPrice}`;
    const totalBilled = `$${currentPrice.toFixed(2)}`;

    const validate = () => {
        const newErrors: {[key: string]: string} = {};
        // Simple regex validations
        if (!/^\d{4}\s?\d{4}\s?\d{4}\s?\d{4}$/.test(cardNumber.replace(/\s/g, ' '))) newErrors.cardNumber = "Invalid card number";
        if (!/^(0[1-9]|1[0-2])\/?([0-9]{2})$/.test(expiry)) newErrors.expiry = "MM/YY";
        if (!/^\d{3,4}$/.test(cvc)) newErrors.cvc = "Invalid CVC";
        if (!name.trim()) newErrors.name = "Required";
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handlePay = () => {
        if (activeTab === 'card') {
            if (!validate()) return;
        }
        setIsProcessing(true);
        setTimeout(() => {
            setIsProcessing(false);
            alert(`Payment of ${totalBilled} successful! Welcome to Nexus ${planName}.`);
            onClose();
        }, 2000);
    };

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[10000] p-4 pt-20">
            <div className="bg-[#0d0d12] border border-purple-500/30 rounded-3xl p-5 max-w-md w-full relative shadow-[0_0_50px_rgba(168,85,247,0.15)] max-h-[calc(100vh-100px)] flex flex-col">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-all active:scale-90 z-10">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                
                <div className="text-center mb-3">
                    <h2 className="font-orbitron text-xl text-white">Upgrade to <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">{planName}</span></h2>
                    <p className="text-gray-400 text-xs mt-1">Unlock autonomous power.</p>
                </div>

                {/* Billing Cycle Switcher */}
                <div className="flex bg-black/40 p-1 rounded-xl mb-4 border border-white/10 relative">
                     <div 
                        className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-gradient-to-r from-purple-600/40 to-cyan-600/40 rounded-lg transition-all duration-300 ${billingCycle === 'monthly' ? 'left-1' : 'left-[calc(50%+4px)]'}`}
                    ></div>
                    <button 
                        onClick={() => setBillingCycle('monthly')} 
                        className={`flex-1 py-2 text-sm font-semibold z-10 transition-colors ${billingCycle === 'monthly' ? 'text-white' : 'text-gray-400'}`}
                    >
                        Monthly
                    </button>
                    <button 
                        onClick={() => setBillingCycle('yearly')} 
                        className={`flex-1 py-2 text-sm font-semibold z-10 transition-colors flex items-center justify-center gap-2 ${billingCycle === 'yearly' ? 'text-white' : 'text-gray-400'}`}
                    >
                        Yearly <span className="text-[10px] bg-green-500 text-black px-1.5 rounded-full font-bold">-20%</span>
                    </button>
                </div>

                <div className="text-center mb-4 p-3 bg-gradient-to-br from-purple-900/20 to-cyan-900/20 rounded-2xl border border-white/10">
                    <div className="text-2xl font-bold text-white">{displayPrice}<span className="text-xs font-normal text-gray-400">/mo</span></div>
                    <div className="text-[10px] text-gray-400 mt-1">Billed {billingCycle === 'yearly' ? 'yearly' : 'monthly'} as <span className="text-white font-semibold">{totalBilled}</span></div>
                </div>

                <div className="border-b border-white/10 mb-4">
                    <div className="flex gap-4">
                        <PaymentTabButton active={activeTab === 'card'} onClick={() => setActiveTab('card')}>
                            <CreditCardIcon className="w-4 h-4"/> Card
                        </PaymentTabButton>
                        <PaymentTabButton active={activeTab === 'bank'} onClick={() => setActiveTab('bank')}>
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18M3 10h18M5 6l7-4 7 4M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3"/></svg>
                            Bank Transfer
                        </PaymentTabButton>
                    </div>
                </div>

                <div className="flex-grow">
                    {activeTab === 'card' && (
                        <div className="space-y-6">
                            <InputField 
                                label="Card Number" 
                                placeholder="0000 0000 0000 0000" 
                                value={cardNumber}
                                onChange={setCardNumber}
                                icon={<CreditCardIcon className="w-4 h-4"/>}
                                error={errors.cardNumber}
                                maxLength={19}
                            />
                             <div className="grid grid-cols-2 gap-4">
                                <InputField 
                                    label="Expiry Date" 
                                    placeholder="MM/YY" 
                                    value={expiry}
                                    onChange={setExpiry}
                                    icon={<CalendarIcon className="w-4 h-4"/>}
                                    error={errors.expiry}
                                    maxLength={5}
                                />
                                <InputField 
                                    label="CVC" 
                                    placeholder="123" 
                                    value={cvc}
                                    onChange={setCvc}
                                    icon={<div className="font-bold text-xs">CVC</div>}
                                    error={errors.cvc}
                                    maxLength={4}
                                />
                            </div>
                            <InputField 
                                label="Name on Card" 
                                placeholder="John Doe" 
                                value={name}
                                onChange={setName}
                                icon={<UserIcon className="w-4 h-4"/>}
                                error={errors.name}
                            />
                        </div>
                    )}
                    {activeTab === 'bank' && (
                        <div className="bg-black/30 p-3 rounded-2xl border border-white/10 relative">
                            <div className="flex justify-between items-center mb-2">
                                <p className="text-white font-semibold text-[11px]">Wire Transfer Details</p>
                                <button 
                                    onClick={handleCopyBankDetails}
                                    className="flex items-center gap-1 px-2 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded-lg text-[10px] font-bold transition-colors"
                                >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                    {isCopied ? 'Copied!' : 'Copy All'}
                                </button>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[9px] text-gray-300">
                                <div className="col-span-2 border-b border-white/5 pb-1 mb-1">
                                    <span className="text-gray-400">Correspondent Bank:</span>
                                    <p className="text-white font-mono text-[8px]">CITIBANK, NEW YORK</p>
                                </div>
                                
                                <div>
                                    <span className="text-gray-400">Swift:</span>
                                    <p className="text-white font-mono text-[8px]">CITIUS33</p>
                                </div>
                                
                                <div>
                                    <span className="text-gray-400">Fedwire/ABA:</span>
                                    <p className="text-white font-mono text-[8px]">021000089</p>
                                </div>
                                
                                <div className="col-span-2 border-t border-white/5 pt-1 mt-1">
                                    <span className="text-gray-400">For Credit Of:</span>
                                    <p className="text-white font-mono text-[8px]">GUARANTY TRUST BANK PLC, LAGOS</p>
                                </div>
                                
                                <div>
                                    <span className="text-gray-400">GTBank Swift:</span>
                                    <p className="text-white font-mono text-[8px]">GTBINGLA</p>
                                </div>
                                
                                <div>
                                    <span className="text-gray-400">GTBank A/C:</span>
                                    <p className="text-white font-mono text-[8px]">36129295</p>
                                </div>
                                
                                <div className="col-span-2 border-t border-white/5 pt-1 mt-1">
                                    <span className="text-gray-400">Beneficiary:</span>
                                    <p className="text-white font-mono text-[8px]">OKOROAFOR, CHUKWUDIFU UZOMA</p>
                                </div>
                                
                                <div>
                                    <span className="text-gray-400">Account No:</span>
                                    <p className="text-white font-mono text-[8px]">0123088915</p>
                                </div>
                                
                                <div>
                                    <span className="text-gray-400">Reference:</span>
                                    <p className="text-cyan-400 font-mono text-[8px]">NEX-{planName.toUpperCase()}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                
                <button 
                    onClick={handlePay}
                    disabled={isProcessing}
                    className="w-full mt-4 text-sm font-orbitron font-bold py-3 px-6 rounded-2xl bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                    {isProcessing ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Processing...
                        </>
                    ) : (
                        `Pay ${totalBilled}`
                    )}
                </button>
                <div className="mt-3 flex items-center justify-center gap-2 text-[10px] text-gray-500">
                     <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                     Secure 256-bit SSL Encrypted Payment
                </div>
            </div>
        </div>
    );
};
