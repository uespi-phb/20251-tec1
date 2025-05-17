import { mock } from 'jest-mock-extended'

import { DatabaseConnectionError, DatabaseUnexpectedError, DatabaseUserCredentials } from '@/database-user-credentials'
import { PgPromiseClient } from '@/pg-promise-client'

describe(DatabaseUserCredentials.name, () => {
  let email: string
  let password: string
  let pgpClient: PgPromiseClient
  let sut: DatabaseUserCredentials

  beforeEach(async () => {
    email = 'john.doe@email.com'
    password = 'any_password'
    pgpClient = new PgPromiseClient()
    await pgpClient.connect()
    await pgpClient.none('insert into ru.user(id,email,name,password) values ($1,$2,$3,$4);', [
      1,
      'john.doe@email.com',
      'John Doe',
      'any_password',
    ])

    sut = new DatabaseUserCredentials(pgpClient)
  })

  afterEach(async () => {
    await pgpClient.none('delete from ru.user where email=$1', [email])
  })

  it('Should validate user/password against database', async () => {
    const result = await sut.signIn(email, password)

    expect(result).toBe(true)
  })

  it('Should not validate invalid user or password against database', async () => {
    let result: boolean

    const wrongEmail = `wrong.${email}`
    result = await sut.signIn(wrongEmail, password)
    expect(result).toBe(false)

    const wrongPassword = `wrong_${password}`
    result = await sut.signIn(email, wrongPassword)
    expect(result).toBe(false)

    result = await sut.signIn(wrongEmail, wrongPassword)
    expect(result).toBe(false)
  })

  it('Should thrown DatabaseConnectionError if is not connected to database', async () => {
    pgpClient.disconnect()

    const promise = sut.signIn(email, password)

    await expect(promise).rejects.toThrow(DatabaseConnectionError)

    pgpClient.connect()
  })

  it('Should thrown DatabaseUnexpectedError if database client throws', async () => {
    const error = new Error('any_pg_promise_client_error')
    const pgpClient = mock<PgPromiseClient>()
    pgpClient.oneOrNone.mockImplementation(() => {
      throw error
    })
    const sut = new DatabaseUserCredentials(pgpClient)

    const promise = sut.signIn(email, password)

    await expect(promise).rejects.toThrow(DatabaseUnexpectedError)
  })
})
