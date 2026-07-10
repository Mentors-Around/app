import { useState, useEffect } from 'react';
import { Search, IndianRupee, CheckCircle, XCircle, ArrowUpRight, ArrowDownLeft, Clock } from 'lucide-react';
import TeacherAvatar from '../components/shared/TeacherAvatar';

const mockWithdrawals = [
  { id: 'w1', teacher: { id: 't1', name: 'Hari Prasad L', initials: 'HP' }, bank: 'HDFC Bank •••• 1234', amount: 5000, date: '2023-10-14', status: 'PENDING' },
  { id: 'w2', teacher: { id: 't3', name: 'Anjali Verma', initials: 'AV' }, bank: 'SBI •••• 5678', amount: 12500, date: '2023-10-12', status: 'APPROVED' },
  { id: 'w3', teacher: { id: 't2', name: 'Rahul Sharma', initials: 'RS' }, bank: 'ICICI Bank •••• 9012', amount: 3000, date: '2023-10-10', status: 'REJECTED' },
];

const mockDeposits = [
  { id: 'd1', student: { id: 's1', name: 'Akash Singh', initials: 'AS' }, amount: 2000, date: '2023-10-15', method: 'UPI' },
  { id: 'd2', student: { id: 's2', name: 'Neha Gupta', initials: 'NG' }, amount: 500, date: '2023-10-14', method: 'Credit Card' },
];

const mockTransactions = [
  { id: 'tx1', type: 'PAYMENT', user: 'Akash Singh', amount: -500, details: 'Paid for Class 12 Physics', date: '2023-10-15' },
  { id: 'tx2', type: 'EARNING', user: 'Hari Prasad L', amount: 450, details: 'Earnings from Class 12 Physics (after 10% fee)', date: '2023-10-15' },
  { id: 'tx3', type: 'DEPOSIT', user: 'Akash Singh', amount: 2000, details: 'Wallet Recharge via UPI', date: '2023-10-15' },
  { id: 'tx4', type: 'WITHDRAWAL', user: 'Anjali Verma', amount: -12500, details: 'Transferred to Bank Account', date: '2023-10-12' },
];

export default function AdminWallet() {
  useEffect(() => { document.title = "Wallet & Payments — Admin Dashboard"; }, []);

  const [activeTab, setActiveTab] = useState('withdrawals');
  const [withdrawals, setWithdrawals] = useState(mockWithdrawals);
  const [search, setSearch] = useState('');

  const handleWithdrawalAction = (id, status) => {
    setWithdrawals(withdrawals.map(w => w.id === id ? { ...w, status } : w));
  };

  const filteredTransactions = mockTransactions.filter(t => t.user.toLowerCase().includes(search.toLowerCase()) || t.details.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="font-sora text-2xl md:text-3xl font-bold text-navy mb-1">Wallet & Payments</h1>
          <p className="text-slate-500 font-medium text-sm md:text-base">Manage platform finances, withdrawals, and deposits.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex bg-slate-100 p-1 rounded-lg w-full sm:w-auto">
            {['withdrawals', 'deposits', 'transactions'].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 sm:flex-none px-6 py-2 text-xs font-bold rounded-md transition capitalize \${activeTab === tab ? 'bg-white text-navy shadow-sm' : 'text-slate-500 hover:text-navy'}`}
              >
                {tab}
              </button>
            ))}
          </div>
          {activeTab === 'transactions' && (
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search transactions..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:bg-white focus:border-navy transition"
              />
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          {activeTab === 'withdrawals' && (
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="p-4">Teacher</th>
                  <th className="p-4">Bank Details</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Requested On</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.map(req => (
                  <tr key={req.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <TeacherAvatar teacherId={req.teacher.id} name={req.teacher.name} initials={req.teacher.initials} className="w-8 h-8 text-xs" />
                        <span className="font-bold text-navy text-sm">{req.teacher.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm font-semibold text-slate-600">{req.bank}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-1 text-navy font-bold">
                        <IndianRupee className="w-4 h-4 text-emerald-600" /> {req.amount}
                      </div>
                    </td>
                    <td className="p-4 text-sm font-semibold text-slate-600">{new Date(req.date).toLocaleDateString()}</td>
                    <td className="p-4">
                      {req.status === 'PENDING' && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold uppercase"><Clock className="w-3 h-3"/> Pending</span>}
                      {req.status === 'APPROVED' && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase"><CheckCircle className="w-3 h-3"/> Approved</span>}
                      {req.status === 'REJECTED' && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 text-red-700 text-[10px] font-bold uppercase"><XCircle className="w-3 h-3"/> Rejected</span>}
                    </td>
                    <td className="p-4 text-right">
                      {req.status === 'PENDING' && (
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleWithdrawalAction(req.id, 'REJECTED')} className="px-3 py-1.5 bg-red-50 text-red-600 text-xs font-bold rounded-lg hover:bg-red-100 transition">Reject</button>
                          <button onClick={() => handleWithdrawalAction(req.id, 'APPROVED')} className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition">Approve</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'deposits' && (
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="p-4">Student</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Method</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {mockDeposits.map(dep => (
                  <tr key={dep.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <TeacherAvatar teacherId={dep.student.id} name={dep.student.name} initials={dep.student.initials} className="w-8 h-8 text-xs" />
                        <span className="font-bold text-navy text-sm">{dep.student.name}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1 text-emerald-600 font-bold">
                        +<IndianRupee className="w-4 h-4" /> {dep.amount}
                      </div>
                    </td>
                    <td className="p-4 text-sm font-semibold text-slate-600">{new Date(dep.date).toLocaleDateString()}</td>
                    <td className="p-4 text-sm font-bold text-slate-700">{dep.method}</td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase"><CheckCircle className="w-3 h-3"/> Success</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'transactions' && (
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="p-4">Type</th>
                  <th className="p-4">User</th>
                  <th className="p-4">Details</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map(tx => (
                  <tr key={tx.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition">
                    <td className="p-4">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-100 px-2 py-1 rounded-md">{tx.type}</span>
                    </td>
                    <td className="p-4 font-bold text-navy text-sm">{tx.user}</td>
                    <td className="p-4 text-sm font-medium text-slate-600">{tx.details}</td>
                    <td className="p-4">
                      <div className={`flex items-center gap-1 font-bold \${tx.amount > 0 ? 'text-emerald-600' : 'text-slate-700'}`}>
                        {tx.amount > 0 ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                        <IndianRupee className="w-3.5 h-3.5" /> {Math.abs(tx.amount)}
                      </div>
                    </td>
                    <td className="p-4 text-sm font-semibold text-slate-600">{new Date(tx.date).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
