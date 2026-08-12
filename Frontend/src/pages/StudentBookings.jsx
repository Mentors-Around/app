import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const StudentBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'My Bookings — TrueEd';
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const res = await api.enrollment.getMyEnrollments().catch(() => null);
        const list = Array.isArray(res) ? res : (res?.docs || res?.enrollments || []);
        const mapped = list.map(e => ({
          id: e._id || e.id,
          teacher: e.teacherId?.name || e.teacherName || 'Teacher',
          subject: e.classroomId?.subject || e.subject || 'Classroom Session',
          date: e.createdAt ? new Date(e.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently',
          time: 'Active',
          status: e.status === 'active' ? 'Upcoming' : (e.status === 'completed' ? 'Completed' : 'Cancelled'),
        }));
        setBookings(mapped);
      } catch (err) {
        console.warn('Failed to load student bookings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  return (
    <div className="max-w-[1000px] mx-auto">
      <h1 className="font-sora text-2xl font-bold text-navy mb-6">My Bookings</h1>
      <div className="bg-white rounded-brand shadow-brand p-6 md:p-8">
        <div className="space-y-4">
          {loading ? (
            <div className="py-12 text-center text-slate-500 font-medium">Loading bookings...</div>
          ) : bookings.length > 0 ? (
            bookings.map(b => (
              <div key={b.id} className="border border-slate-100 p-4 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-sm transition">
                <div>
                  <h4 className="font-bold text-navy">{b.teacher}</h4>
                  <p className="text-xs text-muted mb-1">{b.subject}</p>
                  <p className="text-xs text-slate-500"><i className="fa-regular fa-calendar mr-1" /> {b.date}</p>
                </div>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full w-fit ${
                  b.status === 'Upcoming' ? 'bg-sky/10 text-sky' : b.status === 'Completed' ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
                }`}>
                  {b.status}
                </span>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center text-center py-16">
              <span className="text-6xl mb-4">📅</span>
              <h3 className="text-xl font-semibold text-navy mb-2">No bookings yet</h3>
              <p className="text-slate-500 mb-6">Find a teacher and book your first session!</p>
              <Link to="/student/discover" className="bg-navy text-white px-6 py-2.5 rounded-lg font-bold hover:bg-navy-light transition shadow-md">
                Find a Teacher
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default StudentBookings;
