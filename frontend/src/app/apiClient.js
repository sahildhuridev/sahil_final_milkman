import axios from 'axios'
import { API_BASE_URL } from './env'
import { clearSession, setAccessToken } from '../features/auth/authSlice'

export const api = axios.create({
  baseURL: API_BASE_URL,
})

export const attachInterceptors = (store) => {
  api.interceptors.request.use((config) => {
    const state = store.getState()
    const access = state.auth.accessToken
    if (access) {
      config.headers = config.headers || {}
      config.headers.Authorization = `Bearer ${access}`
    }
    return config
  })

  let isRefreshing = false
  let pending = []

  const processQueue = (error, accessToken = null) => {
    pending.forEach(({ resolve, reject }) => {
      if (error) reject(error)
      else resolve(accessToken)
    })
    pending = []
  }

  api.interceptors.response.use(
    (res) => res,
    async (error) => {
      const originalRequest = error.config
      const status = error?.response?.status

      if (status !== 401 || originalRequest?._retry) {
        return Promise.reject(error)
      }

      originalRequest._retry = true

      const state = store.getState()
      const refresh = state.auth.refreshToken
      if (!refresh) {
        store.dispatch(clearSession())
        return Promise.reject(error)
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pending.push({ resolve, reject })
        }).then((newAccess) => {
          originalRequest.headers.Authorization = `Bearer ${newAccess}`
          return api(originalRequest)
        })
      }

      isRefreshing = true

      try {
        const resp = await axios.post(`${API_BASE_URL}/api/auth/token/refresh/`, {
          refresh,
        })
        const newAccess = resp.data?.access
        if (!newAccess) throw new Error('No access token returned')

        store.dispatch(setAccessToken(newAccess))
        processQueue(null, newAccess)

        originalRequest.headers.Authorization = `Bearer ${newAccess}`
        return api(originalRequest)
      } catch (e) {
        processQueue(e, null)
        store.dispatch(clearSession())
        return Promise.reject(e)
      } finally {
        isRefreshing = false
      }
    },
  )
}
