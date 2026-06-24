import { useState, useEffect } from 'react';
import { Search, Filter, HelpCircle, CheckCircle, Clock, Eye, Lock, MessageSquare, X } from 'lucide-react';

export default function TeacherDoubtsPage() {
  useEffect(() => {
    document.title = "Classroom Doubts — TrueEd";
  }, []);

  const [doubts, setDoubts] = useState(() => {
    const saved = localStorage.getItem('trueed_classroom_doubts');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'DBT-1029',
        studentName: 'Aarav Sharma',
        classroomName: 'Crash Course: Organic Chemistry',
        classroomId: 1,
        subject: 'Chemistry',
        classLevel: 'Class 12',
        date: 'Oct 24, 2026',
        visibility: 'Public',
        title: 'Mechanism for SN2 Reactions',
        description: 'Can someone explain why SN2 reactions lead to inversion of configuration? I am confused about the backside attack mechanism and how steric hindrance affects the rate.',
        image: null,
        status: 'Pending',
        response: null
      },
      {
        id: 'DBT-2918',
        studentName: 'Neha Gupta',
        classroomName: 'Board Prep: Calculus Masterclass',
        classroomId: 2,
        subject: 'Mathematics',
        classLevel: 'Class 12',
        date: 'Oct 23, 2026',
        visibility: 'Private',
        title: 'Integration by Parts Doubt',
        description: 'Sir, in yesterday\'s assignment, question number 4 uses integration by parts but I am unable to identify which function to take as u and v. Can you please review my attempt attached below?',
        image: 'attached-image.jpg',
        status: 'Answered',
        response: 'Hi Neha. You should follow the ILATE rule (Inverse, Logarithmic, Algebraic, Trigonometric, Exponential) to choose u. In Q4, you have an Algebraic and Trigonometric function, so Algebraic should be u.'
      }
    ];
  });

  // Keep localStorage synced if anything updates
  useEffect(() => {
    localStorage.setItem('trueed_classroom_doubts', JSON.stringify(doubts));
  }, [doubts]);

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterVisibility, setFilterVisibility] = useState('All');

  const [selectedDoubt, setSelectedDoubt] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Derived Stats
  const pendingCount = doubts.filter(d => d.status === 'Pending').length;
  const answeredCount = doubts.filter(d => d.status === 'Answered').length;
  const publicCount = doubts.filter(d => d.visibility === 'Public').length;
  const privateCount = doubts.filter(d => d.visibility === 'Private').length;

  // Filtering
  const filteredDoubts = doubts.filter(d => {
    const matchesSearch = d.title.toLowerCase().includes(search.toLowerCase()) || 
                          d.studentName.toLowerCase().includes(search.toLowerCase()) ||
                          d.classroomName.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = filterStatus === 'All' ? true : d.status === filterStatus;
    const matchesVisibility = filterVisibility === 'All' ? true : d.visibility === filterVisibility;

    return matchesSearch && matchesStatus && matchesVisibility;
  });

  const handleOpenResponse = (doubt) => {
    setSelectedDoubt(doubt);
    setResponseText(doubt.response || '');
  };

  const handlePostAnswer = (e) => {
    e.preventDefault();
    if (!responseText.trim()) return;

    setDoubts(prev => prev.map(d => {
      if (d.id === selectedDoubt.id) {
        return { ...d, status: 'Answered', response: responseText };
      }
      return d;
    }));

    setSelectedDoubt(null);
    showToast("Doubt answered and marked resolved");
  };

  return (
    <div className="max-w-6xl mx-auto pb-12 space-y-8 relative">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 bg-navy text-white px-6 py-3 rounded-lg shadow-lg font-bold flex items-center gap-2 z-[100] animate-fade-in" role="alert">
          <CheckCircle className="w-5 h-5" />
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="font-sora text-3xl font-bold text-navy mb-2">Classroom Doubts</h1>
        <p className="text-slate-500 font-medium">Manage and respond to doubts raised by your students.</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Pending</p>
            <p className="font-sora text-2xl font-bold text-navy">{pendingCount}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Answered</p>
            <p className="font-sora text-2xl font-bold text-navy">{answeredCount}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky/10 text-sky flex items-center justify-center shrink-0">
            <Eye className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Public</p>
            <p className="font-sora text-2xl font-bold text-navy">{publicCount}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-500 flex items-center justify-center shrink-0">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Private</p>
            <p className="font-sora text-2xl font-bold text-navy">{privateCount}</p>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative w-full md:w-96 shrink-0">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Search by student, title, or classroom..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky/50 text-sm font-medium text-navy placeholder-slate-400"
          />
        </div>
        
        <div className="flex gap-3 w-full overflow-x-auto hide-scrollbar">
          <select 
            value={filterStatus} 
            onChange={e => setFilterStatus(e.target.value)}
            className="py-2.5 px-4 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-navy outline-none focus:border-sky transition cursor-pointer"
          >
            <option value="All">Status: All</option>
            <option value="Pending">Pending</option>
            <option value="Answered">Answered</option>
          </select>
          <select 
            value={filterVisibility} 
            onChange={e => setFilterVisibility(e.target.value)}
            className="py-2.5 px-4 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-navy outline-none focus:border-sky transition cursor-pointer"
          >
            <option value="All">Visibility: All</option>
            <option value="Public">Public Doubts</option>
            <option value="Private">Private Doubts</option>
          </select>
        </div>
      </div>

      {/* Doubts List */}
      <div className="space-y-4">
        {filteredDoubts.length > 0 ? (
          filteredDoubts.map(doubt => (
            <div key={doubt.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col md:flex-row gap-6">
              
              <div className="flex-1 space-y-4">
                {/* Meta */}
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider flex items-center gap-1 ${doubt.visibility === 'Public' ? 'bg-slate-100 text-slate-600' : 'bg-purple-100 text-purple-700'}`}>
                    {doubt.visibility === 'Public' ? <Eye className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                    {doubt.visibility}
                  </span>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider flex items-center gap-1 ${doubt.status === 'Answered' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {doubt.status === 'Answered' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                    {doubt.status}
                  </span>
                  {doubt.classLevel && <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md uppercase tracking-wider">{doubt.classLevel}</span>}
                  <span className="text-xs font-bold text-sky uppercase tracking-wider">{doubt.subject}</span>
                </div>

                {/* Content */}
                <div>
                  <h3 className="font-sora font-bold text-lg text-navy mb-1">{doubt.title}</h3>
                  <p className="text-sm text-slate-500 font-medium flex items-center gap-2">
                    <span className="font-bold text-slate-700">{doubt.studentName}</span>
                    <span className="text-slate-300">•</span>
                    <span>{doubt.classroomName}</span>
                    <span className="text-slate-300">•</span>
                    <span>{doubt.date}</span>
                  </p>
                </div>

                <p className="text-sm text-slate-600 leading-relaxed line-clamp-2">{doubt.description}</p>

                {doubt.image && (
                  <div className="inline-flex items-center gap-2 text-xs font-bold text-sky bg-sky/10 px-3 py-1.5 rounded-lg">
                    <i className="fa-regular fa-image"></i> Image Attached
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col justify-center items-end shrink-0 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                {doubt.status === 'Answered' ? (
                  <div className="text-right flex flex-col items-end gap-2">
                    <div className="flex items-center gap-1.5 text-emerald-600 text-sm font-bold">
                      <CheckCircle className="w-4 h-4" /> Resolved
                    </div>
                    <button 
                      onClick={() => handleOpenResponse(doubt)}
                      className="text-xs font-bold text-slate-500 hover:text-navy transition underline decoration-slate-300 underline-offset-4"
                    >
                      View Answer
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => handleOpenResponse(doubt)}
                    className="bg-navy text-white text-sm font-bold px-6 py-2.5 rounded-lg hover:bg-navy-light transition shadow-sm w-full md:w-auto"
                  >
                    View & Answer
                  </button>
                )}
              </div>

            </div>
          ))
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-16 flex flex-col items-center justify-center text-center shadow-sm">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
              <HelpCircle className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-sora font-bold text-navy mb-2">No doubts found</h3>
            <p className="text-slate-500 max-w-sm mb-6">There are no classroom doubts matching your current filters. Adjust your search or try again later.</p>
            <button 
              onClick={() => { setSearch(''); setFilterStatus('All'); setFilterVisibility('All'); }}
              className="text-sky font-bold hover:text-navy transition"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Response Modal */}
      {selectedDoubt && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-navy/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10 shrink-0">
              <div>
                <h2 className="text-xl font-sora font-bold text-navy flex items-center gap-2 mb-1">
                  <MessageSquare className="w-5 h-5 text-sky" /> Respond to Doubt
                </h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{selectedDoubt.classroomName}</p>
              </div>
              <button onClick={() => setSelectedDoubt(null)} aria-label="Close" className="text-slate-400 hover:text-slate-600 transition cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50">
              
              {/* Original Doubt */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative">
                <div className={`absolute top-0 right-0 rounded-bl-xl rounded-tr-xl px-3 py-1 text-[10px] font-bold uppercase tracking-wider border-b border-l flex items-center gap-1
                  ${selectedDoubt.visibility === 'Public' ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-purple-50 border-purple-200 text-purple-600'}`}>
                  {selectedDoubt.visibility === 'Public' ? <Eye className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                  {selectedDoubt.visibility}
                </div>
                
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <span>{selectedDoubt.studentName}</span>
                  <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                  <span>{selectedDoubt.date}</span>
                </p>
                <h3 className="font-sora font-bold text-lg text-navy mb-3">{selectedDoubt.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{selectedDoubt.description}</p>
                
                {selectedDoubt.image && (
                  <div className="mt-4 p-8 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 flex flex-col items-center justify-center text-slate-400">
                    <i className="fa-regular fa-image text-3xl mb-2"></i>
                    <span className="text-xs font-bold">Attached Image Preview</span>
                  </div>
                )}
              </div>

              {/* Teacher Response Box */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                  Your Answer
                  {selectedDoubt.visibility === 'Public' && <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded uppercase font-bold tracking-wider">Visible to whole class</span>}
                </label>
                <form id="respond-doubt-form" onSubmit={handlePostAnswer}>
                  <textarea 
                    required
                    value={responseText}
                    onChange={e => setResponseText(e.target.value)}
                    placeholder="Provide a detailed explanation to help the student..."
                    rows="6"
                    className="w-full bg-white border border-slate-200 rounded-xl p-4 text-sm font-medium text-navy outline-none focus:border-sky focus:ring-1 focus:ring-sky transition resize-none shadow-sm"
                  ></textarea>
                </form>
              </div>

            </div>
            
            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-white sticky bottom-0 shrink-0">
              <button onClick={() => setSelectedDoubt(null)} type="button" className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 text-sm font-bold rounded-lg hover:bg-slate-100 transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-200">
                Cancel
              </button>
              <button type="submit" form="respond-doubt-form" className="px-6 py-2.5 bg-sky text-white text-sm font-bold rounded-lg hover:bg-blue-600 transition shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky/50 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> Post Answer & Mark Resolved
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
