export const studentStats = {
  sessionsCompleted: 12,
  learningHours: "48h",
  avgRating: "4.8",
  streak: 7,
};

export const teacherStats = {
  totalStudents: 24,
  totalSessions: 156,
  earnings: "₹45.2k",
  rating: 4.8,
};

export const teacherEarnings = {
  held: "₹4,800",
  released: "₹12,600",
  transferred: "₹27,800",
  monthlyData: [
    { month: "Jan", amount: 28000 },
    { month: "Feb", amount: 32000 },
    { month: "Mar", amount: 38000 },
    { month: "Apr", amount: 41000 },
    { month: "May", amount: 45200 },
  ],
};

export const adminStats = {
  totalTeachers: 156,
  pendingKYC: 12,
  totalStudents: 1240,
  totalSessions: 3420,
  totalRevenue: "₹856k",
};

export const pendingTeachers = [
  {
    id: 1,
    name: "Rahul Verma",
    initials: "RV",
    color: "#5BA3E0",
    email: "rahul.verma@email.com",
    phone: "+91 98765 43210",
    subject: "Physics, Mathematics",
    education: "M.Sc Physics, DU",
    experience: "5 years",
    expYears: 5,
    rate: "₹600/hr",
    location: "Koramangala, Bangalore",
    mode: "Both",
    bio: "Experienced physics and mathematics tutor. Specializes in CBSE and IIT-JEE preparation with a strong track record.",
    documents: {
      idProof: "Aadhaar Card",
      degree: "M.Sc Certificate",
      experience: "Experience Letter",
      photo: "Profile Photo",
    },
    status: "pending",
    submittedAt: "2 days ago",
  },
  {
    id: 2,
    name: "Anjali Singh",
    initials: "AS",
    color: "#F5A623",
    email: "anjali.singh@email.com",
    phone: "+91 98765 43211",
    subject: "Chemistry, Biology",
    education: "M.Sc Chemistry, BITS Pilani",
    experience: "3 years",
    expYears: 3,
    rate: "₹500/hr",
    location: "Indiranagar, Bangalore",
    mode: "Online",
    bio: "Chemistry and biology teacher with a passion for making science accessible and fun for students.",
    documents: {
      idProof: "PAN Card",
      degree: "B.Tech Certificate",
      experience: null,
      photo: "Profile Photo",
    },
    status: "pending",
    submittedAt: "5 days ago",
  },
  {
    id: 3,
    name: "Karthik Reddy",
    initials: "KR",
    color: "#10b981",
    email: "karthik.r@email.com",
    phone: "+91 98765 43212",
    subject: "English, Social Science",
    education: "MA English, JNU",
    experience: "7 years",
    expYears: 7,
    rate: "₹450/hr",
    location: "HSR Layout, Bangalore",
    mode: "Offline",
    bio: "English and social science teacher with expertise in CBSE curriculum and creative writing workshops.",
    documents: {
      idProof: "Voter ID",
      degree: "MA Certificate",
      experience: "Experience Letter",
      photo: "Profile Photo",
    },
    status: "pending",
    submittedAt: "1 week ago",
  },
];
