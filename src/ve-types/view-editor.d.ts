import angular, {
    IComponentController,
    IComponentOptions,
    IHttpResponse,
} from 'angular'

import IModalService = angular.ui.bootstrap.IModalService
import IModalSettings = angular.ui.bootstrap.IModalSettings
import IModalInstanceService = angular.ui.bootstrap.IModalInstanceService

import {
    ElementObject,
    PresentationInstanceObject,
    ViewObject,
} from '@ve-types/mms'

export interface VeComponentOptions extends IComponentOptions {
    selector: string
}

export interface VeSearchOptions {
    getProperties?: boolean
    searchResult?: ElementObject[]
    searchField?: string
    closeable: boolean
    searchInput?: string
    hideFilterOptions?: boolean
    callback?: (elem: ElementObject, property: string) => any
    relatedCallback?(
        doc: ViewObject,
        view: ViewObject,
        elem: ElementObject
    ): any
    filterCallback?(elements: ElementObject[]): ElementObject[]
    filterQueryList?: [(...any) => { [key: string]: string[] }]
    emptyDocTxt?: string
    itemsPerPage?: number
}

export interface VeModalService extends IModalService {
    open?(settings: VeModalSettings): IModalInstanceService
}

export interface VeModalSettings extends IModalSettings {
    component: string
    resolve?: VeModalResolveFn
    bindings?: {
        close: ($value?: any) => void
        dismiss: ($value?: any) => void
        modalInstance: IModalInstanceService
        resolve?: any
    }
}

export interface VeModalComponent extends VeComponentOptions {
    bindings?: {
        modalInstance: string
        resolve?: string
    }
}

export interface VeModalController extends IComponentController {
    // close: ($value?: any) => void,
    // dismiss: ($value?: any) => void,
    modalInstance: IModalInstanceService
}

export interface VeModalResolve {
    [key: string]: unknown
}

export interface VeModalResolveFn {
    [key: string]: () => unknown
}

export interface VePromiseReason<T> extends IHttpResponse<T> {
    state?: angular.PromiseState
    message?: string
    recentVersionOfElement?: ElementObject
}

// {
//     getProperties: any
//     emptyDocTxt?: string
//     searchResult?: ElementObject[]
//     searchInput?: string
//     itemsPerPage: number
//     hideFilterOptions?: boolean
//     callback?(elem, property): void
//         relatedCallback?(doc, view, elem): void
//         filterCallback?(elements: ElementObject[]): ElementObject[]
// }
