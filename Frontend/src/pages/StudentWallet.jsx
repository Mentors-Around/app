import React, { useState, useEffect } from 'react';
import { Wallet, ArrowDownToLine, ArrowUpFromLine, Clock, CheckCircle, X, History, ExternalLink, ChevronRight, Mail, ArrowUpRight, ArrowDownRight, Landmark, Pencil, Trash2, Shield } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import { useWallet } from '../contexts/WalletContext';
import PasswordVerificationModal from '../components/shared/PasswordVerificationModal';
import DepositModal from '../components/shared/DepositModal';
import AddBankAccountModal from '../components/shared/AddBankAccountModal';

const StudentWallet = () => {
  const { user } = useAuth();
  const { updateStudentBalance, showToast, processStudentRecharge, addStudentTransaction, studentWallet, tokens, openTokenModal, studentBankAccount, addStudentBankAccount, removeStudentBankAccount } = useWallet();

  const [transactions, setTransactions] = useState([]);
  
  // Modals
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showAddBankModal, setShowAddBankModal] = useState(false);
  const [showBankRequiredModal, setShowBankRequiredModal] = useState(false);
  const [showRemoveBankModal, setShowRemoveBankModal] = useState(false);

  useEffect(() => {
    document.title = 'Wallet & Payments — TrueEd';
    setTransactions(studentWallet?.transactions || []);
  }, [user, studentWallet]);

  const handleDeposit = (amount) => {
    if (!amount || amount <= 0) return;
    
    setShowDepositModal(false);
    
    setSuccessMessage(`₹${amount} has been added to your wallet.`);
    setShowSuccessModal(true);
    
    // Process recharge in context
    processStudentRecharge(amount);

    const newTxn = {
      id: `TXN-${Math.floor(10000 + Math.random() * 90000)}`,
      date: new Date().toISOString(),
      type: 'Wallet Deposit',
      amount: amount,
      status: 'Completed',
      isCredit: true,
      title: 'Added via UPI'
    };
    addStudentTransaction(newTxn);
  };

  const handleWithdrawClick = () => {
    if (!studentWallet?.balance || studentWallet.balance <= 0) {
      setSuccessMessage('Insufficient Wallet Balance. Your wallet balance is ₹0. Please deposit money before requesting a withdrawal.');
      setShowSuccessModal(true);
    } else if (!studentBankAccount) {
      setShowBankRequiredModal(true);
    } else {
      setShowWithdrawModal(true);
    }
  };

  const handleWithdrawStart = () => {
    const amount = parseInt(withdrawAmount, 10);
    if (!amount || amount <= 0) return;
    setShowWithdrawModal(false);
    setShowPasswordModal(true);
  };

  const handleWithdrawComplete = () => {
    setShowPasswordModal(false);
    setIsProcessing(true);
    const amount = parseInt(withdrawAmount, 10);
    
    setTimeout(() => {
      setIsProcessing(false);
      updateStudentBalance((studentWallet?.balance || 0) - amount);
      setSuccessMessage(`₹${amount} has been successfully refunded to your original payment method.`);
      setShowSuccessModal(true);
      setWithdrawAmount('');

      const newTxn = {
        id: `TXN-${Math.floor(10000 + Math.random() * 90000)}`,
        date: new Date().toISOString(),
        type: 'Withdrawal',
        amount: amount,
        status: 'Completed',
        isCredit: false,
        title: 'Refund to Original Payment Method'
      };
      addStudentTransaction(newTxn);
    }, 1500);
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ', ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  // Transaction rendering component
  const TransactionList = ({ txns }) => (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mt-8">
      <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <h3 className="font-sora font-bold text-base sm:text-lg text-navy flex items-center gap-2">
          <History className="w-5 h-5 text-sky" /> Recent Transactions
        </h3>
        <button className="text-sm font-bold text-sky hover:text-navy transition flex items-center gap-1 self-start sm:self-auto">
          Download Statement <Download className="w-4 h-4 ml-1" />
        </button>
      </div>
      
      {txns.length === 0 ? (
        <div className="p-12 text-center text-slate-500">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <History className="w-6 h-6 text-slate-300" />
          </div>
          <p className="font-medium">No transactions found.</p>
          <p className="text-sm mt-1">Your wallet activity, deposits, withdrawals, classroom payments, token purchases, and refunds will appear here.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {txns.map(txn => (
            <div key={txn.id} className="p-4 sm:p-5 hover:bg-slate-50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 group cursor-pointer">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shrink-0 ${txn.isCredit ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>
                  {txn.isCredit ? <ArrowDownLeft className="w-4.5 h-4.5 sm:w-5 sm:h-5" /> : <ArrowUpRight className="w-4.5 h-4.5 sm:w-5 sm:h-5" />}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-navy text-sm sm:text-base mb-0.5 truncate">{txn.title}</p>
                  <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <span>{txn.type}</span>
                    <span className="hidden sm:inline w-1 h-1 bg-slate-300 rounded-full"></span>
                    <span>{formatDate(txn.date)}</span>
                  </div>
                </div>
              </div>
              <div className="flex sm:flex-col justify-between sm:justify-center items-center sm:items-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                <p className={`font-sora font-bold text-base sm:text-lg ${txn.isCredit ? 'text-emerald-600' : 'text-slate-700'}`}>
                  {txn.isCredit ? '+' : '-'} ₹{txn.amount.toLocaleString()}
                </p>
                <p className="text-[10px] sm:text-xs font-bold text-slate-400 mt-0.5 flex items-center justify-end gap-1">
                  {txn.status} <CheckCircle className="w-3 h-3 text-emerald-500" />
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
 
  return (
    <div className="max-w-6xl mx-auto pb-12 relative px-4 sm:px-6">
      <div className="mb-8">
        <h1 className="font-sora text-2xl sm:text-3xl font-bold text-navy mb-2">Wallet & Payments</h1>
        <p className="text-slate-500 font-medium text-sm sm:text-base">
          Manage your wallet balance, deposits, withdrawals, and payment history.
        </p>
      </div>
 
      <div className="max-w-4xl mx-auto">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 mb-8 shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-sky-50 rounded-bl-full -z-0 opacity-50"></div>
          <div className="w-16 h-16 bg-sky-50 text-sky-500 rounded-full flex items-center justify-center mb-6 relative z-10">
            <Wallet className="w-8 h-8" />
          </div>
          <p className="text-slate-500 font-bold uppercase tracking-wider text-xs sm:text-sm mb-2 relative z-10">Available Wallet Balance</p>
          <h2 className="font-sora text-3xl sm:text-5xl font-bold text-navy mb-8 relative z-10">₹{(studentWallet?.balance || 0).toLocaleString()}</h2>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto relative z-10">
            <button 
              onClick={() => setShowDepositModal(true)} 
              className="w-full sm:w-auto px-6 sm:px-10 py-3.5 sm:py-4 bg-sky-500 hover:bg-sky-400 text-white rounded-xl font-bold transition flex items-center justify-center gap-2 text-base sm:text-lg shadow-sm"
            >
              <ArrowDownToLine className="w-5 h-5" /> Deposit Money
            </button>
            <button 
              onClick={handleWithdrawClick} 
              className="w-full sm:w-auto px-6 py-3.5 sm:py-4 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl font-bold transition flex items-center justify-center gap-2 text-base sm:text-lg"
            >
              <ArrowUpFromLine className="w-5 h-5" /> Withdraw
              </button>
            </div>
          </div>

          {/* Quick Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col justify-center">
              <div className="w-10 h-10 bg-sky-50 text-sky-600 rounded-full flex items-center justify-center mb-3">
                <Wallet className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Wallet Balance</p>
              <p className="font-sora font-bold text-xl text-navy">₹{(studentWallet?.balance || 0).toLocaleString()}</p>
            </div>
            
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col justify-center relative overflow-hidden">
              <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mb-3">
                <i className="fa-solid fa-coins"></i>
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Query Tokens</p>
              <div className="flex items-center justify-between">
                <p className="font-sora font-bold text-xl text-navy">{tokens}</p>
                <button onClick={() => openTokenModal()} className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-lg hover:bg-amber-200 transition">Buy Tokens</button>
              </div>
            </div>
            
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col justify-center">
              <div className="w-10 h-10 bg-slate-50 text-slate-600 rounded-full flex items-center justify-center mb-3">
                <History className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Last Transaction</p>
              {transactions.length > 0 ? (
                <>
                  <p className="font-sora font-bold text-md text-navy truncate">{transactions[0].type}</p>
                  <p className={`text-sm font-bold ${transactions[0].isCredit ? 'text-emerald-600' : 'text-slate-600'}`}>
                    {transactions[0].isCredit ? '+' : '-'}₹{transactions[0].amount}
                  </p>
                </>
              ) : (
                <p className="text-sm font-medium text-slate-500">No activity yet</p>
              )}
            </div>
          </div>

          <TransactionList txns={transactions} />

          {/* Bank Details Section */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mt-8">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-sora font-bold text-lg text-navy flex items-center gap-2">
                <Landmark className="w-5 h-5 text-sky" /> Bank Details
              </h3>
              <p className="text-slate-500 text-sm font-medium mt-1">
                Manage the bank account where your wallet withdrawals and refunds will be transferred.
              </p>
            </div>

            {!studentBankAccount ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Landmark className="w-6 h-6 text-slate-300" />
                </div>
                <p className="font-bold text-slate-700 mb-1">No bank account added.</p>
                <p className="text-sm text-slate-500 mb-6">Add your bank account to withdraw wallet balance or receive refunds.</p>
                <button
                  onClick={() => setShowAddBankModal(true)}
                  className="px-6 py-3 bg-navy text-white font-bold rounded-xl hover:bg-navy-light transition shadow-sm inline-flex items-center gap-2"
                >
                  <i className="fa-solid fa-plus text-sm" /> Add Bank Account
                </button>
              </div>
            ) : (
              <div className="p-6">
                <div className="bg-gradient-to-br from-slate-50 to-sky-50/30 border border-slate-200 rounded-xl p-6 relative">
                  <div className="absolute top-4 right-4 flex items-center gap-2">
                    <button
                      onClick={() => setShowAddBankModal(true)}
                      className="p-2 text-slate-400 hover:text-navy hover:bg-white rounded-lg transition"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setShowRemoveBankModal(true)}
                      className="p-2 text-slate-400 hover:text-rose-500 hover:bg-white rounded-lg transition"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-sky-100 text-sky-600 rounded-xl flex items-center justify-center shrink-0">
                      <Landmark className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-bold text-navy text-lg">{studentBankAccount.accountName}</p>
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full uppercase tracking-wider flex items-center gap-1">
                          <Shield className="w-3 h-3" /> Default
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bank</p>
                          <p className="font-semibold text-slate-700">{studentBankAccount.bankName}</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Account No.</p>
                          <p className="font-semibold text-slate-700 font-mono">XXXX XXXX {studentBankAccount.accountNumber.slice(-4)}</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">IFSC</p>
                          <p className="font-semibold text-slate-700 font-mono">{studentBankAccount.ifscCode}</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Type</p>
                          <p className="font-semibold text-slate-700">{studentBankAccount.accountType}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      {/* Deposit Modal */}
      <DepositModal 
        isOpen={showDepositModal}
        onClose={() => setShowDepositModal(false)}
        onProcess={handleDeposit}
      />
      
      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-navy/80 backdrop-blur-sm flex items-center justify-center p-4 z-[6000]">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-slide-up-sm relative">
            <button onClick={() => setShowWithdrawModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition">
              <X className="w-5 h-5" />
            </button>
            
            <div className="p-8">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                <ArrowUpFromLine className="w-8 h-8 text-slate-700" />
              </div>
              <h3 className="font-sora font-bold text-2xl text-navy text-center mb-2">Withdraw Money</h3>
              <p className="text-slate-500 text-sm text-center mb-6">Available Balance: <strong className="text-slate-800">₹{(studentWallet?.balance || 0).toLocaleString()}</strong></p>
              
              <div className="relative mb-6">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Withdraw Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-sora font-bold text-slate-400">₹</span>
                  <input 
                    type="number" 
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-slate-800 font-bold focus:outline-none focus:border-navy focus:bg-white transition"
                  />
                </div>
              </div>
              
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mb-8 text-center">
                 <p className="text-sm font-semibold text-slate-600 mb-1">Refund to Original Payment Method</p>
                 <p className="text-xs text-slate-500 flex items-center justify-center gap-1">
                   <Clock className="w-3 h-3" /> Usually processed within 5–7 business days.
                 </p>
              </div>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowWithdrawModal(false)}
                  className="flex-[1] py-4 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleWithdrawStart}
                  disabled={!withdrawAmount || parseInt(withdrawAmount, 10) <= 0 || parseInt(withdrawAmount, 10) > (studentWallet?.balance || 0)}
                  className="flex-[2] py-4 bg-navy hover:bg-navy-light disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition shadow flex items-center justify-center gap-2"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-navy/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl animate-scale-in overflow-hidden p-8 text-center relative">
            <button onClick={() => setShowSuccessModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-navy transition">
              <X className="w-5 h-5" />
            </button>
            <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="font-sora font-bold text-2xl text-navy mb-4">
              {successMessage.includes('added') ? 'Money Added Successfully' : 
               successMessage.includes('Insufficient') ? 'Insufficient Balance' : 'Withdrawal Successful'}
            </h3>
            <p className="font-semibold text-slate-600 mb-8">{successMessage}</p>
            <button 
              onClick={() => setShowSuccessModal(false)} 
              className="w-full py-3.5 bg-navy text-white rounded-lg font-bold hover:bg-navy-light transition"
            >
              Done
            </button>
          </div>
        </div>
      )}
      
      {/* Processing State for Withdraw */}
      {isProcessing && (
        <div className="fixed inset-0 bg-navy/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl animate-scale-in overflow-hidden p-10 text-center">
            <div className="w-12 h-12 border-4 border-navy border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <h3 className="font-sora font-bold text-xl text-navy mb-2">Processing Withdrawal...</h3>
            <p className="text-slate-500 font-medium">Please do not close this window.</p>
          </div>
        </div>
      )}
      
      <PasswordVerificationModal
        isOpen={showPasswordModal}
        amount={parseInt(withdrawAmount, 10)}
        onClose={() => setShowPasswordModal(false)}
        onVerified={handleWithdrawComplete}
        isWithdrawal={true}
      />

      {/* Add Bank Account Modal */}
      <AddBankAccountModal
        isOpen={showAddBankModal}
        onClose={() => setShowAddBankModal(false)}
        onSave={(bank) => {
          addStudentBankAccount(bank);
          setShowAddBankModal(false);
          showToast('Bank account saved successfully.');
        }}
      />

      {/* Bank Required Modal */}
      {showBankRequiredModal && (
        <div className="fixed inset-0 bg-navy/80 backdrop-blur-sm z-[8000] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-slide-up-sm relative p-8 text-center">
            <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Landmark className="w-8 h-8" />
            </div>
            <h3 className="font-sora font-bold text-xl text-navy mb-2">Bank Account Required</h3>
            <p className="text-slate-500 text-sm font-medium mb-6">
              Please add a bank account before withdrawing your wallet balance.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowBankRequiredModal(false)}
                className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowBankRequiredModal(false);
                  setShowAddBankModal(true);
                }}
                className="flex-[2] py-3 bg-navy text-white font-bold rounded-xl hover:bg-navy-light transition shadow"
              >
                Add Bank Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Bank Confirmation Modal */}
      {showRemoveBankModal && (
        <div className="fixed inset-0 bg-navy/80 backdrop-blur-sm z-[8000] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-slide-up-sm relative p-8 text-center">
            <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8" />
            </div>
            <h3 className="font-sora font-bold text-xl text-navy mb-2">Remove Bank Account?</h3>
            <p className="text-slate-500 text-sm font-medium mb-6">
              Are you sure you want to remove this bank account? You won't be able to make withdrawals without a bank account.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowRemoveBankModal(false)}
                className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  removeStudentBankAccount();
                  setShowRemoveBankModal(false);
                  showToast('Bank account removed.');
                }}
                className="flex-[2] py-3 bg-rose-500 text-white font-bold rounded-xl hover:bg-rose-600 transition shadow"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
};

// Simple ArrowDownLeft and Download icon components (if missing from lucide)
const ArrowDownLeft = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="17" y1="7" x2="7" y2="17"></line>
    <polyline points="17 17 7 17 7 7"></polyline>
  </svg>
);

const Download = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="7 10 12 15 17 10"></polyline>
    <line x1="12" y1="15" x2="12" y2="3"></line>
  </svg>
);

export default StudentWallet;
