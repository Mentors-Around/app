import { useState, useEffect } from 'react';
import { IndianRupee, TrendingUp, Clock, AlertCircle, Building2, Download, CreditCard, Landmark, CheckCircle, XCircle, X } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function TeacherEarnings() {
  useEffect(() => {
    document.title = "Earnings — TrueEd";
  }, []);

  const [earningsData] = useState(() => {
    const saved = localStorage.getItem('trueed_teacher_earnings');
    if (saved) return JSON.parse(saved);
    return {
      summary: {
        thisMonth: 18500,
        overallTotal: 142000,
        pendingPayout: 4500,
        platformFeeDeducted: 1200
      },
      chartData: [
        { month: 'Jan', earnings: 15000 },
        { month: 'Feb', earnings: 22000 },
        { month: 'Mar', earnings: 18000 },
        { month: 'Apr', earnings: 25000 },
        { month: 'May', earnings: 21000 },
        { month: 'Jun', earnings: 18500 },
      ],
      classrooms: [
        { id: 1, name: 'Crash Course: Organic Chemistry', revenue: 7500 },
        { id: 2, name: 'Physics Masterclass', revenue: 6200 },
        { id: 3, name: 'Mathematics Batch', revenue: 4800 },
      ],
      payouts: [
        { id: 'PO-001', date: 'Jun 15, 2026', amount: 4500, status: 'Processing', method: 'Bank Transfer' },
        { id: 'PO-002', date: 'Jun 08, 2026', amount: 5200, status: 'Transferred', method: 'Bank Transfer' },
        { id: 'PO-003', date: 'Jun 01, 2026', amount: 4800, status: 'Transferred', method: 'Bank Transfer' },
        { id: 'PO-004', date: 'May 25, 2026', amount: 6000, status: 'Failed', method: 'Bank Transfer' },
        { id: 'PO-005', date: 'May 18, 2026', amount: 5000, status: 'Transferred', method: 'Bank Transfer' },
      ]
    };
  });

  useEffect(() => {
    localStorage.setItem('trueed_teacher_earnings', JSON.stringify(earningsData));
  }, [earningsData]);

  const [bankDetails, setBankDetails] = useState(() => {
    const saved = localStorage.getItem('trueed_teacher_bank');
    return saved ? JSON.parse(saved) : { holderName: '', bankName: '', accountNumber: '', ifscCode: '', upiId: '' };
  });

  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [editBankDetails, setEditBankDetails] = useState({ ...bankDetails });
  const [toastMessage, setToastMessage] = useState(null);

  const { summary, chartData, classrooms, payouts } = earningsData;

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleOpenBankModal = () => {
    setEditBankDetails({ ...bankDetails });
    setIsBankModalOpen(true);
  };

  const handleSaveBankDetails = (e) => {
    e.preventDefault();
    if (!editBankDetails.holderName || !editBankDetails.bankName || !editBankDetails.accountNumber || !editBankDetails.ifscCode) return;
    
    setBankDetails(editBankDetails);
    localStorage.setItem('trueed_teacher_bank', JSON.stringify(editBankDetails));
    setIsBankModalOpen(false);
    showToast("Bank details updated successfully");
  };

  const downloadStatement = () => {
    const csvRows = [];
    csvRows.push('Teacher Name,Dummy Teacher');
    csvRows.push(`Date Generated,${new Date().toLocaleDateString()}`);
    csvRows.push(`Current Month Earnings,${summary.thisMonth}`);
    csvRows.push(`Lifetime Earnings,${summary.overallTotal}`);
    csvRows.push(`Pending Transfer Amount,${summary.pendingPayout}`);
    csvRows.push('');
    csvRows.push('Payout History');
    csvRows.push('Payout ID,Date,Amount,Status,Transfer Method');
    
    payouts.forEach(p => {
      csvRows.push(`${p.id},"${p.date}",${p.amount},${p.status},${p.method}`);
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'trueed-earnings-statement.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    showToast("Statement downloaded successfully");
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-navy text-white p-3 rounded-lg shadow-xl border border-navy-light text-sm">
          <p className="font-bold mb-1">{label}</p>
          <p className="text-sky flex items-center gap-1">
            <span className="font-medium">Earnings:</span> 
            <span className="font-bold font-sora">₹{payload[0].value.toLocaleString()}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-6xl mx-auto pb-12 space-y-8 relative">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 bg-navy text-white px-6 py-3 rounded-lg shadow-lg font-bold flex items-center gap-2 z-50 animate-fade-in" role="alert" aria-live="assertive">
          <CheckCircle className="w-5 h-5" />
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="font-sora text-3xl font-bold text-navy mb-2">Earnings</h1>
        <p className="text-slate-500 font-medium">Track your revenue, payouts, and financial performance.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-emerald-300 transition">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
            <IndianRupee className="w-16 h-16 text-emerald-600" />
          </div>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">This Month</p>
          <h2 className="font-sora text-3xl font-extrabold text-navy mb-1">₹{summary.thisMonth.toLocaleString()}</h2>
          <p className="text-xs font-bold text-emerald-600 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> +12% from last month</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-sky-300 transition">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
            <Building2 className="w-16 h-16 text-sky" />
          </div>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Overall Total</p>
          <h2 className="font-sora text-3xl font-extrabold text-navy mb-1">₹{summary.overallTotal.toLocaleString()}</h2>
          <p className="text-xs font-bold text-slate-400">Total lifetime earnings</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-amber-300 transition">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
            <Clock className="w-16 h-16 text-amber-500" />
          </div>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Pending Payout</p>
          <h2 className="font-sora text-3xl font-extrabold text-navy mb-1">₹{summary.pendingPayout.toLocaleString()}</h2>
          <p className="text-xs font-bold text-amber-600">Processing for next transfer</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-red-300 transition">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
            <AlertCircle className="w-16 h-16 text-red-500" />
          </div>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Platform Fee Deducted</p>
          <h2 className="font-sora text-3xl font-extrabold text-navy mb-1">₹{summary.platformFeeDeducted.toLocaleString()}</h2>
          <p className="text-xs font-bold text-slate-400">10% platform commission</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Chart Section */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-sora text-xl font-bold text-navy">Earnings Overview</h2>
            <select aria-label="Timeframe" className="bg-slate-50 border border-slate-200 text-slate-600 text-sm font-bold rounded-lg px-3 py-1.5 outline-none focus:border-sky/50 transition cursor-pointer">
              <option>Last 6 Months</option>
              <option>This Year</option>
              <option>All Time</option>
            </select>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} tickFormatter={(val) => `₹${val/1000}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="earnings" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorEarnings)" activeDot={{ r: 6, fill: '#1e293b', stroke: '#fff', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Side Panels */}
        <div className="space-y-8">
          
          {/* Bank Transfer Info Card */}
          <div className="bg-gradient-to-br from-navy to-navy-light p-6 rounded-2xl shadow-md text-white relative overflow-hidden group">
            <Landmark className="absolute top-4 right-4 w-24 h-24 text-white opacity-5 -rotate-12 transition group-hover:scale-110" />
            <h3 className="font-sora text-lg font-bold mb-3 flex items-center gap-2 relative z-10">
              <Landmark className="w-5 h-5 text-sky" /> Weekly Bank Transfers
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed mb-4 relative z-10">
              Earnings are automatically transferred to your registered bank account every Tuesday. Minimum payout threshold is ₹1000.
            </p>
            <button 
              onClick={handleOpenBankModal}
              aria-label="Manage Bank Details"
              className="relative z-10 bg-white/10 hover:bg-white/20 border border-white/20 transition px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky"
            >
              <CreditCard className="w-4 h-4" /> Manage Bank Details
            </button>
          </div>

          {/* Earnings by Classroom */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-sora text-lg font-bold text-navy mb-6">Earnings by Classroom</h3>
            <div className="space-y-4">
              {classrooms.map((room) => (
                <div key={room.id} className="flex items-center justify-between group cursor-default">
                  <div className="flex items-center gap-3 overflow-hidden pr-4">
                    <div className="w-2 h-2 rounded-full bg-sky shrink-0 transition group-hover:scale-150"></div>
                    <p className="font-bold text-slate-700 text-sm truncate group-hover:text-navy transition">{room.name}</p>
                  </div>
                  <p className="font-sora font-bold text-navy shrink-0">₹{room.revenue.toLocaleString()}</p>
                </div>
              ))}
            </div>
            <button className="w-full mt-6 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-navy transition cursor-pointer">
              View All Classrooms
            </button>
          </div>

        </div>
      </div>

      {/* Payout History */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="font-sora text-xl font-bold text-navy">Payout History</h2>
          <button 
            onClick={downloadStatement}
            disabled={payouts.length === 0}
            aria-label="Download Statement"
            className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-navy px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-sky/50"
          >
            <Download className="w-4 h-4" /> Download Statement
          </button>
        </div>
        
        <div className="overflow-x-auto">
          {payouts.length === 0 ? (
            <div className="p-12 text-center text-slate-500 font-medium">
              No payout records available
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="p-4 font-bold border-b border-slate-200">Payout ID</th>
                  <th className="p-4 font-bold border-b border-slate-200">Date</th>
                  <th className="p-4 font-bold border-b border-slate-200">Amount</th>
                  <th className="p-4 font-bold border-b border-slate-200">Status</th>
                  <th className="p-4 font-bold border-b border-slate-200">Transfer Method</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {payouts.map((payout) => (
                  <tr key={payout.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition">
                    <td className="p-4 font-bold text-navy">{payout.id}</td>
                    <td className="p-4 font-medium text-slate-600">{payout.date}</td>
                    <td className="p-4 font-sora font-bold text-navy">₹{payout.amount.toLocaleString()}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                        ${payout.status === 'Processing' ? 'bg-amber-100 text-amber-700' : ''}
                        ${payout.status === 'Transferred' ? 'bg-emerald-100 text-emerald-700' : ''}
                        ${payout.status === 'Failed' ? 'bg-red-100 text-red-700' : ''}
                      `}>
                        {payout.status === 'Processing' && <Clock className="w-3.5 h-3.5" />}
                        {payout.status === 'Transferred' && <CheckCircle className="w-3.5 h-3.5" />}
                        {payout.status === 'Failed' && <XCircle className="w-3.5 h-3.5" />}
                        {payout.status}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500 font-medium flex items-center gap-2">
                      <Landmark className="w-4 h-4 text-slate-400" /> {payout.method}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Manage Bank Account Modal */}
      {isBankModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <h2 className="text-xl font-sora font-bold text-navy flex items-center gap-2">
                <Landmark className="w-5 h-5 text-sky" /> Manage Bank Account
              </h2>
              <button onClick={() => setIsBankModalOpen(false)} aria-label="Close Modal" className="text-slate-400 hover:text-slate-600 transition cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <form id="bank-form" onSubmit={handleSaveBankDetails} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Account Holder Name *</label>
                  <input 
                    type="text" 
                    required
                    value={editBankDetails.holderName}
                    onChange={e => setEditBankDetails({...editBankDetails, holderName: e.target.value})}
                    placeholder="Enter full name on account"
                    className="w-full border border-slate-200 rounded-lg p-3 text-sm font-medium text-navy outline-none focus:border-sky focus:ring-1 focus:ring-sky transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Bank Name *</label>
                  <input 
                    type="text" 
                    required
                    value={editBankDetails.bankName}
                    onChange={e => setEditBankDetails({...editBankDetails, bankName: e.target.value})}
                    placeholder="e.g. HDFC Bank"
                    className="w-full border border-slate-200 rounded-lg p-3 text-sm font-medium text-navy outline-none focus:border-sky focus:ring-1 focus:ring-sky transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Account Number *</label>
                  <input 
                    type="text" 
                    required
                    value={editBankDetails.accountNumber}
                    onChange={e => setEditBankDetails({...editBankDetails, accountNumber: e.target.value})}
                    placeholder="Enter account number"
                    className="w-full border border-slate-200 rounded-lg p-3 text-sm font-medium text-navy outline-none focus:border-sky focus:ring-1 focus:ring-sky transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">IFSC Code *</label>
                  <input 
                    type="text" 
                    required
                    value={editBankDetails.ifscCode}
                    onChange={e => setEditBankDetails({...editBankDetails, ifscCode: e.target.value})}
                    placeholder="e.g. HDFC0001234"
                    className="w-full border border-slate-200 rounded-lg p-3 text-sm font-medium text-navy outline-none focus:border-sky focus:ring-1 focus:ring-sky transition uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">UPI ID (Optional)</label>
                  <input 
                    type="text" 
                    value={editBankDetails.upiId}
                    onChange={e => setEditBankDetails({...editBankDetails, upiId: e.target.value})}
                    placeholder="e.g. username@upi"
                    className="w-full border border-slate-200 rounded-lg p-3 text-sm font-medium text-navy outline-none focus:border-sky focus:ring-1 focus:ring-sky transition"
                  />
                </div>
              </form>
            </div>
            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 sticky bottom-0">
              <button onClick={() => setIsBankModalOpen(false)} type="button" className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 text-sm font-bold rounded-lg hover:bg-slate-100 transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-200">
                Cancel
              </button>
              <button type="submit" form="bank-form" className="px-6 py-2.5 bg-navy text-white text-sm font-bold rounded-lg hover:bg-navy-light transition shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-navy">
                Save Details
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
