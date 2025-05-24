export interface DatabaseClient {
  connectionUri(): string
  connect(): Promise<void>
  disconnect(): Promise<void>
  dispose(): Promise<void>

  isConnected(): boolean
  isNotConnected(): boolean

  queryNone(query: string, params?: unknown[]): Promise<void>
  queryOne<T>(query: string, params?: unknown[]): Promise<T>
  queryOneOrNone<T>(query: string, params?: unknown[]): Promise<T | null>
  queryMany<T>(query: string, params?: unknown[]): Promise<T[]>
  queryAny<T>(query: string, params?: unknown[]): Promise<T[]>
}

export type DatabaseClientParams = {
  host: string
  port: number
  user: string
  password: string
  name: string
  schema?: string
}
