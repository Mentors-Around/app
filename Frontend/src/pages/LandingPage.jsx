import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Hero from '../components/landing/Hero';
import HowItWorks from '../components/landing/HowItWorks';
import ForWhom from '../components/landing/ForWhom';
import RefundPolicy from '../components/landing/RefundPolicy';
import TrustStats from '../components/landing/TrustStats';
import CTASection from '../components/landing/CTASection';

import SubjectCarousel from '../components/landing/SubjectCarousel';

const LandingPage = () => {
  useEffect(() => { document.title = 'TrueEd — Find Your Perfect Tutor'; }, []);

  return (
    <>
      <Hero />
      <SubjectCarousel />
      <HowItWorks />
      <ForWhom />
      <RefundPolicy />
      <TrustStats />
      <CTASection />
    </>
  );
};
export default LandingPage;
