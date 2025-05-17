export interface UserCredentialsValidator {
  signIn(email: string, password: string): Promise<boolean>
}
