import { veUtils } from '@ve-utils';

import { EventService } from './Event.service';

import { ElementObject, ValueObject } from '@ve-types/mms';

export interface EditObject<T extends ElementObject = ElementObject> {
    element: T;
    values?: ValueObject[];
    key: string;
}

export class EditService {
    private edits: { [editKey: string]: EditObject } = {};

    public EVENT = 've-edits';

    static $inject = ['EventService'];

    constructor(private eventSvc: EventService) {}

    trigger = (): void => {
        this.eventSvc.$broadcast(this.EVENT);
    };

    get<T extends ElementObject>(key: string | string[]): EditObject<T> {
        key = this.makeKey(key);
        return this.edits[key] as EditObject<T>;
    }

    getAll(): { [key: string]: EditObject } {
        return this.edits;
    }

    openEdits = (): number => {
        return Object.keys(this.edits).length;
    };

    addOrUpdate = (key: string | string[], data: ElementObject, overwrite?: boolean): EditObject => {
        key = this.makeKey(key);
        if (overwrite) {
            delete this.edits[key];
        }
        this.edits[key] = { key, element: data };

        this.trigger();
        return this.edits[key];
    };

    remove = (key: string | string[]): void => {
        key = this.makeKey(key);
        if (this.edits[key]) {
            delete this.edits[key];
            this.trigger();
        }
    };

    // getKey<T extends ElementObject>(): string {}

    reset = (): void => {
        const keys = Object.keys(this.edits);
        for (let i = 0; i < keys.length; i++) {
            delete this.edits[keys[i]];
        }
    };

    public makeKey(keys: string | string[]): string {
        if (Array.isArray(keys)) {
            return keys.join('|');
        } else {
            return keys;
        }
    }
}
veUtils.service('EditService', EditService);
