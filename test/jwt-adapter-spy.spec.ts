import jwt from 'jsonwebtoken'

import { JwtAdapter } from '@/jwt-adapter'
import { InvalidPayloadError, TokenError, TokenPayload } from '@/token-handler'

describe('JwtAdapter', () => {
  let payload: TokenPayload
  let secret: string
  let token: string
  let expirationInSec: number
  let signParams: object
  let signSpy: jest.Mock
  let sut: JwtAdapter

  beforeEach(() => {
    payload = { id: 12345 }
    secret = 'any_secret'
    expirationInSec = 3600
    token = 'any_jwt_token'
    signParams = { expiresIn: expirationInSec }
    signSpy = jest.spyOn(jwt, 'sign') as jest.Mock
    signSpy.mockReturnValue(token)
    sut = new JwtAdapter(secret, expirationInSec)
  })

  it('Should generate JWT token using correct payload, secret and expiration', () => {
    const jwtToken = sut.encrypt(payload)

    expect(signSpy).toHaveBeenCalledWith(payload, secret, signParams)
    expect(signSpy).toHaveBeenCalledTimes(1)
    expect(jwtToken).toEqual(token)
  })

  it('Should throw TokenError if payload is invalid', () => {
    expect(() => sut.encrypt({ id: -12345 })).toThrow(InvalidPayloadError)
    expect(() => sut.encrypt({ id: 0 })).toThrow(InvalidPayloadError)
  })

  it('Should throw TokenError if JWT throws', () => {
    signSpy.mockImplementationOnce(() => {
      throw new Error('any_jwt_error')
    })
    expect(() => sut.encrypt(payload)).toThrow(TokenError)
  })
})
