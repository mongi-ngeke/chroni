import type { Db } from "@/prisma/db";
import type { UserRepository } from "../application/ports";
import { User } from "../domain/user";

interface UserRow {
  id: string;
  email: string;
  passwordHash: string;
}

// Les modèles Prisma ne sortent pas de l'infrastructure : on les convertit ici.
const toDomain = (row: UserRow): User => User.create(row);

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly db: Db) {}

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.db.orm.public.User.first({ email });
    return row === null ? null : toDomain(row);
  }

  async findById(id: string): Promise<User | null> {
    const row = await this.db.orm.public.User.first({ id });
    return row === null ? null : toDomain(row);
  }

  async create(user: User): Promise<void> {
    await this.db.orm.public.User.create({ id: user.id, email: user.email, passwordHash: user.passwordHash });
  }
}
