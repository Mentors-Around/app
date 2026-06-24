import React, { useState } from 'react';

const TokenPurchaseModal = ({ isOpen, onClose, onSuccess, currentBalance }) => {
  const [selectedPackage, setSelectedPackage] = useState(19);

  if (!isOpen) return null;

  const packages = [
    { price: 19, tokens: 2 },
    { price: 38, tokens: 4 },
    { price: 95, tokens: 10 },
  ];

  const handlePayment = () => {
    const selected = packages.find(p => p.price === selectedPackage);
    const newTokens = currentBalance + selected.tokens;
    
    // Update local storage
    localStorage.setItem('trueed_student_tokens', newTokens.toString());
    
    onSuccess(newTokens);
  };

  return (
    <div className="fixed inset-0 bg-navy/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-sm rounded-brand shadow-2xl animate-scale-in overflow-hidden my-auto">
        <div className="p-6 border-b border-slate-100 text-center relative">
          <h3 className="font-sora font-bold text-xl text-navy">Buy Query Tokens</h3>
          <p className="text-sm font-medium text-slate-500 mt-2">
            Current Balance: <span className="text-navy font-bold">{currentBalance} Tokens</span>
          </p>
          <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-navy transition">
            <i className="fa-solid fa-xmark text-xl" />
          </button>
        </div>
        
        <div className="p-6">
          <div className="space-y-3 mb-6">
            {packages.map(pkg => (
              <button
                key={pkg.price}
                onClick={() => setSelectedPackage(pkg.price)}
                className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition ${
                  selectedPackage === pkg.price 
                    ? 'border-navy bg-navy/5' 
                    : 'border-slate-100 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedPackage === pkg.price ? 'border-navy' : 'border-slate-300'}`}>
                    {selectedPackage === pkg.price && <div className="w-2 h-2 rounded-full bg-navy" />}
                  </div>
                  <span className="font-bold text-navy">{pkg.tokens} Tokens</span>
                </div>
                <span className="font-sora font-bold text-navy">₹{pkg.price}</span>
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="flex-[1] py-3.5 bg-slate-100 text-slate-700 rounded-lg font-bold hover:bg-slate-200 transition"
            >
              Cancel
            </button>
            <button 
              onClick={handlePayment} 
              className="flex-[2] py-3.5 bg-success text-white rounded-lg font-sora font-bold hover:bg-green-600 transition flex items-center justify-center gap-2 shadow-sm"
            >
              <i className="fa-solid fa-lock" /> Proceed to Payment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenPurchaseModal;
