import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/landing/Navbar';

const NotFound = () => {
  useEffect(() => { document.title = 'Page Not Found — TrueEd'; }, []);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-6 pt-24 text-center">
        <div>
          <div className="text-8xl mb-6 inline-block animate-bounce">🎓</div>
          <h1 className="font-sora font-extrabold text-7xl text-navy mb-4">404</h1>
          <h2 className="font-sora font-bold text-2xl text-navy mb-3">Oops! Page not found</h2>
          <p className="text-slate-500 font-medium mb-8 max-w-md mx-auto">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/" className="w-full sm:w-auto px-8 py-3 bg-slate-200 text-navy font-bold rounded-xl hover:bg-slate-300 transition">
              Go to Home
            </Link>
            <Link to="/student/discover" className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-navy to-blue-600 text-white font-bold rounded-xl hover:shadow-brand transition">
              Find a Teacher
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
