import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';
import { FaXTwitter } from 'react-icons/fa6';
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaYoutube, FaGooglePlay, FaApple } from 'react-icons/fa';
const Footer = () => {
  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <footer className="bg-navy text-white/60 py-12 px-6">

      <div className="max-w-[1100px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Brand & Contact */}
        <div className="lg:col-span-3">
          <span className="font-sora text-3xl font-bold inline-block mb-4">
            <span className="text-white">True</span><span className="text-amber">Ed</span>
          </span>
          <p className="text-sm leading-relaxed mb-6 max-w-[280px]">
            India's trusted platform for verified tutoring. Connecting students with checked teachers since {new Date().getFullYear()}.
          </p>
          
          <div className="space-y-3 mb-8">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="w-4 h-4 text-amber" />
              <a href="mailto:support@trueed.in" className="hover:text-amber transition">support@trueed.in</a>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Phone className="w-4 h-4 text-amber" />
              <a href="tel:+919999999999" className="hover:text-amber transition">+91 XXXXX XXXXX</a>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <MapPin className="w-4 h-4 text-amber" />
              <span>Bengaluru, India</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#1877F2] hover:text-white transition-all duration-300 transform hover:-translate-y-1 hover:scale-105">
              <FaFacebookF className="text-white text-[18px]" />
            </a>
            <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-gradient-to-tr hover:from-[#f09433] hover:via-[#dc2743] hover:to-[#bc1888] hover:text-white transition-all duration-300 transform hover:-translate-y-1 hover:scale-105">
              <FaInstagram className="text-white text-[19px]" />
            </a>
            <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white hover:text-black transition-all duration-300 transform hover:-translate-y-1 hover:scale-105">
              <FaXTwitter className="text-white text-[18px]" />
            </a>
            <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#0A66C2] hover:text-white transition-all duration-300 transform hover:-translate-y-1 hover:scale-105">
              <FaLinkedinIn className="text-white text-[18px]" />
            </a>
            <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#FF0000] hover:text-white transition-all duration-300 transform hover:-translate-y-1 hover:scale-105">
              <FaYoutube className="text-white text-[19px]" />
            </a>
          </div>
        </div>

        {/* Links */}
        <div className="lg:col-span-2">
          <h4 className="text-white font-sora text-sm font-semibold mb-5 uppercase tracking-wider">For Students</h4>
          <ul className="flex flex-col gap-3">
            <li><Link to="/student/discover" className="text-white/60 text-sm hover:text-amber transition hover:translate-x-1 inline-block">Find a Teacher</Link></li>
            <li><Link to="/#how" onClick={() => scrollTo('how')} className="text-white/60 text-sm hover:text-amber transition hover:translate-x-1 inline-block">How it Works</Link></li>
            <li><Link to="/safety" className="text-white/60 text-sm hover:text-amber transition hover:translate-x-1 inline-block">Safety</Link></li>
            <li><Link to="/how-payments-work" className="text-white/60 text-sm hover:text-amber transition hover:translate-x-1 inline-block">How Payments Work</Link></li>
            <li><Link to="/#refund-policy" onClick={() => scrollTo('refund-policy')} className="text-white/60 text-sm hover:text-amber transition hover:translate-x-1 inline-block">Refund Policy</Link></li>
          </ul>
        </div>

        <div className="lg:col-span-2">
          <h4 className="text-white font-sora text-sm font-semibold mb-5 uppercase tracking-wider">For Teachers</h4>
          <ul className="flex flex-col gap-3">
            <li><Link to="/login?role=teacher" className="text-white/60 text-sm hover:text-amber transition hover:translate-x-1 inline-block">Become a Teacher</Link></li>
            <li><Link to="/teacher/earnings-info" className="text-white/60 text-sm hover:text-amber transition hover:translate-x-1 inline-block">Earnings</Link></li>
            <li><Link to="/teacher/verification" className="text-white/60 text-sm hover:text-amber transition hover:translate-x-1 inline-block">Verification</Link></li>
            <li><Link to="/how-payments-work" className="text-white/60 text-sm hover:text-amber transition hover:translate-x-1 inline-block">How Payments Work</Link></li>
            <li><Link to="/community" className="text-white/60 text-sm hover:text-amber transition hover:translate-x-1 inline-block">Community</Link></li>
          </ul>
        </div>

        <div className="lg:col-span-2">
          <h4 className="text-white font-sora text-sm font-semibold mb-5 uppercase tracking-wider">For Coaching Centers</h4>
          <ul className="flex flex-col gap-3">
            <li><Link to="/coaching-centers" className="text-white/60 text-sm hover:text-amber transition hover:translate-x-1 inline-block">Join as a Center</Link></li>
            <li><Link to="/coaching-centers" className="text-white/60 text-sm hover:text-amber transition hover:translate-x-1 inline-block">How it Works</Link></li>
            <li><Link to="/coaching-centers" className="text-white/60 text-sm hover:text-amber transition hover:translate-x-1 inline-block">Pricing</Link></li>
            <li><Link to="/coaching-centers" className="text-white/60 text-sm hover:text-amber transition hover:translate-x-1 inline-block">Contact</Link></li>
          </ul>
        </div>

        <div className="lg:col-span-3">
          <h4 className="text-white font-sora text-sm font-semibold mb-5 uppercase tracking-wider">Stay Updated</h4>
          <p className="text-sm text-white/60 mb-4">
            Get updates about tutors, offers, and learning resources.
          </p>
          <div className="flex items-center gap-2 mb-8">
            <input 
              type="email" 
              placeholder="Email address" 
              className="bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:border-amber w-full"
            />
            <button className="bg-amber text-navy font-bold px-5 py-2.5 rounded-lg text-sm hover:bg-amber-hover transition">
              Subscribe
            </button>
          </div>

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
          <Link to="/privacy" className="hover:text-amber transition">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-amber transition">Terms of Service</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
