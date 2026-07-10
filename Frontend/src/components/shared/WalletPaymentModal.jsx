import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Loader2, X } from 'lucide-react';
import QueryTokenPackages from './QueryTokenPackages';

const WalletPaymentModal = ({ isOpen, onClose, onSuccess, onPaymentComplete, currentTokens, walletBalance, requireBalance, paymentConfig, onRechargeRequested }) => {
  const packages = [
    { price: 19, tokens: 5, badge: '⭐ Most Popular', highlight: true },
    { price: 35, tokens: 10, badge: '💎 Best Value' },
    { price: 79, tokens: 25, badge: '💰 Save More' },
  ];

  const [selectedPackage, setSelectedPackage] = useState(19);
  const [step, setStep] = useState('select'); // 'select' | 'confirm' | 'processing' | 'success' | 'insufficient'

  useEffect(() => {
    if (isOpen && paymentConfig) {
      if (paymentConfig.type === 'classroom') {
         if (walletBalance < paymentConfig.details.price) {
           setStep('insufficient');
         } else {
           setStep('confirm');
         }
      } else if (paymentConfig.type === 'token') {
        if (paymentConfig.preselected) {
          setSelectedPackage(paymentConfig.preselected);
          const pkg = packages.find(p => p.price === paymentConfig.preselected) || packages[0];
          if (walletBalance < pkg.price) {
            setStep('insufficient');
          } else {
            setStep('confirm');
          }
        } else {
          setSelectedPackage(19);
          setStep('select');
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, paymentConfig]);

  if (!isOpen || !paymentConfig) return null;

  const isClassroom = paymentConfig.type === 'classroom';
  const selectedTokenPkg = packages.find(p => p.price === selectedPackage) || packages[0];
  const itemPrice = isClassroom ? paymentConfig.details.price : selectedTokenPkg.price;

  const handleProceedToConfirm = () => {
    if (walletBalance < itemPrice) {
      setStep('insufficient');
    } else {
      setStep('confirm');
    }
  };

  const handlePayment = () => {
    if (walletBalance >= itemPrice) {
      if (requireBalance) {
        setStep('waiting_password');
        requireBalance(
          itemPrice, 
          // onSuccess
          () => {
             if (isClassroom) {
               if (onPaymentComplete) onPaymentComplete();
             } else {
               const newTokens = currentTokens + selectedTokenPkg.tokens;
               if (onPaymentComplete) onPaymentComplete(newTokens);
             }
             setStep('success');
          },
          // onStartProcessing
          () => {
             setStep('processing');
          }
        );
      } else {
         if (!isClassroom) {
           const newTokens = currentTokens + selectedTokenPkg.tokens;
           localStorage.setItem('trueed_student_tokens', newTokens.toString());
           if (onPaymentComplete) onPaymentComplete(newTokens);
         } else {
           if (onPaymentComplete) onPaymentComplete();
         }
         setStep('success');
      }
    } else {
      setStep('insufficient');
    }
  };

  const handleSuccessContinue = () => {
    if (isClassroom) {
      onSuccess();
    } else {
      const newTokens = currentTokens + selectedTokenPkg.tokens;
      onSuccess(newTokens);
    }
  };

  const renderSelect = () => (
    <>
      <div className="p-6 border-b border-slate-100 text-center relative">
        <h3 className="font-sora font-bold text-xl text-navy">Buy Query Tokens</h3>
        <p className="text-sm font-medium text-slate-500 mt-2">
          Current Tokens: <span className="text-navy font-bold">{currentTokens}</span>
        </p>
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-navy transition">
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <div className="p-6">
        <p className="text-sm font-bold text-slate-500 mb-3 text-center">Choose a package</p>
        <QueryTokenPackages onSelect={(price) => {
          setSelectedPackage(price);
          if (walletBalance < price) {
            setStep('insufficient');
          } else {
            setStep('confirm');
          }
        }} />
      </div>
    </>
  );

  const renderConfirm = () => (
    <div className="p-8 text-center relative">
      <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-navy transition">
        <X className="w-5 h-5" />
      </button>
      
      <h3 className="font-sora font-bold text-2xl text-navy mb-4">
        {isClassroom ? 'Confirm Classroom Enrollment' : 'Confirm Token Purchase'}
      </h3>
      
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-6 text-left">
        <p className="text-slate-600 font-medium mb-3">
          {isClassroom ? 'You are about to enroll in:' : 'You are about to purchase:'}
        </p>
        
        {isClassroom ? (
          <div className="mb-4">
            <h4 className="font-bold text-navy text-lg leading-tight mb-1">{paymentConfig.details.name}</h4>
            <p className="text-sm font-semibold text-slate-500 mb-4">Teacher: {paymentConfig.details.teacherName || paymentConfig.details.teacher}</p>
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-500 text-sm">Course Fee</span>
              <span className="font-sora font-bold text-navy text-xl">₹{itemPrice}</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between mb-4">
            <span className="font-bold text-navy text-lg flex items-center gap-2">
              🪙 {selectedTokenPkg.tokens} Query Tokens
            </span>
            <span className="font-sora font-bold text-navy text-xl">₹{itemPrice}</span>
          </div>
        )}
        
        <div className="space-y-2 border-t border-slate-200 pt-4 pb-2">
           <div className="flex justify-between text-sm">
             <span className="text-slate-500 font-medium">Current Wallet Balance:</span>
             <span className="font-bold text-slate-700">₹{walletBalance}</span>
           </div>
           <div className="flex justify-between text-sm">
             <span className="text-slate-500 font-medium">Wallet Balance After Payment:</span>
             <span className="font-bold text-slate-700">₹{walletBalance - itemPrice}</span>
           </div>
        </div>

        {!isClassroom && (
          <div className="space-y-2 border-t border-slate-200 pt-3">
            <p className="text-sm font-semibold text-slate-500 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" /> 1 token = 1 classroom query
            </p>
            <p className="text-sm font-semibold text-slate-500 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" /> Tokens never expire
            </p>
          </div>
        )}
      </div>

      <p className="text-navy font-bold mb-6">Do you want to continue?</p>

      <div className="flex gap-3">
        <button 
          onClick={onClose}
          className="flex-[1] py-3.5 bg-slate-100 text-slate-700 rounded-lg font-bold hover:bg-slate-200 transition"
        >
          Cancel
        </button>
        <button 
          onClick={handlePayment} 
          className="flex-[2] py-3.5 bg-success text-white rounded-lg font-bold hover:bg-green-600 transition flex items-center justify-center gap-2 shadow-sm"
        >
          Pay ₹{itemPrice} from Wallet
        </button>
      </div>
    </div>
  );

  const renderProcessing = () => (
    <div className="p-12 text-center relative">
      <div className="flex justify-center mb-6">
        <Loader2 className="w-12 h-12 text-navy animate-spin" />
      </div>
      <h3 className="font-sora font-bold text-xl text-navy mb-2">Processing Payment...</h3>
      <p className="text-slate-500 font-medium">Please do not close this window.</p>
    </div>
  );

  const renderSuccess = () => (
    <div className="p-8 text-center relative">
      <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle className="w-8 h-8" />
      </div>
      
      <h3 className="font-sora font-bold text-2xl text-navy mb-6">
        {isClassroom ? '✅ Enrollment Successful!' : '✅ Purchase Successful'}
      </h3>
      
      <div className="bg-slate-50 border border-slate-200 rounded-xl py-4 px-4 mb-8 text-center space-y-2">
        {isClassroom ? (
          <>
            <p className="font-semibold text-slate-600 mb-1">You have successfully joined:</p>
            <p className="font-bold text-navy text-lg">{paymentConfig.details.name}</p>
          </>
        ) : (
          <>
            <p className="font-bold text-navy text-lg">{selectedTokenPkg.tokens} Query Tokens added.</p>
            <p className="font-semibold text-slate-500">Wallet deducted by ₹{itemPrice}.</p>
          </>
        )}
      </div>

      <div className="flex gap-3">
        <button 
          onClick={handleSuccessContinue} 
          className="w-full py-3.5 bg-navy text-white rounded-lg font-bold hover:bg-navy-light transition"
        >
          {isClassroom ? 'Go to My Learning' : 'Done'}
        </button>
      </div>
    </div>
  );

  const renderInsufficient = () => (
    <div className="p-8 text-center relative">
      <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h3 className="font-sora font-bold text-2xl text-navy mb-2">Insufficient Wallet Balance</h3>
      <p className="text-sm font-semibold text-slate-500 mb-6">You don't have enough money in your wallet.</p>
      
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-6 text-left">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-slate-500 font-medium">Required Amount:</span>
          <span className="font-bold text-slate-700">₹{itemPrice}</span>
        </div>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-slate-500 font-medium">Current Wallet Balance:</span>
          <span className="font-bold text-slate-700">₹{walletBalance}</span>
        </div>
        <div className="flex justify-between text-sm border-t border-slate-200 mt-2 pt-2">
          <span className="text-slate-500 font-medium">Additional Amount Needed:</span>
          <span className="font-bold text-red-600">₹{itemPrice - walletBalance}</span>
        </div>
      </div>

      <p className="text-sm text-slate-500 font-semibold mb-6">Please add money to your wallet before enrolling.</p>

      <div className="flex gap-3">
        <button 
          onClick={onClose}
          className="flex-[1] py-3.5 bg-slate-100 text-slate-700 rounded-lg font-bold hover:bg-slate-200 transition"
        >
          Cancel
        </button>
        <button 
          onClick={() => {
             if (onRechargeRequested) onRechargeRequested();
          }} 
          className="flex-[2] py-3.5 bg-navy text-white rounded-lg font-bold hover:bg-navy-light transition"
        >
          Add Money to Wallet
        </button>
      </div>
    </div>
  );

  if (!isOpen || step === 'waiting_password') return null;

  return (
    <div className="fixed inset-0 bg-navy/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-sm rounded-brand shadow-2xl animate-scale-in overflow-hidden my-auto">
        {step === 'select' && renderSelect()}
        {step === 'confirm' && renderConfirm()}
        {step === 'processing' && renderProcessing()}
        {step === 'success' && renderSuccess()}
        {step === 'insufficient' && renderInsufficient()}
      </div>
    </div>
  );
};

export default WalletPaymentModal;
