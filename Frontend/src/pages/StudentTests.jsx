import { useEffect } from 'react';
import { Link } from 'react-router-dom';

const pastTests = [
  { id: 'algebra-sep', subject: 'Mathematics', topic: 'Algebra', date: 'Sep 30, 2023', score: 8, total: 10, weakAreas: ['Quadratic Equations'] },
  { id: 'mechanics-aug', subject: 'Physics', topic: 'Mechanics', date: 'Aug 31, 2023', score: 6, total: 10, weakAreas: ['Work, Energy and Power', 'Rotational Motion'] }
];

const StudentTests = () => {
  useEffect(() => {
    document.title = 'Monthly Tests — TrueEd';
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="max-w-5xl mx-auto pb-10">
      <div className="mb-10">
        <h1 className="font-sora text-3xl font-bold text-navy mb-2">Monthly Subject Test</h1>
        <p className="text-muted text-base">Tests are based on what you studied this month. Find your weak points and improve.</p>
      </div>

      <div className="mb-12">
        <h2 className="font-sora text-xl font-bold text-navy mb-4">Upcoming Test</h2>
        <div className="bg-gradient-to-r from-navy to-sky text-white rounded-brand-xl p-8 relative overflow-hidden shadow-brand">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="inline-block bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4 border border-white/20">
                Current Month
              </div>
              <h3 className="font-sora text-3xl font-extrabold mb-1">Mathematics: Geometry</h3>
              <p className="text-white/80 font-medium mb-6">Test your understanding of circles, triangles, and coordinate geometry.</p>
              
              <div className="flex flex-wrap gap-6 text-sm font-semibold">
                <div className="flex items-center gap-2"><i className="fa-regular fa-calendar" /> Oct 31, 2023</div>
                <div className="flex items-center gap-2"><i className="fa-solid fa-list-ol" /> 10 Questions</div>
                <div className="flex items-center gap-2"><i className="fa-regular fa-clock" /> 30 Minutes</div>
              </div>
            </div>
            
            <Link 
              to="/student/tests/geometry-oct" 
              className="py-4 px-8 bg-white text-navy font-sora font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all w-full md:w-auto text-center"
            >
              Take Test Now
            </Link>
          </div>
        </div>
      </div>

      <div>
        <h2 className="font-sora text-xl font-bold text-navy mb-4">Past Test Results</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pastTests.map(test => (
            <div key={test.id} className="bg-white rounded-brand shadow-sm border border-slate-200 p-6 flex flex-col hover:-translate-y-1 hover:shadow-brand transition-all">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-sora text-lg font-bold text-navy mb-1">{test.subject}: {test.topic}</h3>
                  <p className="text-sm font-medium text-slate-500">{test.date}</p>
                </div>
                <div className={`w-14 h-14 rounded-full flex items-center justify-center font-sora font-extrabold text-xl border-4 ${
                  test.score >= 8 ? 'bg-green-50 text-success border-success/20' : 
                  test.score >= 6 ? 'bg-amber-50 text-amber-600 border-amber-500/20' : 
                  'bg-red-50 text-error border-error/20'
                }`}>
                  {test.score}
                </div>
              </div>
              
              <div className="mb-6 flex-1">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Weak Areas Identified</h4>
                <div className="flex flex-wrap gap-2">
                  {test.weakAreas.map((area, idx) => (
                    <span key={idx} className="bg-red-50 border border-red-100 text-error px-2.5 py-1 rounded-md text-xs font-semibold">
                      {area}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <Link to={`/student/tests/${test.id}/results`} className="w-full block text-center py-2.5 bg-slate-50 text-navy font-bold text-sm border border-slate-200 rounded-lg hover:bg-slate-100 transition">
                  View Detailed Results
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudentTests;
