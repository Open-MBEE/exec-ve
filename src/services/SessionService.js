'use strict';

angular.module('mms')
    .factory('SessionService', ['$window', 'EventService', '_', SessionService]);

function SessionService($window, EventService) {

    let sessionStorage = $window.sessionStorage;
    let eventSvc = EventService;

    const constants = {
        DELETEKEY: 'session-delete'
    };

    let setStorage = (key, value) => {
        value = value === void 0 ? null : JSON.stringify(value);
        return sessionStorage.setItem(key, value);
    };

    const getStorage = (key) => {
        let sessionValue = sessionStorage.getItem(key);
        if (sessionValue === "undefined") {
            return null;
        }
        return JSON.parse(sessionValue);
    };

    const removeStorage = (key) => {
        return sessionStorage.removeItem(key);
    };

    const clear = () => {
        let key, results;
        results = [];
        for (key in sessionStorage) {
            results.push(setStorage(key, null));
        }
        return results;
    };

    const accessor = (name, value, defaultValue=null, emit=true) => {
        if (value == null) {
            let val = getStorage(name);
            if (val == null) {
                val = defaultValue;
                setStorage(name, val);
            }
            return val;
        }
        if (value === constants.DELETEKEY) {
            return removeStorage(name);
        }
        const result = setStorage(name, value);
        if (emit) {
            eventSvc.$broadcast(name,value);
        }
        return result;
    };

    return {
        clear: clear,
        accessor: accessor,
        constants: constants
    };
}