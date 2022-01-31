'use strict';

angular.module('mms')
    .factory('EventService', ['$rootScope', 'rx', EventService]);



function EventService($rootScope, rx) {

    function createName (name) {
        return `$ ${name}`;
    }

    this.subjects = {};

    const emit = (name, data) => {
        let fnName = createName(name);
        //$rootScope.$broadcast(name,data);
        if (!this.subjects[fnName]) {
            (this.subjects[fnName] = new rx.Subject());
        }
        this.subjects[fnName].onNext(data);
    };

    const listen = (name, handler) => {
        let fnName = createName(name);
        //let sub = $rootScope.$on(name,(event,data) => {handler(data);});
        //return sub;
        if (!this.subjects[fnName]) {
            (this.subjects[fnName] = new rx.Subject());
        }
        let sub = this.subjects[fnName].subscribe(handler);
        return sub;
    };

    const destroy = (subs) => {
        if (subs.length > 0) {
            for (var i = 0; i < subs.length; i++) {
                if (typeof subs[i].dispose === 'function'){
                    subs[i].dispose();
                }

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