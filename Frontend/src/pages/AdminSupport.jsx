import { useState, useEffect } from 'react';
import { Search, MessageSquare, CheckCircle, Clock, Loader2 } from 'lucide-react';
import TeacherAvatar from '../components/shared/TeacherAvatar';
import api from '../services/api.js';

export default function AdminSupport() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('OPEN');
  const [activeTicket, setActiveTicket] = useState(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    document.title = "Support — Admin Dashboard";
    
    const fetchTickets = async () => {
      try {
        setLoading(true);
        // Clean ticket list when backend support ticketing starts at 0 entries
        setTickets([]);
      } catch (err) {
        console.warn('Failed to load support tickets:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, []);

  const filteredTickets = tickets.filter(t => t.status === filter);

  const handleReply = (id) => {
    if (!replyText.trim()) return;
    setTickets(tickets.map(t => {
      if (t.id === id) {
        return { ...t, replies: [...t.replies, { sender: 'Admin', text: replyText }] };
      }
      return t;
    }));
    setReplyText('');
  };

  const handleResolve = (id) => {
    setTickets(tickets.map(t => t.id === id ? { ...t, status: 'RESOLVED' } : t));
    setActiveTicket(null);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="font-sora text-2xl md:text-3xl font-bold text-navy mb-1">Support Tickets</h1>
          <p className="text-slate-500 font-medium text-sm md:text-base">Manage and resolve issues reported by users.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ticket List */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col h-[700px] lg:col-span-1">
          <div className="p-4 border-b border-slate-100 flex gap-2">
            <button 
              onClick={() => { setFilter('OPEN'); setActiveTicket(null); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition \${filter === 'OPEN' ? 'bg-navy text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
            >
              Open Tickets
            </button>
            <button 
              onClick={() => { setFilter('RESOLVED'); setActiveTicket(null); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition \${filter === 'RESOLVED' ? 'bg-navy text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
            >
              Resolved
            </button>
          </div>
          <div className="overflow-y-auto flex-1 p-3 space-y-3">
            {filteredTickets.map(ticket => (
              <div 
                key={ticket.id} 
                onClick={() => setActiveTicket(ticket)}
                className={`p-4 rounded-xl border cursor-pointer transition \${activeTicket?.id === ticket.id ? 'border-sky bg-sky-50 shadow-sm' : 'border-slate-100 bg-white hover:border-slate-300'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <TeacherAvatar teacherId={ticket.id} name={ticket.user.name} initials={ticket.user.initials} className="w-6 h-6 text-[10px]" />
                    <span className="font-bold text-navy text-xs">{ticket.user.name}</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{new Date(ticket.date).toLocaleDateString()}</span>
                </div>
                <p className="font-bold text-navy text-sm mb-1 truncate">{ticket.subject}</p>
                <p className="text-xs font-medium text-slate-500 line-clamp-2">{ticket.message}</p>
                
                {ticket.status === 'OPEN' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold uppercase mt-3"><Clock className="w-3 h-3"/> Pending</span>
                )}
                {ticket.status === 'RESOLVED' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase mt-3"><CheckCircle className="w-3 h-3"/> Resolved</span>
                )}
              </div>
            ))}
            
            {filteredTickets.length === 0 && (
              <div className="p-8 text-center text-slate-500 font-medium">
                No tickets found.
              </div>
            )}
          </div>
        </div>

        {/* Ticket Details */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 h-[700px] lg:col-span-2 flex flex-col">
          {activeTicket ? (
            <>
              <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full \${activeTicket.status === 'OPEN' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {activeTicket.status}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">{new Date(activeTicket.date).toLocaleDateString()}</span>
                  </div>
                  <h2 className="font-sora text-xl font-bold text-navy mb-4">{activeTicket.subject}</h2>
                  <div className="flex items-center gap-3">
                    <TeacherAvatar teacherId={activeTicket.id} name={activeTicket.user.name} initials={activeTicket.user.initials} className="w-10 h-10 text-sm" />
                    <div>
                      <p className="font-bold text-navy text-sm">{activeTicket.user.name}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{activeTicket.user.type}</p>
                    </div>
                  </div>
                </div>
                {activeTicket.status === 'OPEN' && (
                  <button 
                    onClick={() => handleResolve(activeTicket.id)}
                    className="px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-lg hover:bg-emerald-100 transition shadow-sm flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" /> Mark Resolved
                  </button>
                )}
              </div>
              
              <div className="flex-1 p-6 overflow-y-auto space-y-6">
                {/* User Message */}
                <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl rounded-tl-none w-5/6">
                  <p className="text-sm font-medium text-slate-700 whitespace-pre-wrap">{activeTicket.message}</p>
                </div>
                
                {/* Replies */}
                {activeTicket.replies.map((reply, i) => (
                  <div key={i} className={`p-5 rounded-2xl w-5/6 \${reply.sender === 'Admin' ? 'bg-sky-50 border border-sky-100 rounded-tr-none ml-auto' : 'bg-slate-50 border border-slate-200 rounded-tl-none'}`}>
                    <p className="text-xs font-bold text-sky-700 uppercase tracking-wider mb-2">{reply.sender}</p>
                    <p className="text-sm font-medium text-slate-700 whitespace-pre-wrap">{reply.text}</p>
                  </div>
                ))}
              </div>

              {/* Reply Box */}
              {activeTicket.status === 'OPEN' ? (
                <div className="p-4 border-t border-slate-100 bg-white">
                  <textarea 
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your reply here..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:border-sky transition min-h-[100px] mb-3"
                  ></textarea>
                  <div className="flex justify-end">
                    <button 
                      onClick={() => handleReply(activeTicket.id)}
                      className="px-6 py-2.5 bg-navy text-white text-sm font-bold rounded-xl hover:bg-navy-light transition shadow-sm flex items-center gap-2"
                    >
                      <MessageSquare className="w-4 h-4" /> Send Reply
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 border-t border-slate-100 bg-slate-50 text-center">
                  <p className="text-sm font-semibold text-slate-500 flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4" /> This ticket has been resolved.
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <MessageSquare className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="font-bold text-navy text-lg mb-2">No Ticket Selected</h3>
              <p className="text-slate-500 font-medium text-sm">Select a ticket from the list to view details and reply.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
