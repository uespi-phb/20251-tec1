import { DatabaseClientParams } from '@/database-client'
import { PgClient } from '@/pg-client'
import { PgClientConnectionError } from '@/pg-client-error'

describe('PgClient', () => {
  let params: DatabaseClientParams
  let sut: PgClient

  beforeAll(async () => {
    params = {
      host: 'localhost',
      port: 5432,
      user: 'ru',
      password: 'ru',
      name: 'ru',
      schema: 'test',
    }
    sut = new PgClient(params)
    await sut.connect()
  })

  afterAll(() => {
    sut.dispose()
  })

  // const dbSchema = [
  //   { table: 'no_rows', rows: 0 },
  //   { table: 'one_row', rows: 1 },
  //   { table: 'many_rows', rows: 2 },
  // ]

  // const dbCreate = async (client: PgClient) => {
  //   for (const { table, rows } of dbSchema) {
  //     await client.queryNone(`drop table if exists test.${table}`)
  //     await client.queryNone(`create table test.${table}(id int not null, name text not null)`)
  //     for (let k = 1; k <= rows; k++) {
  //       await client.queryNone(`insert into test.${table} values($1,$2)`, [k, `name_${k}`])
  //     }
  //   }
  // }

  // const dbDrop = async (client: PgClient) => {
  //   for (const { table } of dbSchema) {
  //     await client.queryNone(`drop table if exists test.${table}`)
  //   }
  // }

  it('Should create connection string', () => {
    const uri = `${params.schema}://${params.user}:${params.password}@${params.host}:${params.port}/${params.name}`

    expect(sut.connectionUri()).toBe(uri)
  })

  it('Should connect nicely if it disconected', async () => {
    await sut.disconnect()

    expect(sut.isNotConnected()).toBe(true)
    expect(sut.isConnected()).toBe(false)

    await expect(sut.connect()).resolves.toBeUndefined()
  })

  it('Should disconnect nicely if it conected', async () => {
    expect(sut.isConnected()).toBe(true)
    await expect(sut.disconnect()).resolves.toBeUndefined()

    await sut.connect()
  })

  it('Should throw PgClientConnectionError if connection fails', async () => {
    const faillingParams = { ...params, port: 99999 }
    const sut = new PgClient(faillingParams)

    await expect(sut.connect()).rejects.toThrow(PgClientConnectionError)
  })

  it('Should execute all query methods sucessfully', async () => {
    const sqlCreate = 'create table test.person(id int not null, name text not null)'
    const sqlDrop = 'drop table test.person'

    await expect(sut.queryNone(sqlCreate)).resolves.toBeUndefined()
    await expect(sut.queryNone(sqlDrop)).resolves.toBeUndefined()
  })
})
