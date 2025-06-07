import bcrypt from 'bcrypt'

import { Harsher, HarsherError } from './harsher'

export class BcryptHarsher implements Harsher {
  constructor(private readonly saltRounds: number) {}

  async hash(plainData: string): Promise<string> {
    if (plainData.length === 0) throw new HarsherError('Cannot hash an empty string')
    try {
      return bcrypt.hash(plainData, this.saltRounds)
    } catch {
      throw new HarsherError('Error hashing data')
    }
  }

  async validate(plainData: string, hashedData: string): Promise<boolean> {
    try {
      return bcrypt.compare(plainData, hashedData)
    } catch {
      throw new HarsherError('Error validating data')
    }
  }
}
