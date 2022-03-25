import * as angular from "angular";
import {FaPaneController} from "../components/fa-pane.component";
import {IDeferred} from "angular";
declare module 'angular' {
export namespace pane {
    interface IPaneScope extends angular.IScope {
        subs?: any[];
        $pane?: FaPaneController
        $ctrl?: object
        $parent: IPaneScope
    }
}
}
declare module 'angular' {
export interface IRequestConfig {
    cancel: IDeferred<any>;
}
export interface IPromise<T> {
    state: string
}
export interface IDeferred<T> {
    state: string
}
}