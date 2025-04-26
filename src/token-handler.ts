export interface TokenEncrypter {
  encrypt(payload: object): string
}

export interface TokenDecrypter {
  decrypt(token: string): object
}
