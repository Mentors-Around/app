import { useState, useEffect } from 'react';
import { Search, Eye, CheckCircle, XCircle, FileText, AlertCircle, Calendar } from 'lucide-react';
import TeacherAvatar from '../components/shared/TeacherAvatar';

const mockKYCRequests = [
  {
    id: 'kyc1',
    teacher: { id: 't2', name: 'Rahul Sharma', initials: 'RS', email: 'rahul.s@example.com' },
    submittedAt: '2023-10-15',
    status: 'PENDING',
    documents: {
      aadhaar: 'aadhaar_123.pdf',
      pan: 'pan_123.jpg',
      bank: 'bank_statement.pdf',
      education: 'degree_certificate.pdf'
    }
  },
  {
    id: 'kyc2',
    teacher: { id: 't5', name: 'Sneha Patel', initials: 'SP', email: 'sneha@example.com' },
    submittedAt: '2023-10-14',
    status: 'REJECTED',
    reason: 'Aadhaar image was blurry',
    documents: {
      aadhaar: 'aadhaar_blurred.jpg',
      pan: 'pan_456.jpg',
      bank: 'bank_passbook.jpg',
      education: 'msc_degree.pdf'
    }
  }
];

export default function AdminKYC() {
  useEffect(() => { document.title = "KYC Verification — Admin Dashboard"; }, []);

  const [requests, setRequests] = useState(mockKYCRequests);
  const [search, setSearch] = useState('');
  const [selectedKyc, setSelectedKyc] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const filteredRequests = requests.filter(r => 
    r.teacher.name.toLowerCase().includes(search.toLowerCase()) || 
    r.teacher.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleApprove = (id) => {
    setRequests(requests.map(r => r.id === id ? { ...r, status: 'VERIFIED' } : r));
    setSelectedKyc(null);
  };

  const handleReject = (id) => {
    if (!rejectReason) return alert("Please enter a rejection reason");
    setRequests(requests.map(r => r.id === id ? { ...r, status: 'REJECTED', reason: rejectReason } : r));
    setSelectedKyc(null);
    setRejectReason('');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="font-sora text-2xl md:text-3xl font-bold text-navy mb-1">KYC Verification</h1>
          <p className="text-slate-500 font-medium text-sm md:text-base">Review and approve teacher identity verification requests.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search teachers..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:bg-white focus:border-navy transition"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="p-4">Teacher</th>
                <th className="p-4">Submitted Date</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map(req => (
                <tr key={req.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <TeacherAvatar teacherId={req.teacher.id} name={req.teacher.name} initials={req.teacher.initials} className="w-10 h-10 text-sm" />
                      <div>
                        <p className="font-bold text-navy text-sm">{req.teacher.name}</p>
                        <p className="text-xs font-medium text-slate-500">{req.teacher.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                      <Calendar className="w-4 h-4 text-slate-400" /> {new Date(req.submittedAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="p-4">
                    {req.status === 'VERIFIED' && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase"><CheckCircle className="w-3 h-3"/> Approved</span>}
                    {req.status === 'PENDING' && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold uppercase"><AlertCircle className="w-3 h-3"/> Pending</span>}
                    {req.status === 'REJECTED' && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 text-red-700 text-[10px] font-bold uppercase"><XCircle className="w-3 h-3"/> Rejected</span>}
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => setSelectedKyc(req)}
                      className="px-4 py-2 bg-slate-50 border border-slate-200 text-navy text-xs font-bold rounded-lg hover:bg-slate-100 transition shadow-sm inline-flex items-center gap-2"
                    >
                      <Eye className="w-3.5 h-3.5" /> Review Documents
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredRequests.length === 0 && (
            <div className="p-8 text-center text-slate-500 font-medium">
              No KYC requests found matching your search.
            </div>
          )}
        </div>
      </div>

      {/* KYC Review Modal */}
      {selectedKyc && (
        <div className="fixed inset-0 bg-navy/80 backdrop-blur-sm z-[7000] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-scale-in flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h2 className="font-sora text-xl font-bold text-navy">Review KYC: {selectedKyc.teacher.name}</h2>
                <p className="text-sm font-medium text-slate-500">Submitted on {new Date(selectedKyc.submittedAt).toLocaleDateString()}</p>
              </div>
              <button onClick={() => { setSelectedKyc(null); setRejectReason(''); }} className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-full text-slate-500 hover:text-navy hover:bg-slate-50 transition">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center gap-2 mb-2 text-slate-500">
                    <FileText className="w-4 h-4" /> <span className="text-xs font-bold uppercase tracking-wider">Aadhaar Card</span>
                  </div>
                  <p className="text-sm font-semibold text-navy truncate">{selectedKyc.documents.aadhaar}</p>
                  <button className="mt-3 text-xs font-bold text-sky hover:underline">View Document</button>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center gap-2 mb-2 text-slate-500">
                    <FileText className="w-4 h-4" /> <span className="text-xs font-bold uppercase tracking-wider">PAN Card</span>
                  </div>
                  <p className="text-sm font-semibold text-navy truncate">{selectedKyc.documents.pan}</p>
                  <button className="mt-3 text-xs font-bold text-sky hover:underline">View Document</button>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center gap-2 mb-2 text-slate-500">
                    <FileText className="w-4 h-4" /> <span className="text-xs font-bold uppercase tracking-wider">Bank Details</span>
                  </div>
                  <p className="text-sm font-semibold text-navy truncate">{selectedKyc.documents.bank}</p>
                  <button className="mt-3 text-xs font-bold text-sky hover:underline">View Document</button>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center gap-2 mb-2 text-slate-500">
                    <FileText className="w-4 h-4" /> <span className="text-xs font-bold uppercase tracking-wider">Educational Docs</span>
                  </div>
                  <p className="text-sm font-semibold text-navy truncate">{selectedKyc.documents.education}</p>
                  <button className="mt-3 text-xs font-bold text-sky hover:underline">View Document</button>
                </div>
              </div>

              {selectedKyc.status === 'REJECTED' && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-xs font-bold text-red-500 uppercase tracking-wider mb-1">Rejection Reason</p>
                  <p className="text-sm font-medium text-red-900">{selectedKyc.reason}</p>
                </div>
              )}

              {selectedKyc.status === 'PENDING' && (
                <div className="pt-4 border-t border-slate-100">
                  <label className="block text-sm font-semibold text-navy mb-2">Rejection Reason (If rejecting)</label>
                  <textarea 
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="E.g. Aadhaar card image is blurry and unreadable..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:border-red-400 transition min-h-[100px]"
                  ></textarea>
                </div>
              )}
            </div>

            {selectedKyc.status === 'PENDING' && (
              <div className="p-6 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50">
                <button 
                  onClick={() => handleReject(selectedKyc.id)}
                  className="px-6 py-2.5 bg-white border border-red-200 text-red-600 text-sm font-bold rounded-xl hover:bg-red-50 transition shadow-sm"
                >
                  Reject & Request Resubmission
                </button>
                <button 
                  onClick={() => handleApprove(selectedKyc.id)}
                  className="px-6 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition shadow-sm flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" /> Approve KYC
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
