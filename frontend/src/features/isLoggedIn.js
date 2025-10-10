import { createSlice } from '@reduxjs/toolkit'

export const isLoggedIn = createSlice({
  name: 'LoggedIn',
  initialState: {
    value: false,
  },
  reducers: {
    toggler : (state) =>{
        state.value = !state.value
    }
  },
})
export const { toggler } = isLoggedIn.actions

export default isLoggedIn.reducer