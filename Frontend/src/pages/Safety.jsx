import { useEffect } from 'react';
import { Link } from 'react-router-dom';

const Safety = () => {
  useEffect(() => { document.title = 'Safety — TrueEd'; }, []);
  return (
    <div>
      {/* Hero */}
      <div className="bg-navy text-white py-20 px-6 text-center">
        <div className="max-w-[800px] mx-auto">
          <i className="fa-solid fa-shield-cat text-5xl text-amber mb-6" />
          <h1 className="font-sora text-4xl md:text-5xl font-extrabold mb-4">Your Safety is Our Priority</h1>
          <p className="text-white/70 text-lg">We build trust into every layer of TrueEd to ensure a secure learning environment for students and peace of mind for parents.</p>
        </div>
      </div>

      <div className="max-w-[1100px] mx-auto py-16 px-6 space-y-20">
        
        {/* Verification */}
        <section>
          <h2 className="font-sora text-2xl font-bold text-navy text-center mb-10">How Teachers are Verified</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-brand shadow-brand text-center border-t-4 border-sky">
              <div className="w-12 h-12 bg-sky/10 text-sky rounded-full flex items-center justify-center text-xl mx-auto mb-4"><i className="fa-solid fa-id-card" /></div>
              <h3 className="font-bold text-navy mb-2">1. Application</h3>
              <p className="text-sm text-muted">Teachers submit their credentials, government ID, and educational certificates.</p>
            </div>
            <div className="bg-white p-8 rounded-brand shadow-brand text-center border-t-4 border-amber">
              <div className="w-12 h-12 bg-amber/10 text-amber rounded-full flex items-center justify-center text-xl mx-auto mb-4"><i className="fa-solid fa-magnifying-glass" /></div>
              <h3 className="font-bold text-navy mb-2">2. Background Check</h3>
              <p className="text-sm text-muted">Our dedicated team manually verifies all documents and conducts interview screenings.</p>
            </div>
            <div className="bg-white p-8 rounded-brand shadow-brand text-center border-t-4 border-success">
              <div className="w-12 h-12 bg-success/10 text-success rounded-full flex items-center justify-center text-xl mx-auto mb-4"><i className="fa-solid fa-certificate" /></div>
              <h3 className="font-bold text-navy mb-2">3. Verified Badge</h3>
              <p className="text-sm text-muted">Only approved teachers receive the verified badge to teach on our platform.</p>
            </div>
          </div>
        </section>

        {/* Policies */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-cream rounded-brand p-8">
            <h3 className="font-sora text-xl font-bold text-navy mb-4 flex items-center gap-3"><i className="fa-solid fa-message text-sky" /> Safe Communication</h3>
            <p className="text-sm text-muted mb-6 leading-relaxed">To protect both students and teachers, all communications must occur through the TrueEd platform. Sharing personal phone numbers or external links is strictly prohibited until a booking is confirmed.</p>
            <button onClick={() => console.log('clicked')} className="py-2.5 px-5 bg-white border border-slate-200 text-error rounded-lg text-sm font-semibold hover:bg-error/5 transition flex items-center gap-2">
              <i className="fa-solid fa-flag" /> Report a Teacher
            </button>
          </div>
          <div className="bg-[#fff8e7] rounded-brand p-8">
            <h3 className="font-sora text-xl font-bold text-navy mb-4 flex items-center gap-3"><i className="fa-solid fa-rotate-left text-amber" /> Refund Guarantee</h3>
            <p className="text-sm text-muted leading-relaxed">We hold payments securely for 24 hours after a session is scheduled to end. If the teacher does not show up or there are technical issues, you are entitled to a full, instant refund with zero questions asked.</p>
          </div>
        </section>

        {/* Parents & Under 18 */}
        <section className="bg-white rounded-brand shadow-brand p-8 md:p-12 border border-slate-100 flex flex-col md:flex-row gap-10 items-center">
          <div className="flex-1 space-y-6">
            <h2 className="font-sora text-2xl font-bold text-navy">Parental Controls & Under-18 Protection</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <i className="fa-solid fa-check text-success mt-1" />
                <p className="text-sm text-muted"><strong className="text-navy">Parent Accounts:</strong> Parents can create master accounts to book teachers and monitor progress for their children.</p>
              </div>
              <div className="flex items-start gap-3">
                <i className="fa-solid fa-check text-success mt-1" />
                <p className="text-sm text-muted"><strong className="text-navy">Verified Teachers:</strong> All teachers undergo profile verification before appearing on TrueEd, helping students and parents learn with confidence.</p>
              </div>
              <div className="flex items-start gap-3">
                <i className="fa-solid fa-check text-success mt-1" />
                <p className="text-sm text-muted"><strong className="text-navy">Safe Communication:</strong> Students and teachers communicate through secure TrueEd platform features, helping protect privacy and maintain a safe learning environment.</p>
              </div>
              <div className="flex items-start gap-3">
                <i className="fa-solid fa-check text-success mt-1" />
                <p className="text-sm text-muted"><strong className="text-navy">Content Moderation:</strong> Strict zero-tolerance policy for inappropriate behavior or content.</p>
              </div>
            </div>
          </div>
          <div className="w-full md:w-1/3 bg-slate-50 p-6 rounded-xl text-center">
            <i className="fa-solid fa-headset text-3xl text-navy mb-3" />
            <h4 className="font-bold text-navy mb-2">Need Help?</h4>
            <p className="text-xs text-muted mb-4">Our trust and safety team is available 24/7 for emergency support.</p>
            <a href="mailto:support@trueed.in" className="text-sky font-semibold text-sm hover:underline">support@trueed.in</a>
          </div>
        </section>

      </div>
    </div>
  );
};
export default Safety;
