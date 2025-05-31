import { DatabaseConfig, DatabaseConnectionError, DatabaseError, DatabaseQueryResultError } from '@/database-client'
import { PgClient } from '@/pg-client'

type TableRecord = {
  id: number
  name: string
}

describe('PgClient', () => {
  let testSchema: string
  let testTableNoRows: string
  let testTableOneRow: string
  let testTableManyRows: string
  let testQuery: Record<string, string>
  let testData: Record<string, unknown>[]
  let dbConfig: DatabaseConfig
  let sut: PgClient

  beforeAll(async () => {
    testSchema = 'test'
    testTableNoRows = `${testSchema}.no_rows`
    testTableOneRow = `${testSchema}.one_row`
    testTableManyRows = `${testSchema}.many_rows`
    testQuery = {
      none: `select id,name from ${testTableNoRows}`,
      one: `select id,name from ${testTableOneRow}`,
      many: `select id,name from ${testTableManyRows}`,
    }
    testData = [
      { id: 1, name: 'name_1' },
      { id: 2, name: 'name_2' },
      { id: 3, name: 'name_3' },
    ]

    dbConfig = {
      host: 'localhost',
      port: 5432,
      user: 'ru',
      password: 'ru',
      database: 'ru',
      schema: testSchema,
      maxConnections: 1,
      connectionTimeoutInMs: 2000,
      idleTimeoutInMs: 1000,
    }
    sut = new PgClient(dbConfig)
    await sut.connect()

    await schemaCreate(sut)
  })

  afterAll(async () => {
    try {
      await schemaDrop(sut)
    } catch (error) {
      console.error('Error droping schema:', error)
    } finally {
      await sut.release()
    }
  })

  const schemaCreate = async (client: PgClient): Promise<void> => {
    const schemaTables = [
      { table: testTableNoRows, rows: 0 },
      { table: testTableOneRow, rows: 1 },
      { table: testTableManyRows, rows: testData.length },
    ]

    await client.queryNone(`drop schema if exists ${testSchema} cascade`)
    await client.queryNone(`create schema if not exists ${testSchema}`)

    for (const { table, rows } of schemaTables) {
      await client.queryNone(`create table ${table}(id int not null, name text not null)`)
      for (let k = 1; k <= rows; k++) {
        const record = testData[k - 1]
        await client.queryNone(`insert into ${table} values($1,$2)`, [record.id, record.name])
      }
    }
  }

  const schemaDrop = async (client: PgClient): Promise<void> => {
    await client.queryNone(`drop table if exists ${testSchema} cascade`)
  }

  it('Should create connection string', () => {
    const uri = `postgresql://${dbConfig.user}:${dbConfig.password}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`

    expect(sut.connectionUri()).toBe(uri)
  })

  it('Should disconnect and connect properly', async () => {
    await sut.disconnect()
    expect(sut.isConnected()).toBe(false)
    expect(sut.isNotConnected()).toBe(true)

    await sut.connect()
    expect(sut.isConnected()).toBe(true)
    expect(sut.isNotConnected()).toBe(false)
  })

  it('Should close conections after call release()', async () => {
    const sut = new PgClient(dbConfig)

    await sut.release()

    await expect(sut.queryOne('select 1')).rejects.toThrow(DatabaseConnectionError)
  })

  it('Should throw DatabaseConnectionError if connection fails', async () => {
    const faillingParams = { ...dbConfig, database: 'invalid_database' }
    const sut = new PgClient(faillingParams)

    await expect(sut.connect()).rejects.toThrow(DatabaseConnectionError)

    await sut.disconnect()
  })

  it('queryNone should resolve if no rows, and reject when one or more rows are returned', async () => {
    await expect(sut.queryNone(testQuery.none)).resolves.toBeUndefined()
    await expect(sut.queryNone(testQuery.one)).rejects.toThrow(DatabaseQueryResultError)
    await expect(sut.queryNone(testQuery.many)).rejects.toThrow(DatabaseQueryResultError)
  })

  it('queryOne resolves with a single row, and rejects when zero or multiple rows are returned', async () => {
    await expect(sut.queryOne(testQuery.one)).resolves.toEqual(testData.at(0))
    await expect(sut.queryOne(testQuery.none)).rejects.toThrow(DatabaseQueryResultError)
    await expect(sut.queryOne(testQuery.many)).rejects.toThrow(DatabaseQueryResultError)
  })

  it('queryOneOrNone resolves with a single or no row, and rejects when multiple rows are returned', async () => {
    await expect(sut.queryOneOrNone(testQuery.one)).resolves.toEqual(testData.at(0))
    await expect(sut.queryOneOrNone(testQuery.none)).resolves.toBeNull()
    await expect(sut.queryOneOrNone(testQuery.many)).rejects.toThrow(DatabaseQueryResultError)
  })

  it('queryMany resolves with a single or many rows, and rejects when no rows are returned', async () => {
    await expect(sut.queryOneOrMany(testQuery.one)).resolves.toEqual(testData.slice(0, 1))
    await expect(sut.queryOneOrMany(testQuery.many)).resolves.toEqual(testData)
    await expect(sut.queryOneOrMany(testQuery.none)).rejects.toThrow(DatabaseQueryResultError)
  })

  it('queryAny resolves with no rows, single rows or multiple rows are returned', async () => {
    await expect(sut.queryAny(testQuery.none)).resolves.toEqual([])
    await expect(sut.queryAny(testQuery.one)).resolves.toEqual(testData.slice(0, 1))
    await expect(sut.queryAny(testQuery.many)).resolves.toEqual(testData)
  })

  it('affectedRows should return the number of affected or returned rows by last query', async () => {
    await sut.queryAny(testQuery.none)
    expect(sut.affectedRows).toBe(0)

    await sut.queryAny(testQuery.one)
    expect(sut.affectedRows).toBe(1)

    await sut.queryAny(testQuery.many)
    expect(sut.affectedRows).toBe(testData.length)
  })

  it('Should throw DatabaseError when throws generic database error', async () => {
    const sqlInvalid = 'select * where 1=1'

    await expect(sut.queryAny(sqlInvalid)).rejects.toThrow(DatabaseError)
  })

  it('Should execute callback and commit transaction on success', async () => {
    await sut.transaction(async (tx) => {
      const sql = `insert into ${testTableNoRows}(id,name) values($1,$2)`
      for (const data of testData) {
        tx.queryNone(sql, [data.id, data.name])
      }
    })
    let data = await sut.queryAny<TableRecord>(`select id,name from ${testTableNoRows}`)
    expect(data).toEqual(testData)

    await sut.queryNone(`delete from ${testTableNoRows}`)
    data = await sut.queryAny<TableRecord>(`select id,name from ${testTableNoRows}`)
    expect(data).toHaveLength(0)
  })

  it('Should execute callback and rollback transaction on success', async () => {
    const promise = sut.transaction(async (tx) => {
      const sql = `insert into ${testTableNoRows}(id,name) values($1,$2)`
      for (const data of testData) {
        tx.queryNone(sql, [data.id, data.name])
      }
      throw new Error('any_transaction_error')
    })
    await expect(promise).rejects.toThrow()

    const data = await sut.queryAny<TableRecord>(`select id,name from ${testTableNoRows}`)
    expect(data).toHaveLength(0)
  })

  it('Should throw if transaction is called within another transaction', async () => {
    const promise = sut.transaction(async (tx) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      await tx.transaction(async (tx) => {})
    })
    await expect(promise).rejects.toThrow(DatabaseError)
  })
})
