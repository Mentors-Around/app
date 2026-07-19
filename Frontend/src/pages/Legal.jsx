import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const Legal = () => {
  useEffect(() => { document.title = 'Privacy & Terms — TrueEd'; }, []);
  const { pathname } = useLocation();
  const isPrivacy = pathname === '/privacy';

  const title = isPrivacy ? 'Privacy Policy' : 'Terms of Service';
  const date = `June 4, ${new Date().getFullYear()}`;

  const privacySections = [
    { title: 'Data Collection', text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip.' },
    { title: 'How We Use Your Data', text: 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.' },
    { title: 'Cookies', text: 'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.' },
    { title: 'Third Party Services', text: 'Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est.' },
    { title: 'Contact Us', text: 'If you have any questions about this Privacy Policy, please contact us at privacy@trueed.in.' },
  ];

  const termsSections = [
    { title: 'Acceptance of Terms', text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip.' },
    { title: 'User Responsibilities', text: 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.' },
    { title: 'Teacher Responsibilities', text: 'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.' },
    { title: 'Payment Terms', text: 'Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est.' },
    { title: 'Termination', text: 'At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident.' },
    { title: 'Contact', text: 'If you have any questions about these Terms, please contact us at legal@trueed.in.' },
  ];

  const sections = isPrivacy ? privacySections : termsSections;

  return (
    <div className="max-w-[800px] mx-auto py-16 px-6">
      <div className="mb-12 border-b border-slate-200 pb-8">
        <h1 className="font-sora text-3xl font-bold text-navy mb-2">{title}</h1>
        <p className="text-sm text-muted">Last Updated: {date}</p>
      </div>

      <div className="space-y-10">
        {sections.map(sec => (
          <section key={sec.title}>
            <h2 className="font-sora text-xl font-bold text-navy mb-4">{sec.title}</h2>
            <p className="text-slate-600 text-sm leading-relaxed">{sec.text}</p>
          </section>
        ))}
      </div>
    </div>
  );
};
export default Legal;
