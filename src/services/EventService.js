'use strict';

angular.module('mms')
    .factory('EventService', ['rx', EventService]);



function EventService(rx) {
    let hasOwnProp = {}.hasOwnProperty;

    function createName (name) {
        return `$ ${name}`;
    }

    this.subjects = {};

    const emit = (name, data) => {
        let fnName = createName(name);
        if (!this.subjects[fnName]) {
            (this.subjects[fnName] = new rx.Subject());
        }
        this.subjects[fnName].onNext(data);
    };

    const listen = (name, handler) => {
        let fnName = createName(name);
        if (!this.subjects[fnName]) {
            (this.subjects[fnName] = new rx.Subject());
        }
        return this.subjects[fnName].subscribe(handler);
    };

    return {
        $emit: emit,
        $broadcast: emit,
        $listen: listen,
        $on: listen
    };

}