import { useEffect } from 'react';
import { Link } from 'react-router-dom';

const Community = () => {
  useEffect(() => { document.title = 'Community — TrueEd'; }, []);
  return (
    <div className="bg-cream/30 min-h-screen">
      {/* Hero */}
      <div className="bg-navy text-white py-16 px-6 text-center">
        <h1 className="font-sora text-3xl md:text-4xl font-extrabold mb-3">Join the TrueEd Teacher Community</h1>
        <p className="text-white/70 text-sm max-w-xl mx-auto">Connect, share resources, and grow with thousands of educators across India.</p>
      </div>

      <div className="max-w-[1100px] mx-auto py-12 px-6 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
        
        {/* Main Content: Forums */}
        <div className="space-y-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-sora text-xl font-bold text-navy">Recent Discussions</h2>
            <button onClick={() => console.log('clicked')} className="text-sm font-semibold text-sky hover:underline">New Post</button>
          </div>
          
          <div className="space-y-3">
            {[
              { title: 'Best online whiteboard tools for Mathematics?', author: 'Alex Johnson', initials: 'AJ', replies: 12, time: '2 hours ago', color: '#3b82f6' },
              { title: 'How to handle students who refuse to do homework', author: 'Neha Gupta', initials: 'NG', replies: 34, time: '5 hours ago', color: '#ec4899' },
              { title: 'CBSE Class 10 Science - New syllabus changes discussed', author: 'Dr. Suresh', initials: 'DS', replies: 8, time: '1 day ago', color: '#f59e0b' },
              { title: 'Tax filing tips for freelance educators', author: 'Amit S.', initials: 'AS', replies: 45, time: '2 days ago', color: '#10b981' },
              { title: 'Share your best ice-breaker questions here!', author: 'Priya P.', initials: 'PP', replies: 89, time: '3 days ago', color: '#8b5cf6' },
            ].map((post, i) => (
              <div key={i} className="bg-white p-4 rounded-brand shadow-sm border border-slate-100 flex gap-4 hover:shadow-brand transition cursor-pointer">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: post.color }}>
                  {post.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-navy text-sm mb-1 truncate">{post.title}</h3>
                  <div className="flex items-center gap-3 text-xs text-muted">
                    <span>{post.author}</span>
                    <span>·</span>
                    <span>{post.time}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg h-fit">
                  <i className="fa-regular fa-comment" /> {post.replies}
                </div>
              </div>
            ))}
          </div>

          {/* Resources */}
          <div className="pt-8 border-t border-slate-200">
            <h2 className="font-sora text-xl font-bold text-navy mb-6">Free Resources</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { title: 'Class 10 Math Lesson Plan', type: 'PDF' },
                { title: `Online Teaching Guide ${new Date().getFullYear()}`, type: 'E-Book' },
                { title: 'Invoice Template', type: 'Excel' }
              ].map(r => (
                <div key={r.title} className="bg-white p-4 rounded-brand border border-slate-200 text-center hover:border-sky transition cursor-pointer">
                  <i className="fa-solid fa-file-arrow-down text-3xl text-sky mb-3" />
                  <h4 className="font-semibold text-navy text-sm mb-1">{r.title}</h4>
                  <p className="text-xs text-muted mb-3">{r.type}</p>
                  <button onClick={() => console.log('clicked')} className="text-xs font-semibold text-sky bg-sky/10 px-3 py-1.5 rounded-full w-full">Download</button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Webinar */}
          <div className="bg-gradient-to-br from-navy to-navy-light text-white p-5 rounded-brand shadow-brand-lg relative overflow-hidden">
            <i className="fa-solid fa-video text-6xl text-white/10 absolute -right-2 -bottom-2" />
            <span className="bg-amber text-navy text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-3 inline-block">Upcoming Webinar</span>
            <h3 className="font-sora font-bold text-lg mb-2 relative z-10">Mastering Online Engagement</h3>
            <p className="text-white/70 text-xs mb-4 relative z-10"><i className="fa-regular fa-calendar mr-1" /> This Saturday, 5 PM</p>
            <button onClick={() => console.log('clicked')} className="w-full py-2 bg-white text-navy rounded-lg text-sm font-semibold hover:bg-cream transition relative z-10">Register Now</button>
          </div>

          {/* Spotlight */}
          <div className="bg-white p-5 rounded-brand border border-slate-200 text-center">
            <h3 className="font-sora font-bold text-navy text-sm mb-4">Teacher of the Month 🏆</h3>
            <img src="https://ui-avatars.com/api/?name=Anita+Rao&background=0D8ABC&color=fff&size=80" alt="Anita" className="w-16 h-16 rounded-full mx-auto mb-3" />
            <h4 className="font-semibold text-navy text-sm">Anita Rao</h4>
            <p className="text-xs text-muted mb-3">Biology · Mumbai</p>
            <p className="text-xs text-slate-600 italic">"150+ sessions completed with a perfect 5.0 rating this month."</p>
          </div>

          {/* Regional Groups */}
          <div className="bg-white p-5 rounded-brand border border-slate-200">
            <h3 className="font-sora font-bold text-navy text-sm mb-4">Regional WhatsApp Groups</h3>
            <div className="space-y-2">
              {['Bangalore Educators', 'Delhi NCR Tutors', 'Mumbai Teaching Hub', 'All India Network'].map(g => (
                <button onClick={() => console.log('clicked')} key={g} className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[#25D366]/10 text-left transition group">
                  <span className="text-xs font-semibold text-navy group-hover:text-[#25D366]">{g}</span>
                  <i className="fa-brands fa-whatsapp text-[#25D366]" />
                </button>
              ))}
            </div>
          </div>

          {/* Announcements */}
          <div className="bg-cream p-5 rounded-brand">
            <h3 className="font-sora font-bold text-navy text-sm mb-4">Announcements</h3>
            <ul className="space-y-3">
              <li className="text-xs">
                <span className="text-sky font-bold block mb-0.5">New Feature!</span>
                <span className="text-muted">You can now add video introductions to your profile.</span>
              </li>
              <li className="text-xs">
                <span className="text-amber font-bold block mb-0.5">Referral Bonus</span>
                <span className="text-muted">Earn ₹1000 for every teacher you refer who completes KYC.</span>
              </li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
};
export default Community;
