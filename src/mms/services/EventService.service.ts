import * as angular from 'angular'
var mms = angular.module('mms');


export class EventService {

    private subjects = {};

    constructor(private rx) {}

    createName(name) {
        return `$ ${name}`;
    }

    emit(name, data?) {
        let fnName = this.createName(name);
        //$rootScope.$broadcast(name,data);
        if (!this.subjects[fnName]) {
            (this.subjects[fnName] = new this.rx.Subject());
        }
        this.subjects[fnName].onNext(data);
    };

    listen(name, handler) {
        let fnName = this.createName(name);
        if (!this.subjects[fnName]) {
            (this.subjects[fnName] = new this.rx.Subject());
        }
        let sub = this.subjects[fnName].subscribe(handler);
        return sub;
    };

    destroy(subs) {
        if (subs.length > 0) {
            for (var i = 0; i < subs.length; i++) {
                if (typeof subs[i].dispose === 'function'){
                    subs[i].dispose();
                }

            }
        }
    };

    initEventSvc(componentOrScope) {
        componentOrScope.subs = [];
        if (componentOrScope.$on) {
            componentOrScope.$on('$destroy', () => {
                this.destroy(componentOrScope.subs);
            });
        }
        else if (!componentOrScope.$onDestroy) {
            componentOrScope.$onDestroy = () => {
                this.destroy(componentOrScope.subs);
            };
        }
    };

    $emit = this.emit
    $broadcast = this.emit
    $listen = this.listen
    $on = this.listen
    $destroy = this.destroy
    $init = this.initEventSvc
}

EventService.$inject = ['rx'];

mms.service('EventService', EventService);