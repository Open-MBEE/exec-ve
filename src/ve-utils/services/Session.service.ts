import { veUtils } from '@ve-utils'

import { EventService } from './Event.service'

export class SessionService {
    public constants = {
        DELETEKEY: 'session-delete',
    }

    static $inject = ['EventService']

    constructor(private eventSvc: EventService) {}

    private static _setStorage<T>(key: string, realValue: T): void {
        const value = realValue == null ? null : JSON.stringify(realValue)
        return sessionStorage.setItem(key, value)
    }

    private static _getStorage<T>(key: string): T {
        const sessionValue = sessionStorage.getItem(key)
        if (sessionValue === null) {
            return null
        } else {
            return JSON.parse(sessionValue) as T
        }
    }

    private static _removeStorage(key: string): void {
        return sessionStorage.removeItem(key)
    }

    public clear = (): void => {
        sessionStorage.clear()
    }

    public accessor = <T>(
        name: string,
        value: T,
        defaultValue: T = null,
        emit = false
    ): T => {
        if (value === undefined) {
            let val = SessionService._getStorage<T>(name)
            if (val == null) {
                val = defaultValue
                SessionService._setStorage(name, val)
            }
            return val
        }
        if (value === this.constants.DELETEKEY) {
            SessionService._removeStorage(name)
            return null
        }
        SessionService._setStorage(name, value)
        if (emit) {
            this.eventSvc.$broadcast(name, value)
        }
        return value
    }
}

veUtils.service('SessionService', SessionService)
