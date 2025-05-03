import jwt from 'jsonwebtoken'

import { InvalidPayloadError, TokenEncrypter, TokenError, TokenPayload } from './token-handler'

export class JwtAdapter implements TokenEncrypter<TokenPayload> {
  constructor(
    private readonly secret: string,
    private readonly expiresInSec: number,
  ) {}

  encrypt(payload: TokenPayload): string {
    try {
      if (payload.id <= 0) throw new InvalidPayloadError('Invalid payload')
      return jwt.sign(payload, this.secret, { expiresIn: this.expiresInSec })
    } catch (error) {
      if (error instanceof TokenError) {
        throw error
      } else {
        throw new TokenError('Error encrypting JWT token', error)
      }
    }
  }
}
