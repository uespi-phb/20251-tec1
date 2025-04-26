export interface SaveUser {
  saveToken(userId: number, token: string): Promise<void>
}
