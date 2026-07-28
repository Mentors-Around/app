import React, { useState, useEffect } from 'react';
import { X, Wallet } from 'lucide-react';

const DepositModal = ({ isOpen, onClose, onProcess }) => {
  const [depositAmount, setDepositAmount] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (isOpen) {
      setDepositAmount('');
      setPassword('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-navy/80 backdrop-blur-sm flex items-center justify-center p-4 z-[6000]">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-slide-up-sm relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition">
          <X className="w-5 h-5" />
        </button>
        
        <div className="p-8">
          <div className="w-16 h-16 bg-sky-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Wallet className="w-8 h-8 text-sky-500" />
          </div>
          <h3 className="font-sora font-bold text-2xl text-navy text-center mb-6">Deposit Money</h3>
          
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[100, 250, 500, 1000].map(amt => (
              <button 
                key={amt}
                onClick={() => setDepositAmount(amt.toString())}
                className={`py-3 rounded-xl border font-bold text-sm transition ${depositAmount === amt.toString() ? 'border-sky-500 bg-sky-50 text-sky-700' : 'border-slate-200 text-slate-600 hover:border-sky-300 hover:bg-slate-50'}`}
              >
                + ₹{amt}
              </button>
            ))}
          </div>

          <div className="relative mb-4">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-sora font-bold text-slate-400">₹</span>
            <input 
              type="number" 
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              placeholder="Enter custom amount"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-slate-800 font-bold focus:outline-none focus:border-navy focus:bg-white transition"
            />
          </div>

          <div className="mb-6">
            <input 
              required
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your account password to verify"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-bold focus:outline-none focus:border-navy focus:bg-white transition text-sm"
            />
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="flex-[1] py-4 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition text-sm"
            >
              Cancel
            </button>
            <button 
              onClick={() => onProcess(parseInt(depositAmount, 10), password)}
              disabled={!depositAmount || parseInt(depositAmount, 10) <= 0 || !password.trim()}
              className="flex-[2] py-4 bg-navy hover:bg-navy-light disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition shadow flex items-center justify-center gap-2 text-sm"
            >
              Proceed to Deposit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepositModal;
