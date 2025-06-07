import { DatabaseClient } from './database-client'
import { UserCredentialsValidator } from './user-credentials-validator'

export class DatabaseUserCredentials implements UserCredentialsValidator {
  constructor(private readonly dbClient: DatabaseClient) {}

  async signIn(email: string, password: string): Promise<boolean> {
    const sql = 'select password from ru.user where email=$1'
    try {
      const result = await this.dbClient.queryOneOrNone<{ password: string }>(sql, [email])
      if (result === null) return false
      return result.password === password
    } catch (error) {
      throw new DatabaseUserCredentialsError((error as Error).message)
    }
  }
}

export class DatabaseUserCredentialsError extends Error {
  constructor(message: string) {
    super(message)
  }
}
