import * as angular from "angular";

export interface onChangesCallback {
    (newVal?: any, oldVal?: any, firstChange?: boolean):any;
}
export function handleChange(changesObj: angular.IOnChangesObject, watch:string, callback: onChangesCallback) {
    if (!watch) {
        return callback();
    }
    else if (changesObj[watch]) {
        let newVal = changesObj[watch].currentValue;
        let oldVal = changesObj[watch].previousValue;
        let firstChange = changesObj[watch].isFirstChange();
        return callback(newVal,oldVal,firstChange);
    }
    return;
}