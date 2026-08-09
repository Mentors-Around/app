import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';
import { FaGooglePlay, FaApple } from 'react-icons/fa';
import Logo from '../shared/Logo';
import api from '../../services/api';

const Footer = () => {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;
    setSubmitting(true);
    try {
      await api.contact.subscribeNewsletter({ email });
      setSubscribed(true);
      setEmail('');
    } catch (err) {
      console.warn('Subscription error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <footer className="bg-navy text-white/60 py-12 px-6">

      <div className="max-w-[1100px] mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-12 gap-10">
        
        {/* Brand & Contact */}
        <div className="sm:col-span-2 md:col-span-3 lg:col-span-4">
          <Logo variant="dark" className="h-14 w-auto mb-4" loading="lazy" />
          <p className="text-sm leading-relaxed mb-6 max-w-[280px]">
            India's trusted platform for verified tutoring. Connecting students with checked teachers since {new Date().getFullYear()}.
          </p>
          
          <div className="space-y-3 mb-8">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="w-4 h-4 text-amber" />
              <a href="mailto:trued.alex@gmail.com" className="hover:text-amber transition">trued.alex@gmail.com</a>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Phone className="w-4 h-4 text-amber" />
              <a href="tel:+919905893153" className="hover:text-amber transition">+91 99058 93153</a>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <MapPin className="w-4 h-4 text-amber" />
              <span>Dharwad, Karnataka</span>
            </div>
          </div>
        </div>

        {/* Links */}
        <div className="sm:col-span-1 lg:col-span-2">
          <h4 className="text-white font-sora text-sm font-semibold mb-5 uppercase tracking-wider">For Students</h4>
          <ul className="flex flex-col gap-3">
            <li><Link to="/student/discover" className="text-white/60 text-sm hover:text-amber transition hover:translate-x-1 inline-block">Find a Teacher</Link></li>
            <li><Link to="/#how" onClick={() => scrollTo('how')} className="text-white/60 text-sm hover:text-amber transition hover:translate-x-1 inline-block">How it Works</Link></li>
            <li><Link to="/safety" className="text-white/60 text-sm hover:text-amber transition hover:translate-x-1 inline-block">Safety</Link></li>
            <li><Link to="/how-payments-work" className="text-white/60 text-sm hover:text-amber transition hover:translate-x-1 inline-block">How Payments Work</Link></li>
            <li><Link to="/refund-cancellation" className="text-white/60 text-sm hover:text-amber transition hover:translate-x-1 inline-block">Refund Policy</Link></li>
          </ul>
        </div>

        <div className="sm:col-span-1 lg:col-span-2">
          <h4 className="text-white font-sora text-sm font-semibold mb-5 uppercase tracking-wider">For Teachers</h4>
          <ul className="flex flex-col gap-3">
            <li><Link to="/login?role=teacher" className="text-white/60 text-sm hover:text-amber transition hover:translate-x-1 inline-block">Become a Teacher</Link></li>
            <li><Link to="/teacher/earnings-info" className="text-white/60 text-sm hover:text-amber transition hover:translate-x-1 inline-block">Earnings</Link></li>
            <li><Link to="/teacher/verification" className="text-white/60 text-sm hover:text-amber transition hover:translate-x-1 inline-block">Verification</Link></li>
            <li><Link to="/how-payments-work" className="text-white/60 text-sm hover:text-amber transition hover:translate-x-1 inline-block">How Payments Work</Link></li>
          </ul>
        </div>

        <div className="sm:col-span-2 md:col-span-3 lg:col-span-4">
          <h4 className="text-white font-sora text-sm font-semibold mb-5 uppercase tracking-wider">Stay Updated</h4>
          <p className="text-sm text-white/60 mb-4">
            Get updates about tutors, offers, and learning resources.
          </p>
          {subscribed ? (
            <div className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 p-3 rounded-lg text-xs font-semibold mb-8">
              ✓ Thank you for subscribing! Updates will be sent to your email.
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="flex items-center gap-2 mb-8">
              <input 
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address" 
                className="bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:border-amber w-full"
              />
              <button 
                type="submit"
                disabled={submitting}
                className="bg-amber text-navy font-bold px-5 py-2.5 rounded-lg text-sm hover:bg-amber-hover transition disabled:opacity-50"
              >
                {submitting ? '...' : 'Subscribe'}
              </button>
            </form>
          )}

          <div className="mb-4">
            <h4 className="text-white font-sora text-sm font-semibold uppercase tracking-wider mb-1">Mobile App - Coming Soon</h4>
            <p className="text-xs text-white/50">Available soon for Android and iOS</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button className="flex items-center gap-3 bg-white/[0.08] border border-white/10 px-4 py-2.5 rounded-2xl hover:bg-white/[0.15] hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 cursor-pointer w-full sm:w-auto justify-center sm:justify-start">
              <FaGooglePlay className="text-[28px] text-white" />
              <div className="text-left">
                <div className="text-[10px] uppercase text-white/60 font-semibold tracking-wide leading-none mb-1">Get it on</div>
                <div className="text-[15px] font-bold text-white leading-none">Google Play</div>
              </div>
            </button>
            <button className="flex items-center gap-3 bg-white/[0.08] border border-white/10 px-4 py-2.5 rounded-2xl hover:bg-white/[0.15] hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 cursor-pointer w-full sm:w-auto justify-center sm:justify-start">
              <FaApple className="text-[32px] text-white pb-0.5" />
              <div className="text-left">
                <div className="text-[10px] uppercase text-white/60 font-semibold tracking-wide leading-none mb-1">Download on the</div>
                <div className="text-[15px] font-bold text-white leading-none">App Store</div>
              </div>
            </button>
          </div>
        </div>

      </div>

      <div className="max-w-[1100px] mx-auto mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/40">
        <div>© {new Date().getFullYear()} TrueEd. All rights reserved. Built in India 🇮🇳</div>
        <div className="flex gap-6">
          <Link to="/about" className="hover:text-amber transition">About Us</Link>
          <Link to="/privacy-policy" className="hover:text-amber transition">Privacy Policy</Link>
          <Link to="/terms-and-conditions" className="hover:text-amber transition">Terms &amp; Conditions</Link>
          <Link to="/refund-cancellation" className="hover:text-amber transition">Refund Policy</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
