import { veUtils } from '@ve-utils';

import { EventService } from './Event.service';

export class SessionService {
    static $inject = ['EventService'];

    constructor(private eventSvc: EventService) {}

    private static _setStorage<T>(key: string, realValue: T): void {
        const value = realValue == null ? null : JSON.stringify(realValue);
        sessionStorage.setItem(key, value);
    }

    private static _getStorage<T>(key: string): T {
        const sessionValue = sessionStorage.getItem(key);
        if (sessionValue === null) {
            return null;
        } else {
            return JSON.parse(sessionValue) as T;
        }
    }

    private static _removeStorage(key: string): void {
        sessionStorage.removeItem(key);
    }

    public clear = (): void => {
        sessionStorage.clear();
    };

    public accessor = <T>(name: string, value: T, defaultValue: T = null): T => {
        if (value === undefined) {
            let val = SessionService._getStorage<T>(name);
            if (val == null) {
                val = defaultValue;
                SessionService._setStorage(name, val);
            }
            if (!this.eventSvc.exists(name)) {
                this.eventSvc.resolve(name, val);
            }
            return val;
        }
        this.eventSvc.resolve(name, value);
        SessionService._setStorage(name, value);
        return value;
    };
}

veUtils.service('SessionService', SessionService);
