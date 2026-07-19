const RefundPolicy = () => (
  <section id="refund-policy" className="bg-[#fff8e7] py-12 px-6">
    <div className="max-w-[700px] mx-auto text-center">
      <h2 className="font-sora text-xl font-bold text-navy mb-4">Our Refund Policy</h2>
      <p className="text-muted text-[0.95rem] leading-relaxed mb-3">
        We hold your payment securely for 24 hours after each class. This gives you time to verify the class happened as scheduled.
      </p>
      <p className="text-muted text-[0.95rem] leading-relaxed mb-3">
        If the teacher doesn't show up or leaves early, report it within 12 hours. Our admin reviews and processes refunds within 12 hours of reporting.
      </p>
      <span className="inline-flex items-center gap-1.5 bg-white text-[#92400e] px-5 py-2 rounded-full text-sm font-semibold mt-4 shadow-brand">
        🛡️ Payment Protection Included
      </span>
    </div>
  </section>
);
export default RefundPolicy;
