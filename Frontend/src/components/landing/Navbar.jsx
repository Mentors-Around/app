import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useOverlay, useOverlayRefs } from '../../contexts/OverlayContext';
import useAuth from '../../hooks/useAuth';
import Logo from '../shared/Logo';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const { activeOverlayId, toggleOverlay, closeOverlay } = useOverlay();
  const mobileMenuRefs = useOverlayRefs('navbar-mobile-menu');
  const { user, getDashboardRoute } = useAuth();

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
          <Logo variant="light" className="h-14 w-auto" loading="lazy" />
        </Link>
        <div className="hidden md:flex items-center gap-8">
          <Link to="/student/discover" className="text-navy font-bold text-sm hover:text-amber transition">Find a Teacher</Link>
          <Link to="/#how" onClick={() => scrollTo('how')} className="text-navy/70 text-sm font-medium hover:text-navy transition">How it Works</Link>
          <Link to="/#for-students" onClick={() => scrollTo('for-students')} className="text-navy/70 text-sm font-medium hover:text-navy transition">For Students</Link>
          <Link to="/#for-teachers" onClick={() => scrollTo('for-teachers')} className="text-navy/70 text-sm font-medium hover:text-navy transition">For Teachers</Link>
          {user ? (
            <Link to={getDashboardRoute(user.role)} className="bg-navy text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-navy-light transition">
              Dashboard
            </Link>
          ) : (
            <div className="flex items-center gap-4">
              <Link to="/login" className="text-navy font-bold text-sm hover:text-amber transition">Login</Link>
              <Link to="/signup" className="bg-navy text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-navy-light transition">
                Sign Up
              </Link>
            </div>
          )}
        </div>
        <div className="md:hidden flex items-center gap-4">
          {user ? (
            <Link to={getDashboardRoute(user.role)} className="bg-navy text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-navy-light transition">
              Dashboard
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="text-navy font-bold text-xs hover:text-amber transition">Login</Link>
              <Link to="/signup" className="bg-navy text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-navy-light transition">
                Sign Up
              </Link>
            </div>
          )}
          <button ref={mobileMenuRefs.triggerRef} onClick={() => toggleOverlay('navbar-mobile-menu')} className="text-navy p-1">
            <i className={`fa-solid ${activeOverlayId === 'navbar-mobile-menu' ? 'fa-xmark' : 'fa-bars'} text-xl`} />
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      <div 
        className={`fixed inset-y-0 right-0 w-[280px] bg-white z-50 shadow-xl border-l border-slate-100 p-6 flex flex-col gap-5 transition-transform duration-300 ease-in-out md:hidden
          ${activeOverlayId === 'navbar-mobile-menu' ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
          <Logo variant="light" className="h-10 w-auto" />
          <button onClick={() => closeOverlay()} className="text-slate-400 hover:text-navy p-1">
            <i className="fa-solid fa-xmark text-xl" />
          </button>
        </div>
        <Link to="/student/discover" onClick={() => closeOverlay()} className="text-navy font-bold text-lg">Find a Teacher</Link>
        <Link to="/#how" onClick={() => { scrollTo('how'); closeOverlay(); }} className="text-navy/70 font-semibold text-lg">How it Works</Link>
        <Link to="/#for-students" onClick={() => { scrollTo('for-students'); closeOverlay(); }} className="text-navy/70 font-semibold text-lg">For Students</Link>
        <Link to="/#for-teachers" onClick={() => { scrollTo('for-teachers'); closeOverlay(); }} className="text-navy/70 font-semibold text-lg">For Teachers</Link>
      </div>
      
      {/* Mobile Drawer Overlay */}
      {activeOverlayId === 'navbar-mobile-menu' && (
        <div 
          onClick={() => closeOverlay()}
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
        />
      )}
    </nav>
  );
};
export default Navbar;
