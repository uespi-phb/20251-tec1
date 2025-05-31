import { mock } from 'jest-mock-extended'

import { DatabaseClient, DatabaseConfig, DatabaseError } from '@/database-client'
import { PgClient } from '@/pg-client'
import { UserAccountRepository } from '@/user-account-repo'

describe('UserAccountRepository', () => {
  type UserRecord = {
    id: number
    email: string
    name: string
    password: string
  }
  let user: UserRecord
  let dbConfig: DatabaseConfig
  let dbClient: DatabaseClient
  let sut: UserAccountRepository

  beforeAll(async () => {
    user = {
      id: 1,
      email: 'john.doe@email.com',
      name: 'John Doe',
      password: 'any_password',
    }
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
    sut = new UserAccountRepository(dbClient)
  })

  afterAll(async () => {
    try {
      dbClient.disconnect()
    } finally {
      dbClient.release()
    }
  })

  const insertUser = async (user: UserRecord): Promise<void> => {
    const sql = 'insert into ru.user(id,name,email,password) values($1,$2,$3,$4)'
    await dbClient.queryNone(sql, [user.id, user.name, user.email, user.password])
  }

  const deleteUser = async (userId: number): Promise<void> => {
    const sql = 'delete from ru.user where id=$1'
    await dbClient.queryNone(sql, [userId])
  }

  it('Should load user sucessfully', async () => {
    await insertUser(user)

    const data = await sut.loadByEmail(user.email)

    expect(data).toEqual({
      id: user.id,
      email: user.email,
      name: user.name,
    })

    await deleteUser(user.id)
  })

  it('Should returns undefiend if user not found', async () => {
    const data = await sut.loadByEmail(user.email)

    expect(data).toBeUndefined()
  })

  it('Should throw if database client throws', async () => {
    const error = new Error('any_pg_client_error')
    const dbClient = mock<PgClient>()
    dbClient.queryOneOrNone.mockImplementation(() => {
      throw error
    })
    const sut = new UserAccountRepository(dbClient)

    const promise = sut.loadByEmail(user.email)

    await expect(promise).rejects.toThrow(DatabaseError)
  })
})
