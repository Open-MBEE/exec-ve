import * as angular from 'angular';


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
export type onChangesCallback = (newVal?: any, oldVal?: any, firstChange?: boolean) => any

/**
 * @name change.utils#handleChange:
 * @description This function is a pseudo replacement for most of the boilerplate needed to replace $scope.watch type behavior with
 * angular 1.5 components.
 * @example
 *  class ComponentController {
 *      constructor() {...}
 *      $onChanges(onChangesObj) {
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
export function handleChange(changesObj: angular.IOnChangesObject, watch: string, callback: onChangesCallback,
                             ignoreFirst?: boolean): any {
    if (watch === "") {
        return callback();
    }
    else if (changesObj[watch]) {
        if (ignoreFirst && changesObj[watch].isFirstChange()) {
            return;
        }
        const newVal = changesObj[watch].currentValue;
        const oldVal = changesObj[watch].previousValue;
        const firstChange = changesObj[watch].isFirstChange();
        return callback(newVal, oldVal, firstChange);
    }
    return;
}