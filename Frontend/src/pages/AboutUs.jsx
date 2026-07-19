import { useEffect } from 'react';
import { Link } from 'react-router-dom';

const AboutUs = () => {
  useEffect(() => { document.title = 'About Us — TrueEd'; }, []);
  return (
    <div>
      {/* Hero */}
      <div className="bg-gradient-to-br from-navy to-navy-light text-white py-24 px-6 text-center">
        <div className="max-w-[800px] mx-auto">
          <h1 className="font-sora text-4xl md:text-5xl font-extrabold mb-6 leading-tight">Connecting every Indian student with the right teacher.</h1>
          <p className="text-white/70 text-lg max-w-2xl mx-auto">We are on a mission to democratize quality education by providing a transparent, safe, and efficient platform for private tutoring across India.</p>
        </div>
      </div>

      {/* Problem we solve */}
      <div className="bg-cream py-20 px-6">
        <div className="max-w-[1100px] mx-auto">
          <h2 className="font-sora text-2xl font-bold text-navy text-center mb-12">The Problem We Solve</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-brand shadow-sm">
              <i className="fa-solid fa-magnifying-glass-location text-3xl text-sky mb-4" />
              <h3 className="font-bold text-navy mb-3">Hard to Find Quality</h3>
              <p className="text-sm text-muted">Finding a good teacher locally often relies on word-of-mouth, which limits choices and rarely guarantees quality.</p>
            </div>
            <div className="bg-white p-8 rounded-brand shadow-sm">
              <i className="fa-solid fa-wallet text-3xl text-amber mb-4" />
              <h3 className="font-bold text-navy mb-3">Unfair Pricing</h3>
              <p className="text-sm text-muted">Traditional coaching centers and middlemen take huge cuts, making it expensive for students and underpaying teachers.</p>
            </div>
            <div className="bg-white p-8 rounded-brand shadow-sm">
              <i className="fa-solid fa-shield-halved text-3xl text-success mb-4" />
              <h3 className="font-bold text-navy mb-3">Lack of Trust</h3>
              <p className="text-sm text-muted">Parents struggle to verify the credentials and safety of private home tutors before hiring them.</p>
            </div>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="py-20 px-6 max-w-[1100px] mx-auto text-center">
        <h2 className="font-sora text-2xl font-bold text-navy mb-12">How TrueEd Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="w-16 h-16 bg-navy text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">1</div>
            <h3 className="font-bold text-navy mb-2">Search</h3>
            <p className="text-sm text-muted px-4">Find verified teachers by subject, class, and location.</p>
          </div>
          <div>
            <div className="w-16 h-16 bg-navy text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">2</div>
            <h3 className="font-bold text-navy mb-2">Book</h3>
            <p className="text-sm text-muted px-4">Schedule a session securely with transparent hourly pricing.</p>
          </div>
          <div>
            <div className="w-16 h-16 bg-navy text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">3</div>
            <h3 className="font-bold text-navy mb-2">Learn</h3>
            <p className="text-sm text-muted px-4">Attend online or offline, and pay only when the class is completed.</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-navy text-white py-16 px-6">
        <div className="max-w-[1100px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div><p className="font-sora text-4xl font-bold text-amber mb-2">500+</p><p className="text-sm text-white/70">Verified Teachers</p></div>
          <div><p className="font-sora text-4xl font-bold text-amber mb-2">2000+</p><p className="text-sm text-white/70">Happy Students</p></div>
          <div><p className="font-sora text-4xl font-bold text-amber mb-2">20+</p><p className="text-sm text-white/70">Cities Active</p></div>
          <div><p className="font-sora text-4xl font-bold text-amber mb-2">4.8</p><p className="text-sm text-white/70">Average Rating</p></div>
        </div>
      </div>

      {/* Team */}
      <div className="py-24 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-16 animate-fade-in-up">
          <h2 className="font-sora text-3xl md:text-4xl font-extrabold text-navy tracking-tight mb-4">Meet the Team</h2>
          <p className="text-lg text-slate-500 font-medium">Building India's most trusted student–teacher learning platform.</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            {
              name: "Rohit Kumar",
              role: "Founder",
              initials: "RK",
              image: null
            },
            {
              name: "Sugayan Singh",
              role: "Co-Founder",
              initials: "SS",
              image: null
            },
            {
              name: "Akanksha",
              role: "Co-Founder",
              initials: "AK",
              image: null
            },
            {
              name: "Hari Prasad L",
              role: "Co-Founder",
              initials: "HP",
              image: null
            }
          ].map((f, i) => (
            <div key={i} className="text-center bg-white p-10 rounded-[20px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-300 flex flex-col items-center justify-center animate-fade-in-up h-full" style={{ animationDelay: `${i * 100}ms` }}>
              {f.image ? (
                <img src={f.image} alt={f.name} className="w-28 h-28 rounded-full object-cover mb-6 shadow-sm border-4 border-white" />
              ) : (
                <div className="w-28 h-28 bg-gradient-to-br from-navy to-sky text-white rounded-full flex items-center justify-center text-3xl font-bold mb-6 shadow-sm border-4 border-white">
                  {f.initials}
                </div>
              )}
              <h3 className="font-sora font-bold text-navy text-[24px] mb-1">{f.name}</h3>
              <p className="text-[16px] text-[#0F2B5B] font-medium opacity-80">{f.role}</p>
            </div>
          ))}
        </div>
        <div className="mt-16 text-center">
          <span className="inline-flex items-center gap-2 bg-cream text-navy px-5 py-2 rounded-full text-sm font-semibold border border-slate-200">
            Founded in {new Date().getFullYear()} · Built in India 🇮🇳
          </span>
        </div>
      </div>
    </div>
  );
};
export default AboutUs;
