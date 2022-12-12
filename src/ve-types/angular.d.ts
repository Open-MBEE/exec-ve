//AngularJS Type Overrides
import angular, {
    IComponentOptions,
    IHttpHeadersGetter,
    INgModelController,
    IPromise,
    IRequestConfig,
} from 'angular'

import { ElementObject, ElementsResponse } from '@ve-types/mms'

export interface VeComponentOptions extends IComponentOptions {
    selector: string
}

export interface VePromise<T, U = ElementsResponse<T>> extends IPromise<T> {
    then<TResult1 = T, TResult2 = never>(
        successCallback?:
            | ((
                  value: T
              ) => PromiseLike<never> | PromiseLike<TResult1> | TResult1)
            | null,
        errorCallback?:
            | ((
                  reason: VePromiseReason<U>
              ) => PromiseLike<never> | PromiseLike<TResult2> | TResult2)
            | null,
        notifyCallback?: (state: unknown) => unknown
    ): IPromise<TResult1 | TResult2>
}

export interface VePromisesResponse<T> {
    failedRequests: VePromiseReason<T>[]
    successfulRequests: VePromiseReason<T>[]
}

export interface VeNgModelController<T> extends INgModelController {
    $modelValue: T
}

export interface VePromiseReason<T> {
    type?: 'error' | 'info' | 'warning'
    state?: angular.PromiseState
    message?: string
    recentVersionOfElement?: ElementObject
    data?: T
    status: number
    headers?: IHttpHeadersGetter
    config?: IRequestConfig
    statusText?: string
    /** Added in AngularJS 1.6.6 */
    xhrStatus?: 'complete' | 'error' | 'timeout' | 'abort'
}
