import { Link } from 'react-router-dom';

const cards = [
  {
    id: 'for-students',
    icon: '🎓',
    title: 'For Students & Parents',
    desc: 'Stop hunting for reliable tutors. Every teacher on TrueEd is verified and manually checked by our team.',
    items: [
      'Filter by subject, class & location',
      'View teacher photo, subjects, experience',
      'Secure payments',
      'One-click refund if teacher no-show',
      'Call teacher directly after booking',
    ],
    cta: 'Find a Teacher',
    to: '/student/discover',
  },
  {
    id: 'for-teachers',
    icon: '👨‍🏫',
    title: 'For Teachers',
    desc: 'Focus on teaching. We handle discovery, scheduling, payments, and disputes. Zero subscription fee.',
    items: [
      'Set your own hourly rate',
      'Toggle availability by day & time',
      'Track earnings: Held → Released → Bank',
      'Get student details before class',
      '15% platform commission only',
    ],
    cta: 'Start Teaching',
    to: '/login?role=teacher',
  },
];

const ForWhom = () => (
  <section className="bg-gradient-to-br from-navy to-navy-light text-white py-16 px-6">
    <div className="max-w-[1100px] mx-auto">
      <div className="text-center mb-12">
        <h2 className="font-sora text-3xl font-bold text-white mb-2">Built for Both Sides</h2>
        <p className="text-white/60">Whether you're learning or teaching, we've got you covered</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {cards.map((card) => (
          <div key={card.id} id={card.id} className="bg-white/[0.06] border border-white/10 rounded-brand p-10 backdrop-blur-sm">
            <div className="text-4xl mb-4">{card.icon}</div>
            <h3 className="font-sora text-xl font-bold mb-3">{card.title}</h3>
            <p className="text-white/65 text-sm mb-6 leading-relaxed">{card.desc}</p>
            <ul className="card-check-list space-y-2 mb-6">
              {card.items.map((item) => (
                <li key={item} className="flex items-start text-white/80 text-sm">
                  {item}
                </li>
              ))}
            </ul>
            <Link
              to={card.to}
              className="inline-block py-2.5 px-6 bg-amber text-navy rounded-lg text-sm font-semibold hover:bg-amber-hover hover:-translate-y-0.5 hover:shadow-lg transition-all"
            >
              {card.cta}
            </Link>
          </div>
        ))}
      </div>
    </div>
  </section>
);
export default ForWhom;
