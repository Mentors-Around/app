import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { tutors } from '../data/tutors';
import TutorCard from '../components/shared/TutorCard';

const dummyQuestions = [
  { id: 1, text: "What is the sum of angles in a triangle?", options: ["180 degrees", "360 degrees", "90 degrees", "270 degrees"], correctAnswerIndex: 0, studentAnswerIndex: 0 },
  { id: 2, text: "Which formula calculates the area of a circle?", options: ["πr²", "2πr", "πd", "½bh"], correctAnswerIndex: 0, studentAnswerIndex: 0 },
  { id: 3, text: "In a right-angled triangle, what does the Pythagorean theorem state?", options: ["a² + b² = c²", "a + b = c", "a² - b² = c²", "a² + b² = 2c"], correctAnswerIndex: 0, studentAnswerIndex: 0 },
  { id: 4, text: "What is the volume of a cylinder?", options: ["πr²h", "4/3πr³", "⅓πr²h", "2πrh"], correctAnswerIndex: 0, studentAnswerIndex: 0 },
  { id: 5, text: "Which shape has 4 equal sides and 4 right angles?", options: ["Square", "Rectangle", "Rhombus", "Trapezoid"], correctAnswerIndex: 0, studentAnswerIndex: 0 },
  { id: 6, text: "What is the perimeter of a rectangle?", options: ["2(l + w)", "l × w", "4s", "2l × 2w"], correctAnswerIndex: 0, studentAnswerIndex: 1 }, // WRONG
  { id: 7, text: "An angle that is greater than 90 degrees but less than 180 degrees is called:", options: ["Obtuse", "Acute", "Right", "Straight"], correctAnswerIndex: 0, studentAnswerIndex: 0 },
  { id: 8, text: "The point where the x-axis and y-axis intersect is called the:", options: ["Origin", "Vertex", "Midpoint", "Quadrant"], correctAnswerIndex: 0, studentAnswerIndex: 0 },
  { id: 9, text: "What is the interior angle sum of a pentagon?", options: ["540 degrees", "360 degrees", "720 degrees", "180 degrees"], correctAnswerIndex: 0, studentAnswerIndex: 1 }, // WRONG
  { id: 10, text: "If the radius of a circle is 5cm, what is its diameter?", options: ["10cm", "25cm", "15cm", "5π cm"], correctAnswerIndex: 0, studentAnswerIndex: 2 } // WRONG
];

const StudentTestResults = () => {
  useEffect(() => {
    document.title = 'Test Results — TrueEd';
    window.scrollTo(0, 0);
  }, []);

  const recommendedTeachers = tutors.filter(t => t.subject === 'Mathematics').slice(0, 2);

  return (
    <div className="max-w-5xl mx-auto pb-10">
      
      {/* Header / Score Banner */}
      <div className="bg-white rounded-brand-xl shadow-sm border border-slate-200 p-8 mb-8 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        
        <h1 className="font-sora text-3xl font-bold text-navy mb-2 relative z-10">Geometry Test Results</h1>
        <p className="text-muted font-medium mb-8 relative z-10">Oct 31, 2023</p>

        <div className="flex flex-col md:flex-row justify-center items-center gap-10 relative z-10">
          <div className="w-40 h-40 rounded-full border-8 border-success/20 flex flex-col items-center justify-center relative">
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="46" fill="transparent" stroke="currentColor" strokeWidth="8" className="text-success" strokeDasharray="289" strokeDashoffset={289 - (289 * 0.7)} />
            </svg>
            <span className="font-sora font-extrabold text-4xl text-navy">7<span className="text-2xl text-slate-400">/10</span></span>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Score</span>
          </div>
          
          <div className="text-left space-y-4">
            <div className="bg-success/10 border border-success/20 rounded-lg p-4 flex items-start gap-3 max-w-sm">
              <i className="fa-solid fa-trophy text-success mt-0.5 text-lg" />
              <div>
                <h4 className="font-bold text-success text-sm">Great Job!</h4>
                <p className="text-xs text-success/80 font-medium">You scored better than 65% of students in your city.</p>
              </div>
            </div>
            <div className="bg-error/10 border border-error/20 rounded-lg p-4 flex items-start gap-3 max-w-sm">
              <i className="fa-solid fa-triangle-exclamation text-error mt-0.5 text-lg" />
              <div>
                <h4 className="font-bold text-error text-sm">Weak Areas Identified</h4>
                <p className="text-xs text-error/80 font-medium">You struggled with Area and Perimeter formulas. Practice more!</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Answer Review */}
      <h2 className="font-sora text-xl font-bold text-navy mb-4">Detailed Review</h2>
      <div className="space-y-6 mb-12">
        {dummyQuestions.map((q, qIndex) => {
          const isCorrect = q.studentAnswerIndex === q.correctAnswerIndex;
          
          return (
            <div key={q.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <h3 className="font-semibold text-navy text-base">
                  <span className="text-slate-400 mr-2">{q.id}.</span>
                  {q.text}
                </h3>
                {isCorrect ? (
                  <span className="bg-green-50 text-success px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 flex-shrink-0 border border-green-200">
                    <i className="fa-solid fa-check" /> Correct
                  </span>
                ) : (
                  <span className="bg-red-50 text-error px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 flex-shrink-0 border border-red-200">
                    <i className="fa-solid fa-xmark" /> Incorrect
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-6">
                {q.options.map((opt, optIndex) => {
                  let optStyle = "border-slate-100 bg-slate-50 text-slate-500";
                  let icon = null;

                  if (optIndex === q.correctAnswerIndex) {
                    optStyle = "border-green-200 bg-green-50 text-success font-semibold shadow-sm";
                    icon = <i className="fa-solid fa-check text-success absolute right-4" />;
                  } else if (!isCorrect && optIndex === q.studentAnswerIndex) {
                    optStyle = "border-red-200 bg-red-50 text-error font-semibold shadow-sm";
                    icon = <i className="fa-solid fa-xmark text-error absolute right-4" />;
                  }

                  return (
                    <div key={optIndex} className={`relative p-3 rounded-lg border flex items-center gap-3 ${optStyle}`}>
                      <div className="w-5 h-5 rounded-full bg-white border border-current flex items-center justify-center text-[10px] font-bold">
                        {String.fromCharCode(65 + optIndex)}
                      </div>
                      <span className="text-sm">{opt}</span>
                      {icon}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Recommended Teachers */}
      <h2 className="font-sora text-xl font-bold text-navy mb-4 flex items-center gap-2">
        <i className="fa-solid fa-wand-magic-sparkles text-amber" /> Recommended Teachers to Improve
      </h2>
      <p className="text-slate-500 font-medium text-sm mb-6">These highly-rated teachers specialize in geometry and can help you master Area and Perimeter.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {recommendedTeachers.map(t => <TutorCard key={t.id} tutor={t} />)}
      </div>

    </div>
  );
};

export default StudentTestResults;
