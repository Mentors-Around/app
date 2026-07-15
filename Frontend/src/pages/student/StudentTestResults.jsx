import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Trophy, AlertTriangle, Check, X, ArrowLeft, BookOpen, Compass } from 'lucide-react';
import testService from '@/services/test.service';
import classroomService from '@/services/classroom.service';
import Spinner from '@/components/shared/Spinner';
import { formatDate } from '@/utils/date.util';

const StudentTestResults = () => {
  const { testId } = useParams();
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState(null);
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    document.title = 'Test Results — TrueEd';
    window.scrollTo(0, 0);
    loadResults();
  }, [testId]);

  const loadResults = async () => {
    setLoading(true);
    try {
      const { data } = await testService.getResults(testId);
      const payload = data?.data ?? data;
      setResults(payload);

      // Fetch recommended classrooms based on the test's subject
      if (payload?.subject) {
        try {
          const recRes = await classroomService.discover({
            subject: payload.subject,
            limit: 3,
          });
          const recPayload = recRes.data?.data ?? recRes.data ?? [];
          // If we got paginated structure vs array
          setRecommendations(recPayload.items ?? recPayload.docs ?? recPayload ?? []);
        } catch (_) {
          // Silent catch for recommendations list
        }
      }
    } catch (err) {
      toast.error(err?.message || 'Could not load test results');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!results) {
    return (
      <div className="text-center py-20 bg-white border border-slate-200 rounded-xl">
        <p className="text-slate-500 font-semibold mb-4">No results found for this test.</p>
        <Link to="/student/tests" className="px-4 py-2 bg-navy text-white rounded-xl font-bold text-sm">
          Back to Tests
        </Link>
      </div>
    );
  }

  const scorePercentage = Math.round((results.score / results.totalQuestions) * 100);

  return (
    <div className="font-inter max-w-5xl mx-auto pb-10">
      {/* Back Button */}
      <Link to="/student/tests" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-navy mb-6 transition">
        <ArrowLeft size={16} /> Back to Monthly Tests
      </Link>

      {/* Score Banner */}
      <div className="bg-white rounded-2xl shadow-brand-sm border border-slate-100 p-8 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-center md:text-left flex-1">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky/10 text-sky uppercase tracking-wide mb-2 inline-block">
              {results.subject}
            </span>
            <h1 className="font-sora text-2xl md:text-3xl font-extrabold text-navy leading-tight">
              {results.title}
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Submitted on {formatDate(results.submittedAt)}
            </p>
          </div>

          <div className="flex items-center gap-10 flex-col sm:flex-row shrink-0">
            {/* Score Ring */}
            <div className="w-36 h-36 rounded-full border-[6px] border-slate-100 flex flex-col items-center justify-center relative">
              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="47"
                  fill="transparent"
                  stroke={scorePercentage >= 80 ? '#10b981' : scorePercentage >= 60 ? '#f59e0b' : '#ef4444'}
                  strokeWidth="6"
                  strokeDasharray="295"
                  strokeDashoffset={295 - (295 * scorePercentage) / 100}
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <span className="font-sora font-extrabold text-3xl text-navy">
                {results.score}
                <span className="text-lg text-slate-400 font-semibold">/{results.totalQuestions}</span>
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                Score
              </span>
            </div>

            <div className="max-w-xs space-y-3">
              {scorePercentage >= 80 ? (
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-start gap-2.5">
                  <Trophy className="text-emerald-600 mt-0.5 shrink-0" size={18} />
                  <div>
                    <h4 className="font-bold text-emerald-800 text-xs">Outstanding Work!</h4>
                    <p className="text-[11px] text-emerald-600 font-medium mt-0.5">
                      You showed excellent command of the concepts. Keep it up!
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-start gap-2.5">
                  <AlertTriangle className="text-amber mt-0.5 shrink-0" size={18} />
                  <div>
                    <h4 className="font-bold text-amber-800 text-xs">Areas to Practice</h4>
                    <p className="text-[11px] text-amber-600 font-medium mt-0.5">
                      Review the concepts on which you answered incorrectly. Practice makes perfect!
                    </p>
                  </div>
                </div>
              )}

              {/* Weak Topics */}
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                <h4 className="font-bold text-navy text-xs mb-2">Weak Areas:</h4>
                <div className="flex flex-wrap gap-1.5">
                  {results.weakTopics?.length > 0 ? (
                    results.weakTopics.map((topic, idx) => (
                      <span key={idx} className="bg-red-50 border border-red-100 text-error px-2 py-0.5 rounded text-[10px] font-semibold">
                        {topic}
                      </span>
                    ))
                  ) : (
                    <span className="text-[11px] font-medium text-emerald-600">None! You answered everything correctly.</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Answer review list */}
      <h2 className="font-sora text-lg font-bold text-navy mb-4">Detailed Question Review</h2>
      <div className="space-y-4 mb-10">
        {results.review?.map((q, idx) => {
          const isCorrect = q.isCorrect;
          return (
            <div key={q.questionId || idx} className="bg-white rounded-xl shadow-brand-sm border border-slate-100 p-5 md:p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <h3 className="font-semibold text-navy text-sm md:text-base leading-snug">
                  <span className="text-slate-400 mr-2 font-bold">{idx + 1}.</span>
                  {q.text}
                </h3>
                {isCorrect ? (
                  <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 flex-shrink-0">
                    <Check size={12} /> Correct
                  </span>
                ) : (
                  <span className="bg-red-50 text-error border border-red-100 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 flex-shrink-0">
                    <X size={12} /> Incorrect
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-0 md:pl-5">
                {q.options.map((opt, optIndex) => {
                  let optStyle = "border-slate-100 bg-slate-50/50 text-slate-500";
                  let statusIcon = null;

                  if (optIndex === q.correctAnswerIndex) {
                    optStyle = "border-emerald-200 bg-emerald-50/70 text-emerald-600 font-bold shadow-brand-sm";
                    statusIcon = <Check size={16} className="text-emerald-600 absolute right-4" />;
                  } else if (!isCorrect && optIndex === q.selectedIndex) {
                    optStyle = "border-red-200 bg-red-50 text-error font-bold shadow-brand-sm";
                    statusIcon = <X size={16} className="text-error absolute right-4" />;
                  }

                  return (
                    <div key={optIndex} className={`relative p-3 rounded-xl border flex items-center gap-3 transition-colors ${optStyle}`}>
                      <div className="w-5 h-5 rounded-full bg-white border border-current flex items-center justify-center text-[10px] font-bold shrink-0">
                        {String.fromCharCode(65 + optIndex)}
                      </div>
                      <span className="text-xs md:text-sm">{opt}</span>
                      {statusIcon}
                    </div>
                  );
                })}
              </div>

              {q.topic && (
                <div className="mt-3.5 pl-0 md:pl-5 flex items-center gap-1 text-[11px] text-slate-400 font-semibold">
                  <span>Topic:</span>
                  <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600">{q.topic}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div>
          <h2 className="font-sora text-lg font-bold text-navy mb-4 flex items-center gap-1.5">
            <BookOpen size={20} className="text-amber" /> Recommended Classrooms in {results.subject}
          </h2>
          <p className="text-xs text-muted mb-6">These highly rated classrooms specialize in the same topic and can help you clear up your weak concepts.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recommendations.map((c) => (
              <div key={c._id} className="bg-white rounded-xl border border-slate-100 p-5 shadow-brand-sm hover:shadow-brand hover:-translate-y-0.5 transition flex flex-col justify-between">
                <div>
                  <div className="w-full h-32 bg-slate-50 rounded-lg overflow-hidden border border-slate-100 flex items-center justify-center mb-4">
                    {c.thumbnailUrl ? (
                      <img src={c.thumbnailUrl} alt={c.title} className="w-full h-full object-cover" />
                    ) : (
                      <Compass className="text-slate-300" size={36} />
                    )}
                  </div>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-sky/10 text-sky uppercase tracking-wide">
                    {c.subject}
                  </span>
                  <h4 className="font-sora font-bold text-navy text-sm mt-1.5 line-clamp-1">
                    {c.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1">
                    by {c.teacherId?.name || 'Verified Teacher'}
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between">
                  <span className="text-xs font-bold text-navy">
                    {c.mode === 'online' ? 'Online' : 'Offline'}
                  </span>
                  <Link to={`/student/discover`} className="text-xs font-bold text-sky hover:underline flex items-center gap-0.5">
                    Explore <BookOpen size={12} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentTestResults;
