/* eslint-disable unused-imports/no-unused-imports */
import angular from 'angular';

declare module 'angular' {
    interface IRequestConfig {
        cancel: IDeferred<any>;
    }
    interface IPromise<T> {
        state: string;
    }
    interface IDeferred<T> {
        state: string;
    }
}
