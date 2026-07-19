import React, { createContext, useContext, useState, useEffect } from 'react';
import { Wallet, X, CheckCircle, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import WalletPaymentModal from '../components/shared/WalletPaymentModal';
import PasswordVerificationModal from '../components/shared/PasswordVerificationModal';
import api from '../services/api.js';
const WalletContext = createContext();

export const useWallet = () => useContext(WalletContext);

export const WalletProvider = ({ children }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [tokens, setTokens] = useState(5);
  const [pendingPurchaseRedirect, setPendingPurchaseRedirect] = useState(null);
  
  const [studentWallet, setStudentWallet] = useState({ balance: 0, transactions: [] });
  const [teacherWallet, setTeacherWallet] = useState({ balance: 0, totalEarnings: 0, totalWithdrawn: 0, transactions: [] });
  const [teacherBankAccounts, setTeacherBankAccounts] = useState([]);
  const [studentBankAccount, setStudentBankAccount] = useState(null);

  // Sync with Backend API & Storage
  useEffect(() => {
    if (!user) return;

    const fetchBackendWallet = async () => {
      try {
        if (user.role === 'student') {
          const walletData = await api.wallet.getStudentWallet();
          if (walletData) {
            setTokens(walletData.tokenBalance ?? 5);
            setStudentWallet(prev => ({
              ...prev,
              balance: walletData.cashBalanceRs ?? (walletData.cashBalancePaise / 100) ?? 0,
            }));
            localStorage.setItem('trueed_student_tokens', (walletData.tokenBalance ?? 5).toString());
          }
          try {
            const txData = await api.wallet.getTokenTransactions();
            if (Array.isArray(txData)) {
              setStudentWallet(prev => ({ ...prev, transactions: txData }));
            }
          } catch (e) {
            // ignore tx errors
          }
        } else if (user.role === 'teacher') {
          const tWallet = await api.teacher.getWallet();
          if (tWallet) {
            setTeacherWallet({
              balance: tWallet.balance ?? 0,
              totalEarnings: tWallet.totalEarnings ?? 0,
              totalWithdrawn: tWallet.totalWithdrawn ?? 0,
              transactions: tWallet.transactions || [],
            });
          }
        }
      } catch (err) {
        console.warn('Wallet backend sync info:', err.message);
      }
    };

    fetchBackendWallet();

    // Teacher Init
    const savedTeacher = localStorage.getItem('trueed_teacher_wallet_data');
    if (savedTeacher) {
      try {
        setTeacherWallet(JSON.parse(savedTeacher));
      } catch(e) {}
    }

    // Student Init
    const savedStudent = localStorage.getItem('trueed_student_wallet_data');
    if (savedStudent) {
      try {
        setStudentWallet(JSON.parse(savedStudent));
      } catch(e) {}
    }

    // Teacher Bank Accounts Init
    const savedBanks = localStorage.getItem('trueed_teacher_banks');
    if (savedBanks) {
      try {
        setTeacherBankAccounts(JSON.parse(savedBanks));
      } catch(e) {}
    }

    const savedTokens = localStorage.getItem('trueed_student_tokens');
    if (savedTokens !== null) {
      setTokens(parseInt(savedTokens, 10));
    }

    // Student Bank Account Init
    const savedStudentBank = localStorage.getItem('trueed_student_bank');
    if (savedStudentBank) {
      try {
        setStudentBankAccount(JSON.parse(savedStudentBank));
      } catch(e) {}
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('trueed_teacher_wallet_data', JSON.stringify(teacherWallet));
  }, [teacherWallet]);

  useEffect(() => {
    localStorage.setItem('trueed_student_wallet_data', JSON.stringify(studentWallet));
  }, [studentWallet]);

  const updateStudentBalance = (newBalance) => {
    setStudentWallet(p => ({ ...p, balance: newBalance }));
  };

  const updateTeacherBalance = (newBalance) => {
    setTeacherWallet(p => ({ ...p, balance: newBalance }));
  };

  const addStudentTransaction = (transaction) => {
    setStudentWallet(p => ({
      ...p,
      transactions: [transaction, ...p.transactions]
    }));
  };

  const addTeacherTransaction = (transaction, earningsDelta = 0, withdrawnDelta = 0) => {
    setTeacherWallet(p => ({
      ...p,
      totalEarnings: p.totalEarnings + earningsDelta,
      totalWithdrawn: p.totalWithdrawn + withdrawnDelta,
      transactions: [transaction, ...p.transactions]
    }));
  };

  const updateTokens = (newTokens) => {
    setTokens(newTokens);
    localStorage.setItem('trueed_student_tokens', newTokens.toString());
  };

  // Toast State
  const [toastMessage, setToastMessage] = useState(null);
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Modal States
  const [insufficientModal, setInsufficientModal] = useState({ isOpen: false, requiredAmount: 0, onSuccess: null });
  const [rechargeModal, setRechargeModal] = useState({ isOpen: false, prefillAmount: '', onSuccess: null });
  
  const [paymentModal, setPaymentModal] = useState({ isOpen: false, config: null, onSuccess: null });
  const [noTokensModal, setNoTokensModal] = useState({ isOpen: false, onSuccess: null });
  const [confirmTokenUsageModal, setConfirmTokenUsageModal] = useState({ isOpen: false, onSuccess: null, count: 1 });
  const [passwordModal, setPasswordModal] = useState({ isOpen: false, amount: 0, onSuccess: null, onStartProcessing: null });

  // -------------------------------------------------------------
  // CORE FUNCTIONS
  // -------------------------------------------------------------

  const requireBalance = (amount, onSuccess, onStartProcessing) => {
    // Only students make purchases (tokens/classrooms)
    const currentBalance = studentWallet.balance;
    if (currentBalance >= amount) {
      setPasswordModal({ isOpen: true, amount, onSuccess, onStartProcessing });
    } else {
      setInsufficientModal({ isOpen: true, requiredAmount: amount, onSuccess, onStartProcessing });
    }
  };

  const requireTokens = (count = 1, onSuccess) => {
    if (tokens >= count) {
      setConfirmTokenUsageModal({ isOpen: true, onSuccess, count });
    } else {
      setNoTokensModal({ isOpen: true, onSuccess });
    }
  };

  const handleAddMoneyClick = () => {
    setPendingPurchaseRedirect({
      path: location.pathname,
      config: null 
    });
    setInsufficientModal({ isOpen: false, requiredAmount: 0, onSuccess: null });
    
    // Insufficient modal is only shown to students making purchases
    navigate('/student/wallet');
  };

  const processStudentRecharge = (amount) => {
    const newBalance = studentWallet.balance + amount;
    updateStudentBalance(newBalance);
    showToast(`Successfully added ₹${amount} to wallet.`);
    
    if (insufficientModal.isOpen && insufficientModal.onSuccess) {
      const pendingSuccess = insufficientModal.onSuccess;
      const pendingStart = insufficientModal.onStartProcessing;
      const required = insufficientModal.requiredAmount;
      if (newBalance >= required) {
        setPasswordModal({ isOpen: true, amount: required, onSuccess: pendingSuccess, onStartProcessing: pendingStart });
      }
    } else if (pendingPurchaseRedirect) {
      const path = pendingPurchaseRedirect.path;
      setPendingPurchaseRedirect(null);
      navigate(path);
      setPaymentModal(pendingPurchaseRedirect.config);
    } else if (rechargeModal.onSuccess) {
      rechargeModal.onSuccess();
    }

    setRechargeModal({ isOpen: false, prefillAmount: '', onSuccess: null });
    setInsufficientModal({ isOpen: false, requiredAmount: 0, onSuccess: null });
  };

  const processTeacherRecharge = (amount) => {
    const newBalance = teacherWallet.balance + amount;
    updateTeacherBalance(newBalance);
    showToast(`Successfully added ₹${amount} to wallet.`);
  };

  const addBankAccount = (bankDetails) => {
    const newAccounts = [...teacherBankAccounts, { id: Date.now().toString(), ...bankDetails }];
    if (bankDetails.isDefault || newAccounts.length === 1) {
      // Unset default on others
      newAccounts.forEach(acc => acc.isDefault = false);
      const target = newAccounts.find(a => a.id === newAccounts[newAccounts.length - 1].id);
      if (target) target.isDefault = true;
    }
    setTeacherBankAccounts(newAccounts);
    localStorage.setItem('trueed_teacher_banks', JSON.stringify(newAccounts));
  };

  const setDefaultBankAccount = (bankId) => {
    const newAccounts = teacherBankAccounts.map(acc => ({
      ...acc,
      isDefault: acc.id === bankId
    }));
    setTeacherBankAccounts(newAccounts);
    localStorage.setItem('trueed_teacher_banks', JSON.stringify(newAccounts));
  };

  const addStudentBankAccount = (bankDetails) => {
    const account = { id: Date.now().toString(), ...bankDetails };
    setStudentBankAccount(account);
    localStorage.setItem('trueed_student_bank', JSON.stringify(account));
  };

  const removeStudentBankAccount = () => {
    setStudentBankAccount(null);
    localStorage.removeItem('trueed_student_bank');
  };

  const openRechargeModal = () => {
    setPendingPurchaseRedirect({
      path: location.pathname,
      config: paymentModal
    });
    setPaymentModal({ isOpen: false, config: null, onSuccess: null });
    
    // Token/classroom purchase is student-only flow
    navigate('/student/wallet');
  };

  const executeWalletPayment = async (amount, onSuccess, onStartProcessing) => {
    // 1. Close password modal
    setPasswordModal({ isOpen: false, amount: 0, onSuccess: null, onStartProcessing: null });
    
    // 2. Trigger processing state in UI
    if (onStartProcessing) onStartProcessing();

    // 3. Process Wallet Payment API simulation
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // 4. Complete purchase and deduct from Student Wallet (only students buy tokens/classrooms)
    setStudentWallet(prev => {
      const newBal = prev.balance - amount;
      return { ...prev, balance: newBal };
    });
    
    showToast('Purchase completed successfully.');
    if (onSuccess) onSuccess();
  };

  return (
    <WalletContext.Provider value={{ 
      tokens, 
      updateTokens,
      updateStudentBalance,
      updateTeacherBalance,
      teacherWallet,
      studentWallet,
      teacherBankAccounts,
      addBankAccount,
      setDefaultBankAccount,
      addStudentTransaction,
      addTeacherTransaction,
      requireBalance, 
      requireTokens, 
      openRechargeModal,
      openPaymentModal: (config) => setPaymentModal({ isOpen: true, config, onSuccess: config.onSuccess }),
      openTokenModal: (pkgPrice = null) => setPaymentModal({ isOpen: true, config: { type: 'token', preselected: pkgPrice }, onSuccess: null }),
      showToast,
      processStudentRecharge,
      processTeacherRecharge,
      studentBankAccount,
      addStudentBankAccount,
      removeStudentBankAccount
    }}>
      {children}

      {/* Global Toast */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 bg-navy text-white px-6 py-3 rounded-xl shadow-xl font-bold flex items-center gap-2 z-[9999] animate-slide-up-sm">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          {toastMessage}
        </div>
      )}

      {/* Insufficient Balance Modal */}
      {insufficientModal.isOpen && (
        <div className="fixed inset-0 bg-navy/80 backdrop-blur-sm z-[5000] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-brand shadow-2xl animate-scale-in overflow-hidden relative">
            <button onClick={() => setInsufficientModal({ isOpen: false, requiredAmount: 0, onSuccess: null })} className="absolute top-4 right-4 text-slate-400 hover:text-navy transition">
              <X className="w-5 h-5" />
            </button>
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-8 h-8" />
              </div>
              <h3 className="font-sora font-bold text-xl text-navy mb-2">Insufficient Balance</h3>
              <p className="text-sm font-medium text-slate-500 mb-6">Your wallet balance is insufficient to complete this purchase. Please add money to continue.</p>
              
              <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-100">
                <div className="flex justify-between mb-2 text-sm">
                  <span className="text-slate-500 font-medium">Required Amount</span>
                  <span className="font-bold text-navy">₹{insufficientModal.requiredAmount}</span>
                </div>
                <div className="flex justify-between mb-2 text-sm">
                  <span className="text-slate-500 font-medium">Current Balance</span>
                  <span className="font-bold text-slate-700">₹{studentWallet.balance}</span>
                </div>
                <div className="border-t border-slate-200 mt-2 pt-2 flex justify-between text-sm">
                  <span className="text-slate-700 font-bold">Needed</span>
                  <span className="font-bold text-rose-600">₹{Math.max(0, insufficientModal.requiredAmount - studentWallet.balance)}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setInsufficientModal({ isOpen: false, requiredAmount: 0, onSuccess: null })} className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-lg font-bold hover:bg-slate-200 transition">
                  Cancel
                </button>
                <button onClick={handleAddMoneyClick} className="flex-[2] py-3 bg-sky-500 text-white rounded-lg font-bold hover:bg-sky-400 transition">
                  Add Money to Wallet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recharge Modal */}
      {rechargeModal.isOpen && (
        <RechargeModalInner 
          initialAmount={rechargeModal.prefillAmount}
          onClose={() => setRechargeModal({ isOpen: false, prefillAmount: '', onSuccess: null })}
          onProcess={processRecharge}
          currentBalance={user?.role === 'teacher' ? teacherWallet.balance : studentWallet.balance}
        />
      )}

      {/* No Tokens Modal */}
      {noTokensModal.isOpen && (
        <div className="fixed inset-0 bg-navy/80 backdrop-blur-sm z-[5000] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-brand shadow-2xl animate-scale-in overflow-hidden relative">
            <button onClick={() => setNoTokensModal({ isOpen: false, onSuccess: null })} className="absolute top-4 right-4 text-slate-400 hover:text-navy transition">
              <X className="w-5 h-5" />
            </button>
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fa-solid fa-coins text-3xl" />
              </div>
              <h3 className="font-sora font-bold text-xl text-navy mb-2">No Query Tokens</h3>
              <p className="text-sm font-medium text-slate-500 mb-6">You don't have any query tokens remaining. Purchase more tokens to continue.</p>
              
              <div className="flex gap-3">
                <button onClick={() => setNoTokensModal({ isOpen: false, onSuccess: null })} className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-lg font-bold hover:bg-slate-200 transition">
                  Cancel
                </button>
                <button onClick={() => {
                  setNoTokensModal(prev => ({ ...prev, isOpen: false }));
                  setPaymentModal({ isOpen: true, config: { type: 'token', preselected: null }, onSuccess: noTokensModal.onSuccess });
                }} className="flex-[2] py-3 bg-amber-500 text-white rounded-lg font-bold hover:bg-amber-400 transition">
                  Buy Tokens
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Token Usage Modal */}
      {confirmTokenUsageModal.isOpen && (
        <div className="fixed inset-0 bg-navy/80 backdrop-blur-sm z-[5000] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-brand shadow-2xl animate-scale-in overflow-hidden relative">
            <button onClick={() => setConfirmTokenUsageModal({ isOpen: false, onSuccess: null, count: 1 })} className="absolute top-4 right-4 text-slate-400 hover:text-navy transition">
              <X className="w-5 h-5" />
            </button>
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-sky-50 text-sky-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fa-solid fa-coins text-3xl" />
              </div>
              <h3 className="font-sora font-bold text-xl text-navy mb-2">Send Classroom Query?</h3>
              <p className="text-sm font-medium text-slate-500 mb-6">You are about to use <span className="font-bold text-navy">{confirmTokenUsageModal.count} Query Token</span>.</p>
              
              <div className="flex gap-3">
                <button onClick={() => setConfirmTokenUsageModal({ isOpen: false, onSuccess: null, count: 1 })} className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-lg font-bold hover:bg-slate-200 transition">
                  Cancel
                </button>
                <button onClick={() => {
                  updateTokens(tokens - confirmTokenUsageModal.count);
                  if (confirmTokenUsageModal.onSuccess) confirmTokenUsageModal.onSuccess();
                  setConfirmTokenUsageModal({ isOpen: false, onSuccess: null, count: 1 });
                }} className="flex-[2] py-3 bg-navy text-white rounded-lg font-bold hover:bg-navy-light transition shadow-sm">
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Wallet Payment Modal */}
      <WalletPaymentModal
        isOpen={paymentModal.isOpen} 
        onClose={() => setPaymentModal({ isOpen: false, config: null, onSuccess: null })} 
        onPaymentComplete={(result) => {
          if (paymentModal.config?.type === 'token') {
            updateTokens(result);
          }
        }}
        onSuccess={(result) => {
          setPaymentModal({ isOpen: false, config: null, onSuccess: null });
          if (paymentModal.onSuccess) {
            if (paymentModal.config?.type === 'token') {
              // Deduct the 1 token required for the query right away
              updateTokens(result - 1);
            }
            paymentModal.onSuccess(result);
          }
        }}
        currentTokens={tokens}
        walletBalance={studentWallet.balance}
        requireBalance={requireBalance}
        paymentConfig={paymentModal.config}
        onRechargeRequested={() => {
          setPaymentModal({ isOpen: false, config: null, onSuccess: null });
          openRechargeModal();
        }}
      />

      {/* Password Verification Modal */}
      <PasswordVerificationModal
        isOpen={passwordModal.isOpen}
        amount={passwordModal.amount}
        onClose={() => setPasswordModal({ isOpen: false, amount: 0, onSuccess: null, onStartProcessing: null })}
        onVerified={() => executeWalletPayment(passwordModal.amount, passwordModal.onSuccess, passwordModal.onStartProcessing)}
      />
    </WalletContext.Provider>
  );
};

// Extracted inner component for Recharge Modal to manage its own custom amount state
const RechargeModalInner = ({ initialAmount, onClose, onProcess, currentBalance }) => {
  const [customAmount, setCustomAmount] = useState(initialAmount || '');

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
          <h3 className="font-sora font-bold text-2xl text-navy text-center mb-2">Add Money</h3>
          <p className="text-slate-500 text-sm text-center mb-8">Current Balance: <strong className="text-slate-800">₹{currentBalance.toLocaleString()}</strong></p>
          
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[200, 500, 1000, 2000].map(amt => (
              <button 
                key={amt}
                onClick={() => setCustomAmount(amt.toString())}
                className={`py-3 rounded-xl border font-bold text-sm transition ${customAmount === amt.toString() ? 'border-sky-500 bg-sky-50 text-sky-700' : 'border-slate-200 text-slate-600 hover:border-sky-300 hover:bg-slate-50'}`}
              >
                + ₹{amt}
              </button>
            ))}
          </div>

          <div className="relative mb-8">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-sora font-bold text-slate-400">₹</span>
            <input 
              type="number" 
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              placeholder="Enter custom amount"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-slate-800 font-bold focus:outline-none focus:border-navy focus:bg-white transition"
            />
          </div>
          
          <button 
            onClick={() => onProcess(parseInt(customAmount || 0, 10))}
            disabled={!customAmount || parseInt(customAmount, 10) <= 0}
            className="w-full py-4 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition shadow flex items-center justify-center gap-2"
          >
            Proceed to Pay ₹{customAmount || 0}
          </button>
        </div>
      </div>
    </div>
  );
};


