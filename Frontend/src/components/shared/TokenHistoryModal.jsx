import React from 'react';
import { X, CheckCircle, Clock, Search, RotateCcw, AlertCircle } from 'lucide-react';
import { formatDate } from '../../utils/dateFormatter';

const TokenHistoryModal = ({ isOpen, onClose, currentTokens }) => {
  if (!isOpen) return null;

  // Mock token history
  const history = [
    { id: 1, type: 'refund', reason: 'Teacher did not respond in 24h', amount: '+1', timestamp: new Date().toISOString() },
    { id: 2, type: 'used', reason: 'Sent query to Teacher (Aditi Rao)', amount: '-1', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 3, type: 'purchase', reason: 'Purchased Token Pack (10 Tokens)', amount: '+10', timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 4, type: 'used', reason: 'Sent classroom query', amount: '-1', timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() }
  ];

  return (
    <div className="fixed inset-0 bg-navy/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-fade-in relative flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
          <h2 className="font-sora font-bold text-xl text-navy">Token History</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 bg-navy text-white flex flex-col items-center justify-center py-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/3"></div>
          
          <span className="text-sm font-bold text-blue-200 uppercase tracking-wider mb-2 z-10">Current Balance</span>
          <div className="text-5xl font-black font-sora z-10">{currentTokens} <span className="text-xl text-blue-200">Tokens</span></div>
        </div>

        <div className="p-0 overflow-y-auto flex-1">
          {history.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {history.map(item => (
                <div key={item.id} className="p-5 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    item.type === 'refund' ? 'bg-sky-100 text-sky-500' :
                    item.type === 'purchase' ? 'bg-green-100 text-green-500' :
                    'bg-slate-100 text-slate-500'
                  }`}>
                    {item.type === 'refund' ? <RotateCcw className="w-4 h-4" /> :
                     item.type === 'purchase' ? <CheckCircle className="w-4 h-4" /> :
                     <Search className="w-4 h-4" />}
                  </div>
                  
                  <div className="flex-1">
                    <p className="font-bold text-sm text-navy">{item.reason}</p>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">{formatDate(item.timestamp)}</p>
                  </div>
                  
                  <div className={`font-black font-sora text-lg ${
                    item.amount.startsWith('+') ? 'text-success' : 'text-slate-700'
                  }`}>
                    {item.amount}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-10 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-slate-500 font-medium">No token activity found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TokenHistoryModal;
