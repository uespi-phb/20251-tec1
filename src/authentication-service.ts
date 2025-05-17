import { AuthenticationError, InvalidCredentialsError, UserNotFoundError } from './errors'
import { LoadUser } from './load-user'
import { SaveUser } from './save-user'
import { Service } from './service'
import { TokenEncrypter } from './token-handler'
import { UserCredentialsValidator } from './user-credentials-validator'

export type AuthenticationInput = {
  email: string
  password: string
}

export type AuthenticationOutput = string

export class AuthenticationService implements Service<AuthenticationInput, AuthenticationOutput> {
  // private userAuth: UserAuth
  // private loadUser: LoadUser
  // private saveUser: SaveUser
  // private tokenHandler: TokenHandler

  // constructor(userAuth: UserAuth, loadUser: LoadUser, loadUser: LoadUser, tokenHandler: TokenHandler) {
  //   this.userAuth = userAuth
  //   this.loadUser = loadUser
  //   this.saveUser = saveUser
  //   this.tokenHandler = tokenHandler
  // }

  constructor(
    private readonly userCredentialsValidator: UserCredentialsValidator,
    private readonly loadUser: LoadUser,
    private readonly saveUser: SaveUser,
    private readonly tokenEncrypter: TokenEncrypter,
  ) {}

  async execute(input: AuthenticationInput): Promise<AuthenticationOutput> {
    try {
      const validCredentials = await this.userCredentialsValidator.signIn(input.email, input.password)
      if (!validCredentials) throw new InvalidCredentialsError()
      const user = await this.loadUser.loadByEmail(input.email)
      if (user === undefined) throw new UserNotFoundError()
      const payload = {
        id: user.id,
        name: user.name,
        email: user.email,
      }
      const token = this.tokenEncrypter.encrypt(payload)
      await this.saveUser.saveToken(user.id, token)
      return token
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error
      } else {
        throw new AuthenticationError('Authentication error')
      }
    }
  }
}
