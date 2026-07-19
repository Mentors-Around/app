import { Link } from 'react-router-dom';

const CTASection = () => (
  <section className="py-20 px-6 text-center bg-gradient-to-b from-cream to-cream-warm">
    <h2 className="font-sora text-3xl font-bold text-navy mb-4">Ready to find your perfect teacher?</h2>
    <p className="text-muted text-base mb-8">Join students already learning with verified tutors on TrueEd.</p>
    <Link
      to="/login"
      className="py-4 px-10 bg-navy text-white rounded-brand font-sora text-base font-semibold inline-block hover:bg-navy-light hover:-translate-y-0.5 transition-all shadow-[0_4px_15px_rgba(15,43,77,0.25)] hover:shadow-[0_8px_25px_rgba(15,43,77,0.35)]"
    >
      Get Started
    </Link>
    <p className="text-sm text-navy/70 mt-5 font-medium">Connect with teachers from just ₹19</p>
  </section>
);
export default CTASection;
