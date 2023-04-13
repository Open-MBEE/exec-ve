import { veUtils } from '@ve-utils'

import { EventService } from './Event.service'

import { ConstraintObject, ElementObject, SlotObject, TaggedValueObject, ValueObject } from '@ve-types/mms'

export interface EditObject<T extends ElementObject = ElementObject> {
    edit: T
    editValues: ValueObject[]
    key: string
}

export class EditService {
    private edits: { [editKey: string]: EditObject } = {}

    public EVENT = 've-edits'

    static $inject = ['EventService']

    constructor(private eventSvc: EventService) {}

    trigger = (): void => {
        this.eventSvc.$broadcast(this.EVENT)
    }

    get<T extends ElementObject>(key: string | string[]): EditObject<T> {
        key = this.makeKey(key)
        return this.edits[key] as EditObject<T>
    }

    getAll(): { [key: string]: EditObject } {
        return this.edits
    }

    openEdits = (): number => {
        return Object.keys(this.edits).length
    }

    addOrUpdate = (key: string | string[], data: ElementObject): EditObject => {
        key = this.makeKey(key)
        this.edits[key] = { key, edit: data, editValues: [] }
        if (data.type === 'Property' || data.type === 'Port') {
            if (data.defaultValue) {
                this.edits[key].editValues = [data.defaultValue]
            }
        } else if (data.type === 'Slot') {
            if (Array.isArray(data.value)) {
                this.edits[key].editValues = (data as SlotObject).value
            }
        } else if (data.type.includes('TaggedValue')) {
            if (Array.isArray(data.value)) {
                this.edits[key].editValues = (data as TaggedValueObject).value
            }
        } else if (data.type === 'Constraint' && data.specification) {
            this.edits[key].editValues = [(data as ConstraintObject).specification]
        }
        this.trigger()
        return this.edits[key]
    }

    remove = (key: string | string[]): void => {
        key = this.makeKey(key)
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

    public clearAutosave = (key: string | string[]): void => {
        key = this.makeKey(key)
        const elementType = this.edits[key].edit.type
        if (elementType === 'Slot' || elementType.includes('TaggedValue')) {
            Object.keys(window.localStorage).forEach((akey) => {
                if (akey.indexOf(key as string) !== -1) {
                    window.localStorage.removeItem(key as string)
                }
            })
        } else {
            window.localStorage.removeItem(key)
        }
    }

    public makeKey(keys: string | string[]): string {
        if (Array.isArray(keys)) {
            return keys.join('|')
        } else {
            return keys
        }
    }
}
veUtils.service('EditService', EditService)
