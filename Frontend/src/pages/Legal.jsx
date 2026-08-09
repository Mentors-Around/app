import React, { useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Shield, FileText, RefreshCw, Mail, MapPin, CheckCircle, AlertTriangle, Building, Lock, CreditCard, UserCheck, HelpCircle } from 'lucide-react';

const Legal = () => {
  const { pathname } = useLocation();
  const isPrivacy = pathname === '/privacy' || pathname === '/privacy-policy';

  const todayStr = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  useEffect(() => {
    document.title = `${isPrivacy ? 'Privacy Policy' : 'Terms & Conditions'} — TrueEd`;
    window.scrollTo(0, 0);
  }, [pathname, isPrivacy]);

  return (
    <div className="bg-slate-50 min-h-screen py-12 md:py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* Navigation Tabs Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center gap-2">
            <Link
              to="/privacy-policy"
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-sora font-semibold text-sm transition-all duration-200 ${
                isPrivacy
                  ? 'bg-navy text-white shadow-md shadow-navy/20'
                  : 'text-slate-600 hover:text-navy hover:bg-slate-100'
              }`}
            >
              <Shield className="w-4 h-4" />
              Privacy Policy
            </Link>
            <Link
              to="/terms-and-conditions"
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-sora font-semibold text-sm transition-all duration-200 ${
                !isPrivacy
                  ? 'bg-navy text-white shadow-md shadow-navy/20'
                  : 'text-slate-600 hover:text-navy hover:bg-slate-100'
              }`}
            >
              <FileText className="w-4 h-4" />
              Terms &amp; Conditions
            </Link>
          </div>
          <Link
            to="/refund-cancellation"
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-amber hover:text-amber-600 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refund Policy →
          </Link>
        </div>

        {/* Main Document Content */}
        <div className="bg-white rounded-brand-2xl p-6 sm:p-10 md:p-12 shadow-sm border border-slate-200">
          
          {/* Policy Title Banner */}
          <div className="border-b border-slate-200 pb-8 mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold uppercase tracking-wider mb-4">
              {isPrivacy ? <Shield className="w-3.5 h-3.5 text-navy" /> : <FileText className="w-3.5 h-3.5 text-navy" />}
              Official Website Policy
            </div>
            <h1 className="font-sora font-extrabold text-3xl md:text-4xl text-navy mb-3">
              {isPrivacy ? 'Privacy Policy' : 'Terms & Conditions'}
            </h1>
            <p className="text-slate-500 font-medium text-sm">
              Last Updated: <span className="text-slate-800 font-semibold">{todayStr}</span>
            </p>
          </div>

          {isPrivacy ? (
            /* ================= PRIVACY POLICY CONTENT ================= */
            <div className="space-y-10 text-slate-600 leading-relaxed text-sm md:text-base">
              
              <div className="bg-sky-50 border border-sky-100 rounded-xl p-5 text-sky-900 text-sm font-medium">
                TrueEd is an education platform connecting students with individual teachers. This Privacy Policy explains what information we collect, why we use it, and how we protect it.
              </div>

              {/* 1. Information We Collect */}
              <section className="space-y-4">
                <h2 className="font-sora font-bold text-xl text-navy flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-amber" />
                  1. Information We Collect
                </h2>
                <div className="space-y-3 pl-1">
                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4">
                    <h3 className="font-bold text-navy text-sm mb-1.5">For Students:</h3>
                    <p className="text-slate-600 text-sm">
                      Name, email, mobile number, password, age, date of birth, gender, optional profile photo, location/address, class/grade, subjects, classroom/enrollment details, wallet and transaction information.
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4">
                    <h3 className="font-bold text-navy text-sm mb-1.5">For Teachers:</h3>
                    <p className="text-slate-600 text-sm">
                      Name, email, mobile number, password, profile photo, qualifications, teaching experience, subjects, classes/grades taught, location, address, classroom information, wallet and transaction information, and withdrawal information.
                    </p>
                  </div>
                </div>
              </section>

              {/* 2. How We Use Information */}
              <section className="space-y-3">
                <h2 className="font-sora font-bold text-xl text-navy flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-amber" />
                  2. How We Use Information
                </h2>
                <p className="text-slate-600">
                  We use information to create accounts, connect students and teachers, provide classes and support, process payments/refunds/withdrawals, prevent fraud and abuse, improve security and services, and comply with applicable law.
                </p>
              </section>

              {/* 3. Payments & Third Parties */}
              <section className="space-y-3">
                <h2 className="font-sora font-bold text-xl text-navy flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-amber" />
                  3. Payments &amp; Third Parties
                </h2>
                <p className="text-slate-600">
                  Payments may be processed through <strong>Cashfree</strong>. <strong>AWS</strong> may be used for hosting/infrastructure and <strong>Zoho Mail</strong> for business email. <strong>Google Meet</strong> or <strong>Zoom</strong> may be used for online classes.
                </p>
              </section>

              {/* 4. Information Sharing */}
              <section className="space-y-3">
                <h2 className="font-sora font-bold text-xl text-navy flex items-center gap-2">
                  <Lock className="w-5 h-5 text-amber" />
                  4. Information Sharing &amp; Privacy Safeguards
                </h2>
                <p className="text-slate-600">
                  TrueEd may display limited information needed to provide its services. A student's mobile number or email address will not be publicly shared with teachers through the platform, and a teacher's mobile number or email address will not be publicly shared with students through the platform.
                </p>
              </section>

              {/* 5. Security & Deletion */}
              <section className="space-y-3">
                <h2 className="font-sora font-bold text-xl text-navy flex items-center gap-2">
                  <Shield className="w-5 h-5 text-amber" />
                  5. Security &amp; Data Deletion
                </h2>
                <p className="text-slate-600">
                  TrueEd uses reasonable security measures. After account deletion, relevant personal information may remain in the database for up to <strong>15 days</strong> and will then be permanently deleted, except information that must be retained under applicable law or for legitimate legal, accounting, fraud-prevention or dispute-resolution purposes.
                </p>
              </section>

              {/* 6. Cookies, Minors & User Requests */}
              <section className="space-y-3">
                <h2 className="font-sora font-bold text-xl text-navy flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-amber" />
                  6. Cookies, Minors &amp; User Rights
                </h2>
                <p className="text-slate-600">
                  TrueEd may use cookies for sessions, preferences, security and service improvement. Where a user is a minor, parental or guardian involvement or consent may be required depending on the circumstances and applicable law. Subject to applicable law, users may request access, correction or deletion of personal information through TrueEd support.
                </p>
              </section>

              {/* 7. Contact Information */}
              <section className="pt-6 border-t border-slate-200">
                <h2 className="font-sora font-bold text-xl text-navy flex items-center gap-2 mb-3">
                  <Mail className="w-5 h-5 text-amber" />
                  7. Contact Us
                </h2>
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-5 space-y-2">
                  <p className="font-bold text-navy">TrueEd</p>
                  <p className="flex items-center gap-2 text-slate-600 text-sm">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    Dharwad, Karnataka, India
                  </p>
                  <p className="flex items-center gap-2 text-slate-600 text-sm">
                    <Mail className="w-4 h-4 text-slate-400" />
                    Email:{' '}
                    <a href="mailto:trued.alex@gmail.com" className="text-navy font-bold hover:underline">
                      trued.alex@gmail.com
                    </a>
                  </p>
                </div>
              </section>

            </div>
          ) : (
            /* ================= TERMS & CONDITIONS CONTENT ================= */
            <div className="space-y-10 text-slate-600 leading-relaxed text-sm md:text-base">
              
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-5 text-amber-900 text-sm font-medium">
                By creating an account or using TrueEd, you agree to these Terms &amp; Conditions.
              </div>

              {/* 1. TrueEd's Role */}
              <section className="space-y-3">
                <h2 className="font-sora font-bold text-xl text-navy">1. TrueEd's Role</h2>
                <p>
                  TrueEd is a technology platform connecting students with individual teachers. Teachers provide the actual educational services. TrueEd does not guarantee teacher performance, academic results or specific educational outcomes.
                </p>
              </section>

              {/* 2. Accounts */}
              <section className="space-y-3">
                <h2 className="font-sora font-bold text-xl text-navy">2. Accounts</h2>
                <p>
                  Users must provide accurate information, keep passwords secure, and must not create fake accounts or impersonate others.
                </p>
              </section>

              {/* 3. Students & Teachers */}
              <section className="space-y-3">
                <h2 className="font-sora font-bold text-xl text-navy">3. Students &amp; Teachers</h2>
                <p>
                  Students can discover teachers, browse classrooms, raise queries, enroll, pay, use wallet services and attend classes. Teachers can create profiles/classrooms, set prices and schedules, respond to queries, teach and withdraw eligible balances.
                </p>
              </section>

              {/* 4. Classrooms */}
              <section className="space-y-3">
                <h2 className="font-sora font-bold text-xl text-navy">4. Classrooms</h2>
                <p>
                  A classroom may include subject, class/grade, number of lectures, price, online/offline mode, schedule, description and maximum students. Teachers are responsible for delivering the services described.
                </p>
              </section>

              {/* 5. Wallet */}
              <section className="space-y-3">
                <h2 className="font-sora font-bold text-xl text-navy">5. Wallet</h2>
                <p>
                  Students may deposit funds into their TrueEd wallet and use eligible balances for classroom payments, individual classes, query tokens and other permitted services. Eligible balances may be withdrawn subject to applicable rules.
                </p>
              </section>

              {/* 6. Platform Fee */}
              <section className="space-y-3">
                <h2 className="font-sora font-bold text-xl text-navy">6. Platform Fee</h2>
                <p>
                  TrueEd charges a <strong>10% platform fee</strong> on applicable classroom/class payments.
                </p>
              </section>

              {/* 7. Withdrawal Charges */}
              <section className="space-y-3">
                <h2 className="font-sora font-bold text-xl text-navy">7. Withdrawal Charges</h2>
                <p>
                  A <strong>2% TrueEd platform charge</strong> applies to eligible student wallet withdrawals and a <strong>2% TrueEd platform charge</strong> applies to eligible teacher withdrawals. Additional gateway or banking charges may apply.
                </p>
              </section>

              {/* 8. Payment Processing */}
              <section className="space-y-3">
                <h2 className="font-sora font-bold text-xl text-navy">8. Payment Processing</h2>
                <p>
                  Payments may be processed through third-party providers such as Cashfree and may be subject to their terms.
                </p>
              </section>

              {/* 9. Cancellation */}
              <section className="space-y-3">
                <h2 className="font-sora font-bold text-xl text-navy">9. Cancellation</h2>
                <p>
                  If a teacher cancels a class, the student may either receive a full refund or choose to reschedule the class. Student absence is generally non-refundable. For full refund policy details, please check our <Link to="/refund-cancellation" className="text-navy font-bold hover:underline">Refund &amp; Cancellation Policy</Link>.
                </p>
              </section>

              {/* 10. Online Classes */}
              <section className="space-y-3">
                <h2 className="font-sora font-bold text-xl text-navy">10. Online Classes</h2>
                <p>
                  Teachers may provide Google Meet, Zoom or other external meeting links. TrueEd does not host or record online classes through its own video infrastructure for the current MVP.
                </p>
              </section>

              {/* 11. Classroom Doubts */}
              <section className="space-y-3">
                <h2 className="font-sora font-bold text-xl text-navy">11. Classroom Doubts</h2>
                <p>
                  Enrolled students may raise relevant doubts. Depending on the setting, a doubt may be public to enrolled students or private between student and teacher.
                </p>
              </section>

              {/* 12. Prohibited Activities */}
              <section className="space-y-3">
                <h2 className="font-sora font-bold text-xl text-navy flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  12. Prohibited Activities
                </h2>
                <p>
                  Harassment or abusive language; fraud or spam; fake profiles; inappropriate content; unauthorized payments; attempting to hack TrueEd; sharing another person's personal information without authorization; non-educational or unlawful use; or any activity violating applicable law.
                </p>
              </section>

              {/* 13. Intellectual Property */}
              <section className="space-y-3">
                <h2 className="font-sora font-bold text-xl text-navy">13. Intellectual Property</h2>
                <p>
                  TrueEd owns or has the necessary rights to its website, software, design, logo, branding and original platform content. Teacher-created educational content generally remains with the teacher, subject to rights necessary for operating the platform.
                </p>
              </section>

              {/* 14. Suspension & Termination */}
              <section className="space-y-3">
                <h2 className="font-sora font-bold text-xl text-navy">14. Suspension &amp; Termination</h2>
                <p>
                  TrueEd may suspend or terminate accounts for violations, fraud, misuse, false information, harassment, unauthorized access attempts or unlawful activity.
                </p>
              </section>

              {/* 15. Governing Law */}
              <section className="space-y-3">
                <h2 className="font-sora font-bold text-xl text-navy">15. Governing Law</h2>
                <p>
                  These Terms are governed by applicable laws of India. Subject to applicable law, disputes relating to TrueEd shall be subject to the jurisdiction of courts in Karnataka, India.
                </p>
              </section>

              {/* 16. Business Details */}
              <section className="space-y-3">
                <h2 className="font-sora font-bold text-xl text-navy flex items-center gap-2">
                  <Building className="w-5 h-5 text-amber" />
                  16. Business Details
                </h2>
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-1.5 text-sm">
                  <p><strong>Business Name:</strong> TrueEd</p>
                  <p><strong>Business Registration:</strong> Business registration details will be updated after registration.</p>
                  <p><strong>Location:</strong> Dharwad, Karnataka, India</p>
                </div>
              </section>

              {/* 17. Contact Information */}
              <section className="pt-6 border-t border-slate-200">
                <h2 className="font-sora font-bold text-xl text-navy flex items-center gap-2 mb-3">
                  <Mail className="w-5 h-5 text-amber" />
                  17. Contact Us
                </h2>
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-5 space-y-2">
                  <p className="font-bold text-navy">TrueEd</p>
                  <p className="flex items-center gap-2 text-slate-600 text-sm">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    Dharwad, Karnataka, India
                  </p>
                  <p className="flex items-center gap-2 text-slate-600 text-sm">
                    <Mail className="w-4 h-4 text-slate-400" />
                    Email:{' '}
                    <a href="mailto:trued.alex@gmail.com" className="text-navy font-bold hover:underline">
                      trued.alex@gmail.com
                    </a>
                  </p>
                </div>
              </section>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Legal;
