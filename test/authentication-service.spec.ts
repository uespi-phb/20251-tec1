import { mock, MockProxy } from 'jest-mock-extended'

import { AuthenticationService } from '@/authentication-service'
import { AuthenticationError, InvalidCredentialsError, UserNotFoundError } from '@/errors'
import { LoadUser } from '@/load-user'
import { SaveUser } from '@/save-user'
import { TokenEncrypter } from '@/token-handler'
import { User } from '@/user'
import { UserAuth } from '@/user-auth'

describe('AuthenticationService', () => {
  let userId: number
  let userName: string
  let email: string
  let password: string
  let token: string
  let user: User
  let userAuth: MockProxy<UserAuth>
  let loadUser: MockProxy<LoadUser>
  let saveUser: MockProxy<SaveUser>
  let tokenEncrypter: MockProxy<TokenEncrypter>
  let sut: AuthenticationService

  beforeEach(() => {
    userId = 123
    userName = 'John Doe'
    email = 'john.doe@email.com'
    password = 'any_password'
    token = 'any_token'
    user = new User(userId, userName, email)
    userAuth = mock<UserAuth>()
    userAuth.signIn.mockResolvedValue(true)
    loadUser = mock<LoadUser>()
    loadUser.loadByEmail.mockResolvedValue(user)
    saveUser = mock<SaveUser>()
    saveUser.saveToken.mockResolvedValue()
    tokenEncrypter = mock<TokenEncrypter>()
    tokenEncrypter.encrypt.mockReturnValue(token)
    sut = new AuthenticationService(userAuth, loadUser, saveUser, tokenEncrypter)
  })

  it('Should call UserAuth.signIn() with correct input', async () => {
    await sut.execute({ email, password })

    expect(userAuth.signIn).toHaveBeenCalledWith(email, password)
    expect(userAuth.signIn).toHaveBeenCalledTimes(1)
  })

  it('Should throw InvalidCredentialsError if UserAuth.signIn() returns false', async () => {
    userAuth.signIn.mockResolvedValueOnce(false)

    const promise = sut.execute({ email, password })

    await expect(promise).rejects.toThrow(InvalidCredentialsError)
  })

  it('Should throw AuthenticationError if UserAuth.signIn() throws', async () => {
    userAuth.signIn.mockRejectedValueOnce(new Error('any_error'))

    const promise = sut.execute({ email, password })

    await expect(promise).rejects.toThrow(AuthenticationError)
  })

  it('Should call LoadUser.loadByEmail() if signIn succeed', async () => {
    await sut.execute({ email, password })

    expect(loadUser.loadByEmail).toHaveBeenCalledWith(email)
  })

  it('Should throw UserNotFoundError if LoadUser.loadByEmail() fails', async () => {
    loadUser.loadByEmail.mockResolvedValueOnce(undefined)

    const promise = sut.execute({ email, password })

    await expect(promise).rejects.toThrow(UserNotFoundError)
  })

  it('Should throw AuthenticationError if LoadUser.loadByEmail() throws', async () => {
    loadUser.loadByEmail.mockRejectedValueOnce(new Error('any_error'))

    const promise = sut.execute({ email, password })

    await expect(promise).rejects.toThrow(AuthenticationError)
  })

  it('Should call TokenHandler.encrypt() with correct input', async () => {
    const payload = {
      id: user.id,
      name: user.name,
      email: user.email,
    }

    await sut.execute({ email, password })

    expect(tokenEncrypter.encrypt).toHaveBeenCalledWith(payload)
    expect(tokenEncrypter.encrypt).toHaveBeenCalledTimes(1)
  })

  it('Should throw AuthenticationError if TokenHandler.encrypt() throws', async () => {
    tokenEncrypter.encrypt.mockImplementationOnce(() => {
      throw new Error('any_error')
    })

    const promise = sut.execute({ email, password })

    await expect(promise).rejects.toThrow(AuthenticationError)
  })

  it('Should call SaveUser.saveToken() if encrypt succeeds', async () => {
    await sut.execute({ email, password })

    expect(saveUser.saveToken).toHaveBeenCalledWith(user.id, token)
    expect(saveUser.saveToken).toHaveBeenCalledTimes(1)
  })

  it('Should throw AuthenticationError if SaveUser.saveToken() throws', async () => {
    saveUser.saveToken.mockRejectedValueOnce(new Error('any_error'))

    const promise = sut.execute({ email, password })

    await expect(promise).rejects.toThrow(AuthenticationError)
  })

  it('Should returns an authentication token', async () => {
    const authToken = await sut.execute({ email, password })

    expect(authToken).toEqual(token)
  })
})
