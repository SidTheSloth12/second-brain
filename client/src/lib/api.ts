import axios from'axios'
const baseURL=import.meta.env.VITE_API_URL ??'http://localhost:5000'
export const api=axios.create({
  baseURL,
  headers: {'Content-Type':'application/json' },
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error || error.message || 'An unknown error occurred';
    return Promise.reject(new Error(message));
  }
)
const TOKEN_KEY ='second-brain-token'
export function getStoredToken():string | null {
 return localStorage.getItem(TOKEN_KEY)
}
export function setStoredToken(token:string | null): void {
 if (token) localStorage.setItem(TOKEN_KEY, token)
 else localStorage.removeItem(TOKEN_KEY)
}
export function attachAuthHeader(token:string | null): void {
 if (token) {
 api.defaults.headers.common.Authorization =`Bearer ${token}`
 } else {
 delete api.defaults.headers.common.Authorization
 }
}