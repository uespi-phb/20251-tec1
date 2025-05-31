export type DatabaseTransactionCallback<T> = (client: DatabaseClient) => Promise<T>

export interface DatabaseClient {
  connectionUri(): string
  connect(): Promise<void>
  disconnect(): Promise<void>
  release(): Promise<void>

  isConnected(): boolean
  isNotConnected(): boolean
  isTransactional(): boolean

  get config(): DatabaseConfig
  get affectedRows(): number

  queryNone(query: string, params?: unknown[]): Promise<void>
  queryOne<T extends Record<string, unknown>>(query: string, params?: unknown[]): Promise<T>
  queryOneOrNone<T extends Record<string, unknown>>(query: string, params?: unknown[]): Promise<T | null>
  queryOneOrMany<T extends Record<string, unknown>>(query: string, params?: unknown[]): Promise<T[]>
  queryAny<T extends Record<string, unknown>>(query: string, params?: unknown[]): Promise<T[]>

  transaction<T = void>(callback: DatabaseTransactionCallback<T>): Promise<T>
}

export interface DatabaseQueryLogger {
  logQuery(query: string, params?: unknown[], duration?: number): void
}

export interface DatabaseErrorLogger {
  logError(error: Error, query?: string): void
}

export interface DatabaseConfig {
  host: string
  port: number
  user: string
  password: string
  database: string
  schema?: string
  maxConnections?: number
  connectionTimeoutInMs?: number
  idleTimeoutInMs?: number
}

export class DatabaseError extends Error {
  public readonly error?: Error

  constructor(message: string, error?: Error) {
    super(`Database: ${message}`)
    this.error = error
  }
}

export class DatabaseNetworkError extends Error {
  public readonly error?: Error
  constructor(message: string, error?: Error) {
    super(message)
    this.error = error
  }
}

export class DatabaseConnectionError extends DatabaseError {
  constructor(message?: string, error?: Error) {
    if (!message) {
      message = 'connection error'
    }
    super(message, error)
  }
}

export class DatabaseQueryResultError extends DatabaseError {
  constructor(message: string, error?: Error) {
    super(message, error)
  }
}

export class DatabaseSintaxError extends DatabaseError {
  constructor(message: string, error?: Error) {
    super(message, error)
  }
}

export class DatabaseUnexpectedError extends DatabaseError {
  constructor(error?: Error) {
    super('unexpected error', error)
  }
}
