import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Mail, Phone, MapPin, Star, ShieldCheck, Wallet, RefreshCw, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import Logo from '@/components/shared/Logo';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated, getDashboardRoute, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate('/', { replace: true });
    }
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 py-4 ${scrolled ? 'bg-cream/95 backdrop-blur-md shadow-brand' : 'bg-transparent'}`}>
        <div className="max-w-[1100px] mx-auto px-6 flex items-center justify-between">
          <Link to="/">
            <Logo variant="light" className="h-10 w-auto" />
          </Link>
          <div className="hidden md:flex items-center gap-8">
          <Link to={isAuthenticated ? '/student/discover' : '/discover'} className="text-navy font-bold text-sm hover:text-amber transition">Find a Teacher</Link>
            <Link to="/about" className="text-navy/70 text-sm font-medium hover:text-navy transition">About Us</Link>
            <Link to="/safety" className="text-navy/70 text-sm font-medium hover:text-navy transition">Safety</Link>
            <Link to="/coaching-centers" className="text-navy/70 text-sm font-medium hover:text-navy transition">Coaching Centers</Link>
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link to={getDashboardRoute()} className="bg-navy text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-navy-hover transition">
                  Go to Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 text-navy/70 text-sm font-medium hover:text-error transition"
                  title="Logout"
                >
                  <LogOut size={16} />
                  <span className="hidden xl:inline">Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link to="/login" className="text-navy font-bold text-sm hover:text-amber transition">Log In</Link>
                <Link to="/signup" className="bg-navy text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-navy-hover transition">
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          <div className="md:hidden flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link to={getDashboardRoute()} className="bg-navy text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-navy-hover transition">
                  Dashboard
                </Link>
                <button onClick={handleLogout} className="text-navy/70 hover:text-error transition p-1" title="Logout">
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="text-navy font-bold text-xs hover:text-amber transition">Log In</Link>
                <Link to="/signup" className="bg-navy text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-navy-hover transition">
                  Sign Up
                </Link>
              </div>
            )}
            <button onClick={() => setMobileMenuOpen(true)} className="text-navy p-1">
              <Menu size={20} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-[100] md:hidden backdrop-blur-sm transition-opacity" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed inset-y-0 right-0 w-[280px] bg-white z-[101] shadow-xl border-l border-slate-100 p-6 flex flex-col gap-5 transition-transform duration-300 ease-in-out md:hidden">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <Logo variant="light" className="h-10 w-auto" />
              <button onClick={() => setMobileMenuOpen(false)} className="text-slate-400 hover:text-navy p-1">
                <X size={20} />
              </button>
            </div>
            <Link to={isAuthenticated ? '/student/discover' : '/discover'} onClick={() => setMobileMenuOpen(false)} className="text-navy font-bold text-lg">Find a Teacher</Link>
            <Link to="/about" onClick={() => setMobileMenuOpen(false)} className="text-navy/70 font-semibold text-lg hover:text-navy">About Us</Link>
            <Link to="/safety" onClick={() => setMobileMenuOpen(false)} className="text-navy/70 font-semibold text-lg hover:text-navy">Safety</Link>
            <Link to="/coaching-centers" onClick={() => setMobileMenuOpen(false)} className="text-navy/70 font-semibold text-lg hover:text-navy">Coaching Centers</Link>
            <Link to="/how-payments-work" onClick={() => setMobileMenuOpen(false)} className="text-navy/70 font-semibold text-lg hover:text-navy">How Payments Work</Link>
            <Link to="/teacher/earnings-info" onClick={() => setMobileMenuOpen(false)} className="text-navy/70 font-semibold text-lg hover:text-navy">Teacher Earnings</Link>
          </div>
        </>
      )}
    </>
  );
};

const Footer = () => {
  return (
    <footer className="bg-navy-dark text-white/60 py-12 px-6">
      <div className="max-w-[1100px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <Logo variant="dark" className="h-10 w-auto mb-4" />
          <p className="text-xs leading-relaxed mb-6 max-w-[280px]">
            India's trusted platform for verified tutoring. Connecting students with checked teachers since {new Date().getFullYear()}.
          </p>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <Mail size={14} className="text-amber" />
              <a href="mailto:support@trueed.in" className="hover:text-amber transition">support@trueed.in</a>
            </div>
            <div className="flex items-center gap-2">
              <Phone size={14} className="text-amber" />
              <span>+91 XXXXX XXXXX</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin size={14} className="text-amber" />
              <span>Bengaluru, India</span>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-white font-sora text-sm font-semibold mb-4 uppercase tracking-wider">For Students</h4>
          <ul className="flex flex-col gap-2 text-xs">
            <li><Link to="/student/discover" className="hover:text-amber transition">Find a Teacher</Link></li>
            <li><Link to="/safety" className="hover:text-amber transition">Safety First</Link></li>
            <li><Link to="/how-payments-work" className="hover:text-amber transition">How Payments Work</Link></li>
            <li><Link to="/refund-policy" className="hover:text-amber transition">Refund Policy</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-sora text-sm font-semibold mb-4 uppercase tracking-wider">For Teachers</h4>
          <ul className="flex flex-col gap-2 text-xs">
            <li><Link to="/teacher/become" className="hover:text-amber transition">Become a Teacher</Link></li>
            <li><Link to="/teacher/earnings-info" className="hover:text-amber transition">Teacher Earnings</Link></li>
            <li><Link to="/teacher/verification" className="hover:text-amber transition">Verification Guidelines</Link></li>
            <li><Link to="/community" className="hover:text-amber transition">Community Guidelines</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-sora text-sm font-semibold mb-4 uppercase tracking-wider">Legal & Contact</h4>
          <ul className="flex flex-col gap-2 text-xs">
            <li><Link to="/privacy" className="hover:text-amber transition">Privacy Policy</Link></li>
            <li><Link to="/terms" className="hover:text-amber transition">Terms of Service</Link></li>
            <li><Link to="/contact" className="hover:text-amber transition">Contact Us</Link></li>
          </ul>
        </div>
      </div>

      <div className="max-w-[1100px] mx-auto mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/40">
        <div>© {new Date().getFullYear()} TrueEd. All rights reserved. Built in India 🇮🇳</div>
        <div className="flex gap-2 items-center">
          <Star size={12} className="text-amber fill-amber" /> Trusted by thousands of students &amp; teachers
        </div>
      </div>
    </footer>
  );
};

const PublicLayout = () => {
  const location = useLocation();

  return (
    <div className="flex flex-col min-h-screen bg-page">
      <Navbar />
      <main className="flex-1 pt-16">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default PublicLayout;
