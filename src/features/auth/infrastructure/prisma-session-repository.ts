import type { Db } from "@/prisma/db";
import type { SessionRepository } from "../application/ports";
import { Session } from "../domain/session";

export class PrismaSessionRepository implements SessionRepository {
  constructor(private readonly db: Db) {}

  async create(session: Session): Promise<void> {
    await this.db.orm.public.Session.create({
      id: session.id,
      userId: session.userId,
      expiresAt: session.expiresAt,
    });
  }

  async findById(id: string): Promise<Session | null> {
    const row = await this.db.orm.public.Session.first({ id });
    return row === null ? null : Session.restore({ id: row.id, userId: row.userId, expiresAt: row.expiresAt });
  }

  async delete(id: string): Promise<void> {
    await this.db.orm.public.Session.where({ id }).deleteAll();
  }
}
