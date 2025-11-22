export enum ViewState {
  HOME = 'HOME',
  LESSON = 'LESSON',
  CHAT = 'CHAT',
  IMAGE_GEN = 'IMAGE_GEN',
  VOICE_SESSION = 'VOICE_SESSION'
}

export interface PracticeChallenge {
  scenario: string;
  task: string;
  evaluationPrompt: string; // Instructions for the AI to grade the user's input
}

export interface Lesson {
  id: string;
  title: string;
  altitude: number; // Meters
  description: string;
  content: string; // Markdown
  quiz: QuizQuestion[];
  practice?: PracticeChallenge;
  xpReward: number;
  completed: boolean;
  locked: boolean;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

// Global augmentation for AI Studio billing check
declare global {
  // Fix for window.aistudio access in some environments
  interface Window {
    aistudio?: {
      hasSelectedApiKey(): Promise<boolean>;
      openSelectKey(): Promise<void>;
    };
  }
}