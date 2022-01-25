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
        let sub = [];
        sub[fnName] = this.subjects[fnName].subscribe(handler);
        return sub;
    };

    const destroy = (subs) => {
        var keys = Object.keys(subs);
        for (var i = 0; i < keys.length; i++) {
            subs[keys[i]].unsubscribe();
        }
    };

    return {
        $emit: emit,
        $broadcast: emit,
        $listen: listen,
        $on: listen,
        $destroy: destroy
    };

}