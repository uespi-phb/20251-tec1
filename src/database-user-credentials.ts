import { PgPromiseClient, PgPromiseClientConnectionError } from './pg-promise-client'
import { UserCredentialsValidator } from './user-credentials-validator'

export class DatabaseUserCredentials implements UserCredentialsValidator {
  constructor(private readonly pgpClient: PgPromiseClient) {}

  async signIn(email: string, password: string): Promise<boolean> {
    const sql = 'select password from ru.user where email=$1'
    try {
      const result = await this.pgpClient.oneOrNone<{ password: string }>(sql, [email])
      return result !== null ? result.password === password : false
    } catch (error) {
      if (error instanceof PgPromiseClientConnectionError) throw new DatabaseConnectionError()
      throw new DatabaseUnexpectedError()
    }
  }
}

export class DatabaseUserCredentialsError extends Error {
  constructor(message: string) {
    super(message)
  }
}

export class DatabaseConnectionError extends DatabaseUserCredentialsError {
  constructor() {
    super('Database connection error')
  }
}

export class DatabaseUnexpectedError extends DatabaseUserCredentialsError {
  constructor() {
    super('Database unexpected error')
  }
}
