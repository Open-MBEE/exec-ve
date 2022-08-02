import * as angular from "angular";
import {ElementObject, QueryObject, ViewObject} from "./mms";
import {IModalInstanceService} from "angular";


interface VeComponentOptions extends angular.IComponentOptions {
    selector: string;
}

interface VeSearchOptions {
    getProperties?: boolean,
    searchResult?: ElementObject[],
    searchField?: string,
    closeable: boolean,
    searchInput?: string,
    hideFilterOptions?: boolean
    callback?: (elem: ElementObject, property: string) => any,
    relatedCallback?(doc: ViewObject, view: ViewObject, elem: ElementObject): any,
    filterCallback?(elements: ElementObject[]): ElementObject[],
    filterQueryList?: [(...any) => {[key: string]: string[]}],
    emptyDocTxt?: string,
    itemsPerPage?: number
}

export interface VeModalService extends angular.ui.bootstrap.IModalService {
    open?(settings: VeModalSettings): IModalInstanceService
}

export interface VeModalSettings extends angular.ui.bootstrap.IModalSettings {
    component: string
    resolve?: VeModalResolveFn
    bindings?: {
        close: ($value?: any) => void,
        dismiss: ($value?: any) => void,
        modalInstance: angular.ui.bootstrap.IModalInstanceService,
        resolve?: any
    }
}

export interface VeModalComponent extends VeComponentOptions {
    bindings?: {
        modalInstance: string,
        resolve?: string
    }
}

export interface VeModalController extends angular.IComponentController {
    // close: ($value?: any) => void,
    // dismiss: ($value?: any) => void,
    modalInstance: angular.ui.bootstrap.IModalInstanceService,
}


interface VeModalResolve {
    [key: string]: string | Function | Object | Object[]
}

interface VeModalResolveFn {
    [key: string]: () => any
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