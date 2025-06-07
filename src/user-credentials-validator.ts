export interface UserCredentialsValidator {
  signIn(email: string, harshwedPassword: string): Promise<boolean>
}
