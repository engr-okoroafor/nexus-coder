import React, { useState } from 'react';
import { StripeIcon, PayPalIcon, GooglePayIcon, PaystackIcon } from './PaymentIcons';
import { PaymentModal } from './PaymentModal';

type Tab = 'plan' | 'payment' | 'history';

const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
    <button onClick={onClick} className={`px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 transition-colors ${active ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-gray-400 hover:text-white hover:border-cyan-400/50'}`}>
        {children}
    </button>
)

export const Billing: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<Tab>('plan');
  const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);

  return (
    <>
      {isPaymentModalOpen && <PaymentModal onClose={() => setPaymentModalOpen(false)} />}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-gray-900/70 border border-purple-500/30 rounded-3xl p-8 max-w-3xl w-full relative shadow-2xl shadow-purple-500/20">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <h2 className="font-orbitron text-3xl mb-1 text-white">Billing & Subscription</h2>
          <p className="text-gray-400 mb-6">Manage your plan and payment details.</p>

          <div className="border-b border-white/10 mb-6">
              <TabButton active={activeTab === 'plan'} onClick={() => setActiveTab('plan')}>My Plan</TabButton>
              <TabButton active={activeTab === 'payment'} onClick={() => setActiveTab('payment')}>Payment Methods</TabButton>
              <TabButton active={activeTab === 'history'} onClick={() => setActiveTab('history')}>Billing History</TabButton>
          </div>

          <div>
              {activeTab === 'plan' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="border border-cyan-500/30 rounded-3xl p-6 bg-black/30 flex flex-col">
                          <h3 className="font-orbitron text-xl text-cyan-300">Free</h3>
                          <p className="text-3xl font-bold my-4">0<span className="text-base font-normal text-gray-400">/month</span></p>
                          <ul className="space-y-2 text-sm text-gray-300 flex-grow">
                          <li>300,000 daily tokens</li>
                          <li>Basic code generation</li>
                          </ul>
                          <button disabled className="mt-6 w-full py-2 rounded-full bg-gray-700 text-gray-400 cursor-not-allowed">Current Plan</button>
                      </div>
                      <div className="border border-purple-500/30 rounded-3xl p-6 bg-black/30 flex flex-col ring-2 ring-purple-500 shadow-lg shadow-purple-500/30">
                          <h3 className="font-orbitron text-xl text-purple-300">Pro</h3>
                          <p className="text-3xl font-bold my-4">$20<span className="text-base font-normal text-gray-400">/month</span></p>
                          <ul className="space-y-2 text-sm text-gray-300 flex-grow">
                          <li>10,000,000 monthly tokens</li>
                          <li>Advanced models & agents</li>
                          <li>Connect private repos</li>
                          </ul>
                          <button onClick={() => setPaymentModalOpen(true)} className="mt-6 w-full py-2 rounded-full bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 transition-all">Upgrade</button>
                      </div>
                  </div>
              )}
              {activeTab === 'payment' && (
                  <div>
                      <h3 className="text-lg font-orbitron text-purple-300 mb-4">Add Payment Method</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center cursor-pointer hover:bg-white/10 transition-colors"><StripeIcon className="h-8"/></div>
                          <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center cursor-pointer hover:bg-white/10 transition-colors"><PayPalIcon className="h-8"/></div>
                          <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center cursor-pointer hover:bg-white/10 transition-colors"><GooglePayIcon className="h-8"/></div>
                          <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center cursor-pointer hover:bg-white/10 transition-colors"><PaystackIcon className="h-8"/></div>
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