import React, { useState, useEffect } from 'react';
import { Search, Filter, AlertCircle, CheckCircle, Clock, XCircle, ChevronDown, ChevronUp, ShieldAlert } from 'lucide-react';

const DUMMY_STUDENTS = [
  { id: 1, name: 'Aarav M.' },
  { id: 2, name: 'Priya K.' },
  { id: 3, name: 'Rahul S.' },
  { id: 4, name: 'Sneha P.' }
];

const DUMMY_REPORTS = [
  { id: 'REP-1001', student: 'Rahul S.', category: 'Misbehavior', description: 'Disruptive during online sessions.', date: 'Oct 24, 2026', status: 'Pending Review', history: [{ state: 'Submitted', date: 'Oct 24, 2026' }] },
  { id: 'REP-1002', student: 'Karan V.', category: 'Spam', description: 'Spamming the chat with irrelevant links.', date: 'Oct 20, 2026', status: 'Under Investigation', history: [{ state: 'Submitted', date: 'Oct 20, 2026' }, { state: 'Investigation Started', date: 'Oct 21, 2026' }] },
  { id: 'REP-1003', student: 'Rohan D.', category: 'Non-payment', description: 'Has not paid for the last 3 sessions.', date: 'Sep 15, 2026', status: 'Resolved', history: [{ state: 'Submitted', date: 'Sep 15, 2026' }, { state: 'Investigation Started', date: 'Sep 16, 2026' }, { state: 'Case Closed', date: 'Sep 18, 2026' }] },
];

export default function TeacherReports() {
  useEffect(() => {
    document.title = "Student Reports — TrueEd";
  }, []);

  const [reports, setReports] = useState(DUMMY_REPORTS);
  const [showForm, setShowForm] = useState(false);
  const [expandedReportId, setExpandedReportId] = useState(null);
  
  const [formData, setFormData] = useState({
    studentId: '',
    category: '',
    description: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.studentId || !formData.category || !formData.description) return;
    
    const student = DUMMY_STUDENTS.find(s => s.id === parseInt(formData.studentId));
    const newReport = {
      id: `REP-${1004 + reports.length}`,
      student: student.name,
      category: formData.category,
      description: formData.description,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      status: 'Pending Review',
      history: [{ state: 'Submitted', date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }]
    };
    
    setReports([newReport, ...reports]);
    setShowForm(false);
    setFormData({ studentId: '', category: '', description: '' });
  };

  const handleAdminAction = (id, newStatus) => {
    setReports(reports.map(r => {
      if (r.id === id) {
        let historyState = '';
        if (newStatus === 'Under Investigation') historyState = 'Investigation Started';
        else if (newStatus === 'Resolved') historyState = 'Case Closed';
        else if (newStatus === 'Rejected') historyState = 'Report Rejected';
        
        return {
          ...r,
          status: newStatus,
          history: [...r.history, { state: historyState, date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }]
        };
      }
      return r;
    }));
  };

  const toggleExpand = (id) => {
    setExpandedReportId(expandedReportId === id ? null : id);
  };

  const pendingCount = reports.filter(r => r.status === 'Pending Review').length;
  const investigationCount = reports.filter(r => r.status === 'Under Investigation').length;
  const resolvedCount = reports.filter(r => r.status === 'Resolved').length;

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-sora font-bold text-navy">Student Reports</h1>
          <p className="text-slate-500 mt-1">Manage and track issues raised regarding students</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-navy text-white px-5 py-2.5 rounded-lg font-bold hover:bg-navy-light transition flex items-center gap-2"
        >
          <i className={`fa-solid ${showForm ? 'fa-xmark' : 'fa-plus'}`}></i> 
          {showForm ? 'Cancel' : 'Create Report'}
        </button>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-amber-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500">Pending Review</p>
            <p className="font-sora font-extrabold text-2xl text-navy">{pendingCount}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-sky-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-sky-50 text-sky-500 flex items-center justify-center shrink-0">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500">Under Investigation</p>
            <p className="font-sora font-extrabold text-2xl text-navy">{investigationCount}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-green-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-50 text-green-500 flex items-center justify-center shrink-0">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500">Resolved</p>
            <p className="font-sora font-extrabold text-2xl text-navy">{resolvedCount}</p>
          </div>
        </div>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm animate-fade-in">
          <h2 className="font-sora font-bold text-lg text-navy mb-4">Raise a New Report</h2>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Select Student</label>
                <select 
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 outline-none focus:border-navy transition bg-white"
                  value={formData.studentId}
                  onChange={(e) => setFormData({...formData, studentId: e.target.value})}
                  required
                >
                  <option value="">-- Choose a Student --</option>
                  {DUMMY_STUDENTS.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Category</label>
                <select 
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 outline-none focus:border-navy transition bg-white"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  required
                >
                  <option value="">-- Select Category --</option>
                  <option value="Misbehavior">Misbehavior</option>
                  <option value="Spam">Spam</option>
                  <option value="Non-payment">Non-payment</option>
                  <option value="Harassment">Harassment</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Description</label>
              <textarea 
                rows="4" 
                className="w-full border border-slate-300 rounded-lg px-4 py-3 outline-none focus:border-navy transition resize-none"
                placeholder="Please describe the issue in detail..."
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                required
              ></textarea>
            </div>
            <div className="flex justify-end pt-2">
              <button type="submit" className="bg-navy text-white px-6 py-2.5 rounded-lg font-bold hover:bg-navy-light transition">
                Submit Report
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reports List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h2 className="font-sora font-bold text-navy text-lg">Recent Reports</h2>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
              <input type="text" placeholder="Search reports..." className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:border-navy outline-none transition" />
            </div>
            <button className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 transition"><Filter className="w-5 h-5" /></button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <th className="p-4 font-bold border-b border-slate-200">Report ID</th>
                <th className="p-4 font-bold border-b border-slate-200">Student</th>
                <th className="p-4 font-bold border-b border-slate-200">Category</th>
                <th className="p-4 font-bold border-b border-slate-200">Date</th>
                <th className="p-4 font-bold border-b border-slate-200">Status</th>
                <th className="p-4 font-bold border-b border-slate-200"></th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {reports.map((report) => (
                <React.Fragment key={report.id}>
                  <tr 
                    onClick={() => toggleExpand(report.id)}
                    className="border-b border-slate-100 hover:bg-slate-50/50 transition cursor-pointer"
                  >
                    <td className="p-4 font-semibold text-navy">{report.id}</td>
                    <td className="p-4 font-medium text-slate-700">{report.student}</td>
                    <td className="p-4 text-slate-600">{report.category}</td>
                    <td className="p-4 text-slate-500">{report.date}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold
                        ${report.status === 'Pending Review' ? 'bg-amber-50 text-amber-600 border border-amber-200' : ''}
                        ${report.status === 'Under Investigation' ? 'bg-sky-50 text-sky-600 border border-sky-200' : ''}
                        ${report.status === 'Resolved' ? 'bg-green-50 text-green-600 border border-green-200' : ''}
                        ${report.status === 'Rejected' ? 'bg-red-50 text-red-600 border border-red-200' : ''}
                      `}>
                        {report.status === 'Pending Review' && <Clock className="w-3 h-3" />}
                        {report.status === 'Under Investigation' && <AlertCircle className="w-3 h-3" />}
                        {report.status === 'Resolved' && <CheckCircle className="w-3 h-3" />}
                        {report.status === 'Rejected' && <XCircle className="w-3 h-3" />}
                        {report.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {expandedReportId === report.id ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                    </td>
                  </tr>
                  
                  {/* Expanded Row */}
                  {expandedReportId === report.id && (
                    <tr className="bg-slate-50/50 border-b border-slate-200">
                      <td colSpan="6" className="p-6">
                        <div className="flex flex-col lg:flex-row gap-8">
                          
                          {/* Left: Details */}
                          <div className="flex-1">
                            <h4 className="font-bold text-navy mb-2">Report Description</h4>
                            <p className="text-slate-600 text-sm bg-white p-4 rounded-lg border border-slate-200">
                              "{report.description}"
                            </p>
                            
                            {/* Admin Actions Simulator */}
                            <div className="mt-6 p-4 bg-sky-50 border border-sky-100 rounded-lg">
                              <h4 className="font-bold text-sky-800 text-xs uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                <ShieldAlert className="w-4 h-4" /> Admin Action Simulator
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {report.status === 'Pending Review' && (
                                  <button onClick={() => handleAdminAction(report.id, 'Under Investigation')} className="px-4 py-2 bg-sky-600 text-white text-xs font-bold rounded shadow-sm hover:bg-sky-700 transition">
                                    Start Investigation
                                  </button>
                                )}
                                {(report.status === 'Pending Review' || report.status === 'Under Investigation') && (
                                  <>
                                    <button onClick={() => handleAdminAction(report.id, 'Resolved')} className="px-4 py-2 bg-green-600 text-white text-xs font-bold rounded shadow-sm hover:bg-green-700 transition">
                                      Resolve
                                    </button>
                                    <button onClick={() => handleAdminAction(report.id, 'Rejected')} className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded shadow-sm hover:bg-red-700 transition">
                                      Reject
                                    </button>
                                  </>
                                )}
                                {(report.status === 'Resolved' || report.status === 'Rejected') && (
                                  <span className="text-sm font-bold text-slate-500">No further actions available.</span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {/* Right: Timeline */}
                          <div className="w-full lg:w-1/3 shrink-0">
                            <h4 className="font-bold text-navy mb-4">Status Timeline</h4>
                            <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-slate-200">
                              {report.history.map((h, i) => (
                                <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                  <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-white bg-sky-500 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10"></div>
                                  <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-3 rounded bg-white border border-slate-200 shadow-sm">
                                    <p className="font-bold text-slate-700 text-xs">{h.state}</p>
                                    <p className="text-[10px] text-slate-500 mt-1">{h.date}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
