import * as angular from 'angular';

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