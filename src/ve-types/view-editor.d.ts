import { ngStorage } from 'ngstorage';

import IModalService = angular.ui.bootstrap.IModalService;
import IModalSettings = angular.ui.bootstrap.IModalSettings;
import IModalInstanceService = angular.ui.bootstrap.IModalInstanceService;

import { VeComponentOptions, VePromise, VePromiseReason } from '@ve-types/angular';
import { MmsObject, OrgObject, ProjectObject, ViewObject } from '@ve-types/mms';

export type veSearchCallback<T extends MmsObject = MmsObject> = (elem: T, property: string) => void;

export interface VeSearchOptions<T extends MmsObject = ElementObject> {
    getProperties?: boolean;
    searchResult?: T[];
    searchField?: string;
    closeable: boolean;
    closeCallback?(): void;
    searchInput?: string;
    hideFilterOptions?: boolean;
    callback?: veSearchCallback;
    relatedCallback?(doc: ViewObject, view: ViewObject, elem: T): void;
    filterCallback?(elements: T[]): T[];
    filterQueryList?: [(...any) => { [key: string]: string[] }];
    emptyDocTxt?: string;
    itemsPerPage?: number;
}

export interface VeModalService extends IModalService {
    open?<U, V>(settings: VeModalSettings<U>): VeModalInstanceService<V>;
}

export interface VeModalSettings<U extends VeModalResolveFn> extends IModalSettings {
    component: string;
    resolve?: U;
    // bindings?: {
    //     modalInstance: VeModalInstanceService<V>
    //     resolve?: U
    // }
}

export interface VeModalComponent extends VeComponentOptions {
    bindings?: {
        modalInstance: string;
        resolve?: string;
    };
}

export interface VeModalInstanceService<T> extends IModalInstanceService {
    close(result?: T): void;
    dismiss(reason?: T): void;
    result: VePromise<T, T>;
}

export interface VeModalController extends IComponentController {
    // close: ($value?: any) => void,
    // dismiss: ($value?: any) => void,
    modalInstance: IModalInstanceService;
}

export interface VeModalResolve {
    [key: string]: unknown;
}

export interface VeModalResolveFn {
    [key: string]: () => unknown;
}

export interface VeStorageService extends ngStorage.StorageService {
    token: string;
    org: OrgObject;
    project: ProjectObject;
}

export interface VeApiObject<T> {
    [key: string]: VeApiWait<T>;
}

export interface VeApiWait<T> {
    resolve?(result: T): void;
    reject?(reason: VePromiseReason<T>): void;
    promise?: VePromise<T, void>;
    api?: T;
    refId?: string;
    projectId?: string;
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
