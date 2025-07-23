/**
 * Candidate types and enums
 */
import { candidatesTable } from '@/modules/database/schema';

export enum CandidateStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  HIRED = 'hired',
  REJECTED = 'rejected',
  ON_HOLD = 'on_hold',
}

export enum ExperienceLevel {
  ENTRY = 'entry',
  JUNIOR = 'junior',
  MID = 'mid',
  SENIOR = 'senior',
  LEAD = 'lead',
  PRINCIPAL = 'principal',
  EXECUTIVE = 'executive',
}

export type CandidateSearchResult = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  currentTitle?: string;
  currentCompany?: string;
  similarity: number;
};

export type CandidateFilters = {
  status?: CandidateStatus[];
  experienceLevel?: ExperienceLevel[];
  location?: string;
  isRemoteOk?: boolean;
  minSalary?: number;
  maxSalary?: number;
  skills?: string[];
  yearsOfExperience?: {
    min?: number;
    max?: number;
  };
};

export type CandidateStats = {
  total: number;
  byStatus: Record<string, number>;
  byExperienceLevel: Record<string, number>;
};

export type Candidate = typeof candidatesTable.$inferSelect;
