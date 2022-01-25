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

    const destroy = (subs) => {
        if (subs.length > 0) {
            for (var i = 0; i < subs.length; i++) {
                subs[i].unsubscribe();
            }
        }
    };

    const initEventSvc = (scope) => {
        scope.subs = [];
        scope.$on('$destroy', () => {
            destroy(scope.subs);
        });
    };

    return {
        $emit: emit,
        $broadcast: emit,
        $listen: listen,
        $on: listen,
        $destroy: destroy,
        $init: initEventSvc
    };

}