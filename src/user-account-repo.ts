import { DatabaseClient, DatabaseError } from './database-client'
import { LoadUser } from './load-user'
import { User } from './user'

export class UserAccountRepository implements LoadUser {
  constructor(private readonly dbClient: DatabaseClient) {}

  async loadByEmail(email: string): Promise<User | undefined> {
    type UserRecord = {
      id: number
      email: string
      name: string
    }
    const sql = 'select id,name,email from ru.user where email=$1'
    try {
      const user = await this.dbClient.queryOneOrNone<UserRecord>(sql, [email])
      if (!user) return undefined
      return new User(user.id, user.name, user.email)
    } catch (error) {
      throw new DatabaseError('Database client error', error as Error)
    }
  }
}
