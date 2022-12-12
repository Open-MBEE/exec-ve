import { VeComponentOptions } from '@ve-types/angular'

export interface PresentationComponentOptions extends VeComponentOptions {
    selector: string
    style?: string[]
    bindings: {
        peObject: string
        element: string
        peNumber: string
        mmsProjectId?: '@'
        mmsRefId?: '@'
        mmsCommitId?: '@'
        [key: string]: string
    }
    required?: {
        mmsViewPresentationElemCtrl: string
        mmsViewCtrl: string
        [key: string]: string
    }
}

export interface TableConfig {
    sortByColumnFn(sortCol?: number): void

    showBindingForSortIcon: number
    filterDebounceRate: number
    filterTermColumnPrefixBinding: string
}
