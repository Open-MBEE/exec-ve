import * as angular from 'angular';

declare module 'angular' {
    export namespace ve {
        interface ComponentOptions extends angular.IComponentOptions {
            selector: string;
        }
    }
}