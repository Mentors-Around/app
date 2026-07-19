import React, { useState } from 'react';
import { X, Landmark } from 'lucide-react';

const AddBankAccountModal = ({ isOpen, onClose, onSave }) => {
  const [bankForm, setBankForm] = useState({
    accountName: '',
    bankName: '',
    accountNumber: '',
    confirmAccountNumber: '',
    ifscCode: '',
    branchName: '',
    accountType: 'Savings'
  });

  if (!isOpen) return null;

  const handleSaveBank = () => {
    if (!bankForm.accountName || !bankForm.bankName || !bankForm.accountNumber || !bankForm.ifscCode) {
      alert("Please fill all required fields.");
      return;
    }
    if (bankForm.accountNumber !== bankForm.confirmAccountNumber) {
      alert("Account numbers do not match.");
      return;
    }
    // simple IFSC validation mock (at least 4 chars)
    if (bankForm.ifscCode.length < 4) {
      alert("Invalid IFSC code format.");
      return;
    }
    
    onSave(bankForm);
    setBankForm({
      accountName: '',
      bankName: '',
      accountNumber: '',
      confirmAccountNumber: '',
      ifscCode: '',
      branchName: '',
      accountType: 'Savings'
    });
  };

  return (
    <div className="fixed inset-0 bg-navy/80 backdrop-blur-sm z-[8000] flex items-center justify-center p-4">
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
                <label className="block text-xs font-bold text-slate-500 mb-1">Branch Name (Optional)</label>
                <input type="text" value={bankForm.branchName} onChange={(e) => setBankForm({...bankForm, branchName: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-slate-800 focus:outline-none focus:border-navy" placeholder="e.g. Koramangala" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Account Type</label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                  <input type="radio" name="accountType" checked={bankForm.accountType === 'Savings'} onChange={() => setBankForm({...bankForm, accountType: 'Savings'})} className="text-navy focus:ring-navy" />
                  Savings
                </label>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                  <input type="radio" name="accountType" checked={bankForm.accountType === 'Current'} onChange={() => setBankForm({...bankForm, accountType: 'Current'})} className="text-navy focus:ring-navy" />
                  Current
                </label>
              </div>
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-slate-100 flex gap-3 bg-slate-50">
          <button onClick={onClose} className="px-6 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-100 transition">Cancel</button>
          <button onClick={handleSaveBank} className="flex-1 py-3 bg-navy text-white font-bold rounded-xl hover:bg-navy-light transition shadow">Save Bank Details</button>
        </div>
      </div>
    </div>
  );
};

export default AddBankAccountModal;
