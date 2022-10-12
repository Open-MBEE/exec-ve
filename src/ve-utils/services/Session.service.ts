import {EventService} from "./Event.service";
import {veUtils} from "@ve-utils";

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
        const sessionValue = sessionStorage.getItem(key);
        if (sessionValue === null) {
            return null;
        }else {
            return JSON.parse(sessionValue);
        }

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

    public accessor = (name: any, value: any, defaultValue:any=null, emit: boolean =false): any => {
        if (value === undefined) {
            let val = this._getStorage(name);
            if (val == null) {
                val = defaultValue;
                this._setStorage(name, val);
            }
            return val;
        }
        if (value === this.constants.DELETEKEY) {
            this._removeStorage(name);
            return null
        }
        this._setStorage(name, value);
        if (emit) {
            this.eventSvc.$broadcast(name,value);
        }
        return value;
    };
}

SessionService.$inject = ['$window', 'EventService'];

veUtils.service('SessionService', SessionService);
