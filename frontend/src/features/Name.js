import { createSlice } from '@reduxjs/toolkit'


export const Name = createSlice({
  name: 'Name',
  initialState: {
    value:"",
  },
  reducers: {
    setName : (state,action) =>{
        state.value = action.payload
    }
  },
})
export const { setName } = Name.actions

export default Name.reducer