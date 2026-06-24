const getPastDate = (daysAgo) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
};

export const teacherQueriesData = [
  {
    id: 1,
    student: 'Rahul Sharma',
    initials: 'RS',
    classLevel: 'Class 10',
    subject: 'Mathematics',
    preferredMode: 'Online',
    preferredDays: 'Weekends',
    preferredTime: 'Evening',
    createdAt: getPastDate(1), // 1 day ago
    message: 'I need help preparing for CBSE board exams. I am weak in trigonometry and geometry.',
    status: 'pending',
    reply: null,
    replyDate: null
  },
  {
    id: 2,
    student: 'Priya Kapoor',
    initials: 'PK',
    classLevel: 'Class 12',
    subject: 'Physics',
    preferredMode: 'Offline',
    preferredDays: 'Mon, Wed, Fri',
    preferredTime: 'Afternoon',
    createdAt: getPastDate(5), // 5 days ago - already replied
    message: 'Can you help with JEE preparation? I specifically want to focus on mechanics and electromagnetism.',
    status: 'accepted',
    reply: 'Yes, I specialize in JEE Physics and have 8 years experience. We can start with a mock test to gauge your current level.',
    replyDate: getPastDate(4)
  },
  {
    id: 3,
    student: 'Aditi Rao',
    initials: 'AR',
    classLevel: 'Class 9',
    subject: 'Biology',
    preferredMode: 'Both',
    preferredDays: 'Tue, Thu',
    preferredTime: 'Morning',
    createdAt: getPastDate(4), // 4 days ago - will be auto rejected
    message: 'I am looking for someone to explain concepts with diagrams. Do you provide notes?',
    status: 'pending',
    reply: null,
    replyDate: null
  },
  {
    id: 4,
    student: 'Karan Verma',
    initials: 'KV',
    classLevel: 'Class 11',
    subject: 'Chemistry',
    preferredMode: 'Online',
    preferredDays: 'Any',
    preferredTime: 'Evening',
    createdAt: getPastDate(2), // 2 days ago
    message: 'Organic chemistry is very confusing for me. Will you cover only that portion or physical chemistry too?',
    status: 'pending',
    reply: null,
    replyDate: null
  },
  {
    id: 5,
    student: 'Sneha Desai',
    initials: 'SD',
    classLevel: 'Class 8',
    subject: 'English',
    preferredMode: 'Online',
    preferredDays: 'Sat, Sun',
    preferredTime: 'Morning',
    createdAt: getPastDate(6),
    message: 'I want to improve my grammar and creative writing skills. Do you offer weekly assignments?',
    status: 'accepted',
    reply: 'Absolutely! I provide weekly writing prompts and detailed feedback to help improve grammar and vocabulary.',
    replyDate: getPastDate(5)
  },
  {
    id: 6,
    student: 'Vikram Singh',
    initials: 'VS',
    classLevel: 'Class 12',
    subject: 'Computer Science',
    preferredMode: 'Offline',
    preferredDays: 'Mon, Tue, Wed',
    preferredTime: 'Afternoon',
    createdAt: getPastDate(10), // 10 days ago
    message: 'I have my practical exams coming up for Python and SQL. Can we do a crash course?',
    status: 'rejected',
    reply: 'Sorry, I am currently not taking any short-term crash courses.',
    replyDate: getPastDate(9)
  },
  {
    id: 7,
    student: 'Neha Gupta',
    initials: 'NG',
    classLevel: 'Class 10',
    subject: 'Mathematics',
    preferredMode: 'Online',
    preferredDays: 'Weekends',
    preferredTime: 'Evening',
    createdAt: getPastDate(0), // Today
    message: 'Can we schedule a demo class this weekend?',
    status: 'pending',
    reply: null,
    replyDate: null
  }
];
