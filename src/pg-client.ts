import { Pool, QueryResult, DatabaseError as PgDatabaseError, PoolConfig, PoolClient } from 'pg'

import {
  DatabaseClient,
  DatabaseConfig,
  DatabaseError,
  DatabaseConnectionError,
  DatabaseQueryResultError,
  DatabaseNetworkError,
  DatabaseUnexpectedError,
  DatabaseTransactionCallback,
} from './database-client'

enum ExpectedRows {
  none,
  oneOrNone,
  one,
  oneOrMany,
  any,
}

export class PgClient implements DatabaseClient {
  private readonly configParams: DatabaseConfig
  private readonly uri: string
  private pool: Pool | PoolClient
  private connected: boolean
  private rowsAffected: number
  private transactional: boolean
  private debug: boolean

  constructor(config: DatabaseConfig) {
    this.configParams = config
    this.uri = this.buildConnectioUri(config)
    this.pool = new Pool(this.createPoolConfig())
    this.connected = false
    this.rowsAffected = 0
    this.transactional = false
    this.debug = false
  }

  private buildConnectioUri(config: DatabaseConfig): string {
    let { host, port, database, user, password } = config
    return `postgresql://${user}:${password}@${host}:${port}/${database}`
  }

  private createPoolConfig(): PoolConfig {
    const defaultConnectionTimeoutInMs = 5000
    const defaultIdleTimeoutInMs = 60000
    const defaultQueryTimeoutInMs = 60000
    const defaultStatementTimeoutInMs = 10000
    const defaultIdleInTransactionSessionTimeoutInMs = 10000
    const defaultKeepAliveInitialDelayInMs = 10000
    return {
      host: this.configParams.host,
      port: this.configParams.port,
      database: this.configParams.database,
      user: this.configParams.user,
      password: this.configParams.password,

      max: this.configParams.maxConnections ?? 10,
      min: 0,

      connectionTimeoutMillis: this.configParams.connectionTimeoutInMs ?? defaultConnectionTimeoutInMs,
      idleTimeoutMillis: this.configParams.idleTimeoutInMs ?? defaultIdleTimeoutInMs,

      query_timeout: defaultQueryTimeoutInMs,
      statement_timeout: defaultStatementTimeoutInMs,
      idle_in_transaction_session_timeout: defaultIdleInTransactionSessionTimeoutInMs,

      keepAlive: true,
      keepAliveInitialDelayMillis: defaultKeepAliveInitialDelayInMs,
    }
  }

  get db(): Pool | PoolClient {
    if (!this.connected) throw new DatabaseConnectionError('Database connection not established')
    return this.pool
  }

  get config(): DatabaseConfig {
    return this.configParams
  }

  debugOn(): void {
    this.debug = true
  }

  debugOff(): void {
    this.debug = false
  }

  connectionUri(): string {
    return this.uri
  }

  isConnected(): boolean {
    return this.connected
  }

  isNotConnected(): boolean {
    return !this.connected
  }

  isTransactional(): boolean {
    return this.transactional
  }

  async connect(): Promise<void> {
    let client: PoolClient | undefined

    try {
      client = await (this.pool as Pool).connect()
      const dummyQuery = 'select 1'
      await client.query(dummyQuery)
      this.connected = true
    } catch {
      this.connected = false
      throw new DatabaseConnectionError()
    } finally {
      client?.release()
    }
  }

  async disconnect(): Promise<void> {
    this.connected = false
    this.rowsAffected = 0
  }

  async release(): Promise<void> {
    await this.disconnect()
    await (this.pool as Pool).end()
  }

  private async queryWithExpectation<T extends Record<string, unknown>>(
    expectedRows: ExpectedRows,
    query: string,
    params?: unknown[],
  ): Promise<QueryResult> {
    if (this.debug) console.log(query, params)
    try {
      const queryResult = await this.db.query<T>(query, params)
      this.rowsAffected = queryResult.rowCount ?? 0

      this.validateQueryResult(queryResult, expectedRows)
      return queryResult
    } catch (error) {
      if (error instanceof PgDatabaseError) throw new DatabaseError(error.message, error)
      if (error instanceof DatabaseError || error instanceof DatabaseNetworkError) throw error
      throw new DatabaseUnexpectedError(error as Error)
    }
  }

  private validateQueryResult(queryResult: QueryResult, expectedRows: ExpectedRows): void {
    const rowCount = queryResult.rows.length

    switch (expectedRows) {
      case ExpectedRows.none:
        if (rowCount !== 0) {
          throw new DatabaseQueryResultError('No return data was expected')
        }
        break
      case ExpectedRows.one:
        if (rowCount !== 1) {
          throw new DatabaseQueryResultError('Exactly one row was expected')
        }
        break
      case ExpectedRows.oneOrNone:
        if (rowCount > 1) {
          throw new DatabaseQueryResultError('Multiple rows were not expected')
        }
        break
      case ExpectedRows.oneOrMany:
        if (rowCount === 0) {
          throw new DatabaseQueryResultError('No data returned from the query')
        }
        break
    }
  }

  get affectedRows(): number {
    return this.rowsAffected
  }

  async queryNone(query: string, params?: unknown[]): Promise<void> {
    await this.queryWithExpectation(ExpectedRows.none, query, params)
  }

  async queryOne<T extends Record<string, unknown>>(query: string, params?: unknown[]): Promise<T> {
    const queryResult = await this.queryWithExpectation<T>(ExpectedRows.one, query, params)
    return queryResult.rows[0]
  }

  async queryOneOrNone<T extends Record<string, unknown>>(query: string, params?: unknown[]): Promise<T | null> {
    const queryResult = await this.queryWithExpectation<T>(ExpectedRows.oneOrNone, query, params)
    return queryResult.rows.length == 1 ? queryResult.rows[0] : null
  }

  async queryOneOrMany<T extends Record<string, unknown>>(query: string, params?: unknown[]): Promise<T[]> {
    const queryResult = await this.queryWithExpectation<T>(ExpectedRows.oneOrMany, query, params)
    return queryResult.rows
  }

  async queryAny<T extends Record<string, unknown>>(query: string, params?: unknown[]): Promise<T[]> {
    const queryResult = await this.queryWithExpectation<T>(ExpectedRows.any, query, params)
    return queryResult.rows
  }

  async transaction<T = void>(callback: DatabaseTransactionCallback<T>): Promise<T> {
    if (this.transactional) throw new DatabaseError('Nested transactions are not supported')

    let client: PoolClient | undefined
    const pool = this.db as Pool
    try {
      client = await pool.connect()
      this.pool = client
      this.transactional = true
      await client.query('BEGIN')
      const result = await callback(this)
      await client.query('COMMIT')
      return result
    } catch (error) {
      await client?.query('ROLLBACK')
      throw error
    } finally {
      client?.release()
      this.transactional = false
      this.pool = pool
    }
  }
}
