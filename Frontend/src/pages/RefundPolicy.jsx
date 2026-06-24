import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, CalendarClock, CreditCard, MailQuestion, Info } from 'lucide-react';

const RefundPolicy = () => {
  useEffect(() => { document.title = 'Refund Policy — TrueEd'; }, []);

  return (
    <div className="bg-slate-50 min-h-screen py-12 md:py-20">
      <div className="max-w-3xl mx-auto px-6">
        <h1 className="font-sora font-extrabold text-4xl text-navy mb-2">Refund Policy</h1>
        <p className="text-slate-500 font-medium mb-10">Last updated: June {new Date().getFullYear()}</p>

        <div className="bg-white rounded-brand-xl p-8 md:p-10 shadow-sm border border-slate-200">
          <p className="text-slate-600 font-medium leading-relaxed mb-8">
            At TrueEd, we strive to provide the best learning experience. However, we understand that sometimes things don't go as planned. This Refund Policy outlines the conditions under which you can request a refund for your tutoring sessions.
          </p>

          <div className="bg-sky-50 border border-sky-100 rounded-xl p-6 mb-10 flex gap-4">
            <Info className="w-6 h-6 text-sky flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-navy mb-1">Payment Protection Guarantee</h4>
              <p className="text-sm text-slate-600 font-medium leading-relaxed">
                💳 All payments on TrueEd are protected. If a session doesn't happen, you get a full refund automatically. The teacher only receives payment after the session is successfully completed.
              </p>
            </div>
          </div>

          <div className="space-y-10">
            <section>
              <h2 className="font-sora font-bold text-xl text-navy flex items-center gap-2 mb-4">
                <ShieldCheck className="text-amber" /> Eligibility for Refund
              </h2>
              <div className="space-y-3 text-slate-600 font-medium leading-relaxed text-sm">
                <p>You are eligible for a full refund under the following circumstances:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>The teacher cancels the session prior to the scheduled start time.</li>
                  <li>The teacher does not show up within 15 minutes of the scheduled start time.</li>
                  <li>Technical issues on TrueEd's platform prevent the session from occurring.</li>
                  <li>You cancel the session at least 24 hours before it is scheduled to begin.</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="font-sora font-bold text-xl text-navy flex items-center gap-2 mb-4">
                <CalendarClock className="text-amber" /> How to Request a Refund
              </h2>
              <div className="space-y-3 text-slate-600 font-medium leading-relaxed text-sm">
                <p>
                  In most cases involving a teacher no-show or cancellation, refunds are initiated automatically. However, if you need to manually request a refund, please follow these steps:
                </p>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>Go to your Student Dashboard and navigate to the "My Bookings" section.</li>
                  <li>Select the session in question and click on "Report Issue".</li>
                  <li>Select the reason for the refund request and submit.</li>
                </ol>
              </div>
            </section>

            <section>
              <h2 className="font-sora font-bold text-xl text-navy flex items-center gap-2 mb-4">
                <CreditCard className="text-amber" /> Refund Timeline
              </h2>
              <div className="space-y-3 text-slate-600 font-medium leading-relaxed text-sm">
                <p>
                  Once a refund is approved, it will be processed immediately from our end. Please allow <strong>3 to 5 business days</strong> for the funds to reflect in your original payment method, depending on your bank or credit card provider.
                </p>
              </div>
            </section>

            <section>
              <h2 className="font-sora font-bold text-xl text-navy flex items-center gap-2 mb-4">
                <span className="text-amber">⚠️</span> Non-Refundable Cases
              </h2>
              <div className="space-y-3 text-slate-600 font-medium leading-relaxed text-sm">
                <p>Refunds will not be issued in the following scenarios:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>You do not show up for the session and fail to cancel beforehand.</li>
                  <li>You cancel the session less than 24 hours before the start time (subject to teacher's specific cancellation policy).</li>
                  <li>You are unhappy with the teacher's style but the session was fully delivered (we recommend utilizing free trial classes to prevent this).</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="font-sora font-bold text-xl text-navy flex items-center gap-2 mb-4">
                <MailQuestion className="text-amber" /> Contact for Refund Issues
              </h2>
              <div className="space-y-3 text-slate-600 font-medium leading-relaxed text-sm">
                <p>
                  If you have not received your refund within the stipulated timeline or have questions about a specific transaction, please reach out to our support team.
                </p>
                <Link to="/contact" className="inline-block mt-2 text-navy font-bold hover:text-blue-600 transition underline decoration-2 underline-offset-4">
                  Contact Support →
                </Link>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RefundPolicy;
