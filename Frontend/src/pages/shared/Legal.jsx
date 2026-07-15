import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const Legal = () => {
  useEffect(() => { document.title = 'Privacy & Terms — TrueEd'; }, []);
  const { pathname } = useLocation();
  const isPrivacy = pathname === '/privacy';

  const title = isPrivacy ? 'Privacy Policy' : 'Terms of Service';
  const date = `June 4, ${new Date().getFullYear()}`;

  const privacySections = [
    { title: 'Data Collection', text: 'We collect your personal information to facilitate class scheduling, KYC verification, parental consent, and payouts. This includes your name, email address, phone number, and document uploads.' },
    { title: 'How We Use Your Data', text: 'We use your data to connect students with verified teachers, verify teacher credentials, process secure payment transactions, and send educational notifications.' },
    { title: 'Cookies', text: 'We use secure, HTTP-only cookies to manage authentication sessions, protect against CSRF attacks, and maintain your login state.' },
    { title: 'Third Party Services', text: 'We share necessary payment information with Razorpay for secure payments and document uploads with Cloudinary. We never sell your personal information.' },
    { title: 'Contact Us', text: 'If you have any questions about this Privacy Policy, please contact us at privacy@trueed.in.' },
  ];

  const termsSections = [
    { title: 'Acceptance of Terms', text: 'By signing up and using TrueEd, you agree to these Terms of Service. If you do not agree, please do not use the platform.' },
    { title: 'User Responsibilities', text: 'Students and parents are responsible for scheduling classes and confirming sessions. Communication and payments must happen exclusively on TrueEd.' },
    { title: 'Teacher Responsibilities', text: 'Teachers must provide accurate credentials, complete KYC verification, and deliver professional, safe classes in accordance with their scheduled availability.' },
    { title: 'Payment Terms', text: 'Payment for sessions is secure. We hold payments in escrow and release them only upon session completion or under the refund policy guidelines.' },
    { title: 'Termination', text: 'We reserve the right to suspend or ban users who violate community guidelines, participate in off-platform payments, or violate security policies.' },
    { title: 'Contact', text: 'If you have any questions about these Terms, please contact us at legal@trueed.in.' },
  ];

  const sections = isPrivacy ? privacySections : termsSections;

  return (
    <div className="max-w-[800px] mx-auto py-16 px-6 font-inter">
      <div className="mb-12 border-b border-slate-200 pb-8">
        <h1 className="font-sora text-3xl font-bold text-navy mb-2">{title}</h1>
        <p className="text-sm text-muted">Last Updated: {date}</p>
      </div>

      <div className="space-y-10">
        {sections.map(sec => (
          <section key={sec.title}>
            <h2 className="font-sora text-lg font-bold text-navy mb-3">{sec.title}</h2>
            <p className="text-slate-600 text-sm leading-relaxed">{sec.text}</p>
          </section>
        ))}
      </div>
    </div>
  );
};

export default Legal;
