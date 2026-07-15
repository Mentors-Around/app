import { Link, Outlet } from 'react-router-dom';
import { Check } from 'lucide-react';
import Logo from '@/components/shared/Logo';

const FEATURES = [
  { title: 'Verified Teachers', desc: 'Every teacher undergoes rigorous KYC verification.' },
  { title: 'Secure Payments', desc: 'Bank-level security for all your transactions.' },
  { title: 'Flexible Learning', desc: 'Learn at your own pace from anywhere.' },
  { title: 'Trusted by Students', desc: 'Join thousands of students learning every day.' },
];

const AuthLayout = () => (
  <div className="min-h-screen bg-cream flex font-inter">
    <div className="hidden lg:flex flex-col justify-between w-[45%] max-w-[600px] bg-navy text-white p-12 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-sky-500/10 rounded-full translate-y-1/3 -translate-x-1/4" />

      <div className="relative z-10">
        <Link to="/" className="flex items-center gap-2 mb-16">
          <Logo variant="dark" className="h-14 w-auto" />
        </Link>

        <h1 className="font-sora text-4xl font-bold leading-tight mb-4">
          Learn from verified teachers across India.
        </h1>
        <p className="text-sky-200 text-lg font-medium mb-12 max-w-md">
          Join the platform that connects ambitious students with the best educators.
        </p>

        <ul className="space-y-6">
          {FEATURES.map((feature) => (
            <li key={feature.title} className="flex items-start gap-4">
              <div className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 mt-1">
                <Check size={12} />
              </div>
              <div>
                <h3 className="font-bold text-white">{feature.title}</h3>
                <p className="text-sky-200/80 text-sm font-medium">{feature.desc}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="relative z-10">
        <p className="text-sky-200/60 text-sm font-medium">
          © {new Date().getFullYear()} TrueEd. All rights reserved.
        </p>
      </div>
    </div>

    <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 bg-slate-50/50">
      <div className="w-full max-w-[480px]">
        <div className="lg:hidden flex items-center justify-center mb-10">
          <Logo variant="dark" className="h-14 w-auto" />
        </div>

        <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 sm:p-10 border border-slate-100 relative">
          <Outlet />
        </div>
      </div>
    </div>
  </div>
);

export default AuthLayout;
