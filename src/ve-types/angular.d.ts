//AngularJS Type Overrides
import angular, {
    IComponentOptions,
    IHttpHeadersGetter,
    INgModelController,
    IPromise,
    IQResolveReject,
    IQService,
    IRequestConfig,
} from 'angular';

import { ElementObject, ElementsResponse } from '@ve-types/mms';

export interface VeComponentOptions extends IComponentOptions {
    selector: string;
}

export interface VeQService extends IQService {
    new <T, U = ElementsResponse<T>>(
        resolver: (resolve: IQResolveReject<T>, reject: IQResolveReject<VePromiseReason<U>>) => any
    ): VePromise<T, U>;
    <T, U>(resolver: (resolve: IQResolveReject<T>, reject: IQResolveReject<VePromiseReason<U>>) => any): VePromise<
        T,
        U
    >;
}

export interface VePromise<T, U = ElementsResponse<T>> extends IPromise<T> {
    then<TResult1 = T, TResult2 = never>(
        successCallback?: ((value: T) => PromiseLike<never> | PromiseLike<TResult1> | TResult1) | null,
        errorCallback?: ((reason: VePromiseReason<U>) => PromiseLike<never> | PromiseLike<TResult2> | TResult2) | null,
        notifyCallback?: (state: unknown) => unknown
    ): VePromise<TResult1 | TResult2, U>;
    then<TResult1 = T, TResult2 = never>(
        successCallback?: ((value: T) => PromiseLike<never> | PromiseLike<TResult1> | TResult1) | null,
        errorCallback?: ((reason: VePromiseReason<U>) => PromiseLike<never> | PromiseLike<TResult2> | TResult2) | null,
        notifyCallback?: (state: unknown) => unknown
    ): VePromise<TResult1 | TResult2, U>;

    catch<TResult = never>(
        onRejected?: ((reason: VePromiseReason<U>) => PromiseLike<never> | PromiseLike<TResult> | TResult) | null
    ): VePromise<T | TResult, U>;
    catch<TResult = never>(
        onRejected?: ((reason: VePromiseReason<U>) => VePromise<never> | IPromise<TResult> | TResult) | null
    ): VePromise<T | TResult, U>;
}

export interface VePromisesResponse<T, U = ElementsResponse<T>> {
    failedRequests?: VePromiseReason<U>[];
    successfulRequests?: T[];
}

export interface VeNgModelController<T> extends INgModelController {
    $modelValue: T;
}

export interface VePromiseReason<T> {
    type?: 'error' | 'info' | 'warning';
    state?: angular.PromiseState;
    message?: string;
    recentVersionOfElement?: ElementObject;
    data?: T;
    status: number;
    headers?: IHttpHeadersGetter;
    config?: IRequestConfig;
    statusText?: string;
    /** Added in AngularJS 1.6.6 */
    xhrStatus?: 'complete' | 'error' | 'timeout' | 'abort';
}
