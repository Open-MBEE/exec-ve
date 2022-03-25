import * as angular from "angular";
import {Injectable} from "angular";
var veDirectives = angular.module('veDirectives');

class CKEditorService implements Injectable<any> {


}

declare module 'angular' {
    export namespace ve {
        export interface IEditorApi {
            save()
        }
    }

}