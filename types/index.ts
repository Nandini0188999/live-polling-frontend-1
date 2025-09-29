export interface Student {
  id: string;
  name: string;
  socketId: string;
}

export interface Poll {
  id: string;
  question: string;
  options: string[];
  timeLimit: number;
  createdAt: Date;
  completed: boolean;
  responses: Map<string, string>;
}

export interface PollResults {
  pollId: string;
  question: string;
  totalResponses: number;
  totalParticipants: number;
  options: {
    option: string;
    votes: number;
    percentage: number;
    voters: string[];
  }[];
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: string;
  isTeacher: boolean;
  timestamp: Date;
}

export type UserRole = 'student' | 'teacher' | null;