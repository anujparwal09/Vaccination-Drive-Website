import axios from "axios"

const trimTrailingSlash = (value) => value.replace(/\/+$/, "")

export const API_BASE_URL = trimTrailingSlash(
  import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:3000/api" : "/api")
)

export const buildApiUrl = (path = "") => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  return `${API_BASE_URL}${normalizedPath}`
}

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Crucial for HTTP-Only cookie sharing
})

// Request Interceptor: Attach JWT Access Token to Headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("vax_access_token")
    if (token) {
      if (!config.headers) {
        config.headers = {}
      }
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response Interceptor: Auto-refresh Access Token on 401 Expiry
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    
    // Check if error is 401, has expired code, and request has not retried yet
    if (
      error.response &&
      error.response.status === 401 &&
      error.response.data.code === "TOKEN_EXPIRED" &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true
      
      try {
        // Attempt token refresh call
        const response = await axios.post(
          buildApiUrl("/auth/refresh-token"),
          {},
          { withCredentials: true }
        )
        
        const { accessToken } = response.data
        localStorage.setItem("vax_access_token", accessToken)
        
        // Retry failed request with new access token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        return api(originalRequest)
      } catch (refreshError) {
        // Refresh token is expired or invalid, trigger logout
        localStorage.removeItem("vax_access_token")
        localStorage.removeItem("vax_current_user")
        window.location.href = "/login?expired=true"
        return Promise.reject(refreshError)
      }
    }
    
    return Promise.reject(error)
  }
)

export default api
