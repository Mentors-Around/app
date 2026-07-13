import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { Eye, EyeOff, Loader2, ArrowLeft, CheckCircle, GraduationCap, Users } from 'lucide-react';
import Alert from '../../components/shared/Alert';

const PasswordStrength = ({ password }) => {
  const getStrength = (pass) => {
    if (!pass) return { score: 0, label: '', color: 'bg-slate-200', textColor: 'text-slate-400' };
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    
    if (score <= 2) return { score, label: 'Weak', color: 'bg-red-500', textColor: 'text-red-500' };
    if (score <= 4) return { score, label: 'Medium', color: 'bg-amber-500', textColor: 'text-amber-500' };
    return { score, label: 'Strong', color: 'bg-emerald-500', textColor: 'text-emerald-500' };
  };

  const strength = getStrength(password);

  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[1, 2, 3].map((level) => (
          <div 
            key={level} 
            className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
              password && strength.score >= level * 1.6 - 1 ? strength.color : 'bg-slate-200'
            }`} 
          />
        ))}
      </div>
      <div className="flex justify-between items-center text-xs">
        <span className={`font-bold ${strength.textColor}`}>
          {password ? `${strength.label} Strength` : 'Password Strength'}
        </span>
      </div>
    </div>
  );
};

const Signup = () => {
  const { register, sendPhoneOTP, verifyPhoneOTP, user, getDashboardRoute } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') || 'student';

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form State
  const [role, setRole] = useState(initialRole); // 'student' or 'teacher'
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [otp, setOtp] = useState('');

  // Step 4 Profile fields
  const [school, setSchool] = useState('');
  const [grade, setGrade] = useState('');
  const [studentSubjects, setStudentSubjects] = useState('');
  const [teacherSubjects, setTeacherSubjects] = useState('');
  const [experience, setExperience] = useState('');
  const [qualification, setQualification] = useState('');
  const [teachingMode, setTeachingMode] = useState('Online'); // 'Online', 'Offline', 'Both'

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Auto-login check
  useEffect(() => {
    if (user) {
      navigate(getDashboardRoute(user.role), { replace: true });
    }
  }, [user, navigate, getDashboardRoute]);

  useEffect(() => {
    document.title = 'Create Account — TrueEd';
  }, []);

  // Validation Checkers
  const isEmailValid = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  const isPhoneValid = (p) => /^\d{10}$/.test(p.replace(/[\s-+]/g, ''));
  const isPasswordStrong = (p) => {
    return p.length >= 8 && 
      /[A-Z]/.test(p) && 
      /[a-z]/.test(p) && 
      /[0-9]/.test(p) && 
      /[^A-Za-z0-9]/.test(p);
  };

  const handleStep1Submit = () => {
    setError('');
    setStep(2);
  };

  const handleStep2Submit = async (e) => {
    e.preventDefault();
    if (!fullName) return setError('Full Name is required.');
    if (!email) return setError('Email address is required.');
    if (!isEmailValid(email)) return setError('Please enter a valid email address.');
    if (!phone) return setError('Phone number is required.');
    if (!isPhoneValid(phone)) return setError('Please enter a valid 10-digit phone number.');
    if (!city) return setError('City is required.');
    if (!password) return setError('Password is required.');
    if (!isPasswordStrong(password)) return setError('Password must meet all complexity requirements.');
    if (password !== confirmPassword) return setError('Passwords do not match.');
    if (!agreed) return setError('You must agree to the Terms & Privacy Policy.');

    setError('');
    setLoading(true);
    try {
      await sendPhoneOTP(phone);
      setSuccess('Demo OTP code is 123456');
      setStep(3);
    } catch (err) {
      setError(err.message || 'Failed to send verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleStep3Submit = async (e) => {
    e.preventDefault();
    if (!otp) return setError('Please enter the 6-digit verification code.');
    if (otp.length !== 6) return setError('Verification code must be 6 digits.');

    setError('');
    setLoading(true);
    try {
      await verifyPhoneOTP(otp);
      setSuccess('');
      setStep(4);
    } catch (err) {
      setError(err.message || 'Invalid verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleStep4Submit = async (e, skip = false) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const profileData = {
        name: fullName,
        email: email.toLowerCase(),
        phone: phone,
        city: city,
        role: role,
      };

      if (!skip) {
        if (role === 'student') {
          profileData.school = school;
          profileData.class = grade;
          profileData.subjects = studentSubjects.split(',').map(s => s.trim()).filter(Boolean);
        } else {
          profileData.subjects = teacherSubjects.split(',').map(s => s.trim()).filter(Boolean);
          profileData.experience = experience;
          profileData.qualification = qualification;
          profileData.teachingMode = teachingMode;
        }
      }

      const result = await register(profileData);
      setStep(5);
    } catch (err) {
      setError(err.message || 'Failed to save profile details.');
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    navigate(getDashboardRoute(role));
  };

  return (
    <div className="font-inter">
      {/* Back Button */}
      {step > 1 && step < 5 && (
        <button 
          onClick={() => {
            setError('');
            setSuccess('');
            setStep(step - 1);
          }}
          className="absolute top-4 left-6 text-slate-400 hover:text-navy font-bold transition flex items-center gap-1.5 text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      )}

      {/* Sign Up Progress stepper */}
      {step < 5 && (
        <div className="flex justify-center items-center gap-2 mb-6 mt-2">
          {[1, 2, 3, 4].map((num) => (
            <div key={num} className="flex items-center">
              <div 
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition ${
                  step === num 
                    ? 'bg-navy text-white shadow' 
                    : step > num 
                      ? 'bg-emerald-500 text-white' 
                      : 'bg-slate-100 text-slate-400'
                }`}
              >
                {step > num ? '✓' : num}
              </div>
              {num < 4 && (
                <div 
                  className={`w-8 sm:w-12 h-0.5 ml-2 transition ${
                    step > num ? 'bg-emerald-500' : 'bg-slate-100'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {error && (
        <Alert message={error} type="error" show={!!error} onDismiss={() => setError('')} />
      )}
      {success && (
        <Alert message={success} type="success" show={!!success} onDismiss={() => setSuccess('')} />
      )}

      {/* Step 1: Choose Role */}
      {step === 1 && (
        <div className="animate-fade-in text-center">
          <div className="mb-6">
            <h2 className="font-sora text-2xl font-bold text-navy mb-2">Create Account</h2>
            <p className="text-slate-500 font-medium">Which best describes you?</p>
          </div>

          <div className="grid grid-cols-1 gap-4 mb-6">
            <button
              onClick={() => setRole('student')}
              className={`p-6 rounded-2xl border-2 text-left transition flex items-center gap-4 ${
                role === 'student' ? 'border-sky bg-sky-50/50' : 'border-slate-100 hover:border-slate-200'
              }`}
            >
              <div className="w-12 h-12 bg-sky-100 text-sky-600 rounded-xl flex items-center justify-center shrink-0">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-navy">I am a Student</p>
                <p className="text-slate-500 text-xs mt-0.5">I want to find verified tutors and clear doubts.</p>
              </div>
            </button>

            <button
              onClick={() => setRole('teacher')}
              className={`p-6 rounded-2xl border-2 text-left transition flex items-center gap-4 ${
                role === 'teacher' ? 'border-amber bg-amber-50/50' : 'border-slate-100 hover:border-slate-200'
              }`}
            >
              <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-navy">I am a Teacher</p>
                <p className="text-slate-500 text-xs mt-0.5">I want to verify my KYC profile and start teaching.</p>
              </div>
            </button>
          </div>

          <button
            onClick={handleStep1Submit}
            className="w-full py-3.5 bg-navy hover:bg-navy-light text-white font-bold rounded-xl transition shadow"
          >
            Continue
          </button>

          <p className="mt-8 text-center text-sm font-semibold text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="text-navy hover:text-sky transition font-bold">
              Log in
            </Link>
          </p>
        </div>
      )}

      {/* Step 2: Basic Info */}
      {step === 2 && (
        <div className="animate-fade-in">
          <div className="mb-4">
            <h2 className="font-sora text-2xl font-bold text-navy mb-1">Basic Information</h2>
            <p className="text-slate-500 text-sm font-medium">Create credentials to complete setup</p>
          </div>

          <form onSubmit={handleStep2Submit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 font-semibold focus:outline-none focus:border-navy focus:bg-white transition"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 font-semibold focus:outline-none focus:border-navy focus:bg-white transition"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="10-digit number"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 font-semibold focus:outline-none focus:border-navy focus:bg-white transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Mumbai"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 font-semibold focus:outline-none focus:border-navy focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-12 py-2.5 text-slate-800 font-semibold focus:outline-none focus:border-navy focus:bg-white transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-navy transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <PasswordStrength password={password} />
              
              <div className="mt-3 grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                <span className={password.length >= 8 ? 'text-emerald-500' : ''}>✓ 8+ Characters</span>
                <span className={/[A-Z]/.test(password) ? 'text-emerald-500' : ''}>✓ Uppercase Letter</span>
                <span className={/[a-z]/.test(password) ? 'text-emerald-500' : ''}>✓ Lowercase Letter</span>
                <span className={/[0-9]/.test(password) ? 'text-emerald-500' : ''}>✓ One Number</span>
                <span className={/[^A-Za-z0-9]/.test(password) ? 'text-emerald-500' : ''}>✓ Special Character</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-12 py-2.5 text-slate-800 font-semibold focus:outline-none focus:border-navy focus:bg-white transition"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-navy transition"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <label className="flex items-start cursor-pointer pt-2">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-slate-300 text-navy focus:ring-navy cursor-pointer"
              />
              <span className="ml-2 text-xs font-medium text-slate-500 leading-normal">
                I agree to TrueEd's <a href="/terms" target="_blank" className="text-navy font-bold hover:underline">Terms of Service</a> & <a href="/privacy" target="_blank" className="text-navy font-bold hover:underline">Privacy Policy</a>
              </span>
            </label>

            <button
              type="submit"
              disabled={loading || !fullName || !email || !phone || !city || !password || !agreed}
              className="w-full py-3.5 bg-navy hover:bg-navy-light disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition shadow flex items-center justify-center gap-2 mt-4"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Continue'}
            </button>
          </form>
        </div>
      )}

      {/* Step 3: Verify Phone */}
      {step === 3 && (
        <div className="animate-fade-in text-center">
          <div className="mb-6">
            <h2 className="font-sora text-2xl font-bold text-navy mb-2">Verify Mobile</h2>
            <p className="text-slate-500 text-sm font-medium">
              Enter the 6-digit verification code sent to
              <br />
              <span className="font-bold text-navy">{phone}</span>
            </p>
          </div>

          <form onSubmit={handleStep3Submit}>
            <input
              type="text"
              maxLength="6"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="e.g. 123456"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-center text-xl font-bold text-navy focus:outline-none focus:border-navy focus:bg-white transition mb-6"
              autoFocus
            />

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full py-3.5 bg-navy hover:bg-navy-light disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition shadow flex items-center justify-center gap-2 mb-4"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify Code'}
            </button>
          </form>

          <button
            onClick={() => {
              setOtp('');
              setStep(2);
            }}
            className="text-xs font-bold text-slate-500 hover:text-navy transition"
          >
            Change Phone Number
          </button>
        </div>
      )}

      {/* Step 4: Complete Profile */}
      {step === 4 && (
        <div className="animate-fade-in">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h2 className="font-sora text-2xl font-bold text-navy mb-1">Onboarding Profile</h2>
              <p className="text-slate-500 text-sm font-medium">Tell us more about yourself</p>
            </div>
            <button 
              onClick={() => handleStep4Submit(null, true)}
              className="text-xs font-bold text-slate-400 hover:text-navy transition"
            >
              Skip for now
            </button>
          </div>

          {role === 'student' ? (
            <form onSubmit={(e) => handleStep4Submit(e, false)} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">School / College</label>
                <input
                  type="text"
                  value={school}
                  onChange={(e) => setSchool(e.target.value)}
                  placeholder="e.g. DPS Public School"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-semibold focus:outline-none focus:border-navy focus:bg-white transition"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Class / Grade</label>
                <input
                  type="text"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  placeholder="e.g. Class 10"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-semibold focus:outline-none focus:border-navy focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Preferred Subjects (Comma-separated)</label>
                <input
                  type="text"
                  value={studentSubjects}
                  onChange={(e) => setStudentSubjects(e.target.value)}
                  placeholder="e.g. Mathematics, Physics, Chemistry"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-semibold focus:outline-none focus:border-navy focus:bg-white transition"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-navy hover:bg-navy-light text-white font-bold rounded-xl transition shadow flex items-center justify-center gap-2 mt-4"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Complete Profile'}
              </button>
            </form>
          ) : (
            <form onSubmit={(e) => handleStep4Submit(e, false)} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Subjects You Teach (Comma-separated)</label>
                <input
                  type="text"
                  value={teacherSubjects}
                  onChange={(e) => setTeacherSubjects(e.target.value)}
                  placeholder="e.g. Mathematics, Science"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-semibold focus:outline-none focus:border-navy focus:bg-white transition"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Experience (Years)</label>
                  <input
                    type="text"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    placeholder="e.g. 5"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-semibold focus:outline-none focus:border-navy focus:bg-white transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Highest Qualification</label>
                  <input
                    type="text"
                    value={qualification}
                    onChange={(e) => setQualification(e.target.value)}
                    placeholder="e.g. B.Tech / M.Sc"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-semibold focus:outline-none focus:border-navy focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Teaching Mode</label>
                <select
                  value={teachingMode}
                  onChange={(e) => setTeachingMode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-semibold focus:outline-none focus:border-navy focus:bg-white transition"
                >
                  <option value="Online">Online Only</option>
                  <option value="Offline">Offline Only</option>
                  <option value="Both">Both (Online & Offline)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-navy hover:bg-navy-light text-white font-bold rounded-xl transition shadow flex items-center justify-center gap-2 mt-4"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Complete Profile'}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Step 5: Success Screen */}
      {step === 5 && (
        <div className="animate-scale-in text-center py-6">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-10 h-10" />
          </div>
          <h2 className="font-sora text-3xl font-bold text-navy mb-2">Account Created!</h2>
          <p className="text-slate-500 font-medium mb-8">
            Registration is successful. Welcome to TrueEd!
          </p>
          <button
            onClick={handleFinish}
            className="w-full py-3.5 bg-navy hover:bg-navy-light text-white font-bold rounded-xl transition shadow-lg"
          >
            Go to Dashboard
          </button>
        </div>
      )}
    </div>
  );
};

export default Signup;
