import * as angular from 'angular';
import ngRedux from "ng-redux";
import { configureStore } from '@reduxjs/toolkit'

import treeReducer from './features/tree/treeSlice'

export const store = configureStore({
    reducer: {
        // orgs: orgsReducer,
        // projects: projectsReducer,
        // elements: elementsReducer,
        tree: treeReducer
    }
})

// Infer the `RootState` and `AppDispatch` types from the mmsStoreModule itself
export type RootState = ReturnType<typeof store.getState>
// Inferred type: {ors: PostsState, projects: CommentsState, elements: UsersState, tree: TreeState}
export type AppDispatch = typeof store.dispatch

var mmsStore = angular.module('mms-store',[ngRedux])

mmsStore.config(($ngReduxProvider) => {
    $ngReduxProvider.provideStore(store);
})