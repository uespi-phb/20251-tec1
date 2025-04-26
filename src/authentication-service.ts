import { AuthenticationError, InvalidCredentialsError, UserNotFoundError } from './errors'
import { LoadUser } from './load-user'
import { Service } from './service'
import { UserAuth } from './user-auth'

export type AuthenticationInput = {
  email: string
  password: string
}

export class AuthenticationService implements Service<AuthenticationInput, void> {
  private userAuth: UserAuth
  private loadUser: LoadUser

  constructor(userAuth: UserAuth, loadUser: LoadUser) {
    this.userAuth = userAuth
    this.loadUser = loadUser
  }

  async execute(input: AuthenticationInput): Promise<void> {
    try {
      const validCredentials = await this.userAuth.signIn(input.email, input.password)
      if (!validCredentials) throw new InvalidCredentialsError()
      const user = await this.loadUser.loadByEmail(input.email)
      if (user === undefined) throw new UserNotFoundError()
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error
      } else {
        throw new AuthenticationError('Authentication error')
      }
    }
    return Promise.resolve()
  }
}
