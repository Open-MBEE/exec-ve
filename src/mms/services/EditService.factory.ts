import * as angular from 'angular'
import {EventService} from "./EventService.factory";
var mms = angular.module('mms');

export class EditService {
    private edits = {};
    public EVENT = 've-edits';
    constructor ( private eventSvc : EventService) {}

    trigger() {
        this.eventSvc.$broadcast(this.EVENT);
    };

    get(key) {
        return this.edits[key];
    };

    getAll() {
        return this.edits;
    };

    openEdits() {
        return Object.keys(this.edits).length;
    };

    addOrUpdate(key, value) {
        this.edits[key] = value;
        this.trigger();
    };

    remove(key) {
        delete this.edits[key];
        this.trigger();
    };

    reset() {
        let keys = Object.keys(this.edits);
        for (let i = 0; i < keys.length; i++) {
            delete this.edits[keys[i]];
        }
    };
}

EditService.$inject = ['EventService'];

mms.service('EditService', EditService);