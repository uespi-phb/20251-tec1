import pgPromise, { IDatabase, IMain } from 'pg-promise'

export class PgPromiseClient {
  private readonly pgp: IMain
  private db?: IDatabase<unknown>

  constructor() {
    this.pgp = pgPromise()
    this.db = undefined
  }

  isConnected(): boolean {
    return this.db !== undefined
  }

  async connect(): Promise<void> {
    const uri = `ru://ru:ru@localhost:5432/ru`
    this.db = this.pgp(uri)
    await this.db.one('select 1 as value')
    return Promise.resolve()
  }

  async disconnect(): Promise<void> {
    if (this.isConnected()) {
      this.pgp.end()
      this.db = undefined
    }
  }

  async one<T = unknown>(query: string, params?: unknown[]): Promise<T> {
    if (this.db === undefined) {
      throw new PgPromiseClientConnectionError('Connection Error')
    }
    return this.db.one<T>(query, params)
  }

  async none(query: string, params?: unknown[]): Promise<void> {
    if (this.db === undefined) {
      throw new PgPromiseClientConnectionError('Connection Error')
    }
    await this.db.none(query, params)
  }

  async oneOrNone<T = unknown>(query: string, params?: unknown[]): Promise<T | null> {
    if (this.db === undefined) {
      throw new PgPromiseClientConnectionError('Connection Error')
    }
    return await this.db.oneOrNone<T>(query, params)
  }
}

export class PgPromiseClientError extends Error {
  constructor(message: string) {
    super(message)
  }
}

export class PgPromiseClientConnectionError extends PgPromiseClientError {
  constructor(message: string) {
    super(message)
  }
}
