/**
 * Candidate repository implementation using Drizzle ORM for PostgreSQL
 * Includes vector embedding support for AI-powered candidate matching
 */
import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { desc, eq, and, gt, sql, cosineDistance } from 'drizzle-orm';
import { NodePgTransaction } from 'drizzle-orm/node-postgres';
import OpenAI from 'openai';
import {
  CandidateSearchResult,
  CandidateFilters,
  CandidateStats,
  Candidate,
} from '../../types/candidate.types';
import {
  CreateCandidateDto,
  UpdateCandidateDto,
  CandidateFiltersDto,
} from './dto';
import { DB_PROVIDER } from '@/modules/database/database.module';
import { candidatesTable } from '@/modules/database/schema';
import { CustomLoggerService } from '@/modules/logger/custom-logger.service';
import { LoggerFactory } from '@/modules/logger/logger-factory.service';
import { DrizzleDB } from '@/types';

// Internal interface for update operations with embedding fields
interface InternalUpdateCandidateData extends UpdateCandidateDto {
  summaryEmbedding?: number[] | null;
  skillsEmbedding?: number[] | null;
  updatedAt?: Date;
}

@Injectable()
export class CandidateRepository {
  private readonly logger: CustomLoggerService;
  private readonly openai: OpenAI;

  constructor(
    @Inject(DB_PROVIDER) private readonly db: DrizzleDB,
    private readonly loggerFactory: LoggerFactory,
  ) {
    this.logger = this.loggerFactory.getLogger(CandidateRepository.name);
    this.openai = new OpenAI({
      apiKey: process.env['OPENAI_API_KEY'],
    });
  }

  /**
   * Generates vector embedding for text using OpenAI
   * @param value - Text to generate embedding for
   * @returns Array of numbers representing the embedding
   */
  private async generateEmbedding(value: string): Promise<number[]> {
    if (!value || value.trim().length === 0) {
      return [];
    }

    try {
      const input = value.replaceAll('\n', ' ').trim();
      const { data } = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input,
      });
      return data[0].embedding;
    } catch (error) {
      this.logger.errorAlert(
        `Failed to generate embedding for text: ${value.substring(0, 100)}...`,
        true,
        error.stack,
      );
      return [];
    }
  }

  /**
   * Creates a new candidate with vector embeddings
   * @param candidateData - Candidate creation data
   * @param tx - Optional transaction object
   * @returns Newly created candidate
   */
  async createCandidate(
    candidateData: CreateCandidateDto,
    tx?: NodePgTransaction<any, any>,
  ): Promise<Candidate> {
    this.logger.debug(`Creating candidate with email: ${candidateData.email}`);

    try {
      // Generate embeddings for vector search
      const resumeEmbedding = candidateData.summary //TODO why summary?
        ? await this.generateEmbedding(candidateData.summary)
        : null;

      const skillsEmbedding = candidateData.skills?.length
        ? await this.generateEmbedding(candidateData.skills.join(', '))
        : null;

      const summaryEmbedding = candidateData.summary
        ? await this.generateEmbedding(candidateData.summary)
        : null;

      // Prepare candidate data with proper date conversion
      const newCandidate = {
        ...candidateData,
        // Convert availableFrom string to Date object if provided
        availableFrom: candidateData.availableFrom
          ? new Date(candidateData.availableFrom)
          : null,
        resumeEmbedding: resumeEmbedding?.length ? resumeEmbedding : null,
        skillsEmbedding: skillsEmbedding?.length ? skillsEmbedding : null,
        summaryEmbedding: summaryEmbedding?.length ? summaryEmbedding : null,
      };

      const queryRunner = tx || this.db;
      const result = await queryRunner
        .insert(candidatesTable)
        .values(newCandidate)
        .returning();

      this.logger.debug(`Created candidate with ID: ${result[0].id}`);
      return result[0];
    } catch (error) {
      this.logger.errorAlert(
        `Failed to create candidate with email: ${candidateData.email}`,
        true,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Failed to create candidate: ${error.message}`,
      );
    }
  }

  /**
   * Finds a candidate by ID
   * @param id - UUID of the candidate
   * @returns Candidate if found
   */
  async findCandidateById(id: string): Promise<Candidate> {
    this.logger.debug(`Finding candidate by ID: ${id}`);

    const candidate = await this.db.query.candidatesTable.findFirst({
      where: and(
        eq(candidatesTable.id, id),
        eq(candidatesTable.isDeleted, false),
      ),
    });

    if (!candidate) {
      throw new NotFoundException(`Candidate with ID ${id} not found`);
    }

    return candidate;
  }

  /**
   * Finds a candidate by email
   * @param email - Email to search for
   * @returns Candidate if found
   */
  async findCandidateByEmail(email: string): Promise<Candidate> {
    this.logger.debug(`Finding candidate by email: ${email}`);

    return this.db.query.candidatesTable.findFirst({
      where: and(
        eq(candidatesTable.email, email),
        eq(candidatesTable.isDeleted, false),
      ),
    });
  }

  /**
   * Updates a candidate by ID with new embeddings if content changed
   * @param id - ID of the candidate to update
   * @param data - Fields to update
   * @param tx - Optional transaction object
   * @returns Updated candidate
   */
  async updateCandidate(
    id: string,
    data: UpdateCandidateDto,
    tx?: NodePgTransaction<any, any>,
  ): Promise<Candidate> {
    this.logger.debug(`Updating candidate: ${id}`);

    try {
      const updateData: InternalUpdateCandidateData = { ...data };

      // Regenerate embeddings if relevant fields changed
      if (data.summary) {
        const summaryEmbedding = await this.generateEmbedding(data.summary);
        updateData.summaryEmbedding = summaryEmbedding.length
          ? summaryEmbedding
          : null;
      }

      if (data.skills?.length) {
        const skillsEmbedding = await this.generateEmbedding(
          data.skills.join(', '),
        );
        updateData.skillsEmbedding = skillsEmbedding.length
          ? skillsEmbedding
          : null;
      }

      // Always update the updatedAt timestamp
      updateData.updatedAt = new Date();

      const queryRunner = tx || this.db;
      const result = await queryRunner
        .update(candidatesTable)
        .set(updateData)
        .where(
          and(eq(candidatesTable.id, id), eq(candidatesTable.isDeleted, false)),
        )
        .returning();

      if (result.length === 0) {
        throw new NotFoundException(`Candidate with ID ${id} not found`);
      }

      return result[0];
    } catch (error) {
      this.logger.errorAlert(
        `Failed to update candidate with ID: ${id}`,
        true,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Failed to update candidate: ${error.message}`,
      );
    }
  }

  /**
   * Gets all candidates with optional filtering
   * @param filters - Optional filters to apply
   * @param page - Page number (1-based)
   * @param limit - Number of results per page
   * @returns Array of candidates matching filters
   */
  async findAllCandidates(
    filters: CandidateFilters = {},
    page: number = 1,
    limit: number = 20,
  ): Promise<Candidate[]> {
    this.logger.debug(
      `Finding candidates with filters: ${JSON.stringify(filters)}`,
    );

    try {
      const whereConditions = [eq(candidatesTable.isDeleted, false)];

      // Apply filters
      if (filters.status?.length) {
        whereConditions.push(
          sql`${candidatesTable.status} = ANY(${filters.status})`,
        );
      }

      if (filters.experienceLevel?.length) {
        whereConditions.push(
          sql`${candidatesTable.experienceLevel} = ANY(${filters.experienceLevel})`,
        );
      }

      if (filters.location) {
        whereConditions.push(
          sql`${candidatesTable.location} ILIKE ${'%' + filters.location + '%'}`,
        );
      }

      if (filters.isRemoteOk !== undefined) {
        whereConditions.push(
          eq(candidatesTable.isRemoteOk, filters.isRemoteOk),
        );
      }

      if (filters.minSalary) {
        whereConditions.push(
          sql`${candidatesTable.expectedSalary} >= ${filters.minSalary}`,
        );
      }

      if (filters.maxSalary) {
        whereConditions.push(
          sql`${candidatesTable.expectedSalary} <= ${filters.maxSalary}`,
        );
      }

      if (filters.yearsOfExperience?.min) {
        whereConditions.push(
          sql`${candidatesTable.yearsOfExperience} >= ${filters.yearsOfExperience.min}`,
        );
      }

      if (filters.yearsOfExperience?.max) {
        whereConditions.push(
          sql`${candidatesTable.yearsOfExperience} <= ${filters.yearsOfExperience.max}`,
        );
      }

      if (filters.skills?.length) {
        whereConditions.push(
          sql`${candidatesTable.skills} ?| ARRAY[${filters.skills.join(',')}]`,
        );
      }

      const offset = (page - 1) * limit;

      return this.db
        .select()
        .from(candidatesTable)
        .where(and(...whereConditions))
        .orderBy(desc(candidatesTable.createdAt))
        .limit(limit)
        .offset(offset);
    } catch (error) {
      this.logger.errorAlert(
        `Failed to find candidates with filters`,
        true,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Failed to find candidates: ${error.message}`,
      );
    }
  }

  /**
   * Searches for similar candidates using vector similarity
   * @param description - Job description or requirements to match against
   * @param minSimilarity - Minimum similarity threshold (0-1)
   * @param limit - Maximum number of results
   * @returns Array of similar candidates with similarity scores
   */
  async findSimilarCandidates(
    description: string,
    minSimilarity: number = 0.5,
    limit: number = 10,
  ): Promise<CandidateSearchResult[]> {
    this.logger.debug(
      `Searching for candidates similar to: ${description.substring(0, 100)}...`,
    );

    try {
      const embedding = await this.generateEmbedding(description);

      if (!embedding.length) {
        return [];
      }

      // Search by summary embedding (most comprehensive)
      const similarity = sql<number>`1 - (${cosineDistance(candidatesTable.summaryEmbedding, embedding)})`;

      return this.db
        .select({
          id: candidatesTable.id,
          firstName: candidatesTable.firstName,
          lastName: candidatesTable.lastName,
          email: candidatesTable.email,
          currentTitle: candidatesTable.currentTitle,
          currentCompany: candidatesTable.currentCompany,
          similarity,
        })
        .from(candidatesTable)
        .where(
          and(
            eq(candidatesTable.isDeleted, false),
            eq(candidatesTable.status, 'active'),
            gt(similarity, minSimilarity),
            sql`${candidatesTable.summaryEmbedding} IS NOT NULL`,
          ),
        )
        .orderBy(desc(similarity))
        .limit(limit);
    } catch (error) {
      this.logger.errorAlert(
        `Failed to find similar candidates`,
        true,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Failed to find similar candidates: ${error.message}`,
      );
    }
  }

  /**
   * Searches for candidates with specific skills using vector similarity
   * @param skills - Array of skills to match
   * @param minSimilarity - Minimum similarity threshold (0-1)
   * @param limit - Maximum number of results
   * @returns Array of candidates with matching skills
   */
  async findCandidatesBySkills(
    skills: string[],
    minSimilarity: number = 0.6,
    limit: number = 10,
  ): Promise<CandidateSearchResult[]> {
    this.logger.debug(
      `Searching for candidates with skills: ${skills.join(', ')}`,
    );

    try {
      const skillsText = skills.join(', ');
      const embedding = await this.generateEmbedding(skillsText);

      if (!embedding.length) {
        return [];
      }

      const similarity = sql<number>`1 - (${cosineDistance(candidatesTable.skillsEmbedding, embedding)})`;

      return this.db
        .select({
          id: candidatesTable.id,
          firstName: candidatesTable.firstName,
          lastName: candidatesTable.lastName,
          email: candidatesTable.email,
          currentTitle: candidatesTable.currentTitle,
          currentCompany: candidatesTable.currentCompany,
          similarity,
        })
        .from(candidatesTable)
        .where(
          and(
            eq(candidatesTable.isDeleted, false),
            eq(candidatesTable.status, 'active'),
            gt(similarity, minSimilarity),
            sql`${candidatesTable.skillsEmbedding} IS NOT NULL`,
          ),
        )
        .orderBy(desc(similarity))
        .limit(limit);
    } catch (error) {
      this.logger.errorAlert(
        `Failed to find candidates by skills`,
        true,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Failed to find candidates by skills: ${error.message}`,
      );
    }
  }

  /**
   * Soft deletes a candidate by ID
   * @param id - UUID of the candidate to delete
   * @param tx - Optional transaction object
   * @returns Candidate object that was soft deleted
   */
  async deleteCandidate(
    id: string,
    tx?: NodePgTransaction<any, any>,
  ): Promise<Candidate> {
    this.logger.debug(`Soft deleting candidate with ID: ${id}`);

    try {
      const queryRunner = tx || this.db;

      const result = await queryRunner
        .update(candidatesTable)
        .set({
          isDeleted: true,
          deletedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(candidatesTable.id, id))
        .returning();

      if (result.length === 0) {
        throw new NotFoundException(`Candidate with ID ${id} not found`);
      }

      return result[0];
    } catch (error) {
      this.logger.errorAlert(
        `Failed to soft delete candidate with ID: ${id}`,
        true,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Failed to delete candidate: ${error.message}`,
      );
    }
  }

  /**
   * Gets candidate statistics
   * @returns Object containing various candidate statistics
   */
  async getCandidateStats(): Promise<CandidateStats> {
    try {
      const stats = await this.db
        .select({
          total: sql<number>`count(*)`,
          status: candidatesTable.status,
          experienceLevel: candidatesTable.experienceLevel,
        })
        .from(candidatesTable)
        .where(eq(candidatesTable.isDeleted, false))
        .groupBy(candidatesTable.status, candidatesTable.experienceLevel);

      const total = stats.reduce((sum, stat) => sum + Number(stat.total), 0);
      const byStatus: Record<string, number> = {};
      const byExperienceLevel: Record<string, number> = {};

      stats.forEach((stat) => {
        byStatus[stat.status] =
          (byStatus[stat.status] || 0) + Number(stat.total);
        if (stat.experienceLevel) {
          byExperienceLevel[stat.experienceLevel] =
            (byExperienceLevel[stat.experienceLevel] || 0) + Number(stat.total);
        }
      });

      return {
        total,
        byStatus,
        byExperienceLevel,
      };
    } catch (error) {
      this.logger.errorAlert(
        `Failed to get candidate statistics`,
        true,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Failed to get candidate statistics: ${error.message}`,
      );
    }
  }
}
