export interface UserAuth {
  signIn(email: string, password: string): Promise<boolean>
}
