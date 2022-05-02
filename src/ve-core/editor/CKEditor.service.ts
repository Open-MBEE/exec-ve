import * as angular from "angular";
import {Injectable} from "angular";
import {veCore} from "../ve-core.module";



class CKEditorService implements Injectable<any> {


}

export interface VeEditorApi {
    save?(e?): void
    saveC?(e?): void
    cancel?(e?): void
    startEdit?(e?): void
    preview?(e?): void
    delete?(e?): void
}