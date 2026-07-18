import { useState } from 'react';
import toast from 'react-hot-toast';
import { User, Mail, Phone, Calendar, MapPin, KeyRound, Camera, Loader2, Eye, EyeOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import userService from '@/services/user.service';
import Modal from '@/components/shared/Modal';
import { formatPhone } from '@/utils/format.util';
import { formatDate } from '@/utils/date.util';

const Field = ({ icon: Icon, label, children }) => (
  <div>
    <label className="flex items-center gap-2 text-xs font-bold text-muted uppercase tracking-wide mb-1.5">
      <Icon size={13} /> {label}
    </label>
    {children}
  </div>
);

const StudentProfile = () => {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    city: user?.city || '',
    state: user?.state || '',
    dateOfBirth: user?.dateOfBirth ? user.dateOfBirth.slice(0, 10) : '',
  });
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [pwOpen, setPwOpen] = useState(false);
  const [pwForm, setPwForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [showOldPw, setShowOldPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const dirty = JSON.stringify(form) !== JSON.stringify({
    name: user?.name || '', city: user?.city || '', state: user?.state || '',
    dateOfBirth: user?.dateOfBirth ? user.dateOfBirth.slice(0, 10) : '',
  });

  const save = async () => {
    setSaving(true);
    try {
      const { data } = await userService.updateMe(form);
      updateUser(data?.data ?? data);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err?.message || 'Could not update profile');
    } finally {
      setSaving(false);
    }
  };

  const onAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const { data } = await userService.uploadAvatar(formData);
      updateUser({ avatarUrl: (data?.data ?? data)?.avatarUrl });
      toast.success('Photo updated');
    } catch (err) {
      toast.error(err?.message || 'Upload failed');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const changePassword = async () => {
    if (pwForm.newPassword.length < 8) { toast.error('New password must be at least 8 characters'); return; }
    if (pwForm.newPassword !== pwForm.confirmPassword) { toast.error('New password and confirm password do not match'); return; }
    setPwSaving(true);
    try {
      await userService.changePassword({ oldPassword: pwForm.oldPassword, newPassword: pwForm.newPassword });
      toast.success('Password changed');
      setPwOpen(false);
      setPwForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err?.message || 'Could not change password');
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <h1 className="font-sora text-2xl font-extrabold text-navy mb-6">My Profile</h1>

      <div className="bg-white rounded-brand shadow-brand p-6 mb-6 flex items-center gap-5">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-navy text-white flex items-center justify-center text-2xl font-bold overflow-hidden">
            {user?.avatarUrl ? <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" /> : (user?.initials || 'U')}
          </div>
          <label className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white shadow-brand flex items-center justify-center cursor-pointer border border-slate-200">
            {uploadingAvatar ? <Loader2 size={13} className="animate-spin text-navy" /> : <Camera size={13} className="text-navy" />}
            <input type="file" accept="image/*" className="hidden" onChange={onAvatarChange} disabled={uploadingAvatar} />
          </label>
        </div>
        <div>
          <p className="font-sora font-bold text-lg text-navy">{user?.name}</p>
          <p className="text-sm text-muted">{user?.email}</p>
          {user?.isMinor && (
            <span className="inline-block mt-1 text-[11px] font-bold text-amber-hover bg-amber/10 px-2 py-0.5 rounded-full">
              Minor account &middot; parental consent required
            </span>
          )}
        </div>
      </div>

      <div className="bg-white rounded-brand shadow-brand p-6 space-y-5">
        <h2 className="font-sora font-bold text-navy">Personal details</h2>

        <Field icon={User} label="Full name">
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:border-navy"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field icon={Mail} label="Email">
            <input value={user?.email || ''} disabled className="w-full rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-sm text-slate-400" />
          </Field>
          <Field icon={Phone} label="Phone">
            <input value={user?.phone ? formatPhone(user.phone) : 'Not linked'} disabled className="w-full rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-sm text-slate-400" />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field icon={Calendar} label="Date of birth">
            <input
              type="date"
              value={form.dateOfBirth}
              onChange={(e) => setForm((f) => ({ ...f, dateOfBirth: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:border-navy"
            />
          </Field>
          <Field icon={MapPin} label="City">
            <input
              value={form.city}
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:border-navy"
            />
          </Field>
        </div>

        <Field icon={MapPin} label="State">
          <input
            value={form.state}
            onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:border-navy"
          />
        </Field>

        <div className="flex justify-between items-center pt-2 border-t border-slate-100">
          <p className="text-xs text-muted">Member since {formatDate(user?.createdAt)}</p>
          <button
            onClick={save}
            disabled={!dirty || saving}
            className="bg-navy text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-navy-hover transition disabled:opacity-40"
          >
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-brand shadow-brand p-6 mt-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <KeyRound size={20} className="text-navy" />
          <div>
            <p className="font-sora font-bold text-navy">Password</p>
            <p className="text-xs text-muted">Change your account password</p>
          </div>
        </div>
        <button onClick={() => setPwOpen(true)} className="text-sm font-bold text-navy border-2 border-slate-200 px-4 py-2 rounded-xl hover:bg-slate-50 transition">
          Change
        </button>
      </div>

      <Modal
        isOpen={pwOpen}
        onClose={() => setPwOpen(false)}
        title="Change password"
        footer={
          <>
            <button onClick={() => setPwOpen(false)} className="px-4 py-2.5 rounded-xl border-2 border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
            <button onClick={changePassword} disabled={pwSaving} className="px-4 py-2.5 rounded-xl bg-navy text-white text-sm font-bold hover:bg-navy-hover disabled:opacity-50">
              {pwSaving ? 'Saving...' : 'Update password'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-semibold text-navy">Current password</label>
              <Link to="/forgot-password" className="text-xs font-semibold text-navy/70 hover:text-navy hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input type={showOldPw ? 'text' : 'password'} value={pwForm.oldPassword} onChange={(e) => setPwForm((f) => ({ ...f, oldPassword: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 pr-10 text-sm focus:outline-none focus:border-navy" />
              <button type="button" onClick={() => setShowOldPw((v) => !v)} tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-navy transition">
                {showOldPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-navy mb-1.5">New password</label>
            <div className="relative">
              <input type={showNewPw ? 'text' : 'password'} value={pwForm.newPassword} onChange={(e) => setPwForm((f) => ({ ...f, newPassword: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 pr-10 text-sm focus:outline-none focus:border-navy" />
              <button type="button" onClick={() => setShowNewPw((v) => !v)} tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-navy transition">
                {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="text-xs text-muted mt-1">At least 8 characters, one letter and one number.</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-navy mb-1.5">Confirm new password</label>
            <div className="relative">
              <input type={showConfirmPw ? 'text' : 'password'} value={pwForm.confirmPassword} onChange={(e) => setPwForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 pr-10 text-sm focus:outline-none focus:border-navy" />
              <button type="button" onClick={() => setShowConfirmPw((v) => !v)} tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-navy transition">
                {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default StudentProfile;