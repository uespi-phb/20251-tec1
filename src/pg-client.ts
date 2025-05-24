import { Pool } from 'pg'

import { DatabaseClientParams } from './database-client'
import { PgClientConnectionError } from './pg-client-error'

export class PgClient {
  private readonly params: DatabaseClientParams
  private readonly uri: string
  private poll?: Pool

  constructor(params: DatabaseClientParams) {
    this.params = params
    this.uri = this.makeConnectioUri(params)
    this.poll = undefined
  }

  private makeConnectioUri({ schema, host, port, name, user, password }: DatabaseClientParams): string {
    return `${schema ?? 'public'}://${user}:${password}@${host}:${port}/${name}`
  }

  async dispose(): Promise<void> {
    this.poll?.end()
  }

  connectionUri(): string {
    return this.uri
  }

  isConnected(): boolean {
    return this.poll !== undefined
  }

  isNotConnected(): boolean {
    return this.poll === undefined
  }

  async connect(): Promise<void> {
    const params = {
      host: this.params.host,
      port: this.params.port,
      database: this.params.name,
      user: this.params.user,
      password: this.params.password,
    }

    try {
      this.poll = new Pool(params)
      await this.poll.query('select 1')
    } catch {
      this.poll = undefined
      throw new PgClientConnectionError()
    }
  }

  async disconnect(): Promise<void> {
    await this.poll?.end()
    this.poll = undefined
  }

  async queryNone(query: string, params?: unknown[]): Promise<void> {
    await this.poll?.query(query, params)
  }
}
