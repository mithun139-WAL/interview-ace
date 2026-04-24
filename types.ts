
export enum Difficulty {
  Easy = "Easy",
  Medium = "Medium",
  Hard = "Hard",
}

export enum Company {
  Google = "Google",
  Meta = "Meta",
  Amazon = "Amazon",
  Netflix = "Netflix",
  General = "General",
  Microsoft = "Microsoft",
  Apple = "Apple",
  Adobe = "Adobe",
}

export interface Question {
  id: string;
  title: string;
  difficulty: Difficulty;
  company: Company;
  problemStatement: string;
  details?: QuestionDetails;
  tempDetails?: QuestionDetails; // For refinement flow
}

export interface Complexity {
  notation: string;
  explanation: string;
}

export interface Approach {
  logic: string;
  timeComplexity: Complexity;
  spaceComplexity: Complexity;
}

export interface QuestionDetails {
  problem: {
    title: string;
    statement: string;
    inputOutput: {
      input: string;
      output: string;
      explanation?: string;
    }[];
  };
  edgeCases: string[];
  approaches: {
    bruteForce: Approach;
    patternIdentification: string;
    optimal: Approach;
  };
  code: {
    javascript: string;
    python: string;
    java: string;
  };
  followUps: {
    question: string;
    answer: string;
  }[];
  diagram: {
    explanation: string;
    mermaidCode: string;
  };
}
