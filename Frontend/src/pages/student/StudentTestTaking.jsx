import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Clock, ArrowLeft, ArrowRight, Check, AlertTriangle } from 'lucide-react';
import testService from '@/services/test.service';
import Spinner from '@/components/shared/Spinner';

const StudentTestTaking = () => {
  const { testId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [test, setTest] = useState(null);
  const [attemptId, setAttemptId] = useState(null);

  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { [questionId]: selectedIndex }
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const timerRef = useRef(null);

  useEffect(() => {
    document.title = 'Taking Test — TrueEd';
    window.scrollTo(0, 0);
    startOrResumeAttempt();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [testId]);

  const startOrResumeAttempt = async () => {
    try {
      const { data } = await testService.startAttempt(testId);
      const payload = data?.data ?? data;
      setTest(payload.test);
      setAttemptId(payload.attemptId);

      // Restore previously saved answers from localStorage if any, scoped by attemptId
      const localKey = `trueed_answers_${payload.attemptId}`;
      const savedAnswers = localStorage.getItem(localKey);
      if (savedAnswers) {
        try {
          setAnswers(JSON.parse(savedAnswers));
        } catch (_) {}
      }

      // Calculate time remaining based on startedAt
      const startedAtTime = new Date(payload.startedAt).getTime();
      const now = new Date().getTime();
      const elapsedSeconds = Math.floor((now - startedAtTime) / 1000);
      const totalSeconds = payload.test.durationMinutes * 60;
      const remainingSeconds = Math.max(totalSeconds - elapsedSeconds, 0);

      setTimeLeft(remainingSeconds);

      if (remainingSeconds <= 0) {
        toast.error('Time has already expired. Submitting test...');
        handleAutoSubmit(payload.test.questions, JSON.parse(savedAnswers || '{}'));
      } else {
        startTimer();
      }
    } catch (err) {
      toast.error(err?.message || 'Could not start test');
      navigate('/student/tests');
    } finally {
      setLoading(false);
    }
  };

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          toast.error('Time has expired! Submitting test automatically...');
          // Trigger auto-submit with current state
          setAnswers((currAnswers) => {
            handleAutoSubmit(null, currAnswers);
            return currAnswers;
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Persist answers to localstorage when they change
  const handleOptionSelect = (qId, optIdx) => {
    const newAnswers = { ...answers, [qId]: optIdx };
    setAnswers(newAnswers);
    if (attemptId) {
      localStorage.setItem(`trueed_answers_${attemptId}`, JSON.stringify(newAnswers));
    }
  };

  const handleNext = () => {
    if (currentQIndex < test.questions.length - 1) {
      setCurrentQIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentQIndex > 0) {
      setCurrentQIndex((prev) => prev - 1);
    }
  };

  const handleAutoSubmit = async (questionsList = null, currentAnswers = null) => {
    if (submitting) return;
    setSubmitting(true);

    const questions = questionsList || test?.questions || [];
    const answersData = currentAnswers || answers;

    const payloadAnswers = questions.map((q) => ({
      questionId: q._id,
      selectedIndex: answersData[q._id] !== undefined ? answersData[q._id] : null,
    }));

    try {
      await testService.submitAttempt(testId, {
        answers: payloadAnswers,
        autoSubmit: true,
      });
      // Clear localStorage on successful submit
      if (attemptId) localStorage.removeItem(`trueed_answers_${attemptId}`);
      toast.success('Test submitted successfully!');
      navigate(`/student/tests/${testId}/results`);
    } catch (err) {
      toast.error(err?.message || 'Could not submit test');
    } finally {
      setSubmitting(false);
    }
  };

  const handleManualSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setShowConfirmModal(false);

    const payloadAnswers = test.questions.map((q) => ({
      questionId: q._id,
      selectedIndex: answers[q._id] !== undefined ? answers[q._id] : null,
    }));

    try {
      await testService.submitAttempt(testId, {
        answers: payloadAnswers,
        autoSubmit: false,
      });
      if (attemptId) localStorage.removeItem(`trueed_answers_${attemptId}`);
      toast.success('Test submitted successfully!');
      navigate(`/student/tests/${testId}/results`);
    } catch (err) {
      toast.error(err?.message || 'Could not submit test');
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!test) return null;

  const currentQ = test.questions[currentQIndex];
  const progressPercent = ((currentQIndex + 1) / test.questions.length) * 100;
  const isLastQuestion = currentQIndex === test.questions.length - 1;
  const unansweredCount = test.questions.filter((q) => answers[q._id] === undefined).length;

  return (
    <div className="font-inter max-w-3xl mx-auto pb-10">
      {/* Header & Timer */}
      <div className="bg-slate-50 sticky top-16 z-30 pt-4 pb-4 border-b border-slate-200 mb-8 px-2 md:px-0">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="font-sora text-xl font-bold text-navy">{test.title}</h1>
            <p className="text-xs text-slate-500 font-medium">Classroom: {test.subject}</p>
          </div>
          <div className="bg-error/10 text-error border border-error/20 px-4 py-2 rounded-lg font-sora font-bold flex items-center gap-2">
            <Clock size={16} /> {formatTime(timeLeft)}
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="flex items-center gap-4">
          <span className="text-sm font-bold text-slate-500 whitespace-nowrap">
            Q {currentQIndex + 1} of {test.questions.length}
          </span>
          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-navy transition-all duration-300 rounded-full" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white rounded-2xl shadow-brand-sm border border-slate-100 p-6 md:p-10 mb-8 mx-2 md:mx-0">
        <div className="flex items-center justify-between mb-6">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Topic: {currentQ.topic || 'General'}
          </span>
          {answers[currentQ._id] !== undefined && (
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase">
              Answered
            </span>
          )}
        </div>

        <h2 className="font-sora text-lg md:text-xl font-bold text-navy mb-8 leading-snug">
          {currentQIndex + 1}. {currentQ.text}
        </h2>

        <div className="space-y-3.5">
          {currentQ.options.map((opt, idx) => {
            const isSelected = answers[currentQ._id] === idx;
            return (
              <button
                key={idx}
                onClick={() => handleOptionSelect(currentQ._id, idx)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-4 group ${
                  isSelected 
                    ? 'border-navy bg-navy/5 shadow-brand-sm' 
                    : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50/55'
                }`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                  isSelected ? 'border-navy bg-navy text-white' : 'border-slate-300 group-hover:border-slate-400'
                }`}>
                  {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <span className={`text-sm font-medium ${isSelected ? 'text-navy font-bold' : 'text-slate-600'}`}>
                  {opt}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex justify-between items-center px-2 md:px-0">
        <button
          onClick={handlePrev}
          disabled={currentQIndex === 0}
          className={`py-3 px-5 rounded-xl font-bold transition flex items-center gap-1.5 border text-xs ${
            currentQIndex === 0 
              ? 'opacity-50 cursor-not-allowed bg-slate-100 border-slate-200 text-slate-400' 
              : 'bg-white border-slate-200 text-navy hover:bg-slate-50 shadow-sm'
          }`}
        >
          <ArrowLeft size={16} /> Previous
        </button>

        {isLastQuestion ? (
          <button
            onClick={() => setShowConfirmModal(true)}
            className="py-3 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition flex items-center gap-1.5 text-xs"
            disabled={submitting}
          >
            Submit Test <Check size={16} />
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="py-3 px-6 bg-navy hover:bg-navy-hover text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition flex items-center gap-1.5 text-xs"
          >
            Next <ArrowRight size={16} />
          </button>
        )}
      </div>

      {/* Submit Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-navy/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-16 h-16 bg-amber/10 rounded-full flex items-center justify-center mx-auto mb-5">
              <AlertTriangle className="text-amber animate-pulse" size={26} />
            </div>
            <h3 className="font-sora text-xl font-bold text-navy mb-2">Submit your test?</h3>
            {unansweredCount > 0 ? (
              <p className="text-slate-500 text-sm mb-8">
                You have <strong className="text-error">{unansweredCount} unanswered questions</strong>. Once submitted, you cannot change your answers.
              </p>
            ) : (
              <p className="text-slate-500 text-sm mb-8">
                You have answered all questions. Are you sure you want to finish the test?
              </p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3 px-4 border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition"
              >
                Back to Test
              </button>
              <button
                onClick={handleManualSubmit}
                className="flex-1 py-3 px-4 bg-navy hover:bg-navy-hover text-white rounded-xl text-sm font-bold transition shadow-lg flex items-center justify-center gap-2"
                disabled={submitting}
              >
                {submitting ? <Spinner size="sm" /> : 'Yes, Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentTestTaking;
