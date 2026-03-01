import { createSlice } from '@reduxjs/toolkit'

const GUEST_CART_KEY = 'milkman_guest_cart'

export const readGuestCart = () => {
  const raw = localStorage.getItem(GUEST_CART_KEY)
  return raw ? JSON.parse(raw) : []
}

export const writeGuestCart = (items) => {
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items))
}

const initialState = {
  serverCart: null,
  guestItems: readGuestCart(),
}

const slice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    setServerCart(state, action) {
      state.serverCart = action.payload
    },
    setGuestItems(state, action) {
      state.guestItems = action.payload
      writeGuestCart(action.payload)
    },
    clearGuestCart(state) {
      state.guestItems = []
      localStorage.removeItem(GUEST_CART_KEY)
    },
  },
})

export const { setServerCart, setGuestItems, clearGuestCart } = slice.actions
export default slice.reducer
