import * as angular from "angular";
import {ElementObject} from "./mms";


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