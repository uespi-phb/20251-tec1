import jwt from 'jsonwebtoken'

import { JwtAdapter } from '@/jwt-adapter'
import { InvalidPayloadError, TokenError, TokenPayload } from '@/token-handler'

jest.mock('jsonwebtoken')

describe('JwtAdapter', () => {
  let payload: TokenPayload
  let secret: string
  let token: string
  let expirationInSec: number
  let signParams: object
  let mockedJwt: jest.Mocked<typeof jwt>
  let sut: JwtAdapter

  beforeEach(() => {
    mockedJwt = jwt as jest.Mocked<typeof jwt>
    payload = { id: 12345 }
    secret = 'any_secret'
    expirationInSec = 3600
    token = 'any_jwt_token'
    signParams = { expiresIn: expirationInSec }
    mockedJwt.sign.mockImplementation(() => token)
    sut = new JwtAdapter(secret, expirationInSec)
  })

  it('Should generate JWT token using correct payload, secret and expiration', () => {
    const jwtToken = sut.encrypt(payload)

    expect(mockedJwt.sign).toHaveBeenCalledWith(payload, secret, signParams)
    expect(mockedJwt.sign).toHaveBeenCalledTimes(1)
    expect(jwtToken).toEqual(token)
  })

  it('Should throw TokenError if payload is invalid', () => {
    expect(() => sut.encrypt({ id: -12345 })).toThrow(InvalidPayloadError)
    expect(() => sut.encrypt({ id: 0 })).toThrow(InvalidPayloadError)
  })

  it('Should throw TokenError if JWT throws', () => {
    mockedJwt.sign.mockImplementationOnce(() => {
      throw new Error('any_jwt_error')
    })
    expect(() => sut.encrypt(payload)).toThrow(TokenError)
  })
})
