import React, { useState } from 'react';
import { X, Shield, Upload, FileText, Landmark, User, FileImage, CheckCircle, Info, Award } from 'lucide-react';
import useAuth from '../../hooks/useAuth';

const TeacherKYCModal = ({ isOpen, onClose }) => {
  const { user, updateKycStatus } = useAuth();
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    dob: '',
    gender: '',
    aadhaarNumber: '',
    panNumber: '',
    accountHolder: '',
    bankName: '',
    accountNumber: '',
    confirmAccountNumber: '',
    ifsc: '',
    accountType: 'Savings',
    declarationAccepted: false,
  });

  if (!isOpen) return null;

  const handleNext = () => setStep(s => Math.min(s + 1, 6));
  const handlePrev = () => setStep(s => Math.max(s - 1, 1));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.declarationAccepted) {
      alert("Please accept the declaration to proceed.");
      return;
    }
    updateKycStatus('PENDING');
    onClose();
  };

  const renderStepIndicator = () => (
    <div className="flex justify-between mb-8 relative">
      <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-100 -z-10 -translate-y-1/2"></div>
      <div className="absolute top-1/2 left-0 h-0.5 bg-navy -z-10 -translate-y-1/2 transition-all duration-300" style={{ width: `${((step - 1) / 5) * 100}%` }}></div>
      
      {[1, 2, 3, 4, 5, 6].map(i => (
        <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors shadow-sm ${
          step >= i ? 'bg-navy text-white' : 'bg-white text-slate-400 border border-slate-200'
        }`}>
          {step > i ? <CheckCircle className="w-4 h-4" /> : i}
        </div>
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-navy/80 backdrop-blur-sm z-[7000] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-2xl animate-scale-in flex flex-col relative overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-sora font-bold text-xl text-navy">Identity Verification (KYC)</h2>
              <p className="text-sm font-medium text-slate-500 hidden sm:block">Complete these steps to unlock teaching privileges.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition p-2 bg-slate-50 hover:bg-slate-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50/50">
          {renderStepIndicator()}

          <form id="kyc-form" onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            
            {/* Step 1: Personal Info */}
            {step === 1 && (
              <div className="space-y-5 animate-fadeIn">
                <div className="flex items-center gap-2 mb-6 text-navy">
                  <User className="w-5 h-5" />
                  <h3 className="font-sora font-bold text-lg">Personal Information</h3>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Full Name (As per Govt ID)</label>
                  <input type="text" value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-navy" required />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Date of Birth</label>
                    <input type="date" value={formData.dob} onChange={(e) => setFormData({...formData, dob: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-navy" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Gender</label>
                    <select value={formData.gender} onChange={(e) => setFormData({...formData, gender: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-navy" required>
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Aadhaar */}
            {step === 2 && (
              <div className="space-y-5 animate-fadeIn">
                <div className="flex items-center gap-2 mb-6 text-navy">
                  <FileText className="w-5 h-5" />
                  <h3 className="font-sora font-bold text-lg">Aadhaar Verification</h3>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Aadhaar Number</label>
                  <input type="text" placeholder="XXXX XXXX XXXX" value={formData.aadhaarNumber} onChange={(e) => setFormData({...formData, aadhaarNumber: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-navy font-mono" required />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:bg-slate-50 transition cursor-pointer">
                    <Upload className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm font-bold text-slate-700">Upload Front Image</p>
                    <p className="text-xs text-slate-500 mt-1">JPG, PNG (Max 5MB)</p>
                  </div>
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:bg-slate-50 transition cursor-pointer">
                    <Upload className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm font-bold text-slate-700">Upload Back Image</p>
                    <p className="text-xs text-slate-500 mt-1">JPG, PNG (Max 5MB)</p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: PAN */}
            {step === 3 && (
              <div className="space-y-5 animate-fadeIn">
                <div className="flex items-center gap-2 mb-6 text-navy">
                  <FileImage className="w-5 h-5" />
                  <h3 className="font-sora font-bold text-lg">PAN Verification</h3>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">PAN Number</label>
                  <input type="text" placeholder="ABCDE1234F" value={formData.panNumber} onChange={(e) => setFormData({...formData, panNumber: e.target.value.toUpperCase()})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-navy font-mono uppercase" required />
                </div>
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:bg-slate-50 transition cursor-pointer mt-4">
                  <Upload className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-700">Upload PAN Card Image</p>
                  <p className="text-xs text-slate-500 mt-1">JPG, PNG, PDF (Max 5MB)</p>
                </div>
              </div>
            )}

            {/* Step 4: Bank Details */}
            {step === 4 && (
              <div className="space-y-5 animate-fadeIn">
                <div className="flex items-center gap-2 mb-6 text-navy">
                  <Landmark className="w-5 h-5" />
                  <h3 className="font-sora font-bold text-lg">Bank Details</h3>
                </div>
                <div className="bg-sky-50 text-sky-700 p-3 rounded-lg flex items-start gap-2 mb-4">
                  <Info className="w-4 h-4 mt-0.5 shrink-0" />
                  <p className="text-xs font-medium">This account will be used to process your earnings withdrawals. It must match your verified identity.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Account Holder Name</label>
                    <input type="text" value={formData.accountHolder} onChange={(e) => setFormData({...formData, accountHolder: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-navy" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Account Number</label>
                    <input type="password" value={formData.accountNumber} onChange={(e) => setFormData({...formData, accountNumber: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-navy font-mono" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Confirm Account Number</label>
                    <input type="text" value={formData.confirmAccountNumber} onChange={(e) => setFormData({...formData, confirmAccountNumber: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-navy font-mono" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">IFSC Code</label>
                    <input type="text" value={formData.ifsc} onChange={(e) => setFormData({...formData, ifsc: e.target.value.toUpperCase()})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-navy font-mono uppercase" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Account Type</label>
                    <select value={formData.accountType} onChange={(e) => setFormData({...formData, accountType: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-navy">
                      <option value="Savings">Savings</option>
                      <option value="Current">Current</option>
                    </select>
                  </div>
                </div>
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:bg-slate-50 transition cursor-pointer mt-4">
                  <Upload className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                  <p className="text-xs font-bold text-slate-700">Upload Cancelled Cheque / Passbook (Optional)</p>
                </div>
              </div>
            )}

            {/* Step 5: Educational Documents */}
            {step === 5 && (
              <div className="space-y-5 animate-fadeIn">
                <div className="flex items-center gap-2 mb-6 text-navy">
                  <Award className="w-5 h-5" />
                  <h3 className="font-sora font-bold text-lg">Educational & Professional Documents</h3>
                </div>
                <p className="text-sm font-medium text-slate-500 mb-4">Please upload documents that verify your teaching credentials, degrees, or professional certifications.</p>
                
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-10 text-center hover:bg-slate-50 transition cursor-pointer">
                  <div className="w-16 h-16 bg-sky-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Upload className="w-8 h-8 text-sky-600" />
                  </div>
                  <p className="text-sm font-bold text-navy mb-1">Click to Upload Documents</p>
                  <p className="text-xs text-slate-500 mb-4">You can select multiple files. (JPG, PNG, PDF)</p>
                  
                  <div className="flex flex-wrap gap-2 justify-center mt-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-1 rounded">Degree Cert.</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-1 rounded">B.Ed / M.Ed</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-1 rounded">Experience Letter</span>
                  </div>
                </div>
              </div>
            )}

            {/* Step 6: Declaration */}
            {step === 6 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex items-center gap-2 mb-6 text-navy">
                  <CheckCircle className="w-5 h-5" />
                  <h3 className="font-sora font-bold text-lg">Final Declaration</h3>
                </div>
                
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                  <label className="flex items-start gap-4 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={formData.declarationAccepted}
                      onChange={(e) => setFormData({...formData, declarationAccepted: e.target.checked})}
                      className="w-5 h-5 mt-0.5 rounded border-slate-300 text-navy focus:ring-navy" 
                    />
                    <div>
                      <p className="text-sm font-bold text-slate-800 mb-1">I confirm that all the information and documents submitted are genuine.</p>
                      <p className="text-xs font-medium text-slate-500 leading-relaxed">I understand that submitting false information, forged documents, or misleading credentials may lead to immediate rejection, permanent suspension of my teacher account, and withholding of any pending payouts according to TrueEd's Terms of Service.</p>
                    </div>
                  </label>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-white flex justify-between shrink-0">
          <button 
            type="button" 
            onClick={step === 1 ? onClose : handlePrev}
            className="px-6 py-3 text-sm font-bold text-slate-600 hover:text-navy hover:bg-slate-50 rounded-xl transition"
          >
            {step === 1 ? 'Cancel' : 'Back'}
          </button>
          
          {step < 6 ? (
            <button 
              type="button" 
              onClick={handleNext}
              className="px-8 py-3 bg-navy text-white text-sm font-bold rounded-xl hover:bg-navy-light transition shadow-sm"
            >
              Next Step
            </button>
          ) : (
            <button 
              type="submit" 
              form="kyc-form"
              disabled={!formData.declarationAccepted}
              className="px-8 py-3 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Shield className="w-4 h-4" /> Submit for Verification
            </button>
          )}
        </div>
        
      </div>
    </div>
  );
};

export default TeacherKYCModal;
