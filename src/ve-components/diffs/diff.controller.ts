import { handleChange, onChangesCallback } from '@ve-utils/utils'

import { VeComponentOptions } from '@ve-types/angular'

export interface IDiff<T> {
    baseContent: T
    comparedContent: T
    diffCallback?(): void
}

export interface IDiffComponentOptions extends VeComponentOptions {
    bindings: {
        baseContent: '<'
        comparedContent: '<'
        attr?: '<'
        diffCallback?: '&'
        [key: string]: string
    }
}

export class Diff<T> implements IDiff<T> {
    //Bindings
    baseContent: T
    comparedContent: T
    attr: string

    diffCallback?(): void

    static $inject = ['$scope', '$timeout', 'growl']

    constructor(
        protected $scope: angular.IScope,
        protected $timeout: angular.ITimeoutService,
        protected growl: angular.growl.IGrowlService
    ) {}

    $onChanges(onChangesObj: angular.IOnChangesObject): void {
        handleChange(onChangesObj, 'baseContent', this.changeAction)
        handleChange(onChangesObj, 'comparedContent', this.changeAction)
    }

    $postLink(): void {
        if (this.baseContent && this.comparedContent) this.performDiff()
    }

    protected changeAction: onChangesCallback<T> = (newVal, oldVal, firstChange) => {
        if (!newVal || firstChange) {
            return
        }
        if (this.baseContent && this.comparedContent && oldVal !== newVal) this.performDiff()
    }

    protected performDiff = (): void => {
        this.growl.warning('Not yet implemented')
    }
}
