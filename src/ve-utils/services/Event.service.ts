import angular from 'angular'
import Rx from 'rx-lite'

import { veUtils } from '@ve-utils'

export type eventHandlerFn = (...args: any) => void

export class EventService {
    private subjects: { [key: string]: Rx.ISubject<any> } = {}

    //API
    public $broadcast = (name: string, data?: any): void =>
        this.emit(name, data)
    public $on = (name: string, handler: eventHandlerFn): Rx.IDisposable =>
        this.listen(name, handler)
    public $destroy = (subs: Rx.IDisposable[]): void => this.destroy(subs)
    public $init = (
        ctrl: { subs: Rx.IDisposable[] } & angular.IComponentController
    ): void => this.initEventSvc(ctrl)

    createName(name: string): string {
        return `$ ${name}`
    }

    emit(name: string, data?: unknown): void {
        const fnName = this.createName(name)
        //$rootScope.$broadcast(name,data);
        if (!this.subjects[fnName]) {
            this.subjects[fnName] = new Rx.Subject<unknown>()
        }
        this.subjects[fnName].onNext(data)
    }

    listen(name: string, handler: eventHandlerFn): Rx.IDisposable {
        const fnName = this.createName(name)
        if (!this.subjects[fnName]) {
            this.subjects[fnName] = new Rx.Subject<unknown>()
        }
        return this.subjects[fnName].subscribe(handler)
    }

    destroy(subs: Rx.IDisposable[]): void {
        if (subs.length > 0) {
            for (let i = 0; i < subs.length; i++) {
                if (typeof subs[i].dispose === 'function') {
                    subs[i].dispose()
                }
            }
        }
    }

    initEventSvc(
        componentOrScope: {
            subs: Rx.IDisposable[]
        } & angular.IComponentController
    ): void {
        componentOrScope.subs = []
        if (!componentOrScope.$onDestroy) {
            componentOrScope.$onDestroy = (): void => {
                this.destroy(componentOrScope.subs)
            }
        }
    }
}

veUtils.service('EventService', EventService)
