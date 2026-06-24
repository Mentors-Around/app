import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import StepPhone from '../components/login/StepPhone';
import StepPhoneOTP from '../components/login/StepPhoneOTP';
import StepRegister from '../components/login/StepRegister';
import StepEmailOTP from '../components/login/StepEmailOTP';
import StepSuccess from '../components/login/StepSuccess';
import Alert from '../components/shared/Alert';

const LoginPage = () => {
  const [step, setStep] = useState('phone');
  const [phone, setPhone] = useState('');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => { document.title = 'Login — TrueEd'; }, []);

  const { sendPhoneOTP, verifyPhoneOTP, register, verifyEmailOTP, getDashboardRoute } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') || 'student';

  const clearMessages = () => { setError(''); setSuccessMsg(''); };

  // Step 1
  const handleSendOTP = async (ph) => {
    clearMessages();
    setLoading(true);
    try {
      await sendPhoneOTP(ph);
      setPhone(ph);
      setStep('phone-otp');
      setSuccessMsg('Demo OTP: 123456');
    } catch (e) {
      setError(e.message);
    } finally { setLoading(false); }
  };

  // Step 2
  const handleVerifyPhone = async (otp) => {
    clearMessages();
    setLoading(true);
    try {
      await verifyPhoneOTP(otp);
      setStep('register');
    } catch (e) {
      setError(e.message);
    } finally { setLoading(false); }
  };

  // Step 3
  const handleRegister = async (profileData) => {
    clearMessages();
    setLoading(true);
    try {
      await register(profileData);
      setProfile(profileData);
      setStep('email-otp');
      setSuccessMsg('Demo email code: 654321');
    } catch (e) {
      setError(e.message);
    } finally { setLoading(false); }
  };

  // Step 4
  const handleVerifyEmail = async (otp) => {
    clearMessages();
    setLoading(true);
    try {
      await verifyEmailOTP(otp, profile);
      setStep('success');
    } catch (e) {
      setError(e.message);
    } finally { setLoading(false); }
  };

  // Step 5
  const handleContinue = () => {
    navigate(getDashboardRoute(profile?.role));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream to-cream-warm flex items-center justify-center p-4 md:p-8">
      <div className="bg-white rounded-brand w-full max-w-[460px] shadow-brand animate-slide-up p-7 md:p-10">
        {/* Demo success hint */}
        {successMsg && (
          <Alert message={successMsg} type="success" show={!!successMsg} onDismiss={() => setSuccessMsg('')} />
        )}

        {step === 'phone' && (
          <StepPhone onSubmit={handleSendOTP} loading={loading} error={error} onDismissError={clearMessages} />
        )}
        {step === 'phone-otp' && (
          <StepPhoneOTP
            phone={phone}
            onSubmit={handleVerifyPhone}
            onResend={() => handleSendOTP(phone)}
            onBack={() => { clearMessages(); setStep('phone'); }}
            loading={loading}
            error={error}
            onDismissError={clearMessages}
          />
        )}
        {step === 'register' && (
          <StepRegister
            onSubmit={handleRegister}
            loading={loading}
            error={error}
            onDismissError={clearMessages}
            initialRole={initialRole}
          />
        )}
        {step === 'email-otp' && (
          <StepEmailOTP
            email={profile?.email}
            onSubmit={handleVerifyEmail}
            onResend={() => {}}
            onBack={() => { clearMessages(); setStep('register'); }}
            loading={loading}
            error={error}
            onDismissError={clearMessages}
          />
        )}
        {step === 'success' && (
          <StepSuccess role={profile?.role} onContinue={handleContinue} loading={loading} />
        )}
      </div>
    </div>
  );
};
export default LoginPage;
