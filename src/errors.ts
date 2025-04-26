export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message)
  }
}

export class InvalidCredentialsError extends AuthenticationError {
  constructor() {
    super('Invalid user credentials')
  }
}

export class UserNotFoundError extends AuthenticationError {
  constructor() {
    super('User not found')
  }
}
