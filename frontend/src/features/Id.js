import { createSlice } from '@reduxjs/toolkit'


export const Id = createSlice({
  name: 'Id',
  initialState: {
    value:"8ac5064f-1481-47d5-8746-d07cddf57e24",
  },
  reducers: {
    setId : (state,action) =>{
        state.value = action.payload
    }
  },
})
export const { setId } = Id.actions

export default Id.reducer