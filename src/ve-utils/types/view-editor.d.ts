import * as angular from "angular";
import {ElementObject} from "./mms";
import {ContentToolConfig, VeExtensionConfig} from "../../ve-extensions/ve-extensions";


interface VeComponentOptions extends angular.IComponentOptions {
    selector: string;
}

interface VeSearchOptions {
    getProperties?: boolean,
    callback?: (elem: ElementObject, property: string) => any,
    relatedCallback?: (...any) => any,
    filterQueryList?: [(...any) => any],
    emptyDocTxt?: string,
    itemsPerPage?: number
}

export interface VeConfig {
    version?: string,
    apiUrl: string,
    basePath: string,
    enableDebug?: boolean,
    customLabels?: {[key: string]: string}
    loginBanner?: {
        labels: string[][]
        separator?: string,
        background?: string,
        color?: string,
        disabled?: boolean
    }
    banner?: {
        message: string | string[]
        separator?: string,
        background?: string,
        color?: string,
        top?: boolean,
        bottom?: boolean,
        disabled?: boolean
    }
    footer?: {
        message: string | string[]
        separator?: string,
        background?: string,
        color?: string
        disabled?: boolean
    }
    loginTimeout?: number,
    extensions?: {
        content?: ContentToolConfig[],
        transclusion?: VeExtensionConfig[]
        view?: VeExtensionConfig[]
    }
}