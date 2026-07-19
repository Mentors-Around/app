import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, UploadCloud, ChevronRight, ChevronLeft, Building2 } from 'lucide-react';

const subjectsList = ['Mathematics', 'Science', 'English', 'History', 'Computer Science', 'Physics', 'Chemistry', 'Biology', 'Languages', 'Art'];
const classesList = ['Class 1-5', 'Class 6-8', 'Class 9-10', 'Class 11-12', 'College/Degree', 'Competitive Exams', 'Hobbies/Skills'];

const TeacherApply = () => {
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState({});
  
  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '+91 ',
    city: '',
    experience: '',
    subjects: [],
    classes: [],
    teachingMode: '',
    hourlyRate: '',
    bio: '',
    termsAccepted: false
  });

  const handleNextStep1 = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Full Name is required';
    if (!formData.email.trim() || !/^\S+@\S+\.\S+$/.test(formData.email)) newErrors.email = 'Valid Email is required';
    if (!formData.phone.trim() || formData.phone.length < 5) newErrors.phone = 'Valid Phone is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.experience) newErrors.experience = 'Experience is required';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
    } else {
      setErrors({});
      setStep(2);
      window.scrollTo(0,0);
    }
  };

  const handleNextStep2 = () => {
    const newErrors = {};
    if (formData.subjects.length === 0) newErrors.subjects = 'Select at least one subject';
    if (formData.classes.length === 0) newErrors.classes = 'Select at least one class';
    if (!formData.teachingMode) newErrors.teachingMode = 'Select teaching mode';
    if (!formData.hourlyRate || formData.hourlyRate < 100 || formData.hourlyRate > 5000) newErrors.hourlyRate = 'Rate must be between ₹100 and ₹5000';
    if (!formData.bio.trim()) newErrors.bio = 'Short bio is required';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
    } else {
      setErrors({});
      setStep(3);
      window.scrollTo(0,0);
    }
  };

  const handleSubmit = () => {
    const newErrors = {};
    if (!formData.termsAccepted) newErrors.termsAccepted = 'You must accept the terms and privacy policy';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
    } else {
      setErrors({});
      // Simulate API call
      setStep(4);
      window.scrollTo(0,0);
    }
  };

  const toggleSelection = (field, value) => {
    setFormData(prev => {
      const array = prev[field];
      if (array.includes(value)) {
        return { ...prev, [field]: array.filter(item => item !== value) };
      } else {
        return { ...prev, [field]: [...array, value] };
      }
    });
  };

  if (step === 4) {
    return (
      <div className="fixed inset-0 bg-white z-[9999] overflow-y-auto flex flex-col font-sans">
        {/* Minimal Navbar */}
        <div className="py-4 px-8 border-b border-gray-100 flex items-center justify-center">
          <Link to="/" className="flex items-center gap-2 text-2xl font-bold text-blue-600">
            <Building2 className="h-8 w-8" />
            TrueEd
          </Link>
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 text-center max-w-lg mx-auto w-full">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-8 mx-auto">
            <span className="text-5xl">🎉</span>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-4">Application Submitted!</h1>
          <p className="text-lg text-gray-600 mb-8">
            Thank you, {formData.fullName.split(' ')[0] || 'Teacher'}! We'll review your application and get back to you within 3-5 business days at <span className="font-semibold text-gray-900">{formData.email}</span>.
          </p>
          <Link to="/" className="w-full bg-blue-600 text-white rounded-xl py-4 font-semibold text-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl mx-auto">
        
        {/* Progress Bar */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 text-center mb-8">Teacher Application</h1>
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 -z-10 rounded-full"></div>
            <div 
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-blue-600 -z-10 rounded-full transition-all duration-500"
              style={{ width: `${((step - 1) / 2) * 100}%` }}
            ></div>
            
            {[1, 2, 3].map(num => (
              <div key={num} className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-4 border-gray-50 transition-colors ${step >= num ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  {step > num ? <Check size={20} /> : num}
                </div>
                <span className={`text-xs mt-2 font-medium ${step >= num ? 'text-blue-600' : 'text-gray-500'}`}>
                  {num === 1 ? 'Personal Info' : num === 2 ? 'Teaching Details' : 'Documents'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-6 sm:p-10 border border-gray-100">
          
          {/* STEP 1: Personal Info */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-4">1. Personal Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input 
                    type="text" 
                    value={formData.fullName}
                    onChange={e => setFormData({...formData, fullName: e.target.value})}
                    className={`w-full px-4 py-3 rounded-xl border ${errors.fullName ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'} outline-none transition-all`}
                    placeholder="Enter your full name"
                  />
                  {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <input 
                      type="email" 
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                      className={`w-full px-4 py-3 rounded-xl border ${errors.email ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'} outline-none transition-all`}
                      placeholder="you@example.com"
                    />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input 
                      type="text" 
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                      className={`w-full px-4 py-3 rounded-xl border ${errors.phone ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'} outline-none transition-all`}
                    />
                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City/Location</label>
                    <input 
                      type="text" 
                      value={formData.city}
                      onChange={e => setFormData({...formData, city: e.target.value})}
                      className={`w-full px-4 py-3 rounded-xl border ${errors.city ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'} outline-none transition-all`}
                      placeholder="e.g. Mumbai, Maharashtra"
                    />
                    {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
                    <select 
                      value={formData.experience}
                      onChange={e => setFormData({...formData, experience: e.target.value})}
                      className={`w-full px-4 py-3 rounded-xl border ${errors.experience ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'} outline-none transition-all bg-white`}
                    >
                      <option value="">Select experience</option>
                      <option value="0-1">0-1 Years (Fresher)</option>
                      <option value="1-3">1-3 Years</option>
                      <option value="3-5">3-5 Years</option>
                      <option value="5-10">5-10 Years</option>
                      <option value="10+">10+ Years</option>
                    </select>
                    {errors.experience && <p className="text-red-500 text-xs mt-1">{errors.experience}</p>}
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button 
                  onClick={handleNextStep1}
                  className="flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-md"
                >
                  Next Step <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Teaching Details */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-4">2. Teaching Details</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subjects You Can Teach</label>
                  <div className="flex flex-wrap gap-2">
                    {subjectsList.map(subject => (
                      <button
                        key={subject}
                        onClick={() => toggleSelection('subjects', subject)}
                        className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                          formData.subjects.includes(subject) 
                            ? 'bg-blue-100 border-blue-500 text-blue-700' 
                            : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {subject}
                      </button>
                    ))}
                  </div>
                  {errors.subjects && <p className="text-red-500 text-xs mt-1">{errors.subjects}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Target Classes/Audience</label>
                  <div className="flex flex-wrap gap-2">
                    {classesList.map(cls => (
                      <button
                        key={cls}
                        onClick={() => toggleSelection('classes', cls)}
                        className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                          formData.classes.includes(cls) 
                            ? 'bg-purple-100 border-purple-500 text-purple-700' 
                            : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {cls}
                      </button>
                    ))}
                  </div>
                  {errors.classes && <p className="text-red-500 text-xs mt-1">{errors.classes}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Teaching Mode</label>
                    <div className="flex flex-col gap-3">
                      {['Online', 'Offline', 'Both'].map(mode => (
                        <label key={mode} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${formData.teachingMode === mode ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                          <input 
                            type="radio" 
                            name="teachingMode" 
                            value={mode}
                            checked={formData.teachingMode === mode}
                            onChange={(e) => setFormData({...formData, teachingMode: e.target.value})}
                            className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="font-medium text-gray-800">{mode}</span>
                        </label>
                      ))}
                    </div>
                    {errors.teachingMode && <p className="text-red-500 text-xs mt-1">{errors.teachingMode}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Expected Hourly Rate (₹)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span>
                      <input 
                        type="number" 
                        min="100" max="5000"
                        value={formData.hourlyRate}
                        onChange={e => setFormData({...formData, hourlyRate: e.target.value})}
                        className={`w-full pl-10 pr-4 py-3 rounded-xl border ${errors.hourlyRate ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'} outline-none transition-all`}
                        placeholder="e.g. 500"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Between ₹100 and ₹5000</p>
                    {errors.hourlyRate && <p className="text-red-500 text-xs mt-1">{errors.hourlyRate}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Short Bio / Teaching Style</label>
                  <textarea 
                    rows="4"
                    maxLength="500"
                    value={formData.bio}
                    onChange={e => setFormData({...formData, bio: e.target.value})}
                    className={`w-full px-4 py-3 rounded-xl border ${errors.bio ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'} outline-none transition-all resize-none`}
                    placeholder="Tell us a bit about your teaching methodology..."
                  ></textarea>
                  <div className="flex justify-between mt-1">
                    {errors.bio ? <p className="text-red-500 text-xs">{errors.bio}</p> : <span></span>}
                    <span className="text-xs text-gray-500">{formData.bio.length}/500</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-between">
                <button 
                  onClick={() => setStep(1)}
                  className="flex items-center gap-2 text-gray-600 px-6 py-3 rounded-xl font-medium hover:bg-gray-100 transition-colors"
                >
                  <ChevronLeft size={18} /> Back
                </button>
                <button 
                  onClick={handleNextStep2}
                  className="flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-md"
                >
                  Next Step <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Documents */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-4">3. Verification Documents</h2>
              
              <div className="space-y-6">
                <p className="text-gray-600 text-sm">Upload these documents for verification. Max file size: 5MB per file. (UI Demo only)</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Aadhaar Upload */}
                  <div className="border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center hover:bg-blue-50 hover:border-blue-400 transition-colors cursor-pointer group">
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                      <UploadCloud size={24} />
                    </div>
                    <p className="font-semibold text-gray-800 mb-1">Aadhaar Card</p>
                    <p className="text-xs text-gray-500 mb-3">Front and Back (PDF/JPG)</p>
                    <button onClick={() => console.log('clicked')} className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 shadow-sm">Browse Files</button>
                  </div>

                  {/* Degree Upload */}
                  <div className="border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center hover:bg-blue-50 hover:border-blue-400 transition-colors cursor-pointer group">
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                      <UploadCloud size={24} />
                    </div>
                    <p className="font-semibold text-gray-800 mb-1">Highest Degree</p>
                    <p className="text-xs text-gray-500 mb-3">Certificate or Marksheet (PDF/JPG)</p>
                    <button onClick={() => console.log('clicked')} className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 shadow-sm">Browse Files</button>
                  </div>
                </div>

                {/* Experience Proof Upload */}
                <div className="border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center hover:bg-blue-50 hover:border-blue-400 transition-colors cursor-pointer group">
                  <div className="w-12 h-12 bg-gray-100 text-gray-500 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform group-hover:bg-blue-100 group-hover:text-blue-600">
                    <UploadCloud size={24} />
                  </div>
                  <p className="font-semibold text-gray-800 mb-1">Experience Proof <span className="text-gray-400 font-normal">(Optional)</span></p>
                  <p className="text-xs text-gray-500 mb-3">Relieving letter, offer letter, or payslip (PDF)</p>
                  <button onClick={() => console.log('clicked')} className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 shadow-sm">Browse Files</button>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-100">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={formData.termsAccepted}
                      onChange={(e) => setFormData({...formData, termsAccepted: e.target.checked})}
                      className="mt-1 w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-sm text-gray-700">I confirm that the information provided is accurate. I agree to TrueEd's <span className="text-blue-600 hover:underline">Terms of Service</span> and <span className="text-blue-600 hover:underline">Privacy Policy</span>.</span>
                      {errors.termsAccepted && <p className="text-red-500 text-xs mt-1">{errors.termsAccepted}</p>}
                    </div>
                  </label>
                </div>
              </div>

              <div className="mt-8 flex justify-between">
                <button 
                  onClick={() => setStep(2)}
                  className="flex items-center gap-2 text-gray-600 px-6 py-3 rounded-xl font-medium hover:bg-gray-100 transition-colors"
                >
                  <ChevronLeft size={18} /> Back
                </button>
                <button 
                  onClick={handleSubmit}
                  className="flex items-center gap-2 bg-green-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors shadow-md shadow-green-200"
                >
                  Submit Application <Check size={18} />
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default TeacherApply;
