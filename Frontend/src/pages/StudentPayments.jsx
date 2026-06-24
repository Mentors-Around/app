import { useEffect } from 'react';

const StudentPayments = () => {
  useEffect(() => { document.title = 'Payment History — TrueEd'; }, []);

  const getFormattedDate = (daysOffset) => {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const dummyPayments = [
    { id: 'TXN001', date: getFormattedDate(-2), teacher: 'Arun Singh', amount: '₹1000', status: 'Paid' },
    { id: 'TXN002', date: getFormattedDate(-7), teacher: 'Sneha R', amount: '₹800', status: 'Refunded' },
  ];

  return (
    <div className="max-w-[1000px] mx-auto">
      <h1 className="font-sora text-2xl font-bold text-navy mb-6">Payment History</h1>
      <div className="bg-white rounded-brand shadow-brand p-6 md:p-8">
        {dummyPayments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-sm text-navy">
                  <th className="py-3 px-2 font-semibold">Date</th>
                  <th className="py-3 px-2 font-semibold">Teacher</th>
                  <th className="py-3 px-2 font-semibold">Amount</th>
                  <th className="py-3 px-2 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {dummyPayments.map(p => (
                  <tr key={p.id} className="border-b border-slate-100 text-sm hover:bg-slate-50 transition">
                    <td className="py-3 px-2 text-muted">{p.date}</td>
                    <td className="py-3 px-2 font-medium text-navy">{p.teacher}</td>
                    <td className="py-3 px-2 font-medium text-navy">{p.amount}</td>
                    <td className="py-3 px-2">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${p.status === 'Paid' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center py-16">
            <span className="text-6xl mb-4">💳</span>
            <h3 className="text-xl font-semibold text-navy mb-2">No payment history</h3>
            <p className="text-slate-500">Your transactions will appear here after your first booking</p>
          </div>
        )}
      </div>
    </div>
  );
};
export default StudentPayments;
