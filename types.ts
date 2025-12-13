export enum TaskStatus {
  PENDING = 'PENDING',
  PRE_LABELING = 'PRE_LABELING',
  READY_FOR_HUMAN = 'READY_FOR_HUMAN',
  IN_PROGRESS = 'IN_PROGRESS',
  REVIEW_QUEUE = 'REVIEW_QUEUE',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED'
}

export enum UserRole {
  ADMIN = 'ADMIN',
  LABELER = 'LABELER',
  REVIEWER = 'REVIEWER'
}

export enum ProjectType {
  TEXT_CLASSIFICATION = 'TEXT_CLASSIFICATION',
  SENTIMENT_ANALYSIS = 'SENTIMENT_ANALYSIS',
  NAMED_ENTITY_RECOGNITION = 'NER',
  IMAGE_CAPTIONING = 'IMAGE_CAPTIONING'
}

export interface Project {
  id: string;
  name: string;
  type: ProjectType;
  description: string;
  labels: string[];
  guidelines: string;
  hourlyRate: number;
}

export interface Task {
  id: string;
  projectId: string;
  data: {
    text?: string;
    imageUrl?: string;
    [key: string]: any;
  };
  status: TaskStatus;
  aiPrediction?: {
    label: string;
    confidence: number;
    reasoning?: string;
  };
  humanLabel?: {
    label: string;
    timestamp: number;
    userId: string;
    timeSpentSeconds: number;
  };
  review?: {
    approved: boolean;
    comment?: string;
    reviewerId: string;
    timestamp: number;
  };
  createdAt: number;
  updatedAt: number;
}

export interface AgentState {
  isProcessing: boolean;
  currentTask?: string;
  logs: string[];
  error?: string;
}

export interface WorkerStats {
  tasksCompleted: number;
  hoursWorked: number;
  earnings: number;
  accuracyScore: number;
}
