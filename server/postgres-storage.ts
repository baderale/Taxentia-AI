import { type IStorage } from './storage';
import { db } from './db';
import { users, taxQueries, authorities, ircSyncStatus } from '@shared/schema';
import { type User, type InsertUser, type TaxQuery, type InsertTaxQuery,
         type Authority, type InsertAuthority, type IrcSyncStatus,
         type InsertIrcSyncStatus } from '@shared/schema';
import { eq, desc, inArray } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export class PostgresStorage implements IStorage {
  async initialize(): Promise<void> {
    try {
      await db.select().from(users).limit(1);
      console.log("PostgreSQL storage initialized successfully");
    } catch (error) {
      console.error("Failed to initialize PostgreSQL storage:", error);
      throw error;
    }
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users)
      .where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users)
      .where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const result = await db.insert(users).values({
        id: randomUUID(),
        ...insertUser,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();

      return result[0];
    } catch (error: any) {
      // Handle unique constraint violations
      if (error.code === '23505') {
        if (error.constraint?.includes('email')) {
          throw new Error('Email already in use');
        }
        if (error.constraint?.includes('username')) {
          throw new Error('Username already taken');
        }
      }
      throw error;
    }
  }

  // Tax query methods
  async getTaxQuery(id: string): Promise<TaxQuery | undefined> {
    const result = await db.select().from(taxQueries)
      .where(eq(taxQueries.id, id)).limit(1);
    return result[0];
  }

  async getTaxQueriesByUser(userId: string): Promise<TaxQuery[]> {
    return await db.select().from(taxQueries)
      .where(eq(taxQueries.userId, userId))
      .orderBy(desc(taxQueries.createdAt));
  }

  async createTaxQuery(insertQuery: InsertTaxQuery): Promise<TaxQuery> {
    const result = await db.insert(taxQueries).values({
      id: randomUUID(),
      ...insertQuery,
      createdAt: new Date().toISOString(),
    }).returning();

    return result[0];
  }

  // Authority methods
  async getAuthority(id: string): Promise<Authority | undefined> {
    const result = await db.select().from(authorities)
      .where(eq(authorities.id, id)).limit(1);
    return result[0];
  }

  async getAuthorities(sourceTypes?: string[]): Promise<Authority[]> {
    if (sourceTypes && sourceTypes.length > 0) {
      return await db.select().from(authorities)
        .where(inArray(authorities.sourceType, sourceTypes));
    }
    return await db.select().from(authorities);
  }

  async createAuthority(insertAuthority: InsertAuthority): Promise<Authority> {
    const result = await db.insert(authorities).values({
      id: randomUUID(),
      ...insertAuthority,
    }).returning();

    return result[0];
  }

  // IRC sync status methods
  async getIrcSyncStatus(): Promise<IrcSyncStatus | undefined> {
    const result = await db.select().from(ircSyncStatus).limit(1);
    return result[0];
  }

  async updateIrcSyncStatus(insertStatus: InsertIrcSyncStatus): Promise<IrcSyncStatus> {
    const existing = await this.getIrcSyncStatus();

    if (existing) {
      const result = await db.update(ircSyncStatus)
        .set({
          ...insertStatus,
          updatedAt: new Date(),
        })
        .where(eq(ircSyncStatus.id, existing.id))
        .returning();
      return result[0];
    } else {
      const result = await db.insert(ircSyncStatus).values({
        id: randomUUID(),
        ...insertStatus,
        updatedAt: new Date(),
      }).returning();
      return result[0];
    }
  }
}
