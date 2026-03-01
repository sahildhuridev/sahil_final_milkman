import { createSlice } from '@reduxjs/toolkit'

const ACCESS_KEY = 'milkman_access'
const REFRESH_KEY = 'milkman_refresh'
const USER_KEY = 'milkman_user'

const initialState = {
  accessToken: localStorage.getItem(ACCESS_KEY) || null,
  refreshToken: localStorage.getItem(REFRESH_KEY) || null,
  user: (() => {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  })(),
}

const slice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setSession(state, action) {
      const { access, refresh, user } = action.payload
      state.accessToken = access
      state.refreshToken = refresh
      state.user = user
      localStorage.setItem(ACCESS_KEY, access)
      localStorage.setItem(REFRESH_KEY, refresh)
      localStorage.setItem(USER_KEY, JSON.stringify(user))
    },
    setAccessToken(state, action) {
      state.accessToken = action.payload
      if (action.payload) localStorage.setItem(ACCESS_KEY, action.payload)
      else localStorage.removeItem(ACCESS_KEY)
    },
    clearSession(state) {
      state.accessToken = null
      state.refreshToken = null
      state.user = null
      localStorage.removeItem(ACCESS_KEY)
      localStorage.removeItem(REFRESH_KEY)
      localStorage.removeItem(USER_KEY)
    },
  },
})

export const { setSession, setAccessToken, clearSession } = slice.actions
export default slice.reducer
