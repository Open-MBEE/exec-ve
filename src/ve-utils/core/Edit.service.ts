import { veUtils } from '@ve-utils'

import { EventService } from './Event.service'

import { ElementObject } from '@ve-types/mms'

export class EditService {
    private edits: { [editKey: string]: ElementObject } = {}

    public EVENT = 've-edits'

    static $inject = ['EventService']

    constructor(private eventSvc: EventService) {}

    trigger = (): void => {
        this.eventSvc.$broadcast(this.EVENT)
    }

    get<T extends ElementObject>(key: string | string[]): T {
        key = this._makeKey(key)
        return this.edits[key] as T
    }

    getAll(): { [key: string]: ElementObject } {
        return this.edits
    }

    openEdits = (): number => {
        return Object.keys(this.edits).length
    }

    addOrUpdate = (key: string | string[], value: ElementObject): void => {
        key = this._makeKey(key)
        this.edits[key] = value
        this.trigger()
    }

    remove = (key: string | string[]): void => {
        key = this._makeKey(key)
        delete this.edits[key]
        this.trigger()
    }

    // getKey<T extends ElementObject>(): string {}

    reset = (): void => {
        const keys = Object.keys(this.edits)
        for (let i = 0; i < keys.length; i++) {
            delete this.edits[keys[i]]
        }
    }

    public clearAutosave = (autosaveKey: string, elementType: string): void => {
        if (elementType === 'Slot') {
            Object.keys(window.localStorage).forEach((key) => {
                if (key.indexOf(autosaveKey) !== -1) {
                    window.localStorage.removeItem(key)
                }
            })
        } else {
            window.localStorage.removeItem(autosaveKey)
        }
    }

    private _makeKey(keys: string | string[]): string {
        if (Array.isArray(keys)) {
            return keys.join('|')
        } else {
            return keys
        }
    }
}
veUtils.service('EditService', EditService)
