export const categories = [
  'All',
  'Academics',
  'Technology',
  'Commerce',
  'Humanities',
  'Competitive Exams',
  'Arts & Skills',
  'Sports & Wellness'
];

export const allSubjects = [
  // Academics
  { name: 'Mathematics', category: 'Academics', tutors: 1250, icon: 'Calculator', trending: true },
  { name: 'Physics', category: 'Academics', tutors: 980, icon: 'Atom', trending: false },
  { name: 'Chemistry', category: 'Academics', tutors: 850, icon: 'FlaskConical', trending: false },
  { name: 'Biology', category: 'Academics', tutors: 920, icon: 'Dna', trending: false },
  { name: 'Science', category: 'Academics', tutors: 1100, icon: 'Telescope', trending: true },
  { name: 'English', category: 'Academics', tutors: 2100, icon: 'BookOpen', trending: true },
  { name: 'Hindi', category: 'Academics', tutors: 800, icon: 'Languages', trending: false },
  { name: 'Kannada', category: 'Academics', tutors: 450, icon: 'Languages', trending: false },
  { name: 'Sanskrit', category: 'Academics', tutors: 300, icon: 'BookMarked', trending: false },
  { name: 'French', category: 'Academics', tutors: 550, icon: 'Globe2', trending: false },
  { name: 'German', category: 'Academics', tutors: 400, icon: 'Globe2', trending: false },
  { name: 'Spanish', category: 'Academics', tutors: 380, icon: 'Globe2', trending: false },

  // Technology
  { name: 'Computer Science', category: 'Technology', tutors: 1450, icon: 'Monitor', trending: false },
  { name: 'Programming', category: 'Technology', tutors: 2450, icon: 'TerminalSquare', trending: true },
  { name: 'Web Development', category: 'Technology', tutors: 1800, icon: 'Layout', trending: true },
  { name: 'App Development', category: 'Technology', tutors: 1200, icon: 'Smartphone', trending: false },
  { name: 'Python', category: 'Technology', tutors: 2100, icon: 'Code2', trending: true },
  { name: 'Java', category: 'Technology', tutors: 1600, icon: 'Coffee', trending: false },
  { name: 'C++', category: 'Technology', tutors: 1350, icon: 'Cpu', trending: false },
  { name: 'Data Science', category: 'Technology', tutors: 950, icon: 'Database', trending: true },
  { name: 'Artificial Intelligence', category: 'Technology', tutors: 850, icon: 'BrainCircuit', trending: true },
  { name: 'Machine Learning', category: 'Technology', tutors: 780, icon: 'Network', trending: false },
  { name: 'Cyber Security', category: 'Technology', tutors: 600, icon: 'ShieldCheck', trending: false },

  // Commerce
  { name: 'Accounting', category: 'Commerce', tutors: 850, icon: 'Calculator', trending: false },
  { name: 'Economics', category: 'Commerce', tutors: 920, icon: 'TrendingUp', trending: true },
  { name: 'Business Studies', category: 'Commerce', tutors: 780, icon: 'Briefcase', trending: false },
  { name: 'Finance', category: 'Commerce', tutors: 650, icon: 'Landmark', trending: false },
  { name: 'Statistics', category: 'Commerce', tutors: 550, icon: 'BarChart4', trending: false },

  // Humanities
  { name: 'History', category: 'Humanities', tutors: 680, icon: 'Landmark', trending: false },
  { name: 'Geography', category: 'Humanities', tutors: 550, icon: 'Globe', trending: false },
  { name: 'Political Science', category: 'Humanities', tutors: 480, icon: 'Scale', trending: false },
  { name: 'Sociology', category: 'Humanities', tutors: 420, icon: 'Users', trending: false },
  { name: 'Psychology', category: 'Humanities', tutors: 750, icon: 'Brain', trending: true },

  // Competitive Exams
  { name: 'JEE', category: 'Competitive Exams', tutors: 1850, icon: 'GraduationCap', trending: true },
  { name: 'NEET', category: 'Competitive Exams', tutors: 1950, icon: 'Stethoscope', trending: true },
  { name: 'UPSC', category: 'Competitive Exams', tutors: 1200, icon: 'Building2', trending: true },
  { name: 'KPSC', category: 'Competitive Exams', tutors: 450, icon: 'Building', trending: false },
  { name: 'GATE', category: 'Competitive Exams', tutors: 850, icon: 'Cpu', trending: false },
  { name: 'CAT', category: 'Competitive Exams', tutors: 950, icon: 'LineChart', trending: false },
  { name: 'IELTS', category: 'Competitive Exams', tutors: 1400, icon: 'Globe2', trending: true },
  { name: 'TOEFL', category: 'Competitive Exams', tutors: 850, icon: 'BookOpen', trending: false },
  { name: 'SSC', category: 'Competitive Exams', tutors: 1100, icon: 'FileText', trending: false },
  { name: 'Banking Exams', category: 'Competitive Exams', tutors: 1300, icon: 'Landmark', trending: true },

  // Arts & Skills
  { name: 'Drawing', category: 'Arts & Skills', tutors: 950, icon: 'Pencil', trending: false },
  { name: 'Painting', category: 'Arts & Skills', tutors: 820, icon: 'Palette', trending: true },
  { name: 'Guitar', category: 'Arts & Skills', tutors: 1150, icon: 'Music', trending: true },
  { name: 'Piano', category: 'Arts & Skills', tutors: 650, icon: 'Music4', trending: false },
  { name: 'Singing', category: 'Arts & Skills', tutors: 880, icon: 'Mic2', trending: false },
  { name: 'Dance', category: 'Arts & Skills', tutors: 1250, icon: 'Activity', trending: true },
  { name: 'Photography', category: 'Arts & Skills', tutors: 550, icon: 'Camera', trending: false },
  { name: 'Public Speaking', category: 'Arts & Skills', tutors: 720, icon: 'Megaphone', trending: false },
  { name: 'Content Writing', category: 'Arts & Skills', tutors: 850, icon: 'PenTool', trending: true },

  // Sports & Wellness
  { name: 'Yoga', category: 'Sports & Wellness', tutors: 1650, icon: 'Heart', trending: true },
  { name: 'Karate', category: 'Sports & Wellness', tutors: 100, icon: 'Shield', trending: true },
  { name: 'Chess', category: 'Sports & Wellness', tutors: 580, icon: 'Target', trending: false },
  { name: 'Cricket Coaching', category: 'Sports & Wellness', tutors: 420, icon: 'Activity', trending: false },
  { name: 'Fitness Training', category: 'Sports & Wellness', tutors: 1400, icon: 'Dumbbell', trending: true },
  { name: 'Meditation', category: 'Sports & Wellness', tutors: 950, icon: 'Flower2', trending: false },
];
