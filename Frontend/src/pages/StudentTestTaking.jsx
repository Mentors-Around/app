import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const dummyQuestions = [
  { id: 1, text: "What is the sum of angles in a triangle?", options: ["180 degrees", "360 degrees", "90 degrees", "270 degrees"] },
  { id: 2, text: "Which formula calculates the area of a circle?", options: ["πr²", "2πr", "πd", "½bh"] },
  { id: 3, text: "In a right-angled triangle, what does the Pythagorean theorem state?", options: ["a² + b² = c²", "a + b = c", "a² - b² = c²", "a² + b² = 2c"] },
  { id: 4, text: "What is the volume of a cylinder?", options: ["πr²h", "4/3πr³", "⅓πr²h", "2πrh"] },
  { id: 5, text: "Which shape has 4 equal sides and 4 right angles?", options: ["Square", "Rectangle", "Rhombus", "Trapezoid"] },
  { id: 6, text: "What is the perimeter of a rectangle?", options: ["2(l + w)", "l × w", "4s", "2l × 2w"] },
  { id: 7, text: "An angle that is greater than 90 degrees but less than 180 degrees is called:", options: ["Obtuse", "Acute", "Right", "Straight"] },
  { id: 8, text: "The point where the x-axis and y-axis intersect is called the:", options: ["Origin", "Vertex", "Midpoint", "Quadrant"] },
  { id: 9, text: "What is the interior angle sum of a pentagon?", options: ["540 degrees", "360 degrees", "720 degrees", "180 degrees"] },
  { id: 10, text: "If the radius of a circle is 5cm, what is its diameter?", options: ["10cm", "25cm", "15cm", "5π cm"] }
];

const StudentTestTaking = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 minutes in seconds

  useEffect(() => {
    document.title = 'Taking Test — TrueEd';
    window.scrollTo(0, 0);

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleOptionSelect = (optIndex) => {
    setAnswers(prev => ({ ...prev, [currentQIndex]: optIndex }));
  };

  const handleNext = () => {
    if (currentQIndex < dummyQuestions.length - 1) {
      setCurrentQIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentQIndex > 0) {
      setCurrentQIndex(prev => prev - 1);
    }
  };

  const handleSubmit = () => {
    // Navigate to results page
    navigate(`/student/tests/${testId}/results`);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const currentQ = dummyQuestions[currentQIndex];
  const progressPercent = ((currentQIndex + 1) / dummyQuestions.length) * 100;
  const isLastQuestion = currentQIndex === dummyQuestions.length - 1;

  return (
    <div className="max-w-3xl mx-auto pb-10">
      
      {/* Header & Timer */}
      <div className="bg-white sticky top-16 z-30 pt-6 pb-4 border-b border-slate-200 mb-8 px-2 md:px-0">
        <div className="flex justify-between items-center mb-4">
          <h1 className="font-sora text-xl font-bold text-navy">Geometry Monthly Test</h1>
          <div className="bg-error/10 text-error border border-error/20 px-4 py-2 rounded-lg font-sora font-bold flex items-center gap-2">
            <i className="fa-regular fa-clock" /> {formatTime(timeLeft)}
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="flex items-center gap-4">
          <span className="text-sm font-bold text-slate-500 whitespace-nowrap">Q {currentQIndex + 1} of {dummyQuestions.length}</span>
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-navy transition-all duration-300 rounded-full" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white rounded-brand-xl shadow-sm border border-slate-200 p-6 md:p-10 mb-8 mx-2 md:mx-0">
        <h2 className="font-sora text-xl md:text-2xl font-semibold text-navy mb-8 leading-snug">
          {currentQ.id}. {currentQ.text}
        </h2>

        <div className="space-y-4">
          {currentQ.options.map((opt, idx) => {
            const isSelected = answers[currentQIndex] === idx;
            return (
              <button
                key={idx}
                onClick={() => handleOptionSelect(idx)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-4 group ${
                  isSelected 
                    ? 'border-navy bg-navy/5 shadow-sm' 
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                  isSelected ? 'border-navy' : 'border-slate-300 group-hover:border-slate-400'
                }`}>
                  {isSelected && <div className="w-3 h-3 rounded-full bg-navy" />}
                </div>
                <span className={`text-base font-medium ${isSelected ? 'text-navy font-semibold' : 'text-slate-600'}`}>
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
          className={`py-3 px-6 rounded-lg font-bold transition flex items-center gap-2 ${
            currentQIndex === 0 ? 'opacity-50 cursor-not-allowed bg-slate-100 text-slate-400' : 'bg-white border border-slate-200 text-navy hover:bg-slate-50'
          }`}
        >
          <i className="fa-solid fa-arrow-left" /> Previous
        </button>

        {isLastQuestion ? (
          <button
            onClick={handleSubmit}
            className="py-3 px-8 bg-success text-white rounded-lg font-sora font-bold hover:shadow-lg hover:-translate-y-0.5 transition shadow-md flex items-center gap-2"
          >
            Submit Test <i className="fa-solid fa-check" />
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="py-3 px-8 bg-navy text-white rounded-lg font-sora font-bold hover:bg-navy-light hover:-translate-y-0.5 transition shadow-md flex items-center gap-2"
          >
            Next <i className="fa-solid fa-arrow-right" />
          </button>
        )}
      </div>

    </div>
  );
};

export default StudentTestTaking;
