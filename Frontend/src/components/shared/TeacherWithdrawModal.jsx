import React, { useState, useEffect } from 'react';
import { X, ArrowUpFromLine, CheckCircle, Building2, Plus, Clock, Landmark } from 'lucide-react';
import PasswordVerificationModal from './PasswordVerificationModal';

const TeacherWithdrawModal = ({ isOpen, onClose, walletBalance, bankAccounts, onAddBankAccount, onWithdrawSuccess }) => {
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState('');
  const [selectedBankId, setSelectedBankId] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Bank Form State
  const [bankForm, setBankForm] = useState({
    accountName: '',
    bankName: '',
    accountNumber: '',
    confirmAccountNumber: '',
    ifscCode: '',
    upiId: '',
    isDefault: true
  });
  
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setAmount('');
      setSuccessMessage('');
      if (bankAccounts.length > 0) {
        const defaultBank = bankAccounts.find(b => b.isDefault) || bankAccounts[0];
        setSelectedBankId(defaultBank.id);
      }
    }
  }, [isOpen, bankAccounts]);

  const handleAmountSubmit = () => {
    const numAmount = parseInt(amount, 10);
    if (!numAmount || numAmount <= 0 || numAmount > walletBalance) return;
    
    if (bankAccounts.length === 0) {
      setStep(2); // Go to Add Bank Account
    } else {
      setStep(3); // Go to Confirm Bank Details
    }
  };

  const handleSaveBank = () => {
    if (!bankForm.accountName || !bankForm.bankName || !bankForm.accountNumber || !bankForm.ifscCode) {
      alert("Please fill all required fields");
      return;
    }
    if (bankForm.accountNumber !== bankForm.confirmAccountNumber) {
      alert("Account numbers do not match");
      return;
    }
    onAddBankAccount(bankForm);
    setStep(3);
  };

  const handleConfirmBank = () => {
    setShowPasswordModal(true);
  };

  const handlePasswordVerified = () => {
    setShowPasswordModal(false);
    setIsProcessing(true);
    
    // Mock processing delay
    setTimeout(() => {
      setIsProcessing(false);
      setSuccessMessage(`₹${parseInt(amount, 10).toLocaleString()} withdrawal requested successfully.`);
      if (onWithdrawSuccess) {
        onWithdrawSuccess(parseInt(amount, 10));
      }
      setStep(4); // Success step
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-navy/80 backdrop-blur-sm flex items-center justify-center p-4 z-[6000]">
      {step === 1 && (
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-slide-up-sm relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition">
            <X className="w-5 h-5" />
          </button>
          
          <div className="p-8">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
              <ArrowUpFromLine className="w-8 h-8 text-slate-700" />
            </div>
            <h3 className="font-sora font-bold text-2xl text-navy text-center mb-2">Withdraw Earnings</h3>
            <p className="text-slate-500 text-sm text-center mb-6">Available Balance: <strong className="text-slate-800">₹{walletBalance.toLocaleString()}</strong></p>
            
            <div className="relative mb-8">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Amount to Withdraw</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-sora font-bold text-slate-400">₹</span>
                <input 
                  type="number" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-slate-800 font-bold focus:outline-none focus:border-navy focus:bg-white transition"
                />
              </div>
              {parseInt(amount, 10) > walletBalance && (
                <p className="text-xs font-semibold text-rose-500 mt-2">Insufficient balance for this withdrawal.</p>
              )}
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={onClose}
                className="flex-[1] py-4 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition"
              >
                Cancel
              </button>
              <button 
                onClick={handleAmountSubmit}
                disabled={!amount || parseInt(amount, 10) <= 0 || parseInt(amount, 10) > walletBalance}
                className="flex-[2] py-4 bg-navy hover:bg-navy-light disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition shadow flex items-center justify-center gap-2"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-slide-up-sm relative max-h-[90vh] flex flex-col">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-sora font-bold text-xl text-navy">Add Bank Account</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6 overflow-y-auto">
            <div className="bg-sky-50 text-sky-700 p-4 rounded-xl mb-6 flex items-start gap-3">
              <Landmark className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <p className="text-sm font-medium">Please add a bank account to receive your withdrawals. We process payments securely via NEFT/IMPS.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Account Holder Name *</label>
                <input type="text" value={bankForm.accountName} onChange={(e) => setBankForm({...bankForm, accountName: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-slate-800 focus:outline-none focus:border-navy" placeholder="As per bank records" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Bank Name *</label>
                <input type="text" value={bankForm.bankName} onChange={(e) => setBankForm({...bankForm, bankName: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-slate-800 focus:outline-none focus:border-navy" placeholder="e.g. HDFC Bank, SBI" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Account Number *</label>
                  <input type="password" value={bankForm.accountNumber} onChange={(e) => setBankForm({...bankForm, accountNumber: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-slate-800 focus:outline-none focus:border-navy" placeholder="Enter Account No." />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Confirm Account *</label>
                  <input type="text" value={bankForm.confirmAccountNumber} onChange={(e) => setBankForm({...bankForm, confirmAccountNumber: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-slate-800 focus:outline-none focus:border-navy" placeholder="Re-enter Account No." />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">IFSC Code *</label>
                  <input type="text" value={bankForm.ifscCode} onChange={(e) => setBankForm({...bankForm, ifscCode: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-slate-800 focus:outline-none focus:border-navy uppercase" placeholder="e.g. HDFC0001234" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">UPI ID (Optional)</label>
                  <input type="text" value={bankForm.upiId} onChange={(e) => setBankForm({...bankForm, upiId: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-slate-800 focus:outline-none focus:border-navy" placeholder="e.g. user@okhdfc" />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4">
                <input type="checkbox" id="defaultBank" checked={bankForm.isDefault} onChange={(e) => setBankForm({...bankForm, isDefault: e.target.checked})} className="w-4 h-4 rounded text-navy focus:ring-navy cursor-pointer" />
                <label htmlFor="defaultBank" className="text-sm font-medium text-slate-700 cursor-pointer">Set as default account for future withdrawals</label>
              </div>
            </div>
          </div>
          <div className="p-6 border-t border-slate-100 flex gap-3 bg-slate-50">
            <button onClick={() => setStep(1)} className="px-6 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-100 transition">Back</button>
            <button onClick={handleSaveBank} className="flex-1 py-3 bg-navy text-white font-bold rounded-xl hover:bg-navy-light transition shadow">Save & Continue</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-slide-up-sm relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition">
            <X className="w-5 h-5" />
          </button>
          
          <div className="p-8">
            <div className="w-16 h-16 bg-sky-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-sky-100">
              <Building2 className="w-8 h-8 text-sky-600" />
            </div>
            <h3 className="font-sora font-bold text-2xl text-navy text-center mb-2">Confirm Withdrawal</h3>
            <p className="text-slate-500 text-sm text-center mb-6">You are withdrawing <strong className="text-slate-800">₹{parseInt(amount, 10).toLocaleString()}</strong></p>
            
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 mb-6 relative">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Transferring To</p>
              
              {bankAccounts.length > 0 && selectedBankId ? (
                bankAccounts.length === 1 ? (
                  (() => {
                    const bank = bankAccounts[0];
                    return (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-bold text-navy">{bank.bankName}</p>
                          <p className="text-sm font-semibold text-slate-600">XXXX{bank.accountNumber.slice(-4)}</p>
                        </div>
                        <p className="text-sm text-slate-500">{bank.accountName}</p>
                      </div>
                    );
                  })()
                ) : (
                  <div className="space-y-3 mt-2">
                    {bankAccounts.map((bank) => (
                      <div 
                        key={bank.id}
                        onClick={() => setSelectedBankId(bank.id)}
                        className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${selectedBankId === bank.id ? 'border-sky-500 bg-sky-50' : 'border-slate-200 bg-white hover:border-sky-300'}`}
                      >
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 mt-0.5 ${selectedBankId === bank.id ? 'border-sky-500 bg-sky-500' : 'border-slate-300'}`}>
                          {selectedBankId === bank.id && <div className="w-2 h-2 bg-white rounded-full"></div>}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-bold text-navy text-sm">{bank.bankName}</p>
                            <p className="text-xs font-mono font-bold text-slate-500">XXXX{bank.accountNumber.slice(-4)}</p>
                          </div>
                          {bank.isDefault && (
                            <p className="text-xs font-bold text-sky-600 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Default Account</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : null}
            </div>

            <div className="flex items-start gap-2 bg-amber-50 text-amber-700 p-3 rounded-lg mb-8">
              <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p className="text-xs font-medium">Withdrawals usually process within 1-3 business days. Bank holidays may affect processing times.</p>
            </div>
            
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-[1] py-4 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition">Back</button>
              <button onClick={handleConfirmBank} className="flex-[2] py-4 bg-navy hover:bg-navy-light text-white font-bold rounded-xl transition shadow">Confirm Transfer</button>
            </div>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl animate-scale-in overflow-hidden p-8 text-center relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-navy transition">
            <X className="w-5 h-5" />
          </button>
          <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10" />
          </div>
          <h3 className="font-sora font-bold text-2xl text-navy mb-4">Withdrawal Requested</h3>
          <p className="font-semibold text-slate-600 mb-8">{successMessage}</p>
          <div className="bg-slate-50 p-4 rounded-xl mb-6">
            <p className="text-sm text-slate-500">Amount to be credited</p>
            <p className="font-sora font-bold text-xl text-navy">₹{parseInt(amount, 10).toLocaleString()}</p>
          </div>
          <button 
            onClick={onClose} 
            className="w-full py-4 bg-navy text-white rounded-xl font-bold hover:bg-navy-light transition shadow"
          >
            Done
          </button>
        </div>
      )}

      {isProcessing && (
        <div className="fixed inset-0 bg-navy/80 backdrop-blur-sm z-[7000] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl animate-scale-in overflow-hidden p-10 text-center">
            <div className="w-12 h-12 border-4 border-navy border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <h3 className="font-sora font-bold text-xl text-navy mb-2">Processing Request...</h3>
            <p className="text-slate-500 font-medium">Securing connection to bank gateway.</p>
          </div>
        </div>
      )}

      <PasswordVerificationModal
        isOpen={showPasswordModal}
        amount={parseInt(amount, 10)}
        onClose={() => setShowPasswordModal(false)}
        onVerified={handlePasswordVerified}
        isWithdrawal={true}
      />
    </div>
  );
};

export default TeacherWithdrawModal;
