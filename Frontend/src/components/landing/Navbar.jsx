import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 py-4
      ${scrolled ? 'bg-cream/95 backdrop-blur-md shadow-[0_1px_10px_rgba(15,43,77,0.06)]' : 'bg-transparent'}`}>
      <div className="max-w-[1100px] mx-auto px-6 flex items-center justify-between">
        <Link to="/">
          <img src="/logo.png" alt="TrueEd logo" className="h-10 w-auto" loading="lazy" />
        </Link>
        <div className="hidden md:flex items-center gap-8">
          <Link to="/student/discover" className="text-navy font-bold text-sm hover:text-amber transition">Find a Teacher</Link>
          <Link to="/#how" onClick={() => scrollTo('how')} className="text-navy/70 text-sm font-medium hover:text-navy transition">How it Works</Link>
          <Link to="/#for-students" onClick={() => scrollTo('for-students')} className="text-navy/70 text-sm font-medium hover:text-navy transition">For Students</Link>
          <Link to="/#for-teachers" onClick={() => scrollTo('for-teachers')} className="text-navy/70 text-sm font-medium hover:text-navy transition">For Teachers</Link>
          <Link to="/coaching-centers" className="text-navy/70 text-sm font-medium hover:text-navy transition">For Coaching Centers</Link>
          <Link to="/login" className="bg-navy text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-navy-light transition">
            Get Started
          </Link>
        </div>
        <div className="md:hidden flex items-center gap-4">
          <Link to="/login" className="bg-navy text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-navy-light transition">
            Get Started
          </Link>
          <button onClick={() => setMenuOpen(!menuOpen)} className="text-navy p-1">
            <i className={`fa-solid ${menuOpen ? 'fa-xmark' : 'fa-bars'} text-xl`} />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-slate-100 shadow-lg py-4 px-6 flex flex-col gap-4 animate-fade-in">
          <Link to="/student/discover" onClick={() => setMenuOpen(false)} className="text-navy font-bold">Find a Teacher</Link>
          <Link to="/#how" onClick={() => { scrollTo('how'); setMenuOpen(false); }} className="text-navy/70 font-medium">How it Works</Link>
          <Link to="/#for-students" onClick={() => { scrollTo('for-students'); setMenuOpen(false); }} className="text-navy/70 font-medium">For Students</Link>
          <Link to="/#for-teachers" onClick={() => { scrollTo('for-teachers'); setMenuOpen(false); }} className="text-navy/70 font-medium">For Teachers</Link>
          <Link to="/coaching-centers" onClick={() => setMenuOpen(false)} className="text-navy/70 font-medium">For Coaching Centers</Link>
        </div>
      )}
    </nav>
  );
};
export default Navbar;
