export interface Harsher {
  hash(plainData: string): Promise<string>
  validate(plainData: string, hashedData: string): Promise<boolean>
}

export class HarsherError extends Error {
  constructor(message: string) {
    super(message)
  }
}
