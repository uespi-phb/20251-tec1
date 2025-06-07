import { mock } from 'jest-mock-extended'

import { DatabaseClient, DatabaseConfig } from '@/database-client'
import { DatabaseUserCredentials, DatabaseUserCredentialsError } from '@/database-user-credentials'
import { PgClient } from '@/pg-client'

describe(DatabaseUserCredentials.name, () => {
  type UserRecord = {
    id: number
    email: string
    name: string
  }
  let plainPassword: string
  let user: UserRecord
  let dbConfig: DatabaseConfig
  let dbClient: DatabaseClient
  let sut: DatabaseUserCredentials

  beforeAll(async () => {
    user = {
      id: 1,
      email: 'john.doe@email.com',
      name: 'John Doe',
    }
    plainPassword = 'plain_password'
    dbConfig = {
      host: 'localhost',
      port: 5432,
      user: 'ru',
      password: 'ru',
      database: 'ru',
      schema: 'ru',
      maxConnections: 1,
      connectionTimeoutInMs: 2000,
      idleTimeoutInMs: 1000,
    }

    dbClient = new PgClient(dbConfig)
    await dbClient.connect()
  })

  beforeEach(() => {
    sut = new DatabaseUserCredentials(dbClient)
  })

  afterAll(async () => {
    try {
      await dbClient.disconnect()
    } finally {
      await dbClient.release()
    }
  })

  const insertUser = async (user: UserRecord): Promise<void> => {
    const sql = 'insert into ru.user(id,name,email,password) values($1,$2,$3,$4)'
    await dbClient.queryNone(sql, [user.id, user.name, user.email, plainPassword])
  }

  const deleteUser = async (userId: number): Promise<void> => {
    const sql = 'delete from ru.user where id=$1'
    await dbClient.queryNone(sql, [userId])
  }

  it('Should validate user/password against database', async () => {
    await insertUser(user)

    const result = await sut.signIn(user.email, plainPassword)
    expect(result).toBe(true)

    await deleteUser(user.id)
    const data = await dbClient.queryAny('select * from ru.user')
    expect(data).toHaveLength(0)
  })

  it('Should not validate invalid user or password against database', async () => {
    let result: boolean

    const wrongEmail = `wrong.${user.email}`
    result = await sut.signIn(wrongEmail, plainPassword)
    expect(result).toBe(false)

    const wrongPassword = `wrong_${plainPassword}`
    result = await sut.signIn(user.email, wrongPassword)
    expect(result).toBe(false)

    result = await sut.signIn(wrongEmail, wrongPassword)
    expect(result).toBe(false)
  })

  it('Should thrown DatabaseUserCredentialsError if is not connected to database', async () => {
    dbClient.disconnect()

    const promise = sut.signIn(user.email, plainPassword)

    await expect(promise).rejects.toThrow(DatabaseUserCredentialsError)

    dbClient.connect()
  })

  it('Should thrown DatabaseUserCredentialsError if database client throws', async () => {
    const error = new Error('any_pg_client_error')
    const pgpClient = mock<PgClient>()
    pgpClient.queryOneOrNone.mockImplementation(() => {
      throw error
    })
    const sut = new DatabaseUserCredentials(pgpClient)

    const promise = sut.signIn(user.email, plainPassword)

    await expect(promise).rejects.toThrow(DatabaseUserCredentialsError)
  })
})
