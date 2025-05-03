export type TokenPayload = {
  id: number
}

export interface TokenEncrypter<T = TokenPayload> {
  encrypt(payload: T): string
}

export interface TokenDecrypter<T = TokenPayload> {
  decrypt(token: string): T
}

export class TokenError extends Error {
  public readonly cause?: unknown

  constructor(message: string, cause?: unknown) {
    super(message)
    this.cause = cause
  }
}

export class InvalidPayloadError extends TokenError {
  constructor(message: string) {
    super(message)
  }
}
