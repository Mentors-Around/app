import { useState, useEffect } from 'react';

const CoachingCenters = () => {
  const [form, setForm] = useState({
    centerName: '',
    ownerName: '',
    phone: '',
    city: '',
    subjects: [],
    studentsCount: ''
  });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    document.title = 'For Coaching Centers — TrueEd';
    window.scrollTo(0, 0);
  }, []);

  const handleSubjectToggle = (subject) => {
    setForm(prev => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter(s => s !== subject)
        : [...prev.subjects, subject]
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 5000);
    setForm({ centerName: '', ownerName: '', phone: '', city: '', subjects: [], studentsCount: '' });
  };

  return (
    <div className="min-h-screen bg-cream">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-navy to-blue-900 text-white py-24 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <span className="inline-block py-1 px-3 rounded-full bg-amber/20 text-amber font-bold text-xs mb-6">NEW FOR INSTITUTES</span>
          <h1 className="font-sora text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
            Grow Your Coaching Center with True<span className="text-amber">Edu</span>
          </h1>
          <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
            List your center, manage students and get paid securely. We handle the technology so you can focus on teaching.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="#apply" className="w-full sm:w-auto py-3.5 px-8 bg-amber text-navy rounded-brand font-sora font-semibold hover:bg-amber-hover hover:-translate-y-1 transition-all">
              Join Now
            </a>
            <a href="#how-it-works" className="w-full sm:w-auto py-3.5 px-8 bg-white/10 text-white border border-white/20 rounded-brand font-sora font-semibold hover:bg-white/20 transition-all">
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white border-b border-slate-200 py-10 px-6">
        <div className="max-w-[1100px] mx-auto flex flex-wrap justify-around gap-8 text-center">
          <div>
            <div className="font-sora text-3xl font-extrabold text-navy">50+</div>
            <div className="text-sm text-muted font-medium mt-1">Centers Onboarded</div>
          </div>
          <div>
            <div className="font-sora text-3xl font-extrabold text-navy">500+</div>
            <div className="text-sm text-muted font-medium mt-1">Students Placed</div>
          </div>
          <div>
            <div className="font-sora text-3xl font-extrabold text-navy">20+</div>
            <div className="text-sm text-muted font-medium mt-1">Cities Across India</div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 px-6 max-w-[1100px] mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-sora text-3xl font-bold text-navy mb-4">The Challenges You Face Today</h2>
          <p className="text-muted">Running a coaching center isn't easy without the right tools.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: 'fa-users-slash', title: 'Hard to find new students', desc: 'Relying purely on word-of-mouth limits your reach in today\'s digital world.' },
            { icon: 'fa-money-bill-transfer', title: 'Manual fee collection', desc: 'Chasing students for payments and maintaining physical ledgers is stressful.' },
            { icon: 'fa-globe', title: 'No online presence', desc: 'Creating and maintaining a website is expensive and technically challenging.' }
          ].map((item, i) => (
            <div key={i} className="bg-white p-8 rounded-brand shadow-sm border border-slate-200 text-center hover:shadow-md transition">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center text-2xl mx-auto mb-6">
                <i className={`fa-solid ${item.icon}`} />
              </div>
              <h3 className="font-sora font-bold text-navy text-lg mb-3">{item.title}</h3>
              <p className="text-sm text-muted">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-6 bg-navy text-white">
        <div className="max-w-[1100px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-sora text-3xl font-bold text-white mb-4">Why Partner With Us?</h2>
            <p className="text-white/60">Everything you need to modernize your coaching center.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              { icon: 'fa-magnifying-glass-location', title: 'Get discovered by local students', desc: 'Appear in top search results when students look for batches in your city or area.' },
              { icon: 'fa-shield-halved', title: 'Secure escrow payments', desc: 'Fees are collected upfront and deposited directly to your bank account safely.' },
              { icon: 'fa-calendar-days', title: 'Manage all batches online', desc: 'Organize timings, subjects, and student rosters from a single clean dashboard.' },
              { icon: 'fa-star', title: 'Build your reputation', desc: 'Collect verified reviews from past students to attract even more admissions.' }
            ].map((item, i) => (
              <div key={i} className="bg-white/5 p-8 rounded-brand border border-white/10 flex gap-6 hover:bg-white/10 transition">
                <div className="w-14 h-14 bg-amber text-navy rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                  <i className={`fa-solid ${item.icon}`} />
                </div>
                <div>
                  <h3 className="font-sora font-bold text-lg mb-2">{item.title}</h3>
                  <p className="text-white/60 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-6 max-w-[1100px] mx-auto text-center">
        <h2 className="font-sora text-3xl font-bold text-navy mb-16">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
          <div className="hidden md:block absolute top-8 left-[10%] right-[10%] h-0.5 bg-slate-200" />
          {[
            { step: '1', title: 'Register your center', desc: 'Fill out the form below to get verified' },
            { step: '2', title: 'List your batches', desc: 'Add subjects, timings, and fees' },
            { step: '3', title: 'Students discover', desc: 'Local students find and book your batches' },
            { step: '4', title: 'Get paid securely', desc: 'Earnings transferred to your bank' }
          ].map((item, i) => (
            <div key={i} className="relative z-10">
              <div className="w-16 h-16 bg-gradient-to-br from-navy to-sky text-white rounded-full flex items-center justify-center font-sora font-bold text-xl mx-auto mb-6 shadow-brand">
                {item.step}
              </div>
              <h3 className="font-sora font-bold text-navy mb-2">{item.title}</h3>
              <p className="text-sm text-muted px-4">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 px-6 bg-[#fff8e7]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-sora text-3xl font-bold text-navy mb-4">Transparent Pricing</h2>
          <p className="text-muted mb-8">We only make money when you do.</p>
          <div className="bg-white p-8 rounded-brand shadow-brand border border-amber/20 flex flex-col sm:flex-row items-center justify-around gap-6">
            <div className="flex items-center gap-3">
              <i className="fa-solid fa-circle-check text-success text-xl" />
              <span className="font-bold text-navy">No upfront fees</span>
            </div>
            <div className="flex items-center gap-3">
              <i className="fa-solid fa-circle-check text-success text-xl" />
              <span className="font-bold text-navy">No monthly charges</span>
            </div>
            <div className="flex items-center gap-3">
              <i className="fa-solid fa-percent text-amber text-xl" />
              <span className="font-bold text-navy">15% platform fee</span>
            </div>
          </div>
        </div>
      </section>

      {/* Apply Form */}
      <section id="apply" className="py-20 px-6">
        <div className="max-w-2xl mx-auto bg-white p-8 md:p-12 rounded-brand shadow-brand-lg border border-slate-200">
          <div className="text-center mb-10">
            <h2 className="font-sora text-3xl font-bold text-navy mb-3">Apply to Join</h2>
            <p className="text-muted text-sm">Fill out this quick form and our onboarding team will contact you within 24 hours.</p>
          </div>

          {submitted ? (
            <div className="bg-green-50 text-success p-8 rounded-xl text-center border border-green-200 animate-fade-in">
              <i className="fa-solid fa-circle-check text-5xl mb-4" />
              <h3 className="font-sora font-bold text-xl mb-2">Application Received!</h3>
              <p className="text-sm">Thank you for your interest. We will be in touch shortly to verify your center.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-navy mb-2">Center Name</label>
                  <input required type="text" value={form.centerName} onChange={e => setForm({...form, centerName: e.target.value})} className="w-full py-3 px-4 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-navy transition" placeholder="e.g. Apex Tutorials" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-navy mb-2">Owner Name</label>
                  <input required type="text" value={form.ownerName} onChange={e => setForm({...form, ownerName: e.target.value})} className="w-full py-3 px-4 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-navy transition" placeholder="Your Name" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-navy mb-2">Phone Number</label>
                  <input required type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full py-3 px-4 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-navy transition" placeholder="+91" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-navy mb-2">City</label>
                  <input required type="text" value={form.city} onChange={e => setForm({...form, city: e.target.value})} className="w-full py-3 px-4 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-navy transition" placeholder="e.g. Bangalore" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-navy mb-3">Subjects Offered</label>
                <div className="flex flex-wrap gap-2">
                  {['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'English', 'Social Studies', 'Languages'].map(sub => (
                    <button
                      type="button"
                      key={sub}
                      onClick={() => handleSubjectToggle(sub)}
                      className={`px-4 py-2 rounded-full text-xs font-semibold border transition ${form.subjects.includes(sub) ? 'bg-navy text-white border-navy' : 'bg-white text-muted border-slate-200 hover:border-navy'}`}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-navy mb-2">Current Number of Students</label>
                <select required value={form.studentsCount} onChange={e => setForm({...form, studentsCount: e.target.value})} className="w-full py-3 px-4 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-navy transition">
                  <option value="">Select range</option>
                  <option value="0-50">0 - 50</option>
                  <option value="51-200">51 - 200</option>
                  <option value="201-500">201 - 500</option>
                  <option value="500+">500+</option>
                </select>
              </div>

              <button type="submit" className="w-full py-4 bg-gradient-to-r from-navy to-sky text-white rounded-lg font-sora font-bold text-lg hover:shadow-lg hover:-translate-y-0.5 transition-all">
                Submit Application
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
};

export default CoachingCenters;
