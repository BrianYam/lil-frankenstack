import { sql } from 'drizzle-orm';
import {
  pgTable,
  text,
  uuid,
  timestamp,
  boolean,
  integer,
  pgEnum,
  index,
  vector,
  jsonb,
} from 'drizzle-orm/pg-core';

// Enums for candidate status and experience level
export const candidateStatusEnum = pgEnum('candidate_status', [
  'active',
  'inactive',
  'hired',
  'rejected',
  'on_hold',
]);

export const experienceLevelEnum = pgEnum('experience_level', [
  'entry',
  'junior',
  'mid',
  'senior',
  'lead',
  'principal',
  'executive',
]);

/**
 * Candidates table schema
 * Stores candidate information with vector embeddings for AI-powered matching
 */
export const candidatesTable = pgTable(
  'candidates',
  {
    id: uuid('id').defaultRandom().notNull().primaryKey(),

    // Basic Information
    firstName: text('first_name').notNull(),
    lastName: text('last_name').notNull(),
    email: text('email').notNull(),
    phone: text('phone'),

    // Professional Information
    currentTitle: text('current_title'),
    currentCompany: text('current_company'),
    experienceLevel: experienceLevelEnum('experience_level').default('mid'),
    yearsOfExperience: integer('years_of_experience'),
    expectedSalary: integer('expected_salary'),
    currency: text('currency').default('USD'),

    // Location
    location: text('location'),
    isRemoteOk: boolean('is_remote_ok').default(false),
    isWillingToRelocate: boolean('is_willing_to_relocate').default(false),

    // Documents and Links
    resumeUrl: text('resume_url'),
    portfolioUrl: text('portfolio_url'),
    linkedinUrl: text('linkedin_url'),
    githubUrl: text('github_url'),

    // Skills and Technologies (stored as JSON array)
    skills: jsonb('skills').$type<string[]>(),

    // Summary and Notes
    summary: text('summary'),
    notes: text('notes'),

    // Vector Embeddings for AI matching
    resumeEmbedding: vector('resume_embedding', { dimensions: 1536 }),
    skillsEmbedding: vector('skills_embedding', { dimensions: 1536 }),
    summaryEmbedding: vector('summary_embedding', { dimensions: 1536 }),

    // Status and Tracking
    status: candidateStatusEnum('status').default('active').notNull(),
    source: text('source'), // How they were found (referral, job board, etc.)

    // Availability
    availableFrom: timestamp('available_from'),
    noticePeriod: text('notice_period'), // e.g., "2 weeks", "1 month"

    // Soft delete fields
    isDeleted: boolean('is_deleted').default(false).notNull(),
    deletedAt: timestamp('deleted_at'),

    // Audit fields
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    // Vector similarity search indexes using HNSW
    index('candidates_resume_embedding_idx').using(
      'hnsw',
      table.resumeEmbedding.op('vector_cosine_ops'),
    ),
    index('candidates_skills_embedding_idx').using(
      'hnsw',
      table.skillsEmbedding.op('vector_cosine_ops'),
    ),
    index('candidates_summary_embedding_idx').using(
      'hnsw',
      table.summaryEmbedding.op('vector_cosine_ops'),
    ),

    // Regular indexes for common queries
    index('candidates_email_idx').on(table.email),
    index('candidates_status_idx').on(table.status),
    index('candidates_experience_level_idx').on(table.experienceLevel),
    index('candidates_location_idx').on(table.location),
    index('candidates_created_at_idx').on(table.createdAt),

    // Composite index for active candidates
    index('candidates_active_status_idx')
      .on(table.status, table.isDeleted)
      .where(sql`${table.isDeleted} = false`),
  ],
);
