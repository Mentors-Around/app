import { useState, useEffect } from 'react';

const Contact = () => {
  const [category, setCategory] = useState('Student Support');
  const [submitted, setSubmitted] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [messageError, setMessageError] = useState('');

  useEffect(() => {
    document.title = 'Contact Us — TrueEd';
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();

    let hasError = false;

    // Name validation
    if (!name.trim()) {
      setNameError('Name is required');
      hasError = true;
    } else {
      setNameError('');
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      setEmailError('Email is required');
      hasError = true;
    } else if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      hasError = true;
    } else {
      setEmailError('');
    }

    // Message validation
    if (!message.trim()) {
      setMessageError('Message is required');
      hasError = true;
    } else if (message.length < 20) {
      setMessageError('Message must be at least 20 characters');
      hasError = true;
    } else {
      setMessageError('');
    }

    if (hasError) return;

    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-cream/30 py-16 px-6">
      <div className="max-w-[800px] mx-auto">
        <div className="text-center mb-10">
          <h1 className="font-sora text-3xl font-bold text-navy mb-3">Contact Us</h1>
          <p className="text-muted text-sm">Have a question? We're here to help. Choose a category below and send us a message.</p>
        </div>

        {submitted ? (
          <div className="bg-white rounded-brand shadow-brand p-12 text-center animate-slide-up">
            <div className="w-16 h-16 bg-success/10 text-success rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
              <i className="fa-solid fa-check" />
            </div>
            <h2 className="font-sora text-2xl font-bold text-navy mb-2">Message Sent!</h2>
            <p className="text-muted text-sm mb-6">Thank you for reaching out. Our team will get back to you within 24 hours.</p>
            <button onClick={() => setSubmitted(false)} className="text-sky text-sm font-semibold hover:underline">Send another message</button>
          </div>
        ) : (
          <div className="bg-white rounded-brand shadow-brand p-6 md:p-10">
            {/* Categories */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
              {['Student Support', 'Teacher Support', 'Business Enquiry'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`py-3 px-4 rounded-lg text-sm font-semibold transition border-2 text-center ${
                    category === cat ? 'border-navy bg-navy/5 text-navy' : 'border-slate-200 text-muted hover:border-slate-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-navy mb-1.5">Full Name</label>
                  <input
                    type="text"
                    maxLength={50}
                    value={name}
                    onChange={e => {
                      const val = e.target.value;
                      if (/^[a-zA-Z\s]*$/.test(val) && val.length <= 50) {
                        setName(val);
                        setNameError('');
                      }
                    }}
                    className={`w-full py-3 px-4 border rounded-lg text-sm outline-none focus:border-sky bg-white ${nameError ? 'border-red-400' : 'border-slate-200'}`}
                    placeholder="John Doe"
                  />
                  {nameError && <p className="text-xs text-red-500 mt-1">{nameError}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-navy mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => {
                      setEmail(e.target.value);
                      setEmailError('');
                    }}
                    className={`w-full py-3 px-4 border rounded-lg text-sm outline-none focus:border-sky bg-white ${emailError ? 'border-red-400' : 'border-slate-200'}`}
                    placeholder="john@example.com"
                  />
                  {emailError && <p className="text-xs text-red-500 mt-1">{emailError}</p>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-navy mb-1.5">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  className="w-full py-3 px-4 border border-slate-200 rounded-lg text-sm outline-none focus:border-sky bg-white"
                  placeholder="How can we help you?"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-navy mb-1.5">Message</label>
                <textarea
                  rows="5"
                  maxLength={1000}
                  value={message}
                  onChange={e => {
                    if (e.target.value.length <= 1000) {
                      setMessage(e.target.value);
                      setMessageError('');
                    }
                  }}
                  className={`w-full py-3 px-4 border rounded-lg text-sm outline-none focus:border-sky bg-white resize-none ${messageError ? 'border-red-400' : 'border-slate-200'}`}
                  placeholder="Include all relevant details here..."
                ></textarea>
                <p className="text-xs text-muted mt-1">{message.length}/1000</p>
                {messageError && <p className="text-xs text-red-500 mt-1">{messageError}</p>}
              </div>
              
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <span className="text-xs text-muted flex items-center gap-1.5"><i className="fa-regular fa-clock" /> We reply within 24 hours</span>
                <button type="submit" className="w-full sm:w-auto py-3 px-8 bg-navy text-white rounded-lg font-sora font-semibold hover:bg-navy-light transition">
                  Send Message
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div>
            <h4 className="font-semibold text-navy text-sm mb-1">Direct Email</h4>
            <a href="mailto:support@trueed.in" className="text-sky text-sm hover:underline">support@trueed.in</a>
          </div>
          <div className="md:text-right">
            <h4 className="font-semibold text-navy text-sm mb-2">Follow Us</h4>
            <div className="flex items-center md:justify-end gap-3">
              <span className="w-8 h-8 rounded-full bg-cream flex items-center justify-center text-navy hover:bg-slate-200 transition cursor-pointer"><i className="fa-brands fa-instagram" /></span>
              <span className="w-8 h-8 rounded-full bg-cream flex items-center justify-center text-navy hover:bg-slate-200 transition cursor-pointer"><i className="fa-brands fa-linkedin-in" /></span>
              <span className="w-8 h-8 rounded-full bg-cream flex items-center justify-center text-navy hover:bg-slate-200 transition cursor-pointer"><i className="fa-brands fa-x-twitter" /></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Contact;
