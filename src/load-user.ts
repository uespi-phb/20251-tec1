import { User } from './user'

export interface LoadUser {
  loadByEmail(email: string): Promise<User | undefined>
}
