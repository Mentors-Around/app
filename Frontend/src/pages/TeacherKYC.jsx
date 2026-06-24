import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Alert from '../components/shared/Alert';
import Spinner from '../components/shared/Spinner';

const GRADES = ['CBSE 8-10', 'CBSE 11-12', 'IIT JEE', 'NEET', 'College', 'Foundation'];

const Step1 = ({ data, onChange, onNext, error }) => {
  useEffect(() => { document.title = 'KYC Verification — TrueEd'; }, []);
  const [local, setLocal] = useState('');
  const f = (field, val) => { onChange(field, val); };
  const next = () => {
    if (!data.name || !data.email || !data.phone || !data.city) { onChange('_err', 'Please fill all required fields'); return; }
    if ((data.bio || '').length < 50) { onChange('_err', 'Bio must be at least 50 characters'); return; }
    onNext();
  };
  return (
    <>
      <h3 className="font-sora text-xl font-bold text-navy mb-6">Personal Information</h3>
      {error && <Alert message={error} type="error" show={!!error} onDismiss={() => onChange('_err', '')} />}
      {[
        { label: 'Full Name *', field: 'name', type: 'text', placeholder: `e.g. John Doe` },
        { label: 'Email Address *', field: 'email', type: 'email', placeholder: 'john@example.com' },
        { label: 'Phone Number *', field: 'phone', type: 'tel', placeholder: '+91 98765 43210' },
        { label: 'City *', field: 'city', type: 'text', placeholder: 'Bangalore' },
      ].map((f2) => (
        <div key={f2.field} className="mb-4">
          <label className="block text-sm font-semibold text-navy mb-1.5">{f2.label}</label>
          <input type={f2.type} value={data[f2.field] || ''} onChange={(e) => f(f2.field, e.target.value)}
            placeholder={f2.placeholder}
            className="w-full py-3 px-4 border-2 border-slate-200 rounded-brand text-sm outline-none focus:border-sky transition" />
        </div>
      ))}
      <div className="mb-5">
        <label className="block text-sm font-semibold text-navy mb-1.5">Bio * (min 50 chars)</label>
        <textarea rows={4} value={data.bio || ''} onChange={(e) => f('bio', e.target.value)}
          placeholder="Tell students about your teaching experience, approach, and qualifications..."
          className="w-full py-3 px-4 border-2 border-slate-200 rounded-brand text-sm outline-none focus:border-sky transition resize-none" />
        <p className="text-xs text-muted mt-1">{(data.bio || '').length}/50 characters minimum</p>
      </div>
      <button onClick={next} className="w-full py-3.5 bg-navy text-white rounded-brand font-sora font-semibold hover:bg-navy-light transition">
        Next →
      </button>
    </>
  );
};

const Step2 = ({ data, onChange, onNext, onBack, error }) => {
  const next = () => {
    if (!data.subjects || !data.experience || !data.mode || !data.rate) {
      onChange('_err', 'Please fill all required fields');
      return;
    }
    onNext();
  };
  return (
    <>
      <h3 className="font-sora text-xl font-bold text-navy mb-6">Teaching Details</h3>
      {error && <Alert message={error} type="error" show={!!error} onDismiss={() => onChange('_err', '')} />}
      <div className="mb-4">
        <label className="block text-sm font-semibold text-navy mb-1.5">Subjects * (comma-separated)</label>
        <input type="text" value={data.subjects || ''} onChange={(e) => onChange('subjects', e.target.value)}
          placeholder="Mathematics, Physics, Chemistry"
          className="w-full py-3 px-4 border-2 border-slate-200 rounded-brand text-sm outline-none focus:border-sky transition" />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-semibold text-navy mb-3">Grade Levels</label>
        <div className="grid grid-cols-2 gap-2">
          {GRADES.map((g) => (
            <label key={g} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="accent-amber w-4 h-4"
                checked={(data.grades || []).includes(g)}
                onChange={(e) => {
                  const curr = data.grades || [];
                  onChange('grades', e.target.checked ? [...curr, g] : curr.filter((x) => x !== g));
                }} />
              <span className="text-sm text-slate-600">{g}</span>
            </label>
          ))}
        </div>
      </div>
      {[
        { label: 'Experience *', field: 'experience', options: ['1-2 years', '3-5 years', '5-10 years', '10+ years'] },
        { label: 'Teaching Mode *', field: 'mode', options: ['Online', 'Offline', 'Both'] },
      ].map((sel) => (
        <div key={sel.field} className="mb-4">
          <label className="block text-sm font-semibold text-navy mb-1.5">{sel.label}</label>
          <select value={data[sel.field] || ''} onChange={(e) => onChange(sel.field, e.target.value)}
            className="w-full py-3 px-4 border-2 border-slate-200 rounded-brand text-sm outline-none focus:border-sky transition bg-white">
            <option value="">Select...</option>
            {sel.options.map((o) => <option key={o}>{o}</option>)}
          </select>
        </div>
      ))}
      <div className="mb-5">
        <label className="block text-sm font-semibold text-navy mb-1.5">Hourly Rate (₹) *</label>
        <input type="number" value={data.rate || ''} onChange={(e) => onChange('rate', e.target.value)} placeholder="e.g. 600"
          className="w-full py-3 px-4 border-2 border-slate-200 rounded-brand text-sm outline-none focus:border-sky transition" />
      </div>
      <div className="flex gap-3">
        <button onClick={onBack} className="flex-1 py-3.5 border-2 border-slate-200 text-muted rounded-brand font-sora font-semibold hover:border-navy hover:text-navy transition">← Back</button>
        <button onClick={next} className="flex-1 py-3.5 bg-navy text-white rounded-brand font-sora font-semibold hover:bg-navy-light transition">Next →</button>
      </div>
    </>
  );
};

const Step3 = ({ documents, onFileChange, onNext, onBack }) => {
  const zones = [
    { key: 'idProof', label: 'ID Proof', icon: 'fa-solid fa-id-card', required: true },
    { key: 'degree', label: 'Degree Certificate', icon: 'fa-solid fa-graduation-cap', required: true },
    { key: 'experience', label: 'Experience Certificate', icon: 'fa-solid fa-briefcase', required: false },
    { key: 'photo', label: 'Profile Photo', icon: 'fa-solid fa-camera', required: true },
  ];
  const next = () => {
    const missing = zones.filter((z) => z.required && !documents[z.key]);
    if (missing.length > 0) { alert(`Please upload: ${missing.map((z) => z.label).join(', ')}`); return; }
    onNext();
  };
  return (
    <>
      <h3 className="font-sora text-xl font-bold text-navy mb-6">Upload Documents</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {zones.map((z) => (
          <label key={z.key} className={`upload-zone cursor-pointer ${documents[z.key] ? 'has-file' : ''}`}>
            <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => e.target.files[0] && onFileChange(z.key, e.target.files[0])} />
            <i className={`${z.icon} text-2xl mb-2 ${documents[z.key] ? 'text-success' : 'text-muted'}`} />
            <p className="text-sm font-semibold text-navy">{z.label} {z.required && <span className="text-error">*</span>}</p>
            {documents[z.key]
              ? <p className="text-xs text-success mt-1 truncate max-w-[140px]">{documents[z.key].name}</p>
              : <p className="text-xs text-muted mt-1">PDF, JPG, PNG (max 5MB)</p>
            }
          </label>
        ))}
      </div>
      <div className="flex gap-3">
        <button onClick={onBack} className="flex-1 py-3.5 border-2 border-slate-200 text-muted rounded-brand font-sora font-semibold hover:border-navy hover:text-navy transition">← Back</button>
        <button onClick={next} className="flex-1 py-3.5 bg-navy text-white rounded-brand font-sora font-semibold hover:bg-navy-light transition">Next →</button>
      </div>
    </>
  );
};

const Step4 = ({ personalData, teachingData, documents, onSubmit, onBack, loading }) => {
  const [agreed, setAgreed] = useState(false);
  const Row = ({ label, value }) => (
    <div className="flex justify-between text-sm py-1.5 border-b border-slate-50 last:border-0">
      <span className="text-muted">{label}</span>
      <span className="text-navy font-medium text-right ml-4">{value || '—'}</span>
    </div>
  );
  return (
    <>
      <h3 className="font-sora text-xl font-bold text-navy mb-6">Review Your Application</h3>
      <div className="bg-cream rounded-brand p-4 mb-4">
        <h4 className="font-sora font-semibold text-navy text-sm mb-3">Personal Info</h4>
        <Row label="Name" value={personalData.name} />
        <Row label="Email" value={personalData.email} />
        <Row label="Phone" value={personalData.phone} />
        <Row label="City" value={personalData.city} />
      </div>
      <div className="bg-cream rounded-brand p-4 mb-4">
        <h4 className="font-sora font-semibold text-navy text-sm mb-3">Teaching Details</h4>
        <Row label="Subjects" value={teachingData.subjects} />
        <Row label="Grade Levels" value={(teachingData.grades || []).join(', ')} />
        <Row label="Experience" value={teachingData.experience} />
        <Row label="Mode" value={teachingData.mode} />
        <Row label="Hourly Rate" value={teachingData.rate ? `₹${teachingData.rate}/hr` : ''} />
      </div>
      <div className="bg-cream rounded-brand p-4 mb-5">
        <h4 className="font-sora font-semibold text-navy text-sm mb-3">Documents</h4>
        {['idProof', 'degree', 'experience', 'photo'].map((k) => (
          <Row key={k} label={k.replace(/([A-Z])/g, ' $1').trim()} value={documents[k]?.name || '—'} />
        ))}
      </div>
      <label className="flex items-start gap-3 mb-6 cursor-pointer">
        <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="accent-navy w-4 h-4 mt-0.5 flex-shrink-0" />
        <span className="text-sm text-muted">I agree to TrueEd's Terms of Service and confirm all information provided is accurate.</span>
      </label>
      <div className="flex gap-3">
        <button onClick={onBack} className="flex-1 py-3.5 border-2 border-slate-200 text-muted rounded-brand font-sora font-semibold hover:border-navy hover:text-navy transition">← Back</button>
        <button onClick={onSubmit} disabled={!agreed || loading}
          className="flex-1 py-3.5 bg-navy text-white rounded-brand font-sora font-semibold hover:bg-navy-light transition disabled:opacity-60">
          {loading ? <>Submitting<Spinner /></> : 'Submit Application'}
        </button>
      </div>
    </>
  );
};

const Step5 = ({ onGoToDashboard }) => (
  <div className="text-center py-8">
    <div className="text-6xl mb-4">🎉</div>
    <h3 className="font-sora text-2xl font-bold text-navy mb-3">Application Submitted!</h3>
    <p className="text-muted text-sm max-w-md mx-auto mb-6">Your KYC application is under review. Our team will verify your documents within 24-48 hours.</p>
    <span className="inline-flex items-center gap-2 bg-warning/10 text-warning px-5 py-2.5 rounded-full text-sm font-semibold mb-8">
      <i className="fa-solid fa-clock" /> Verification Pending
    </span>
    <br />
    <button onClick={onGoToDashboard} className="py-3.5 px-8 bg-navy text-white rounded-brand font-sora font-semibold hover:bg-navy-light transition">
      Go to Dashboard
    </button>
  </div>
);

const TeacherKYC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [personalData, setPersonalData] = useState({});
  const [teachingData, setTeachingData] = useState({});
  const [documents, setDocuments] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const updatePersonal = (field, val) => {
    if (field === '_err') { setError(val); return; }
    setPersonalData((p) => ({ ...p, [field]: val }));
  };
  const updateTeaching = (field, val) => {
    if (field === '_err') { setError(val); return; }
    setTeachingData((p) => ({ ...p, [field]: val }));
  };
  const updateDoc = (key, file) => setDocuments((p) => ({ ...p, [key]: file }));

  const handleSubmit = async () => {
    setLoading(true);
    localStorage.setItem('trueed_kyc_status', 'pending');
    await new Promise((r) => setTimeout(r, 1500));
    setLoading(false);
    setStep(5);
  };

  const progress = Math.min(((step - 1) / 4) * 100, 100);

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream to-cream-warm py-8 px-4">
      <div className="max-w-[800px] mx-auto">
        {step < 5 && (
          <>
            <div className="text-center mb-6">
              <Link to="/">
                <img src="/logo.png" alt="TrueEd" className="h-10 mx-auto mb-4" />
              </Link>
              <h1 className="font-sora text-2xl font-bold text-navy">Teacher Verification (KYC)</h1>
              <p className="text-muted text-sm mt-1">Step {step} of 4 — Complete your profile to start teaching</p>
            </div>
            {/* Progress bar */}
            <div className="h-1.5 bg-slate-200 rounded-full mb-2 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-navy to-sky transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
            {/* Step dots */}
            <div className="flex justify-center gap-3 mb-8">
              {[1,2,3,4].map((n) => (
                <div key={n} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                  n < step ? 'bg-success border-success text-white' : n === step ? 'bg-navy border-navy text-white' : 'bg-white border-slate-200 text-muted'
                }`}>{n}</div>
              ))}
            </div>
          </>
        )}

        <div className="bg-white rounded-brand shadow-brand p-6 md:p-10">
          {step === 1 && <Step1 data={personalData} onChange={updatePersonal} onNext={() => { setError(''); setStep(2); }} error={error} />}
          {step === 2 && <Step2 data={teachingData} onChange={updateTeaching} onNext={() => { setError(''); setStep(3); }} onBack={() => setStep(1)} error={error} />}
          {step === 3 && <Step3 documents={documents} onFileChange={updateDoc} onNext={() => setStep(4)} onBack={() => setStep(2)} />}
          {step === 4 && <Step4 personalData={personalData} teachingData={teachingData} documents={documents} onSubmit={handleSubmit} onBack={() => setStep(3)} loading={loading} />}
          {step === 5 && <Step5 onGoToDashboard={() => navigate('/teacher/dashboard')} />}
        </div>

        {step < 5 && (
          <p className="text-center mt-4 text-sm text-muted">
            <Link to="/" className="hover:text-navy transition">← Cancel and go back home</Link>
          </p>
        )}
      </div>
    </div>
  );
};
export default TeacherKYC;
