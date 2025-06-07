import bcrypt from 'bcrypt'

import { BcryptHarsher } from '@/bcrypt-harsher'
import { HarsherError } from '@/harsher'

jest.mock('bcrypt')

describe('BcryptHarsher', () => {
  let saltRounds: number
  let plainData: string
  let hashedData: string
  let mockedBcrypt: jest.Mocked<typeof bcrypt>
  let sut: BcryptHarsher

  beforeAll(() => {
    saltRounds = 12
    plainData = 'any_plain_password'
    hashedData = 'any_h4sh3d_p4$$w0rd'

    mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>

    mockedBcrypt.hash.mockImplementation(async () => hashedData)
    mockedBcrypt.compare.mockImplementation(async () => true)
  })

  beforeEach(() => {
    sut = new BcryptHarsher(saltRounds)
  })

  it('Should call bcrypt.hash() with correct params', async () => {
    await sut.hash(plainData)

    expect(mockedBcrypt.hash).toHaveBeenCalledWith(plainData, saltRounds)
  })

  it('Should hash a string sucessfully', async () => {
    const hash = await sut.hash(plainData)

    expect(hash).toBe(hashedData)
  })

  it('Should call bcrypt.compare with correct params', async () => {
    await sut.validate(plainData, hashedData)

    expect(mockedBcrypt.compare).toHaveBeenCalledWith(plainData, hashedData)
  })

  it('Should validate a string sucessfully', async () => {
    const result = await sut.validate(plainData, hashedData)

    expect(result).toBeTruthy()
  })

  it('Validation should fail if data/hash is invalid', async () => {
    const invalidData = 'invalida_data'
    const invalidHash = '1nv4l1d_h4sh'

    mockedBcrypt.compare.mockImplementationOnce(async () => false)
    mockedBcrypt.compare.mockImplementationOnce(async () => false)
    mockedBcrypt.compare.mockImplementationOnce(async () => false)

    expect(await sut.validate(plainData, invalidHash)).toBeFalsy()
    expect(await sut.validate(invalidData, hashedData)).toBeFalsy()
    expect(await sut.validate(invalidData, invalidHash)).toBeFalsy()
  })

  it('Should throw HasherError when hashing an empty string', async () => {
    const emptyData = ''

    const promise = sut.hash(emptyData)
    await expect(promise).rejects.toThrow(HarsherError)
  })

  it('Should throw HarsherError if bcrypt throws', async () => {
    mockedBcrypt.hash.mockImplementationOnce(() => {
      throw new Error('bcrypt_hash_error')
    })
    mockedBcrypt.compare.mockImplementationOnce(() => {
      throw new Error('bcrypt_compare_error')
    })

    await expect(sut.hash(plainData)).rejects.toThrow(HarsherError)
    await expect(sut.validate(plainData, hashedData)).rejects.toThrow(HarsherError)
  })
})
