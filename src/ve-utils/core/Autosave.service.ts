import { veUtils } from '@ve-utils'

import { EventService } from './Event.service'

import { ElementObject } from '@ve-types/mms'

export class AutosaveService {
    private edits: { [autosaveKey: string]: ElementObject } = {}

    public EVENT = 've-edits'

    static $inject = ['EventService']

    constructor(private eventSvc: EventService) {}

    trigger = (): void => {
        this.eventSvc.$broadcast(this.EVENT)
    }

    get<T extends ElementObject>(key: string): T {
        return this.edits[key] as T
    }

    getAll(): { [key: string]: ElementObject } {
        return this.edits
    }

    openEdits = (): number => {
        return Object.keys(this.edits).length
    }

    addOrUpdate = (key: string, value: ElementObject): void => {
        this.edits[key] = value
        this.trigger()
    }

    remove = (key: string): void => {
        delete this.edits[key]
        this.trigger()
    }

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
}

veUtils.service('AutosaveService', AutosaveService)
