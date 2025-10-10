import { createSlice } from '@reduxjs/toolkit'


export const Email = createSlice({
  name: 'Email',
  initialState: {
    value:"",
  },
  reducers: {
    setEmail : (state,action) =>{
        state.value = action.payload
    }
  },
})
export const { setEmail } = Email.actions

export default Email.reducer