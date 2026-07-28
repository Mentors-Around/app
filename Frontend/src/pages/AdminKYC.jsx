import { useState, useEffect } from 'react';
import { Search, Eye, CheckCircle, XCircle, FileText, AlertCircle, Calendar, Loader2 } from 'lucide-react';
import TeacherAvatar from '../components/shared/TeacherAvatar';
import api from '../services/api.js';

export default function AdminKYC() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedKyc, setSelectedKyc] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchPendingTeachers = async () => {
    try {
      setLoading(true);
      const data = await api.admin.getPendingTeachers();
      const docs = Array.isArray(data) ? data : (data?.docs || []);
      
      const mapped = docs.map(item => {
        const u = item.userId;
        const name = u?.name || item.name || 'Teacher Application';
        const email = u?.email || item.email || 'N/A';
        return {
          id: item._id || item.id,
          teacher: {
            id: u?._id || item.userId || item._id,
            name,
            email,
            initials: name[0].toUpperCase(),
          },
          submittedAt: item.createdAt || new Date().toISOString(),
          status: item.verificationStatus ? item.verificationStatus.toUpperCase() : 'PENDING',
          verifiedBy: item.verifiedBy ? {
            name: item.verifiedBy.name,
            email: item.verifiedBy.email,
          } : null,
          documents: {
            aadhaar: item.aadhaarNumber ? `Aadhaar (${item.aadhaarNumber})` : 'Aadhaar Document',
            pan: item.panNumber ? `PAN (${item.panNumber})` : 'PAN Card',
            bank: 'Bank Passbook / Cheque',
            education: (item.education && item.education.length > 0) ? item.education[0].degree : 'Degree Certificate'
          }
        };
      });
      setRequests(mapped);
    } catch (err) {
      console.warn('Failed to load pending teachers from API:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "KYC Verification — Admin Dashboard";
    fetchPendingTeachers();
  }, []);

  const filteredRequests = requests.filter(r => 
    r.teacher.name.toLowerCase().includes(search.toLowerCase()) || 
    r.teacher.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleApprove = async (id) => {
    try {
      await api.admin.approveTeacher(id);
      setRequests(requests.map(r => r.id === id ? { ...r, status: 'VERIFIED' } : r));
      setSelectedKyc(null);
    } catch (err) {
      alert(err.message || 'Failed to approve teacher KYC');
    }
  };

  const handleReject = async (id) => {
    if (!rejectReason) return alert("Please enter a rejection reason");
    try {
      await api.admin.rejectTeacher(id, rejectReason);
      setRequests(requests.map(r => r.id === id ? { ...r, status: 'REJECTED', reason: rejectReason } : r));
      setSelectedKyc(null);
      setRejectReason('');
    } catch (err) {
      alert(err.message || 'Failed to reject teacher KYC');
    }
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

              {selectedKyc.verifiedBy && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Verified By</p>
                  <p className="text-sm font-semibold text-emerald-950">{selectedKyc.verifiedBy.name} ({selectedKyc.verifiedBy.email})</p>
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
