import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, CalendarClock, CreditCard, Mail, Info, RefreshCw, AlertCircle, FileText } from 'lucide-react';

const RefundPolicy = () => {
  const todayStr = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  useEffect(() => {
    document.title = 'Refund & Cancellation Policy — TrueEd';
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="bg-slate-50 min-h-screen py-12 md:py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">

        {/* Navigation Tabs Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center gap-2">
            <Link
              to="/privacy-policy"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-sora font-semibold text-sm text-slate-600 hover:text-navy hover:bg-slate-100 transition-all duration-200"
            >
              <ShieldCheck className="w-4 h-4" />
              Privacy Policy
            </Link>
            <Link
              to="/terms-and-conditions"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-sora font-semibold text-sm text-slate-600 hover:text-navy hover:bg-slate-100 transition-all duration-200"
            >
              <FileText className="w-4 h-4" />
              Terms &amp; Conditions
            </Link>
          </div>
          <div className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-navy text-white shadow-md shadow-navy/20 font-sora font-semibold text-sm">
            <RefreshCw className="w-4 h-4" />
            Refund Policy
          </div>
        </div>

        {/* Main Document Content */}
        <div className="bg-white rounded-brand-2xl p-6 sm:p-10 md:p-12 shadow-sm border border-slate-200">
          
          {/* Header */}
          <div className="border-b border-slate-200 pb-8 mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold uppercase tracking-wider mb-4">
              <RefreshCw className="w-3.5 h-3.5 text-navy" />
              Official Website Policy
            </div>
            <h1 className="font-sora font-extrabold text-3xl md:text-4xl text-navy mb-3">
              Refund &amp; Cancellation Policy
            </h1>
            <p className="text-slate-500 font-medium text-sm">
              Last Updated: <span className="text-slate-800 font-semibold">{todayStr}</span>
            </p>
          </div>

          <div className="space-y-10 text-slate-600 leading-relaxed text-sm md:text-base">
            <p className="text-slate-600 font-medium leading-relaxed">
              This policy explains cancellations, refunds, wallet withdrawals and teacher payment release on TrueEd.
            </p>

            <div className="bg-sky-50 border border-sky-100 rounded-xl p-5 flex gap-4 text-sky-900 text-sm">
              <Info className="w-6 h-6 text-sky flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-navy mb-1">Payment Protection Guarantee</h4>
                <p className="text-slate-600 font-medium leading-relaxed text-xs sm:text-sm">
                  💳 All payments on TrueEd are protected. Platform fees and instructor release amounts follow strict rule sets to ensure total transparency for both students and teachers.
                </p>
              </div>
            </div>

            {/* 1. Cancellation Before Payment */}
            <section className="space-y-2">
              <h2 className="font-sora font-bold text-xl text-navy">1. Cancellation Before Payment</h2>
              <p>
                Students may cancel before completing payment. No refund applies because no payment has been completed.
              </p>
            </section>

            {/* 2. Cancellation After Payment */}
            <section className="space-y-2">
              <h2 className="font-sora font-bold text-xl text-navy">2. Cancellation After Payment</h2>
              <p>
                After payment is completed, the amount is generally non-refundable except where this policy provides otherwise.
              </p>
            </section>

            {/* 3. Teacher Cancellation */}
            <section className="space-y-2">
              <h2 className="font-sora font-bold text-xl text-navy">3. Teacher Cancellation</h2>
              <p>
                If a teacher cancels a class, the student may either receive a full refund or choose to reschedule the class.
              </p>
            </section>

            {/* 4. Teacher Fails to Complete - Short Course */}
            <section className="space-y-2">
              <h2 className="font-sora font-bold text-xl text-navy">
                4. Teacher Fails to Complete — Short Course / Session (14 Days or Less)
              </h2>
              <p>
                If a teacher fails to complete a short course or session lasting 14 days or less, the student receives a refund of the teacher's 90% portion. TrueEd's 10% platform fee is non-refundable.
              </p>
            </section>

            {/* 5. Teacher Fails to Complete - Long Course */}
            <section className="space-y-4">
              <h2 className="font-sora font-bold text-xl text-navy">
                5. Teacher Fails to Complete — Long Course (15+ Days)
              </h2>
              <p>
                If a teacher fails to complete a course lasting 15 days or more, the student receives a flat 50% refund of the total amount paid, regardless of how much of the course has already been taught. This replaces any refund calculation based on the normal 40%/60% payout milestone.
              </p>

              {/* Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-slate-100 text-navy font-bold border-b border-slate-200">
                      <th className="p-3.5">Course Type</th>
                      <th className="p-3.5">Teacher Fails to Complete Refund Rule</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr className="hover:bg-slate-50">
                      <td className="p-3.5 font-semibold text-slate-800">14 days or less</td>
                      <td className="p-3.5">90% refund of the total amount paid (teacher's portion). TrueEd's 10% platform fee is not refunded.</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-3.5 font-semibold text-slate-800">15+ days</td>
                      <td className="p-3.5">Flat 50% refund of the total amount paid, regardless of how much was taught.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* 6. Normal Payment Release Rules */}
            <section className="space-y-4">
              <h2 className="font-sora font-bold text-xl text-navy">
                6. Normal Payment Release Rules — Successful Courses
              </h2>
              <p>
                The following applies when the teacher successfully completes the course. A 10% TrueEd platform fee is deducted according to the applicable release rule before the teacher receives the net payout.
              </p>

              <div className="space-y-3">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <h4 className="font-bold text-navy text-sm mb-1">Single Sessions &amp; Short Courses (up to 14 days):</h4>
                  <p className="text-sm">
                    For successfully completed sessions/courses, a 10% platform fee is deducted and the remaining amount is released to the teacher within 24 hours of the session/course ending. If the teacher fails to complete, the separate 90% teacher-portion refund rule applies.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <h4 className="font-bold text-navy text-sm mb-1">Courses Longer Than 15 Days:</h4>
                  <p className="text-sm">
                    For successfully completed courses, a 10% platform fee is deducted upfront. Of the remaining amount, 40% is released after 50% course completion, and the remaining 60% is released on 100% completion. If the teacher fails to complete, the separate flat 50% refund rule applies instead.
                  </p>
                </div>
              </div>

              {/* Worked Example */}
              <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4 md:p-5">
                <h4 className="font-bold text-navy text-sm mb-3">Worked Example — ₹100 Course Payment (15+ days, Successful Completion)</h4>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs font-semibold">
                  <div className="bg-white p-2.5 rounded-lg border border-amber-200">
                    <div className="text-slate-500 text-[10px] uppercase">Student Pays</div>
                    <div className="text-navy text-base font-bold">₹100</div>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-amber-200">
                    <div className="text-slate-500 text-[10px] uppercase">Platform Fee (10%)</div>
                    <div className="text-red-500 text-base font-bold">-₹10</div>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-amber-200">
                    <div className="text-slate-500 text-[10px] uppercase">Net Payout Base</div>
                    <div className="text-slate-800 text-base font-bold">₹90</div>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-amber-200">
                    <div className="text-slate-500 text-[10px] uppercase">40% @ 50% Done</div>
                    <div className="text-green-600 text-base font-bold">₹36</div>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-amber-200 col-span-2 sm:col-span-1">
                    <div className="text-slate-500 text-[10px] uppercase">60% @ 100% Done</div>
                    <div className="text-green-600 text-base font-bold">₹54</div>
                  </div>
                </div>
              </div>
            </section>

            {/* 7. Wallet Withdrawal */}
            <section className="space-y-2">
              <h2 className="font-sora font-bold text-xl text-navy">7. Wallet Withdrawal</h2>
              <p>
                Students may withdraw eligible wallet balances subject to a <strong>2% TrueEd platform charge</strong>. Teachers may withdraw eligible wallet balances subject to a <strong>2% TrueEd platform charge</strong>.
              </p>
            </section>

            {/* 8. Failed or Duplicate Payment */}
            <section className="space-y-2">
              <h2 className="font-sora font-bold text-xl text-navy">8. Failed or Duplicate Payment</h2>
              <p>
                Failed payments where money was deducted may be reversed/refunded through the payment system. Confirmed duplicate payments may be refunded.
              </p>
            </section>

            {/* 9. Refund Processing */}
            <section className="space-y-2">
              <h2 className="font-sora font-bold text-xl text-navy">9. Refund Processing</h2>
              <p>
                Approved refunds are initiated through the applicable payment method or gateway. The time to receive the refund depends on the payment gateway, bank or payment method.
              </p>
            </section>

            {/* 10. Refund Request */}
            <section className="space-y-2">
              <h2 className="font-sora font-bold text-xl text-navy">10. Refund Request</h2>
              <p>
                Send refund requests to TrueEd support with full name, registered email, registered mobile number, transaction/order ID, payment date and reason.
              </p>
              <p className="font-semibold text-navy">
                Support Email:{' '}
                <a href="mailto:trued.alex@gmail.com" className="text-navy underline">
                  trued.alex@gmail.com
                </a>
              </p>
            </section>

            {/* 11. Refund Eligibility */}
            <section className="space-y-2">
              <h2 className="font-sora font-bold text-xl text-navy">11. Refund Eligibility</h2>
              <p>
                Submitting a refund request does not automatically guarantee approval. Eligibility is determined under this policy and the transaction circumstances.
              </p>
            </section>

            {/* 12. Contact */}
            <section className="pt-6 border-t border-slate-200">
              <h2 className="font-sora font-bold text-xl text-navy flex items-center gap-2 mb-3">
                <Mail className="w-5 h-5 text-amber" />
                12. Contact Us
              </h2>
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-5 space-y-2 text-sm">
                <p className="font-bold text-navy">TrueEd</p>
                <p className="text-slate-600">Dharwad, Karnataka, India</p>
                <p className="text-slate-600">
                  Email:{' '}
                  <a href="mailto:trued.alex@gmail.com" className="text-navy font-bold hover:underline">
                    trued.alex@gmail.com
                  </a>
                </p>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
};

export default RefundPolicy;
