export class GenerateCVDto {
  template?: 'modern' | 'classic' | 'minimal' | 'technical' | 'creative';
  format?: 'pdf' | 'docx' | 'markdown' | 'html';
  targetRole?: string;
  sections?: {
    summary?: boolean;
    skills?: boolean;
    evidence?: boolean;
    certifications?: boolean;
    achievements?: boolean;
    experience?: boolean;
    education?: boolean;
    projects?: boolean;
  };
  includeSections?: {
    skills?: boolean;
    experience?: boolean;
    education?: boolean;
    projects?: boolean;
    certifications?: boolean;
  };
  emphasisCategories?: string[];
  customization?: {
    accentColor?: string;
    font?: string;
  };
}

export class MatchRolesDto {
  query?: string;
  location?: string;
  minScore?: number;
  sortBy?: 'score' | 'salary' | 'date';
}

export class GenerateLearningPathDto {
  targetGoal: string;
  learningStyle: 'balanced' | 'practical' | 'theoretical' | 'fast';
  timeCommitment: number; // hours per week
}

export class UpdateLearningPathProgressDto {
  stepId: string;
  completed: boolean;
}
