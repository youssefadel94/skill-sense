export interface Profile {
  id: string;
  userId: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  status: 'active' | 'processing' | 'error';
}

export interface Skill {
  id: string;
  profileId: string;
  name: string;
  category: string;
  confidence: number;
  verified: boolean;
  evidence: Evidence[];
  firstSeenAt: Date;
  lastSeenAt: Date;
  occurrences: number;
}

export interface Evidence {
  id: string;
  skillId: string;
  source: 'CV' | 'GITHUB' | 'WEB' | 'LINKEDIN';
  sourceUrl?: string;
  documentId?: string;
  snippet: string;
  context: string;
  extractedAt: Date;
  confidence: number;
}

export interface SourceConnection {
  type: 'CV' | 'GITHUB' | 'WEB' | 'LINKEDIN';
  status: 'connected' | 'processing' | 'error';
  connectedAt: Date;
  lastSyncAt?: Date;
  metadata: any;
}

export interface Job {
  id: string;
  profileId: string;
  type: 'CV_EXTRACTION' | 'GITHUB_SYNC' | 'WEB_SCRAPE';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  result?: any;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface SkillGap {
  skill: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  estimatedLearningTime: string;
  resources?: string[];
}

export interface LearningPath {
  targetRole: string;
  phases: LearningPhase[];
  totalDuration: string;
  estimatedCost?: string;
}

export interface LearningPhase {
  name: string;
  duration: string;
  skills: string[];
  resources: Resource[];
  order: number;
}

export interface Resource {
  title: string;
  type: 'course' | 'book' | 'tutorial' | 'project' | 'certification';
  url?: string;
  provider?: string;
  cost?: string;
  duration?: string;
}

export interface SearchResult {
  profiles: Profile[];
  totalResults: number;
  facets?: Record<string, number>;
}

export interface DashboardStats {
  totalSkills: number;
  profilesAnalyzed: number;
  gapsIdentified: number;
  confidenceAverage: number;
  recentActivity: Activity[];
}

export interface Activity {
  id: string;
  type: string;
  description: string;
  timestamp: Date;
}
