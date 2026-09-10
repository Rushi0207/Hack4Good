// Centralized mock data for Hack4Good
export const mockHackathons = [
  { id: 'h1', title: 'Green Cities Hackathon 2026', tag: 'Climate & sustainability', date: 'Apr 18–20, 2026', dateRange: { start: '2026-04-18', end: '2026-04-20' }, place: 'Online + 12 cities', image: 'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=900&q=80', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300', status: 'active', description: 'Solve real-world climate challenges in your community. From reducing waste to sustainable transport, build solutions that make cities greener.', registrationDeadline: '2026-04-15', teamSize: '3-5', organizer: 'Global Green Initiative', problemCount: 24 },
  { id: 'h2', title: 'Rural Innovation Challenge', tag: 'Community development', date: 'May 09–11, 2026', dateRange: { start: '2026-05-09', end: '2026-05-11' }, place: 'Bengaluru + online', image: 'https://images.unsplash.com/photo-1509099836639-18ba02c6f7b4?auto=format&fit=crop&w=900&q=80', color: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300', status: 'active', description: 'Bring technology and innovation to underserved rural communities. Focus on agriculture, education, healthcare, and livelihood.', registrationDeadline: '2026-05-05', teamSize: '2-6', organizer: 'Rural Development Foundation', problemCount: 18 },
  { id: 'h3', title: 'Health for All Hackathon', tag: 'Health & wellbeing', date: 'Jun 06–07, 2026', dateRange: { start: '2026-06-06', end: '2026-06-07' }, place: 'Online', image: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=900&q=80', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300', status: 'upcoming', description: 'Create solutions to increase healthcare access, affordability, and quality across regions and demographics.', registrationDeadline: '2026-06-02', teamSize: '2-4', organizer: 'Health Access Coalition', problemCount: 15 },
]

export const mockProblems = [
  { id: 'p1', title: 'Waste Segregation in Colleges', category: 'Environment', place: 'Pune, India', votes: 124, comments: 18, avatar: 'PS', creator: 'Priya S.', date: '2026-03-15', description: 'Students produce massive waste daily but have no system to segregate recyclables from compost and trash. This leads to landfill overflow and missed recycling opportunities.', impact: 'Could reduce college waste to landfill by 60% and create employment for sanitation workers.' },
  { id: 'p2', title: 'Lack of Digital Education Access', category: 'Education', place: 'Nairobi, Kenya', votes: 98, comments: 12, avatar: 'AM', creator: 'Amara M.', date: '2026-03-12', description: 'Rural students have no access to quality online learning platforms due to lack of connectivity and devices.', impact: '50+ schools could reach 10,000+ students with a hybrid learning platform.' },
  { id: 'p3', title: 'Water Shortage in Urban Areas', category: 'Infrastructure', place: 'Cape Town, South Africa', votes: 87, comments: 9, avatar: 'NK', creator: 'Nandi K.', date: '2026-03-10', description: 'Rapid population growth has stressed water systems. Residents need better conservation tools and awareness.', impact: 'Could reduce water consumption by 30% across 500,000+ households.' },
  { id: 'p4', title: 'Mental Health Support for Gig Workers', category: 'Wellbeing', place: 'Delhi, India', votes: 76, comments: 14, avatar: 'RJ', creator: 'Raj J.', date: '2026-03-08', description: 'Gig workers face isolation, stress, and no mental health support. We need accessible counseling and peer support networks.', impact: 'Connect 20,000+ gig workers with mental health resources and community.' },
]

export const mockTeams = [
  { id: 't1', name: 'Green Warriors', category: 'Climate', leader: 'Priya Shah', members: ['Priya Shah', 'Arjun Patel', 'Sofia Martinez'], hackathonId: 'h1', projectId: 'pr1', memberCount: 3 },
  { id: 't2', name: 'Tech for Rural', category: 'Community', leader: 'Amara Okonkwo', members: ['Amara Okonkwo', 'Chen Wei', 'Liam O\'Brien'], hackathonId: 'h2', projectId: 'pr2', memberCount: 3 },
  { id: 't3', name: 'Innovate Youth', category: 'Health', leader: 'Raj Joshi', members: ['Raj Joshi', 'Maya Patel', 'Sam Chen'], hackathonId: 'h3', projectId: 'pr3', memberCount: 3 },
]

export const mockProjects = [
  { id: 'pr1', title: 'Smart Waste Segregation System', team: 'Green Warriors', hackathon: 'Green Cities Hackathon 2026', problem: 'Waste Segregation in Colleges', solution: 'IoT-enabled bins that sort waste automatically and track segregation metrics in real-time.', technologies: ['IoT', 'Python', 'React', 'Firebase'], github: 'https://github.com/greenwarriors/smart-waste', demo: 'https://demo.greenwaste.io', status: 'submitted', score: null, feedback: null },
  { id: 'pr2', title: 'OfflineLearn Platform', team: 'Tech for Rural', hackathon: 'Rural Innovation Challenge', problem: 'Lack of Digital Education Access', solution: 'Progressive web app that syncs educational content when offline and works on low-bandwidth devices.', technologies: ['React', 'Node.js', 'MongoDB', 'Service Workers'], github: 'https://github.com/techforrural/offlinelearn', demo: 'https://offlinelearn.io', status: 'submitted', score: null, feedback: null },
  { id: 'pr3', title: 'WaterWise - Conservation AI', team: 'Innovate Youth', hackathon: 'Health for All Hackathon', problem: 'Water Shortage in Urban Areas', solution: 'AI-powered app that predicts household water usage and suggests conservation strategies.', technologies: ['TensorFlow', 'React', 'AWS', 'PostgreSQL'], github: 'https://github.com/innovateyouth/waterwise', demo: 'https://waterwise.ai', status: 'submitted', score: 78, feedback: 'Strong technical approach. Consider user education component.' },
]

export const mockJudges = [
  { id: 'j1', name: 'Dr. Amelia Chen', expertise: 'Climate Tech', hackathons: ['h1'], assignedCount: 5 },
  { id: 'j2', name: 'James Okafor', expertise: 'Social Innovation', hackathons: ['h1', 'h2'], assignedCount: 8 },
  { id: 'j3', name: 'Sofia Bergström', expertise: 'Healthcare Technology', hackathons: ['h3'], assignedCount: 6 },
]

export const mockEvaluations = [
  { id: 'e1', projectId: 'pr1', judgeId: 'j1', hackathonId: 'h1', innovation: 22, socialImpact: 24, technicalFeasibility: 19, scalability: 14, presentation: 14, total: 93, strengths: 'Great technical execution and practical solution', weaknesses: 'Limited cost analysis', suggestions: 'Add financial sustainability model', feedback: 'Strong project with real-world application potential.' },
]

export const mockLeaderboard = [
  { rank: 1, team: 'Green Warriors', hackathon: 'Green Cities Hackathon 2026', score: 93, status: 'Winner', members: 3 },
  { rank: 2, team: 'Tech for Rural', hackathon: 'Green Cities Hackathon 2026', score: 87, status: 'Runner-up', members: 3 },
  { rank: 3, team: 'Innovate Youth', hackathon: 'Green Cities Hackathon 2026', score: 82, status: 'Top 3', members: 3 },
]

export const mockParticipant = {
  id: 'user1',
  name: 'Alex Johnson',
  email: 'alex@example.com',
  bio: 'Full-stack developer passionate about climate tech and social impact.',
  location: 'San Francisco, CA',
  skills: ['React', 'Node.js', 'Python', 'Product Design'],
  teams: 1,
  projects: 1,
  hackathonsJoined: 2,
  avatar: 'AJ',
}

export const mockNotifications = [
  { id: 'n1', type: 'team_invite', message: 'You were invited to join Green Warriors', timestamp: '2 hours ago', read: false },
  { id: 'n2', type: 'hackathon_registered', message: 'You registered for Rural Innovation Challenge', timestamp: '1 day ago', read: true },
  { id: 'n3', type: 'project_comment', message: 'New comment on OfflineLearn Platform', timestamp: '2 days ago', read: true },
  { id: 'n4', type: 'evaluation_complete', message: 'Smart Waste System was evaluated: 93/100', timestamp: '3 days ago', read: true },
]

export const mockImpactStats = {
  projectsLaunched: 240,
  communitiesReached: 48,
  changemakers: 12000,
  peopleImpacted: 125000,
}
