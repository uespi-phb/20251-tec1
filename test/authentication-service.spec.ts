import { mock, MockProxy } from 'jest-mock-extended'

import { AuthenticationService } from '@/authentication-service'
import { AuthenticationError, InvalidCredentialsError, UserNotFoundError } from '@/errors'
import { LoadUser } from '@/load-user'
import { User } from '@/user'
import { UserAuth } from '@/user-auth'

describe('AuthenticationService', () => {
  let userId: number
  let userName: string
  let email: string
  let password: string
  let user: User
  let userAuth: MockProxy<UserAuth>
  let loadUser: MockProxy<LoadUser>
  let sut: AuthenticationService

  beforeEach(() => {
    userId = 123
    userName = 'John Doe'
    email = 'john.doe@email.com'
    password = 'any_password'
    user = new User(userId, userName, email)
    userAuth = mock<UserAuth>()
    userAuth.signIn.mockResolvedValue(true)
    loadUser = mock<LoadUser>()
    loadUser.loadByEmail.mockResolvedValue(user)
    sut = new AuthenticationService(userAuth, loadUser)
  })

  it('Should call signIn with correct input', async () => {
    await sut.execute({ email, password })

    expect(userAuth.signIn).toHaveBeenCalledWith(email, password)
    expect(userAuth.signIn).toHaveBeenCalledTimes(1)
  })

  it('Should throw InvalidCredentialsError if signIn returns false', async () => {
    userAuth.signIn.mockResolvedValueOnce(false)

    const promise = sut.execute({ email, password })

    await expect(promise).rejects.toThrow(InvalidCredentialsError)
  })

  it('Should throw AuthenticationError if signIn returns throws', async () => {
    const error = new Error('any_error')
    userAuth.signIn.mockRejectedValueOnce(error)

    const promise = sut.execute({ email, password })

    await expect(promise).rejects.toThrow(AuthenticationError)
  })

  it('Should call loadByEmail if signIn succeed', async () => {
    await sut.execute({ email, password })

    expect(loadUser.loadByEmail).toHaveBeenCalledWith(email)
  })

  it('Should throw UserNotFoundError if loadByEmail fails', async () => {
    loadUser.loadByEmail.mockResolvedValueOnce(undefined)

    const promise = sut.execute({ email, password })

    await expect(promise).rejects.toThrow(UserNotFoundError)
  })

  it('Should throw AuthenticationError if loadByEmail throws', async () => {
    const error = new Error('any_error')
    loadUser.loadByEmail.mockRejectedValueOnce(error)

    const promise = sut.execute({ email, password })

    await expect(promise).rejects.toThrow(AuthenticationError)
  })
})
