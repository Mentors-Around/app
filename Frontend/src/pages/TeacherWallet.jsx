import React, { useState, useEffect } from 'react';
import { ArrowUpFromLine, ArrowDownToLine, Download, History, Wallet, Calendar, Vault, Briefcase, TrendingUp, Landmark, CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import useAuth from '../hooks/useAuth';
import { useWallet } from '../contexts/WalletContext';
import TeacherWithdrawModal from '../components/shared/TeacherWithdrawModal';
import DepositModal from '../components/shared/DepositModal';
import AddBankAccountModal from '../components/shared/AddBankAccountModal';

const TeacherWallet = () => {
  const { user } = useAuth();
  const { teacherWallet, teacherBankAccounts, addBankAccount, setDefaultBankAccount, showToast, processTeacherRecharge, addTeacherTransaction, updateTeacherBalance } = useWallet();

  const [transactions, setTransactions] = useState([]);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showAddBankModal, setShowAddBankModal] = useState(false);
  const [showWithdrawError, setShowWithdrawError] = useState(false);
  
  // Mock data for charts
  const monthlyData = [
    { name: 'Jan', earnings: 4500 },
    { name: 'Feb', earnings: 5200 },
    { name: 'Mar', earnings: 6100 },
    { name: 'Apr', earnings: 5800 },
    { name: 'May', earnings: 7500 },
    { name: 'Jun', earnings: 8200 },
  ];

  const weeklyData = [
    { day: 'Mon', amount: 120 },
    { day: 'Tue', amount: 350 },
    { day: 'Wed', amount: 280 },
    { day: 'Thu', amount: 410 },
    { day: 'Fri', amount: 550 },
    { day: 'Sat', amount: 890 },
    { day: 'Sun', amount: 720 },
  ];

  useEffect(() => {
    document.title = 'Earnings Dashboard — TrueEd';
    setTransactions(teacherWallet?.transactions || []);
  }, [user, teacherWallet]);

  const handleDeposit = (amount) => {
    if (!amount || amount <= 0) return;
    
    setShowDepositModal(false);
    
    showToast(`₹${amount} has been added to your wallet.`);
    
    // Process recharge in context
    processTeacherRecharge(amount);

    const newTxn = {
      id: `TXN-${Math.floor(10000 + Math.random() * 90000)}`,
      date: new Date().toISOString(),
      type: 'Wallet Deposit',
      amount: amount,
      status: 'Completed',
      isCredit: true,
      title: 'Added via UPI'
    };
    addTeacherTransaction(newTxn, 0, 0); // Deposits don't count towards earnings
  };

  return (
    <div className="max-w-6xl mx-auto pb-12 relative">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="font-sora text-3xl font-bold text-navy mb-2">Earnings Dashboard</h1>
          <p className="text-slate-500 font-medium">Manage your earnings, withdraw funds, and analyze revenue trends.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Wallet Balance Card */}
        <div className="bg-gradient-to-br from-navy to-navy-light p-8 rounded-2xl shadow-md text-white lg:col-span-1 relative overflow-hidden flex flex-col justify-between h-full min-h-[240px]">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-bl-full -z-0"></div>
          <div className="relative z-10 mb-6">
            <p className="text-sky-200/80 font-bold uppercase tracking-wider text-sm mb-2 flex items-center gap-2">
              <Wallet className="w-4 h-4" /> AVAILABLE WALLET BALANCE
            </p>
            <h2 className="font-sora text-5xl font-bold mb-2">₹{(teacherWallet?.balance || 0).toLocaleString()}</h2>
            <p className="text-sky-100/70 text-sm font-medium">Ready for withdrawal</p>
          </div>
          
          <div className="flex gap-3 relative z-10">
            <button onClick={() => setShowDepositModal(true)} className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold transition flex items-center justify-center gap-2 backdrop-blur-sm">
              <ArrowDownToLine className="w-5 h-5" /> Deposit
            </button>
            <button onClick={() => {
              if (!teacherBankAccounts || teacherBankAccounts.length === 0) {
                setShowWithdrawError(true);
              } else {
                setShowWithdrawModal(true);
              }
            }} className="flex-1 py-3 bg-sky-500 hover:bg-sky-400 rounded-xl font-bold transition flex items-center justify-center gap-2 shadow-lg">
              <ArrowUpFromLine className="w-5 h-5" /> Withdraw
            </button>
          </div>
        </div>
        
        {/* Analytics Cards */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition group">
            <div className="w-12 h-12 bg-emerald-50 group-hover:bg-emerald-100 transition text-emerald-600 rounded-full flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Today's Earnings</p>
            <p className="font-sora font-bold text-3xl text-navy">₹0</p>
            <p className="text-xs text-slate-500 mt-2 font-medium flex items-center gap-1"><span className="text-emerald-500">↑ 0%</span> vs yesterday</p>
          </div>
          
          <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition group">
            <div className="w-12 h-12 bg-sky-50 group-hover:bg-sky-100 transition text-sky-600 rounded-full flex items-center justify-center mb-4">
              <Calendar className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">This Month</p>
            <p className="font-sora font-bold text-3xl text-navy">₹8,200</p>
            <p className="text-xs text-slate-500 mt-2 font-medium flex items-center gap-1"><span className="text-emerald-500">↑ 12%</span> vs last month</p>
          </div>
          
          <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition group relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-50 rounded-full opacity-50 transition group-hover:scale-110"></div>
            <div className="w-12 h-12 bg-purple-50 group-hover:bg-purple-100 transition text-purple-600 rounded-full flex items-center justify-center mb-4 relative z-10">
              <Briefcase className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 relative z-10">Lifetime Earnings</p>
            <p className="font-sora font-bold text-3xl text-navy relative z-10">₹{(teacherWallet?.totalEarnings || 0).toLocaleString()}</p>
            <p className="text-xs text-slate-500 mt-2 font-medium relative z-10">Total platform revenue</p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="mb-10">
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-sora font-bold text-lg text-navy">Monthly Revenue</h3>
            <select className="bg-slate-50 border border-slate-200 text-sm font-bold text-slate-700 rounded-lg px-3 py-1.5 focus:outline-none">
              <option>2026</option>
              <option>2025</option>
            </select>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} tickFormatter={(val) => `₹${val/1000}k`} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', fontWeight: 'bold', color: '#1e293b'}} />
                <Bar dataKey="earnings" fill="#0ea5e9" radius={[4, 4, 0, 0]} maxBarSize={60} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bank Details Section */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden mb-10">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-sora text-xl font-bold text-navy flex items-center gap-2">
              <Landmark className="w-5 h-5 text-sky-500" /> Bank Details
            </h2>
            <p className="text-sm font-medium text-slate-500 mt-1">Manage the bank account where your earnings will be transferred.</p>
          </div>
        </div>
        
        <div className="p-6">
          {!teacherBankAccounts || teacherBankAccounts.length === 0 ? (
            <div className="text-center py-8">
              <p className="font-medium text-slate-600 mb-4">No bank account added.</p>
              <p className="text-sm text-slate-500 mb-6">Add your bank account to withdraw your earnings.</p>
              <button 
                onClick={() => setShowAddBankModal(true)}
                className="px-6 py-3 bg-slate-50 border border-slate-200 text-navy font-bold rounded-xl hover:bg-slate-100 transition shadow-sm"
              >
                + Add Bank Account
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Landmark className="w-5 h-5 text-sky-600" />
                <h3 className="font-sora font-bold text-lg text-navy">Your Saved Bank Accounts</h3>
              </div>
              
              <div className="space-y-4">
                {teacherBankAccounts.map((account) => (
                  <div key={account.id} className={`border rounded-xl p-6 transition ${account.isDefault ? 'bg-slate-50 border-sky-200' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        {account.isDefault && (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-sky-100 text-sky-700 rounded-full text-xs font-bold border border-sky-200 mb-3">
                            <CheckCircle className="w-3.5 h-3.5" /> Default Withdrawal Account
                          </div>
                        )}
                        <p className="font-bold text-slate-800 text-lg mb-1">{account.bankName}</p>
                        <p className="font-mono font-bold text-slate-700 tracking-wider mb-1">**** **** **** {account.accountNumber.slice(-4)}</p>
                        <p className="text-sm font-medium text-slate-500 mb-2">IFSC: {account.ifscCode}</p>
                        <p className="text-sm font-medium text-slate-500">{account.accountName} &middot; Savings Account</p>
                      </div>
                      <div className="flex flex-col gap-2 items-end">
                        <button className="px-5 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-lg hover:bg-slate-50 transition">
                          Edit
                        </button>
                        {!account.isDefault && (
                          <button 
                            onClick={() => setDefaultBankAccount(account.id)}
                            className="px-5 py-2 bg-slate-100 border border-slate-200 text-navy text-sm font-bold rounded-lg hover:bg-slate-200 transition mt-2"
                          >
                            ○ Make Default
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="pt-4 mt-2">
                <button 
                  onClick={() => setShowAddBankModal(true)}
                  className="w-full py-4 bg-slate-50 border border-dashed border-slate-300 text-navy font-bold rounded-xl hover:bg-slate-100 hover:border-slate-400 transition shadow-sm flex items-center justify-center gap-2"
                >
                  <span>+ Add Another Bank Account</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-sora text-xl font-bold text-navy flex items-center gap-2">
            <History className="w-5 h-5 text-sky-500" /> Transaction History
          </h2>
          <button className="px-4 py-2 bg-slate-50 text-slate-600 text-sm font-bold rounded-lg hover:bg-slate-100 transition flex items-center gap-2">
            <Download className="w-4 h-4" /> Statement
          </button>
        </div>
        
        {transactions.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <History className="w-6 h-6 text-slate-300" />
            </div>
            <p className="font-medium text-lg">No transactions yet.</p>
            <p className="text-sm mt-1">Your earnings will appear here after students enroll in your classrooms.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {transactions.map(txn => (
              <div key={txn.id} className="p-4 sm:p-6 hover:bg-slate-50/50 transition flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${txn.isCredit ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
                    <ArrowUpFromLine className={`w-5 h-5 ${txn.isCredit ? 'rotate-180' : ''}`} />
                  </div>
                  <div>
                    <p className="font-bold text-navy text-sm sm:text-base">{txn.type}</p>
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500">
                      <span>{new Date(txn.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                      <span className="font-mono text-xs">{txn.id}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-sora font-bold sm:text-lg ${txn.isCredit ? 'text-emerald-600' : 'text-slate-800'}`}>
                    {txn.isCredit ? '+' : '-'}₹{txn.amount.toLocaleString()}
                  </p>
                  <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider mt-1">Success</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <TeacherWithdrawModal
        isOpen={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        walletBalance={teacherWallet?.balance || 0}
        bankAccounts={teacherBankAccounts}
        onAddBankAccount={addBankAccount}
        onWithdrawSuccess={(amount) => {
          updateTeacherBalance((teacherWallet?.balance || 0) - amount);
          const newTxn = {
            id: `TXN-${Math.floor(10000 + Math.random() * 90000)}`,
            date: new Date().toISOString(),
            type: 'Withdrawal',
            amount: amount,
            status: 'Completed',
            isCredit: false,
            title: 'Bank Transfer'
          };
          addTeacherTransaction(newTxn, 0, amount); // Earnings delta 0, withdrawn +amount
          
          setTimeout(() => setShowWithdrawModal(false), 2000);
        }}
      />
      
      <DepositModal 
        isOpen={showDepositModal}
        onClose={() => setShowDepositModal(false)}
        onProcess={handleDeposit}
      />
      
      <AddBankAccountModal 
        isOpen={showAddBankModal}
        onClose={() => setShowAddBankModal(false)}
        onSave={(bank) => {
          addBankAccount(bank);
          setShowAddBankModal(false);
          // If we were blocked from withdrawing, open the withdraw modal now
          if (showWithdrawError) {
            setShowWithdrawError(false);
            setShowWithdrawModal(true);
          }
        }}
      />

      {/* Withdraw Error Modal */}
      {showWithdrawError && (
        <div className="fixed inset-0 bg-navy/80 backdrop-blur-sm z-[8000] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-slide-up-sm relative p-8 text-center">
            <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Landmark className="w-8 h-8" />
            </div>
            <h3 className="font-sora font-bold text-xl text-navy mb-2">Bank Account Required</h3>
            <p className="text-sm font-medium text-slate-500 mb-6">Please add a bank account before withdrawing your earnings.</p>
            
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => {
                  setShowWithdrawError(false);
                  setShowAddBankModal(true);
                }}
                className="w-full py-4 bg-sky-500 hover:bg-sky-400 text-white font-bold rounded-xl transition shadow flex items-center justify-center"
              >
                Add Bank Account
              </button>
              <button 
                onClick={() => setShowWithdrawError(false)}
                className="w-full py-4 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherWallet;
