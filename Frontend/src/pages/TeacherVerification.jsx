import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const TeacherVerification = () => {
  useEffect(() => { document.title = 'Teacher Verification — TrueEd'; }, []);
  const [openFaq, setOpenFaq] = useState(null);
  const faqs = [
    { q: 'How long does verification take?', a: 'Typically 3-5 working days after submitting all documents.' },
    { q: 'Is there a fee to get verified?', a: 'No, verification is completely free for all teachers on TrueEd.' },
    { q: 'What happens if my application is rejected?', a: 'You will receive an email explaining why, and you can re-apply after fixing the issues (e.g. uploading a clearer ID scan).' },
    { q: 'Do I need to do the video interview?', a: 'Yes, a 5-minute video call is required to verify your identity and communication skills.' },
    { q: 'Are my documents safe?', a: 'Absolutely. We use bank-level encryption and do not share your documents with anyone.' },
  ];

  return (
    <div>
      {/* Hero */}
      <div className="bg-navy text-white py-20 px-6 text-center">
        <h1 className="font-sora text-4xl md:text-5xl font-extrabold mb-4">Get Your Verified Badge</h1>
        <p className="text-white/70 text-lg max-w-xl mx-auto mb-8">Build trust with students instantly. A verified badge shows you are a qualified, safe, and professional educator.</p>
        <Link to="/teacher/kyc" className="inline-block py-3.5 px-8 bg-amber text-navy rounded-lg font-sora font-semibold hover:bg-amber-hover transition">
          Start Verification
        </Link>
      </div>

      <div className="max-w-[1100px] mx-auto py-16 px-6 space-y-24">
        
        {/* Benefits */}
        <section className="text-center">
          <h2 className="font-sora text-2xl font-bold text-navy mb-10">What the Badge Means for You</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-brand shadow-sm border border-slate-100">
              <i className="fa-solid fa-eye text-3xl text-sky mb-4" />
              <h3 className="font-bold text-navy mb-2">More Visibility</h3>
              <p className="text-sm text-muted">Verified profiles rank higher in student search results and get featured on the homepage.</p>
            </div>
            <div className="bg-white p-8 rounded-brand shadow-sm border border-slate-100">
              <i className="fa-solid fa-shield-heart text-3xl text-success mb-4" />
              <h3 className="font-bold text-navy mb-2">Higher Trust</h3>
              <p className="text-sm text-muted">Parents and students are 4x more likely to book a teacher who has a verified badge.</p>
            </div>
            <div className="bg-white p-8 rounded-brand shadow-sm border border-slate-100">
              <i className="fa-solid fa-indian-rupee-sign text-3xl text-amber mb-4" />
              <h3 className="font-bold text-navy mb-2">Better Bookings</h3>
              <p className="text-sm text-muted">Command higher hourly rates by proving your qualifications and teaching experience.</p>
            </div>
          </div>
        </section>

        {/* Process Timeline */}
        <section>
          <div className="bg-cream rounded-brand p-8 md:p-12">
            <h2 className="font-sora text-2xl font-bold text-navy text-center mb-12">The Verification Process</h2>
            <div className="flex flex-col md:flex-row justify-between items-center relative">
              <div className="hidden md:block absolute top-1/2 left-0 w-full h-1 bg-white -z-0 -translate-y-1/2"></div>
              {[
                { step: 1, title: 'Apply Online', icon: 'fa-desktop' },
                { step: 2, title: 'Submit Docs', icon: 'fa-file-arrow-up' },
                { step: 3, title: 'Video Call', icon: 'fa-video' },
                { step: 4, title: 'Get Verified', icon: 'fa-certificate' },
              ].map(s => (
                <div key={s.step} className="relative z-10 flex flex-col items-center mb-8 md:mb-0 bg-cream md:px-4">
                  <div className="w-14 h-14 bg-navy text-white rounded-full flex items-center justify-center text-xl mb-3 border-4 border-cream shadow-sm">
                    <i className={`fa-solid ${s.icon}`} />
                  </div>
                  <h4 className="font-bold text-navy text-sm">{s.title}</h4>
                </div>
              ))}
            </div>
            <p className="text-center text-sm font-semibold text-sky mt-8">Estimated Timeline: 3-5 working days</p>
          </div>
        </section>

        {/* Documents Checklist */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="font-sora text-2xl font-bold text-navy mb-6">Documents Required</h2>
            <p className="text-muted text-sm mb-6">Have these ready before you start your application to speed up the process.</p>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-navy font-medium"><i className="fa-solid fa-circle-check text-success" /> Government ID (Aadhaar / PAN)</li>
              <li className="flex items-center gap-3 text-navy font-medium"><i className="fa-solid fa-circle-check text-success" /> Highest Degree Certificate</li>
              <li className="flex items-center gap-3 text-navy font-medium"><i className="fa-solid fa-circle-check text-success" /> Experience Proof (Optional but recommended)</li>
              <li className="flex items-center gap-3 text-navy font-medium"><i className="fa-solid fa-circle-check text-success" /> Clear Profile Photo</li>
            </ul>
          </div>
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
            <div className="aspect-video bg-slate-200 rounded-lg flex items-center justify-center text-muted flex-col gap-2">
              <i className="fa-solid fa-play text-3xl opacity-50" />
              <span className="text-sm font-semibold">Watch: How to upload documents correctly</span>
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section className="max-w-3xl mx-auto">
          <h2 className="font-sora text-2xl font-bold text-navy text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="border border-slate-200 rounded-lg overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between p-4 bg-white text-left hover:bg-slate-50 transition">
                  <span className="font-semibold text-navy text-sm">{faq.q}</span>
                  <i className={`fa-solid fa-chevron-down text-muted text-sm transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="p-4 bg-slate-50 border-t border-slate-200 text-sm text-muted">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
};
export default TeacherVerification;
