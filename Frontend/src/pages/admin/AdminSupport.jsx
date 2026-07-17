// src/pages/admin/AdminSupport.jsx
// Support ticket management for admin. Backend may or may not have a support
// endpoint; we gracefully handle both cases.
import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { MessageSquare, CheckCircle, Clock } from 'lucide-react';
import apiClient from '@/services/apiClient';
import Spinner from '@/components/shared/Spinner';
import { formatDate } from '@/utils/date.util';

// ── Local service (no dedicated support.service.js exists) ────────────────────
const supportService = {
  getAll: (params) => apiClient.get('/support/tickets', { params }),
  reply: (id, data) => apiClient.post(`/support/tickets/${id}/reply`, data),
  resolve: (id) => apiClient.patch(`/support/tickets/${id}/resolve`),
};

const initials = (name = '') => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

const AdminSupport = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('open');
  const [activeTicket, setActiveTicket] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [apiUnavailable, setApiUnavailable] = useState(false);

  useEffect(() => { document.title = 'Support — Admin'; }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supportService.getAll({ status: filter });
      const payload = data?.data ?? data;
      setTickets(payload?.items ?? payload?.docs ?? payload ?? []);
    } catch (err) {
      // 404 = endpoint not yet implemented; show empty state gracefully
      const status = err?.statusCode || err?.response?.status;
      if (status === 404 || status === 405) {
        setApiUnavailable(true);
        setTickets([]);
      } else {
        toast.error(err?.message || 'Could not load support tickets');
      }
    } finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const handleReply = async (ticketId) => {
    if (!replyText.trim()) return;
    setReplying(true);
    try {
      await supportService.reply(ticketId, { message: replyText });
      toast.success('Reply sent');
      setReplyText('');
      load();
    } catch (err) {
      toast.error(err?.message || 'Could not send reply');
    } finally { setReplying(false); }
  };

  const handleResolve = async (ticketId) => {
    setResolving(true);
    try {
      await supportService.resolve(ticketId);
      toast.success('Ticket resolved');
      setActiveTicket(null);
      load();
    } catch (err) {
      toast.error(err?.message || 'Could not resolve ticket');
    } finally { setResolving(false); }
  };

  const filteredTickets = tickets;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="font-sora text-2xl md:text-3xl font-bold text-navy mb-1">Support Tickets</h1>
        <p className="text-slate-500 font-medium text-sm md:text-base">Manage and resolve issues reported by users.</p>
      </div>

      {apiUnavailable ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-16 text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="font-bold text-navy text-lg mb-2">Support Module Unavailable</h3>
          <p className="text-slate-500 font-medium text-sm">The support ticket API is not yet enabled. Contact the backend team to activate it.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Ticket List */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col h-[700px] lg:col-span-1">
            <div className="p-4 border-b border-slate-100 flex gap-2">
              {['open', 'resolved'].map(f => (
                <button key={f} onClick={() => { setFilter(f); setActiveTicket(null); }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition capitalize ${filter === f ? 'bg-navy text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                  {f === 'open' ? 'Open Tickets' : 'Resolved'}
                </button>
              ))}
            </div>
            <div className="overflow-y-auto flex-1 p-3 space-y-3">
              {loading ? (
                <div className="flex justify-center py-8"><Spinner /></div>
              ) : filteredTickets.length === 0 ? (
                <div className="p-8 text-center text-slate-500 font-medium">No tickets found.</div>
              ) : (
                filteredTickets.map(ticket => (
                  <div key={ticket._id} onClick={() => setActiveTicket(ticket)}
                    className={`p-4 rounded-xl border cursor-pointer transition ${activeTicket?._id === ticket._id ? 'border-sky bg-sky-50 shadow-sm' : 'border-slate-100 bg-white hover:border-slate-300'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-navy text-white flex items-center justify-center text-[10px] font-bold">
                          {initials(ticket.userId?.name || ticket.user?.name)}
                        </div>
                        <span className="font-bold text-navy text-xs">{ticket.userId?.name || ticket.user?.name || 'User'}</span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400">{formatDate(ticket.createdAt)}</span>
                    </div>
                    <p className="font-bold text-navy text-sm mb-1 truncate">{ticket.subject || ticket.category || 'Support Request'}</p>
                    <p className="text-xs font-medium text-slate-500 line-clamp-2">{ticket.message || ticket.description}</p>
                    <div className="mt-3">
                      {ticket.status === 'open' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold uppercase">
                          <Clock className="w-3 h-3" /> Pending
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase">
                          <CheckCircle className="w-3 h-3" /> Resolved
                        </span>
                      )}
                    </div>
                  </div>
                ))
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
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${activeTicket.status === 'open' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {activeTicket.status}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">{formatDate(activeTicket.createdAt)}</span>
                    </div>
                    <h2 className="font-sora text-xl font-bold text-navy mb-2">
                      {activeTicket.subject || activeTicket.category || 'Support Request'}
                    </h2>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-navy text-white flex items-center justify-center text-sm font-bold">
                        {initials(activeTicket.userId?.name || activeTicket.user?.name)}
                      </div>
                      <div>
                        <p className="font-bold text-navy text-sm">{activeTicket.userId?.name || activeTicket.user?.name || 'User'}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{activeTicket.userId?.role || 'user'}</p>
                      </div>
                    </div>
                  </div>
                  {activeTicket.status === 'open' && (
                    <button onClick={() => handleResolve(activeTicket._id)} disabled={resolving}
                      className="px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-lg hover:bg-emerald-100 transition shadow-sm flex items-center gap-2 disabled:opacity-50">
                      <CheckCircle className="w-4 h-4" /> Mark Resolved
                    </button>
                  )}
                </div>

                <div className="flex-1 p-6 overflow-y-auto space-y-6">
                  <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl rounded-tl-none w-5/6">
                    <p className="text-sm font-medium text-slate-700 whitespace-pre-wrap">
                      {activeTicket.message || activeTicket.description || 'No message provided.'}
                    </p>
                  </div>
                  {(activeTicket.replies || []).map((reply, i) => (
                    <div key={i} className={`p-5 rounded-2xl w-5/6 ${reply.sender === 'Admin' || reply.role === 'admin' ? 'bg-sky-50 border border-sky-100 rounded-tr-none ml-auto' : 'bg-slate-50 border border-slate-200 rounded-tl-none'}`}>
                      <p className="text-xs font-bold text-sky-700 uppercase tracking-wider mb-2">{reply.sender || reply.role || 'Admin'}</p>
                      <p className="text-sm font-medium text-slate-700 whitespace-pre-wrap">{reply.text || reply.message}</p>
                    </div>
                  ))}
                </div>

                {activeTicket.status === 'open' ? (
                  <div className="p-4 border-t border-slate-100 bg-white">
                    <textarea value={replyText} onChange={e => setReplyText(e.target.value)}
                      placeholder="Type your reply here..."
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:border-sky transition min-h-[100px] mb-3" />
                    <div className="flex justify-end">
                      <button onClick={() => handleReply(activeTicket._id)} disabled={replying}
                        className="px-6 py-2.5 bg-navy text-white text-sm font-bold rounded-xl hover:bg-navy-hover transition shadow-sm flex items-center gap-2 disabled:opacity-50">
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
      )}
    </div>
  );
};

export default AdminSupport;
