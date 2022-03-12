import * as angular from 'angular'
import {EventService} from "./EventService.service";
var mms = angular.module('mms');

export class SessionService {

    private sessionStorage = this.$window.sessionStorage;

    public constants = {
                DELETEKEY: 'session-delete'
            };

    constructor(private $window, private eventSvc : EventService) {}

    private _setStorage = (key, value) => {
        value = value === void 0 ? null : JSON.stringify(value);
        return sessionStorage.setItem(key, value);
    };

    private _getStorage = (key) => {
        let sessionValue = sessionStorage.getItem(key);
        if (sessionValue === "undefined") {
            return null;
        }
        return JSON.parse(sessionValue);
    };

    private _removeStorage = (key) => {
        return sessionStorage.removeItem(key);
    };

    public clear = () => {
        let key, results;
        results = [];
        for (key in sessionStorage) {
            results.push(this._setStorage(key, null));
        }
        return results;
    };

    public accessor = (name, value, defaultValue=null, emit=false) => {
        if (value == null) {
            let val = this._getStorage(name);
            if (val == null) {
                val = defaultValue;
                this._setStorage(name, val);
            }
            return val;
        }
        if (value === this.constants.DELETEKEY) {
            return this._removeStorage(name);
        }
        const result = this._setStorage(name, value);
        if (emit) {
            this.eventSvc.$broadcast(name,value);
        }
        return result;
    };
}

SessionService.$inject = ['$window', 'EventService'];

mms.service('SessionService', SessionService);