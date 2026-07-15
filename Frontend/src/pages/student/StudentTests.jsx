import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Calendar, ClipboardList, Clock, AlertTriangle, ChevronRight, Award } from 'lucide-react';
import testService from '@/services/test.service';
import Spinner from '@/components/shared/Spinner';
import { formatDate } from '@/utils/date.util';

const StudentTests = () => {
  const [tests, setTests] = useState({ upcoming: [], past: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'Monthly Tests — TrueEd';
    window.scrollTo(0, 0);
    loadTests();
  }, []);

  const loadTests = async () => {
    setLoading(true);
    try {
      const { data } = await testService.getStudentTests();
      const payload = data?.data ?? data;
      setTests(payload || { upcoming: [], past: [] });
    } catch (err) {
      toast.error(err?.message || 'Could not load tests');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-inter max-w-5xl mx-auto pb-10">
      <div className="mb-10">
        <h1 className="font-sora text-3xl font-bold text-navy mb-2">Monthly Subject Tests</h1>
        <p className="text-muted text-base">
          Tests are based on what you studied this month in your enrolled classrooms. Evaluate your progress and identify weak topics.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          {/* Upcoming Tests Section */}
          <div className="mb-12">
            <h2 className="font-sora text-xl font-bold text-navy mb-4">Available Tests</h2>
            {tests.upcoming.length === 0 ? (
              <div className="bg-slate-50 border border-slate-200 border-dashed rounded-brand-xl p-8 text-center">
                <ClipboardList className="mx-auto text-slate-300 mb-2" size={40} />
                <p className="text-sm font-semibold text-slate-500">No tests available right now.</p>
                <p className="text-xs text-muted mt-1">Tests are published by classroom teachers toward the end of each month.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {tests.upcoming.map((test) => (
                  <div
                    key={test.testId}
                    className="bg-gradient-to-r from-navy to-sky text-white rounded-brand-xl p-8 relative overflow-hidden shadow-brand"
                  >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
                    
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                      <div className="flex-1">
                        <div className="inline-block bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4 border border-white/20">
                          {test.subject}
                        </div>
                        <h3 className="font-sora text-2xl font-extrabold mb-1">
                          {test.title}
                        </h3>
                        <p className="text-white/80 font-medium text-sm mb-6">
                          Classroom: {test.classroomTitle} &middot; Session: {test.monthKey}
                        </p>
                        
                        <div className="flex flex-wrap gap-6 text-sm font-semibold">
                          <div className="flex items-center gap-2">
                            <Clock size={16} /> {test.durationMinutes} Minutes
                          </div>
                          <div className="flex items-center gap-2">
                            <ClipboardList size={16} /> {test.totalQuestions} Questions
                          </div>
                          {test.availableTo && (
                            <div className="flex items-center gap-2">
                              <Calendar size={16} /> Open until {formatDate(test.availableTo)}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <Link 
                        to={`/student/tests/${test.testId}`} 
                        className="py-3.5 px-8 bg-white text-navy font-sora font-extrabold rounded-xl shadow-lg hover:shadow-xl hover:scale-103 transition-all w-full md:w-auto text-center whitespace-nowrap"
                      >
                        Take Test Now
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Past Tests Section */}
          <div>
            <h2 className="font-sora text-xl font-bold text-navy mb-4">Past Test Results</h2>
            {tests.past.length === 0 ? (
              <div className="bg-white rounded-brand border border-slate-200 p-10 text-center">
                <Award className="mx-auto text-slate-300 mb-2" size={40} />
                <p className="text-sm font-semibold text-slate-500">No past test results found.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {tests.past.map((test) => {
                  const percentage = Math.round((test.score / test.totalQuestions) * 100);
                  let scoreStyle = 'bg-red-50 text-error border-error/20';
                  if (percentage >= 80) scoreStyle = 'bg-emerald-50 text-emerald-600 border-emerald-500/20';
                  else if (percentage >= 60) scoreStyle = 'bg-amber-50 text-amber-600 border-amber-500/20';

                  return (
                    <div
                      key={test.testId}
                      className="bg-white rounded-brand shadow-brand-sm border border-slate-100 p-6 flex flex-col justify-between hover:shadow-brand hover:-translate-y-0.5 transition-all"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky/10 text-sky uppercase tracking-wide mb-1 inline-block">
                              {test.subject}
                            </span>
                            <h3 className="font-sora text-lg font-bold text-navy">
                              {test.title}
                            </h3>
                            <p className="text-xs text-muted mt-0.5">
                              {test.classroomTitle} &middot; {formatDate(test.submittedAt)}
                            </p>
                          </div>
                          
                          <div className={`w-14 h-14 rounded-full flex flex-col items-center justify-center font-sora font-extrabold border-2 shrink-0 ${scoreStyle}`}>
                            <span className="text-base leading-none">{test.score}</span>
                            <span className="text-[9px] text-slate-400 font-semibold border-t border-slate-200 mt-1 pt-0.5">/{test.totalQuestions}</span>
                          </div>
                        </div>

                        <div className="mb-6">
                          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                            <AlertTriangle size={12} className="text-amber" /> Weak Areas Identified
                          </h4>
                          <div className="flex flex-wrap gap-1.5">
                            {test.weakTopics?.length > 0 ? (
                              test.weakTopics.map((topic, idx) => (
                                <span
                                  key={idx}
                                  className="bg-red-50 border border-red-100 text-error px-2.5 py-0.5 rounded text-[10px] font-semibold"
                                >
                                  {topic}
                                </span>
                              ))
                            ) : (
                              <span className="text-[11px] font-semibold text-emerald-600">
                                None! You nailed this test.
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-100">
                        <Link
                          to={`/student/tests/${test.testId}/results`}
                          className="w-full text-center py-2.5 bg-slate-50 text-navy hover:bg-slate-100 font-bold text-xs border border-slate-200 rounded-xl transition flex items-center justify-center gap-1"
                        >
                          View Detailed Results <ChevronRight size={14} />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default StudentTests;
