import angular from 'angular'
import Rx from 'rx-lite'

import { EventService } from '@ve-utils/services'

import { VePromise, VeQService } from '@ve-types/angular'

/**
 * @name onChangesCallback
 * @description This function type defines the expected format for a callback added to the {@link handleChange}
 * helper function.
 * @example
 *      myCallback: onChangesCallback = (newVal, oldVal, firstChange) => {
 *          if (newVal != oldVal && !firstChange) {
 *              doSomething();
 *          }
 *
 *      }
 *
 */
export type onChangesCallback<T> = (
    newVal?: T,
    oldVal?: T,
    firstChange?: boolean
) => void

/**
 * @name change.utils#handleChange:
 * @description This function is a pseudo replacement for most of the boilerplate needed to replace $scope.watch type behavior with
 * angular 1.5 components.
 * @example
 *  class ComponentController {
 *      constructor() {...}
 *      $onChanges(onChangesObj: angular.IOnChangesObject): void {
 *          handleChange(onChangesObj,'watchedBinding',myCallback)
 *      }
 *
 *      myCallback: onChangesCallback = (newVal, oldVal) => {
 *          if newVal != oldVal
 *              doSomething();
 *      }
 *  }
 * @param {angular.IOnChangesObject} changesObj
 * @param {string} watch
 * @param {onChangesCallback} callback
 * @param {boolean} ignoreFirst -
 * @returns {any}
 */
export function handleChange<T>(
    changesObj: angular.IOnChangesObject,
    watch: string,
    callback: onChangesCallback<T>,
    ignoreFirst?: boolean
): void {
    if (watch === '') {
        return callback()
    } else if (changesObj[watch]) {
        if (ignoreFirst && changesObj[watch].isFirstChange()) {
            return
        }
        const newVal: T = changesObj[watch].currentValue as T
        const oldVal: T = changesObj[watch].previousValue as T
        const firstChange = changesObj[watch].isFirstChange()
        callback(newVal, oldVal, firstChange)
    }
    return
}

interface EventWatcher {
    $q: VeQService
    eventSvc: EventService
    subs: Rx.IDisposable[]
}

export function watchChangeEvent<T>(
    $ctrl: EventWatcher & angular.IComponentController,
    name: string,
    changeAction: onChangesCallback<T>,
    update?: boolean
): void {
    $ctrl.subs.push(
        $ctrl.eventSvc.$on<T>(name, (data) => {
            const change: angular.IChangesObject<T> = {
                currentValue: data,
                previousValue: $ctrl[name] as T,
                isFirstChange: () => {
                    return typeof $ctrl[name] === 'undefined'
                },
            }
            if (data !== $ctrl[name] && update) {
                $ctrl[name] = data
            }
            watchChange(change, changeAction)
        })
    )
}

export function watchChange<T>(
    changeObj: angular.IChangesObject<T>,
    callback: onChangesCallback<T>,
    ignoreFirst?: boolean
): void {
    if (!changeObj) {
        return callback()
    } else {
        if (ignoreFirst && changeObj.isFirstChange()) {
            return
        }
        const newVal: T = changeObj.currentValue
        const oldVal: T = changeObj.previousValue
        const firstChange = changeObj.isFirstChange()
        callback(newVal, oldVal, firstChange)
    }
    return
}

export function waitFor(
    $ctrl: EventWatcher & angular.IComponentController,
    bindings: string[]
): VePromise<void, void> {
    return new $ctrl.$q((resolve, reject) => {})
}
