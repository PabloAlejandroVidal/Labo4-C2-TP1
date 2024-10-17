export interface UserData {
  user: string,
  email: string,
  registrationDate: Date | null,
  isOnline: boolean,
  firstAccess:  Date | null,
  lastAccess: Date | null,
  id: string | null,

}
export const userDataInit: UserData = {
  user: '',
  email: '',
  registrationDate: null,
  isOnline: false,
  firstAccess: null,
  lastAccess: null,
  id: null
}
