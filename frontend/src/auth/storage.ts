const TOKEN_KEY = 'clario_token'
const USER_ID_KEY = 'clario_user_id'
const USER_EMAIL_KEY = 'clario_user_email'

export function storeToken(token: string, userId: string, email: string) {
  sessionStorage.setItem(TOKEN_KEY, token)
  sessionStorage.setItem(USER_ID_KEY, userId)
  sessionStorage.setItem(USER_EMAIL_KEY, email)
}

export function getToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY)
}

export function getUserId(): string | null {
  return sessionStorage.getItem(USER_ID_KEY)
}

export function getUserEmail(): string | null {
  return sessionStorage.getItem(USER_EMAIL_KEY)
}

export function removeToken() {
  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(USER_ID_KEY)
  sessionStorage.removeItem(USER_EMAIL_KEY)
}

export function isAuthenticated(): boolean {
  return getToken() !== null
}
