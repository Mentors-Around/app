// src/pages/teacher/TeacherKYC.jsx
// Handles all KYC states:
//   - pending  → show the form to submit
//   - under_review → show "submitted, under review" state
//   - rejected → show rejection message + allow resubmission
//   - approved → shouldn't reach here (ProtectedRoute redirects away), but handle gracefully
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { UploadCloud, CheckCircle2, Loader2, Clock, XCircle, ShieldCheck } from 'lucide-react';
import teacherService from '@/services/teacher.service';
import { useAuth } from '@/hooks/useAuth';
import { SUBJECTS } from '@/constants/enums';
import Spinner from '@/components/shared/Spinner';

const DOC_TYPES = [
  { key: 'aadhaar', label: 'Aadhaar Card' },
  { key: 'pan', label: 'PAN Card' },
  { key: 'degree', label: 'Degree Certificate' },
  { key: 'bank_passbook', label: 'Bank Passbook / Cancelled Cheque' },
  { key: 'selfie', label: 'Selfie with ID' },
];

const Step = ({ active, done, label, index }) => (
  <div className="flex items-center gap-2">
    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
      done ? 'bg-emerald-500 text-white' : active ? 'bg-navy text-white' : 'bg-slate-100 text-slate-400'
    }`}>
      {done ? <CheckCircle2 size={14} /> : index}
    </div>
    <span className={`text-sm font-semibold ${active || done ? 'text-navy' : 'text-slate-400'}`}>{label}</span>
  </div>
);

// Status card for under_review / rejected / approved states
const StatusCard = ({ kycStatus }) => {
  if (kycStatus === 'under_review') {
    return (
      <div className="max-w-xl mx-auto text-center py-16">
        <div className="w-20 h-20 rounded-full bg-sky/10 flex items-center justify-center mx-auto mb-5">
          <Clock className="text-sky" size={36} />
        </div>
        <h1 className="font-sora text-2xl font-bold text-navy mb-2">Documents under review</h1>
        <p className="text-sm text-muted mb-6">
          Our team is reviewing your KYC documents. This usually takes 1–2 business days.
          You'll receive a notification once approved.
        </p>
        <Link to="/teacher/settings" className="inline-block text-sm font-bold text-sky hover:underline">
          Go to Settings →
        </Link>
      </div>
    );
  }

  if (kycStatus === 'approved') {
    return (
      <div className="max-w-xl mx-auto text-center py-16">
        <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-5">
          <ShieldCheck className="text-emerald-500" size={36} />
        </div>
        <h1 className="font-sora text-2xl font-bold text-navy mb-2">KYC Approved!</h1>
        <p className="text-sm text-muted mb-6">Your account is verified. You can now create classrooms and accept students.</p>
        <Link to="/teacher/dashboard" className="inline-block bg-navy text-white font-bold px-6 py-3 rounded-xl hover:bg-navy-hover transition">
          Go to Dashboard
        </Link>
      </div>
    );
  }

  return null;
};

const TeacherKYC = () => {
  const { user, updateUser, kycPending } = useAuth();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [kycStatus, setKycStatus] = useState(user?.kycStatus || 'pending');
  const [submitted, setSubmitted] = useState(false);

  const [profile, setProfile] = useState({
    headline: '', bio: '', subjects: [], city: '', state: '',
    experienceYears: '', ifsc: '', accountNumber: '', accountHolderName: '',
  });

  const [files, setFiles] = useState({});

  // Load dashboard data to get real KYC status
  useEffect(() => {
    const status = user?.kycStatus;
    if (status) setKycStatus(status);
  }, [user]);

  const toggleSubject = (s) => {
    setProfile((p) => ({
      ...p,
      subjects: p.subjects.includes(s) ? p.subjects.filter((x) => x !== s) : [...p.subjects, s],
    }));
  };

  const submitProfile = async (e) => {
    e.preventDefault();
    if (profile.subjects.length === 0) { toast.error('Select at least one subject'); return; }
    setSaving(true);
    try {
      await teacherService.submitProfile({
        headline: profile.headline,
        bio: profile.bio,
        subjects: profile.subjects,
        city: profile.city,
        state: profile.state,
        experienceYears: Number(profile.experienceYears) || 0,
        bankAccount: profile.ifsc
          ? { ifsc: profile.ifsc.toUpperCase(), accountNumber: profile.accountNumber, accountHolderName: profile.accountHolderName }
          : undefined,
      });
      toast.success('Profile saved — now upload your documents');
      setStep(2);
    } catch (err) {
      toast.error(err?.message || 'Could not save profile');
    } finally {
      setSaving(false);
    }
  };

  const onFileChange = (docKey, fileList) => {
    setFiles((f) => ({ ...f, [docKey]: fileList[0] }));
  };

  const submitDocuments = async (e) => {
    e.preventDefault();
    const selected = Object.entries(files).filter(([, f]) => f);
    if (selected.length === 0) { toast.error('Upload at least one document'); return; }
    setSaving(true);
    try {
      for (const [docKey, file] of selected) {
        const formData = new FormData();
        formData.append('documents', file);
        formData.append('documentType', docKey);
        await teacherService.uploadKYC(formData);
      }
      toast.success('Documents submitted! We\'ll review within 1-2 business days.');
      setSubmitted(true);
      updateUser({ kycStatus: 'under_review', isVerificationPending: true });
      setKycStatus('under_review');
    } catch (err) {
      toast.error(err?.message || 'Upload failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Show status cards for non-pending states
  if (!submitted && (kycStatus === 'under_review' || kycStatus === 'approved')) {
    return <StatusCard kycStatus={kycStatus} />;
  }

  // Submitted in this session
  if (submitted) {
    return <StatusCard kycStatus="under_review" />;
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-sora text-2xl font-extrabold text-navy mb-2">Complete your KYC</h1>
      <p className="text-sm text-muted mb-6">Verification is required before you can start accepting students.</p>

      {kycStatus === 'rejected' && (
        <div className="mb-6 p-4 rounded-xl bg-error/10 border border-error/20 flex items-start gap-3">
          <XCircle size={20} className="text-error shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-error">Your previous KYC submission was rejected.</p>
            <p className="text-xs text-muted mt-1">Please review the documents and resubmit with clearer, complete copies.</p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-6 mb-8">
        <Step index={1} active={step === 1} done={step > 1} label="Profile details" />
        <div className="flex-1 h-px bg-slate-200" />
        <Step index={2} active={step === 2} done={false} label="Upload documents" />
      </div>

      {step === 1 ? (
        <form onSubmit={submitProfile} className="bg-white rounded-brand shadow-brand p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-navy mb-1.5">Headline</label>
            <input value={profile.headline} onChange={(e) => setProfile((p) => ({ ...p, headline: e.target.value }))}
              placeholder="e.g. IIT alum, 5 years teaching Physics"
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:border-navy" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-navy mb-1.5">Bio</label>
            <textarea rows={3} value={profile.bio} onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
              placeholder="Tell students about yourself, your teaching style, and experience..."
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:border-navy resize-none" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-navy mb-1.5">Subjects you teach *</label>
            <div className="flex flex-wrap gap-2">
              {SUBJECTS.map((s) => (
                <button key={s} type="button" onClick={() => toggleSubject(s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 transition ${
                    profile.subjects.includes(s) ? 'bg-navy border-navy text-white' : 'border-slate-200 text-slate-500 hover:border-navy'
                  }`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-navy mb-1.5">City</label>
              <input value={profile.city} onChange={(e) => setProfile((p) => ({ ...p, city: e.target.value }))}
                placeholder="e.g. Mumbai"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:border-navy" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-navy mb-1.5">State</label>
              <input value={profile.state} onChange={(e) => setProfile((p) => ({ ...p, state: e.target.value }))}
                placeholder="e.g. Maharashtra"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:border-navy" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-navy mb-1.5">Experience (yrs)</label>
              <input type="number" min="0" max="50" value={profile.experienceYears}
                onChange={(e) => setProfile((p) => ({ ...p, experienceYears: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:border-navy" />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <p className="text-sm font-bold text-navy mb-3">Bank account (for payouts)</p>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <input placeholder="Account holder name" value={profile.accountHolderName}
                onChange={(e) => setProfile((p) => ({ ...p, accountHolderName: e.target.value }))}
                className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:border-navy" />
              <input placeholder="IFSC code" value={profile.ifsc}
                onChange={(e) => setProfile((p) => ({ ...p, ifsc: e.target.value }))}
                className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:border-navy" />
            </div>
            <input placeholder="Account number" value={profile.accountNumber}
              onChange={(e) => setProfile((p) => ({ ...p, accountNumber: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:border-navy" />
          </div>

          <button type="submit" disabled={saving}
            className="w-full bg-navy text-white text-sm font-bold py-3 rounded-xl hover:bg-navy-hover transition disabled:opacity-50 flex items-center justify-center gap-2">
            {saving && <Loader2 size={14} className="animate-spin" />}
            Save &amp; continue
          </button>
        </form>
      ) : (
        <form onSubmit={submitDocuments} className="bg-white rounded-brand shadow-brand p-6 space-y-4">
          <p className="text-sm text-muted mb-2">Upload clear photos or scans. Files must be JPG, PNG, or PDF (max 10 MB each).</p>
          {DOC_TYPES.map((doc) => (
            <div key={doc.key}>
              <label className="block text-sm font-semibold text-navy mb-1.5">{doc.label}</label>
              <label className={`upload-zone flex items-center justify-center gap-3 cursor-pointer ${files[doc.key] ? 'has-file' : ''}`}>
                <UploadCloud size={18} className={files[doc.key] ? 'text-emerald-500' : 'text-slate-400'} />
                <span className="text-sm text-muted">
                  {files[doc.key] ? (
                    <span className="text-emerald-600 font-semibold">{files[doc.key].name}</span>
                  ) : 'Click to upload (PDF, JPG, PNG)'}
                </span>
                <input type="file" accept="image/*,application/pdf" className="hidden"
                  onChange={(e) => e.target.files?.[0] && onFileChange(doc.key, e.target.files)} />
              </label>
            </div>
          ))}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setStep(1)}
              className="flex-1 py-2.5 border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50">
              Back
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 bg-navy text-white rounded-xl text-sm font-bold hover:bg-navy-hover disabled:opacity-50 flex items-center justify-center gap-2">
              {saving && <Loader2 size={14} className="animate-spin" />}
              {saving ? 'Submitting...' : 'Submit for review'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default TeacherKYC;
