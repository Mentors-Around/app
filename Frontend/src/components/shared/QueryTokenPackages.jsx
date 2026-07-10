import React from 'react';

export default function QueryTokenPackages({ onSelect }) {
  return (
    <div className="space-y-3">
      <button onClick={() => onSelect(19)} className="w-full flex items-center justify-between p-3 rounded-xl border border-amber-400 bg-amber-50 transition relative overflow-hidden group">
        <div className="absolute top-0 right-0 bg-amber-400 text-white text-[9px] font-bold px-2 py-0.5 rounded-bl-lg uppercase tracking-wider">⭐ Most Popular</div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-200 flex items-center justify-center transition">
            <span className="font-bold text-amber-800">5</span>
          </div>
          <span className="font-bold text-slate-900">Tokens</span>
        </div>
        <span className="font-bold text-navy">₹19</span>
      </button>
      
      <button onClick={() => onSelect(35)} className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50 transition relative overflow-hidden group">
        <div className="absolute top-0 right-0 bg-slate-100 text-slate-500 text-[9px] font-bold px-2 py-0.5 rounded-bl-lg uppercase tracking-wider">💎 Best Value</div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-amber-200 flex items-center justify-center transition">
            <span className="font-bold text-slate-600 group-hover:text-amber-800">10</span>
          </div>
          <span className="font-bold text-slate-700 group-hover:text-slate-900">Tokens</span>
        </div>
        <span className="font-bold text-navy">₹35</span>
      </button>
      
      <button onClick={() => onSelect(79)} className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50 transition relative overflow-hidden group">
        <div className="absolute top-0 right-0 bg-slate-100 text-slate-500 text-[9px] font-bold px-2 py-0.5 rounded-bl-lg uppercase tracking-wider">💰 Save More</div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-amber-200 flex items-center justify-center transition">
            <span className="font-bold text-slate-600 group-hover:text-amber-800">25</span>
          </div>
          <span className="font-bold text-slate-700 group-hover:text-slate-900">Tokens</span>
        </div>
        <span className="font-bold text-navy">₹79</span>
      </button>
    </div>
  );
}
