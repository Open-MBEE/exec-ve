import Rx from 'rx-lite';

import { veUtils } from '@ve-utils';

export type eventHandlerFn<T> = (data: T) => void;

export class EventService {
    private subjects: { [key: string]: Rx.ISubject<unknown> } = {};
    private bindings: { [key: string]: Rx.ISubject<unknown> } = {};
    //API
    public $broadcast = <T>(name: string, data?: T): void => this.emit(name, data);
    public $on = <T>(name: string, handler: eventHandlerFn<T>): Rx.IDisposable => this.listen<T>(name, handler);
    public $destroy = (subs: Rx.IDisposable[]): void => this.destroy(subs);
    public $init = (ctrl: { subs: Rx.IDisposable[] } & angular.IComponentController): void => this.initEventSvc(ctrl);

    createName = (name: string): string => {
        return `$ ${name}`;
    };

    resolve<T = unknown>(name: string, data?: T): void {
        const fnName = this.createName(name);
        //$rootScope.$broadcast(name,data);
        if (!this.bindings[fnName]) {
            this.bindings[fnName] = new Rx.BehaviorSubject<T>(data);
        } else {
            this.bindings[fnName].onNext(data);
        }
    }

    binding<T = unknown>(name: string, handler: eventHandlerFn<T>): Rx.IDisposable {
        const fnName = this.createName(name);
        if (!this.bindings[fnName]) {
            throw Error('Binding ' + name + ' subscribed before initialization!');
        }
        return this.bindings[fnName].subscribe(handler);
    }

    emit<T = unknown>(name: string, data?: T): void {
        const fnName = this.createName(name);
        //$rootScope.$broadcast(name,data);
        if (!this.subjects[fnName]) {
            this.subjects[fnName] = new Rx.Subject<T>();
        }
        this.subjects[fnName].onNext(data);
    }

    listen<T = unknown>(name: string, handler: eventHandlerFn<T>): Rx.IDisposable {
        const fnName = this.createName(name);
        if (!this.subjects[fnName]) {
            this.subjects[fnName] = new Rx.Subject<T>();
        }
        return this.subjects[fnName].subscribe(handler);
    }

    destroy(subs: Rx.IDisposable[]): void {
        if (subs.length > 0) {
            for (let i = 0; i < subs.length; i++) {
                if (typeof subs[i].dispose === 'function') {
                    subs[i].dispose();
                }
            }
        }
    }

    initEventSvc(
        componentOrScope: {
            subs: Rx.IDisposable[];
        } & angular.IComponentController
    ): void {
        componentOrScope.subs = [];
        if (!componentOrScope.$onDestroy) {
            componentOrScope.$onDestroy = (): void => {
                this.destroy(componentOrScope.subs);
            };
        }
    }

    exists(eventOrBinding: string): boolean {
        const name = this.createName(eventOrBinding);
        return this.subjects.hasOwnProperty(name) || this.bindings.hasOwnProperty(name);
    }
}

veUtils.service('EventService', EventService);
