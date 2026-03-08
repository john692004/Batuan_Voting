export interface Candidate {
  id: string;
  name: string;
  position: string;
  section: string;
  gradeLevel: string;
  motto: string;
  avatar: string;
  partyList: string;
  votes: number;
}

export interface Position {
  id: string;
  title: string;
  maxVotes: number;
}

export const positions: Position[] = [
  { id: "president", title: "President", maxVotes: 1 },
  { id: "vice-president", title: "Vice President", maxVotes: 1 },
  { id: "secretary", title: "Secretary", maxVotes: 1 },
  { id: "treasurer", title: "Treasurer", maxVotes: 1 },
  { id: "auditor", title: "Auditor", maxVotes: 1 },
  { id: "pio", title: "Public Information Officer", maxVotes: 1 },
  { id: "peace-officer", title: "Peace Officer", maxVotes: 1 },
  { id: "representative", title: "Grade Representative", maxVotes: 1 },
];

export const candidates: Candidate[] = [
  { id: "1", name: "Maria Santos", position: "president", section: "Narra", gradeLevel: "Grade 12", motto: "Leadership through service and integrity", avatar: "", partyList: "Pagbabago", votes: 245 },
  { id: "2", name: "Juan Dela Cruz", position: "president", section: "Molave", gradeLevel: "Grade 12", motto: "Unity is our strength", avatar: "", partyList: "Bagong Pag-asa", votes: 198 },
  { id: "3", name: "Ana Reyes", position: "president", section: "Kamagong", gradeLevel: "Grade 12", motto: "Together we rise, together we succeed", avatar: "", partyList: "Kabataan", votes: 167 },
  { id: "4", name: "Carlo Mendoza", position: "vice-president", section: "Narra", gradeLevel: "Grade 11", motto: "Your voice, my mission", avatar: "", partyList: "Pagbabago", votes: 289 },
  { id: "5", name: "Rica Flores", position: "vice-president", section: "Molave", gradeLevel: "Grade 11", motto: "Serving with a genuine heart", avatar: "", partyList: "Bagong Pag-asa", votes: 221 },
  { id: "6", name: "Miguel Torres", position: "secretary", section: "Kamagong", gradeLevel: "Grade 11", motto: "Transparency in every action", avatar: "", partyList: "Kabataan", votes: 310 },
  { id: "7", name: "Sophia Garcia", position: "secretary", section: "Narra", gradeLevel: "Grade 10", motto: "Organized for progress", avatar: "", partyList: "Pagbabago", votes: 254 },
  { id: "8", name: "Paolo Villanueva", position: "treasurer", section: "Molave", gradeLevel: "Grade 11", motto: "Every peso counts for our school", avatar: "", partyList: "Bagong Pag-asa", votes: 276 },
  { id: "9", name: "Liza Aquino", position: "treasurer", section: "Kamagong", gradeLevel: "Grade 10", motto: "Accountability above all", avatar: "", partyList: "Kabataan", votes: 198 },
  { id: "10", name: "Mark Bautista", position: "auditor", section: "Narra", gradeLevel: "Grade 11", motto: "Ensuring fairness and honesty", avatar: "", partyList: "Pagbabago", votes: 302 },
  { id: "11", name: "Christine Lim", position: "pio", section: "Molave", gradeLevel: "Grade 10", motto: "Bridging students through communication", avatar: "", partyList: "Bagong Pag-asa", votes: 265 },
  { id: "12", name: "James Ramos", position: "peace-officer", section: "Kamagong", gradeLevel: "Grade 11", motto: "Peace and order for all", avatar: "", partyList: "Kabataan", votes: 288 },
];

export const electionStats = {
  totalVoters: 1250,
  totalVotesCast: 876,
  turnoutPercentage: 70.1,
  totalCandidates: 12,
  totalPositions: 8,
  electionDate: "March 15, 2026",
  electionStatus: "ongoing" as "upcoming" | "ongoing" | "completed",
};
