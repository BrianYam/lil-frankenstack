import { Inject, Injectable } from '@nestjs/common';
import { eq, and, desc } from 'drizzle-orm';
import { DB_PROVIDER } from '@/modules/database/database.module';
import { apiKeysTable } from '@/modules/database/schema';
import { DrizzleDB, ApiKey, NewApiKey } from '@/types';

@Injectable()
export class ApiKeyRepository {
  constructor(@Inject(DB_PROVIDER) private readonly db: DrizzleDB) {}

  findAll(): Promise<ApiKey[]> {
    return this.db.query.apiKeysTable.findMany({
      orderBy: [desc(apiKeysTable.createdAt)],
    });
  }

  async findById(id: string): Promise<ApiKey | null> {
    return this.db.query.apiKeysTable.findFirst({
      where: eq(apiKeysTable.id, id),
    });
  }

  async findByKey(hashedKey: string): Promise<ApiKey | null> {
    return this.db.query.apiKeysTable.findFirst({
      where: eq(apiKeysTable.key, hashedKey),
    });
  }

  async findActiveByKey(hashedKey: string): Promise<ApiKey | null> {
    return this.db.query.apiKeysTable.findFirst({
      where: and(
        eq(apiKeysTable.key, hashedKey),
        eq(apiKeysTable.isActive, true),
      ),
    });
  }

  async create(data: NewApiKey): Promise<ApiKey> {
    const [apiKey] = await this.db
      .insert(apiKeysTable)
      .values(data)
      .returning();
    return apiKey;
  }

  async update(id: string, data: Partial<ApiKey>): Promise<ApiKey | null> {
    const [updated] = await this.db
      .update(apiKeysTable)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(apiKeysTable.id, id))
      .returning();
    return updated || null;
  }

  async updateLastUsed(id: string): Promise<void> {
    await this.db
      .update(apiKeysTable)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiKeysTable.id, id));
  }

  async delete(id: string): Promise<ApiKey | null> {
    const [deleted] = await this.db
      .delete(apiKeysTable)
      .where(eq(apiKeysTable.id, id))
      .returning();
    return deleted || null;
  }

  async deactivate(id: string): Promise<ApiKey | null> {
    return this.update(id, { isActive: false });
  }
}
