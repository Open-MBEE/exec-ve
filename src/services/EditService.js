'use strict';

angular.module('mms')
    .factory('EditService', ['EventService', EditService]);

function EditService(EventService) {
    let eventSvc = EventService;
    let edits = {};
    let EVENT = 've-edits';

    const trigger = () => {
        eventSvc.$broadcast(EVENT);
    };

    const get = (key) => {
        return edits[key];
    };

    const getAll = () => {
        return edits;
    };

    const openEdits = () => {
        return Object.keys(edits).length;
    };

    const addOrUpdate = (key, value) => {
        edits[key] = value;
        trigger();
    };

    const remove = (key) => {
        delete edits[key];
        trigger();
    };

    var reset = function() {
        var keys = Object.keys(edits);
        for (var i = 0; i < keys.length; i++) {
            delete edits[keys[i]];
        }
    };

    return {
        get: get,
        getAll: getAll,
        openEdits: openEdits,
        addOrUpdate: addOrUpdate,
        remove: remove,
        reset: reset,
        EVENT: EVENT
    };
}