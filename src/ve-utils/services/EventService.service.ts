import * as angular from 'angular'
import Rx from 'rx'

var veUtils = angular.module('veUtils');

export interface IEventService {
    $emit: { (name: string, data?: any): void }
    $broadcast: { (name: string, data?: any): void }
    $listen: { (name: string, handler: eventHanderFn): Rx.IDisposable}
    $on: { (name: string, handler: eventHanderFn): Rx.IDisposable}
    $destroy: { (subs: PushSubscription[]): void}
    $init: { (componentOrScope: angular.IComponentController | angular.IScope): void}
}

export interface eventHanderFn {
    (args?: any): void
}

export class EventService implements IEventService{

    private subjects: {[key:string]: Rx.ISubject<any>} = {};

    //API
    public $emit = this.emit
    public $broadcast = this.emit
    public $listen = this.listen
    public $on = this.listen
    public $destroy = this.destroy
    public $init = this.initEventSvc

    constructor(private rx: Rx) {}

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
        return this.subjects[fnName].subscribe(handler);
    };

    destroy(subs: Rx.IDisposable[]) {
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


}

EventService.$inject = ['rx'];

veUtils.service('EventService', EventService);

