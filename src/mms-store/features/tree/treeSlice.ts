import {createSlice, PayloadAction} from '@reduxjs/toolkit'

type TreeState = {
    treeData: object,
    treeRows: object,
    options: object
};



export const treeSlice = createSlice({
    name: 'tree',
    initialState: {
        treeData: {},
        treeRows: {},
        options: {
            types: {},
            sectionNumbering: false,
            numberingDepth: 0,
            numberingSeparator: '.',
            expandLevel: 1,
            search: ''
        }
    } as TreeState,
    reducers: {
        updateData: (state,action: PayloadAction<object>) => {
            state.treeData = action.payload;
        },
        updateOptions: (state,action: PayloadAction<object>) => {
            state.options = action.payload;
        },
    }
})

export const { updateData, updateRows, updateOptions } = treeSlice.actions

export default treeSlice.reducer