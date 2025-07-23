/**
 * Candidate service implementation
 * Business logic layer for candidate operations
 */
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { CandidateRepository } from './candidate.repository';
import {
  CreateCandidateDto,
  UpdateCandidateDto,
  CandidateFiltersDto,
  PaginationDto,
  SearchCandidatesDto,
} from './dto';
import { CustomLoggerService } from '@/modules/logger/custom-logger.service';
import { LoggerFactory } from '@/modules/logger/logger-factory.service';
import {
  CandidateSearchResult,
  CandidateFilters,
  CandidateStats,
  Candidate,
} from '@/types';

@Injectable()
export class CandidateService {
  private readonly logger: CustomLoggerService;

  constructor(
    private readonly candidateRepository: CandidateRepository,
    private readonly loggerFactory: LoggerFactory,
  ) {
    this.logger = this.loggerFactory.getLogger(CandidateService.name);
  }

  /**
   * Creates a new candidate
   * @param createCandidateDto - Candidate data
   * @returns Created candidate
   */
  async createCandidate(
    createCandidateDto: CreateCandidateDto,
  ): Promise<Candidate> {
    // Check if candidate with email already exists
    const existingCandidate =
      await this.candidateRepository.findCandidateByEmail(
        createCandidateDto.email,
      );

    if (existingCandidate) {
      throw new ConflictException(
        `Candidate with email ${createCandidateDto.email} already exists`,
      );
    }

    return this.candidateRepository.createCandidate(createCandidateDto);
  }

  /**
   * Retrieves all candidates with optional filtering and pagination
   * @param filtersDto - Filtering criteria
   * @param paginationDto - Pagination parameters
   * @returns Array of candidates
   */
  async getAllCandidates(
    filtersDto: CandidateFiltersDto = {},
    paginationDto: PaginationDto = {},
  ): Promise<{
    data: Candidate[];
    pagination: {
      page: number;
      limit: number;
      hasNext: boolean;
    };
  }> {
    const { page = 1, limit = 20 } = paginationDto;

    // Convert DTO to internal filters format
    const filters: CandidateFilters = {
      status: filtersDto.status,
      experienceLevel: filtersDto.experienceLevel,
      location: filtersDto.location,
      isRemoteOk: filtersDto.isRemoteOk,
      minSalary: filtersDto.minSalary,
      maxSalary: filtersDto.maxSalary,
      skills: filtersDto.skills,
      yearsOfExperience: {
        min: filtersDto.minYearsOfExperience,
        max: filtersDto.maxYearsOfExperience,
      },
    };

    // Clean up undefined values
    Object.keys(filters).forEach((key) => {
      if (filters[key] === undefined) {
        delete filters[key];
      }
    });

    if (filters.yearsOfExperience) {
      if (
        filters.yearsOfExperience.min === undefined &&
        filters.yearsOfExperience.max === undefined
      ) {
        delete filters.yearsOfExperience;
      }
    }

    const candidates = await this.candidateRepository.findAllCandidates(
      filters,
      page,
      limit + 1, // Fetch one extra to check if there's a next page
    );

    const hasNext = candidates.length > limit;
    const data = hasNext ? candidates.slice(0, limit) : candidates;

    return {
      data,
      pagination: {
        page,
        limit,
        hasNext,
      },
    };
  }

  /**
   * Retrieves a candidate by ID
   * @param id - Candidate ID
   * @returns Candidate data
   */
  async getCandidateById(id: string): Promise<Candidate> {
    return this.candidateRepository.findCandidateById(id);
  }

  /**
   * Retrieves a candidate by email
   * @param email - Candidate email
   * @returns Candidate data
   */
  async getCandidateByEmail(email: string): Promise<Candidate> {
    const candidate =
      await this.candidateRepository.findCandidateByEmail(email);

    if (!candidate) {
      throw new NotFoundException(`Candidate with email ${email} not found`);
    }

    return candidate;
  }

  /**
   * Updates a candidate
   * @param id - Candidate ID
   * @param updateCandidateDto - Update data
   * @returns Updated candidate
   */
  async updateCandidate(
    id: string,
    updateCandidateDto: UpdateCandidateDto,
  ): Promise<Candidate> {
    // If email is being updated, check for conflicts
    if (updateCandidateDto.email) {
      const existingCandidate =
        await this.candidateRepository.findCandidateByEmail(
          updateCandidateDto.email,
        );

      if (existingCandidate && existingCandidate.id !== id) {
        throw new ConflictException(
          `Another candidate with email ${updateCandidateDto.email} already exists`,
        );
      }
    }

    return this.candidateRepository.updateCandidate(id, updateCandidateDto);
  }

  /**
   * Deletes a candidate (soft delete)
   * @param id - Candidate ID
   * @returns Deleted candidate
   */
  async deleteCandidate(id: string): Promise<Candidate> {
    return this.candidateRepository.deleteCandidate(id);
  }

  /**
   * Searches for similar candidates using AI vector similarity
   * @param searchDto - Search parameters
   * @returns Array of similar candidates with similarity scores
   */
  async searchSimilarCandidates(
    searchDto: SearchCandidatesDto,
  ): Promise<CandidateSearchResult[]> {
    const { description, skills, minSimilarity = 0.5, limit = 10 } = searchDto;

    if (!description && !skills?.length) {
      throw new BadRequestException(
        'Either description or skills must be provided for search',
      );
    }

    if (description) {
      return this.candidateRepository.findSimilarCandidates(
        description,
        minSimilarity,
        limit,
      );
    }

    if (skills?.length) {
      return this.candidateRepository.findCandidatesBySkills(
        skills,
        minSimilarity,
        limit,
      );
    }

    return [];
  }

  /**
   * Searches candidates by specific skills using vector similarity
   * @param skills - Array of skills to search for
   * @param minSimilarity - Minimum similarity threshold (0-1)
   * @param limit - Maximum number of results
   * @returns Array of candidates with matching skills
   */
  async searchCandidatesBySkills(
    skills: string[],
    minSimilarity: number = 0.6,
    limit: number = 10,
  ): Promise<CandidateSearchResult[]> {
    if (!skills?.length) {
      throw new BadRequestException('Skills array cannot be empty');
    }

    return this.candidateRepository.findCandidatesBySkills(
      skills,
      minSimilarity,
      limit,
    );
  }

  /**
   * Gets candidate statistics
   * @returns Statistics about candidates
   */
  async getCandidateStats(): Promise<CandidateStats> {
    return this.candidateRepository.getCandidateStats();
  }

  /**
   * Bulk import candidates (useful for CSV imports, etc.)
   * @param candidates - Array of candidate data
   * @returns Array of created candidates with any errors
   */
  async bulkImportCandidates(candidates: CreateCandidateDto[]): Promise<{
    successful: Candidate[];
    failed: Array<{ data: CreateCandidateDto; error: string }>;
  }> {
    const successful: Candidate[] = [];
    const failed: Array<{ data: CreateCandidateDto; error: string }> = [];

    for (const candidateData of candidates) {
      try {
        const created = await this.createCandidate(candidateData);
        successful.push(created);
      } catch (error) {
        failed.push({
          data: candidateData,
          error: error.message,
        });
      }
    }

    return { successful, failed };
  }
}
