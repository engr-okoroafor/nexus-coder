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

  return (
    <>
      {selectedPlan && <PaymentModal onClose={() => setSelectedPlan(null)} planName={selectedPlan.name} monthlyPrice={selectedPlan.price} />}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
        <div className="bg-gray-900/70 border border-purple-500/30 rounded-3xl p-8 max-w-3xl w-full relative shadow-2xl shadow-purple-500/20">
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
                      <div className="border border-cyan-500/30 rounded-3xl p-4 bg-black/30 flex flex-col">
                          <h3 className="font-orbitron text-lg text-cyan-300">Free</h3>
                          <p className="text-2xl font-bold my-3">$0<span className="text-sm font-normal text-gray-400">/mo</span></p>
                          <ul className="space-y-1.5 text-xs text-gray-300 flex-grow">
                          <li>• 300K daily tokens</li>
                          <li>• Basic code generation</li>
                          </ul>
                          <button disabled className="mt-4 w-full py-2 text-sm rounded-full bg-gray-700 text-gray-400 cursor-not-allowed">Current Plan</button>
                      </div>
                      <div className="border border-purple-500/30 rounded-3xl p-4 bg-black/30 flex flex-col ring-2 ring-purple-500 shadow-lg shadow-purple-500/30">
                          <h3 className="font-orbitron text-lg text-purple-300">Pro</h3>
                          <p className="text-2xl font-bold my-3">$20<span className="text-sm font-normal text-gray-400">/mo</span></p>
                          <ul className="space-y-1.5 text-xs text-gray-300 flex-grow">
                          <li>• 10M monthly tokens</li>
                          <li>• Advanced models</li>
                          <li>• Private repos</li>
                          </ul>
                          <button onClick={() => setSelectedPlan({name: 'Pro', price: 20})} className="mt-4 w-full py-2 text-sm rounded-full bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 transition-all transform hover:scale-105 active:scale-95 active:shadow-[0_0_20px_rgba(168,85,247,0.4)]">Upgrade to Pro</button>
                      </div>
                      <div className="border border-orange-500/30 rounded-3xl p-4 bg-black/30 flex flex-col ring-2 ring-orange-500 shadow-lg shadow-orange-500/30">
                          <h3 className="font-orbitron text-lg text-orange-300">Titan</h3>
                          <p className="text-2xl font-bold my-3">$50<span className="text-sm font-normal text-gray-400">/mo</span></p>
                          <ul className="space-y-1.5 text-xs text-gray-300 flex-grow">
                          <li>• Unlimited tokens</li>
                          <li>• Dedicated GPU cluster</li>
                          <li>• Team collaboration</li>
                          <li>• 24/7 priority support</li>
                          </ul>
                          <button onClick={() => setSelectedPlan({name: 'Titan', price: 50})} className="mt-4 w-full py-2 text-sm rounded-full bg-gradient-to-r from-orange-600 to-yellow-500 hover:from-orange-500 hover:to-yellow-400 transition-all transform hover:scale-105 active:scale-95 active:shadow-[0_0_20px_rgba(249,115,22,0.4)]">Go Titan</button>
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