const getPastDate = (daysAgo) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
};

const getFutureDate = (daysAhead) => {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString();
};

export const teacherQueriesData = [
  {
    id: 4,
    type: 'classroom',
    classroomId: 1,
    classroomName: 'Complete CBSE Math - Class 10',
    student: 'Karan Verma',
    studentId: 'student-1',
    initials: 'KV',
    classLevel: 'Class 10',
    subject: 'Mathematics',
    createdAt: getPastDate(2),
    status: 'pending_review',
    archived: false,
    events: [
      { id: 'e1', type: 'submitted', timestamp: getPastDate(2), content: 'I would like to enroll in this classroom.' }
    ]
  },
  {
    id: 5,
    type: 'classroom',
    classroomId: 2,
    classroomName: 'JEE Physics Batch 2026',
    student: 'Sneha Desai',
    studentId: 'student-1',
    initials: 'SD',
    classLevel: 'Class 12',
    subject: 'Physics',
    createdAt: getPastDate(6),
    status: 'approved_waiting_payment',
    paymentDeadline: getFutureDate(1),
    archived: false,
    events: [
      { id: 'e1', type: 'submitted', timestamp: getPastDate(6), content: 'I want to enroll in the JEE Physics batch.' },
      { id: 'e2', type: 'system_action', timestamp: getPastDate(5), actionType: 'teacher_approved', content: 'Your classroom request has been approved. Please complete payment to confirm your enrollment.' }
    ]
  },
  {
    id: 6,
    type: 'classroom',
    classroomId: 3,
    classroomName: 'Crash Course - Python & SQL',
    student: 'Vikram Singh',
    studentId: 'student-2',
    initials: 'VS',
    classLevel: 'Class 12',
    subject: 'Computer Science',
    createdAt: getPastDate(10),
    status: 'rejected',
    archived: true,
    rejectionReason: 'Sorry, I am currently not taking any short-term crash courses.',
    events: [
      { id: 'e1', type: 'submitted', timestamp: getPastDate(10), content: 'I have my practical exams coming up for Python and SQL. Can we do a crash course?' },
      { id: 'e2', type: 'system_action', timestamp: getPastDate(9), actionType: 'teacher_rejected', content: 'Teacher rejected your request. Reason: Sorry, I am currently not taking any short-term crash courses.' }
    ]
  }
];

