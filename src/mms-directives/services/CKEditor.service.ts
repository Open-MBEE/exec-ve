import * as angular from "angular";
import {Injectable} from "angular";
var mmsDirectives = angular.module('mmsDirectives');

class CKEditorService implements Injectable<any> {


}

declare module 'angular' {
    export namespace ve {
        export interface IEditorApi {
            save()
        }
    }

}