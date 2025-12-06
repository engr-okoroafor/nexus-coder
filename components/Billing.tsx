import React, { useState } from 'react';
import { StripeIcon, PayPalIcon, GooglePayIcon, PaystackIcon } from './PaymentIcons';
import { PaymentModal } from './PaymentModal';

type Tab = 'plan' | 'history';

const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
    <button onClick={onClick} className={`px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 transition-colors ${active ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-gray-400 hover:text-white hover:border-cyan-400/50'}`}>
        {children}
    </button>
)

export const Billing: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<Tab>('plan');
  const [selectedPlan, setSelectedPlan] = useState<{name: string, price: number} | null>(null);
  
  // Get current user plan from localStorage (server-side verification required in production)
  const [currentPlan, setCurrentPlan] = useState<string>(() => {
    try {
      const savedPlan = localStorage.getItem('nexus-user-plan');
      return savedPlan || 'Free';
    } catch {
      return 'Free';
    }
  });

  return (
    <>
      {selectedPlan && <PaymentModal onClose={() => setSelectedPlan(null)} planName={selectedPlan.name} monthlyPrice={selectedPlan.price} />}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] animate-fade-in p-4 pt-20">
        <div className="bg-gray-900/70 border border-purple-500/30 rounded-3xl p-4 md:p-8 max-w-3xl w-full relative shadow-2xl shadow-purple-500/20 max-h-[calc(100vh-100px)] overflow-y-auto">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-all active:scale-90">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <h2 className="font-orbitron text-3xl mb-1 text-white">Billing & Subscription</h2>
          <p className="text-gray-400 mb-6">Manage your plan and payment details.</p>

          <div className="border-b border-white/10 mb-6">
              <TabButton active={activeTab === 'plan'} onClick={() => setActiveTab('plan')}>My Plan</TabButton>
              <TabButton active={activeTab === 'history'} onClick={() => setActiveTab('history')}>Billing History</TabButton>
          </div>

          <div>
              {activeTab === 'plan' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="border border-cyan-500/30 rounded-3xl p-4 bg-black/30 flex flex-col relative">
                          <h3 className="font-orbitron text-lg text-cyan-300">Free</h3>
                          <p className="text-2xl font-bold my-3">$0<span className="text-sm font-normal text-gray-400">/mo</span></p>
                          <ul className="space-y-1.5 text-xs text-gray-300 flex-grow">
                          <li>• 300K daily tokens</li>
                          <li>• Basic code generation</li>
                          </ul>
                          <button disabled className="mt-4 w-full py-2 text-sm rounded-full bg-gray-700 text-gray-400 cursor-not-allowed">
                            {currentPlan === 'Free' ? 'Current Plan' : 'Downgrade'}
                          </button>
                      </div>
                      <div className="border border-purple-500/30 rounded-3xl p-4 bg-black/30 flex flex-col ring-2 ring-purple-500 shadow-lg shadow-purple-500/30 relative">
                          <div className="absolute top-0 right-0 bg-gradient-to-l from-purple-600 to-cyan-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl rounded-tr-[1.8rem] tracking-wider">
                              POPULAR
                          </div>
                          <h3 className="font-orbitron text-lg text-purple-300 mt-4">Pro</h3>
                          <p className="text-2xl font-bold my-3">$20<span className="text-sm font-normal text-gray-400">/mo</span></p>
                          <ul className="space-y-1.5 text-xs text-gray-300 flex-grow">
                          <li>• 10M monthly tokens</li>
                          <li>• Advanced models</li>
                          <li>• Private repos</li>
                          </ul>
                          {currentPlan === 'Pro' ? (
                            <button disabled className="mt-4 w-full py-2 text-sm rounded-full bg-gray-700 text-gray-400 cursor-not-allowed">Current Plan</button>
                          ) : (
                            <button onClick={() => setSelectedPlan({name: 'Pro', price: 20})} className="mt-4 w-full py-2 text-sm rounded-full bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 transition-all transform hover:scale-105 active:scale-95 active:shadow-[0_0_20px_rgba(168,85,247,0.4)]">Upgrade to Pro</button>
                          )}
                      </div>
                      <div className="border border-orange-500/30 rounded-3xl p-4 bg-black/30 flex flex-col ring-2 ring-orange-500 shadow-lg shadow-orange-500/30 relative">
                          <div className="absolute top-0 right-0 bg-gradient-to-l from-yellow-600 to-orange-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl rounded-tr-[1.8rem] tracking-wider">
                              ULTIMATE
                          </div>
                          <h3 className="font-orbitron text-lg text-orange-300 mt-4">Titan</h3>
                          <p className="text-2xl font-bold my-3">$50<span className="text-sm font-normal text-gray-400">/mo</span></p>
                          <ul className="space-y-1.5 text-xs text-gray-300 flex-grow">
                          <li>• Unlimited tokens</li>
                          <li>• Dedicated GPU cluster</li>
                          <li>• Team collaboration</li>
                          <li>• 24/7 priority support</li>
                          </ul>
                          {currentPlan === 'Titan' ? (
                            <button disabled className="mt-4 w-full py-2 text-sm rounded-full bg-gray-700 text-gray-400 cursor-not-allowed">Current Plan</button>
                          ) : (
                            <button onClick={() => setSelectedPlan({name: 'Titan', price: 50})} className="mt-4 w-full py-2 text-sm rounded-full bg-gradient-to-r from-orange-600 to-yellow-500 hover:from-orange-500 hover:to-yellow-400 transition-all transform hover:scale-105 active:scale-95 active:shadow-[0_0_20px_rgba(249,115,22,0.4)]">Go Titan</button>
                          )}
                      </div>
                  </div>
              )}
              {activeTab === 'history' && (
                  <div className="text-center text-gray-400 p-8 bg-black/20 rounded-2xl">
                      <p>No billing history found.</p>
                  </div>
              )}
          </div>

        </div>
      </div>
    </>
  );
};