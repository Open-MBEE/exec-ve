import _ from 'lodash';

import { veUtils } from '@ve-utils';

import { ElementObject, MmsObject } from '@ve-types/mms';

export class CacheService {
    public cache: { [key: string]: string | unknown | unknown[] } = {};

    static $inject = [];

    get<T>(key: string | string[], noCopy?: boolean): T | undefined {
        const realKey: string = this._makeKey(key);
        const result: T = this._get<T>(realKey);

        return result;
        //else return _.cloneDeep(result)
    }

    private _get = <T>(realKey: string): T => {
        const recurse = (key: string): string | T => {
            if (typeof this.cache[key] === 'string') {
                return recurse(this.cache[key] as string);
            }
            return this.cache[key] as T;
        };
        if (this.cache.hasOwnProperty(realKey)) {
            let result: T;
            if (typeof this.cache[realKey] === 'string') {
                result = recurse(this.cache[realKey] as string) as T;
            } else {
                result = this.cache[realKey] as T;
            }
            return result;
        }
        return;
    };

    /**
     * @name CacheService#getElements
     * Get the latest elements in the cache with the parameter workspace ID
     *
     * @param {string} projectId The mms project id
     * @param {string} refId The branch/tag id
     * @returns {Object} Value if found, empty array if not found
     */
    getLatestElements<T extends MmsObject>(projectId: string, refId: string): T[] {
        const latestElements: T[] = [];
        for (const key in this.cache) {
            if (!this.cache.hasOwnProperty(key)) {
                continue;
            }
            if (
                key.indexOf('|latest') >= 0 &&
                key.indexOf('element|') >= 0 &&
                key.indexOf('|edit') < 0 &&
                key.indexOf('deleted') < 0 &&
                key.indexOf(refId) >= 0 &&
                key.indexOf(projectId) >= 0
            ) {
                const val: T | T[] = this._get<T>(key);
                if (val) {
                    Array.isArray(val) ? latestElements.push(...val) : latestElements.push(val);
                }
            }
        }
        return latestElements;
    }

    /**
     * @name CacheService#put
     * Put value into cache
     *
     * @param {Array.<string>|string} key String key or Array of hierarchical keys
     * @param {Object} value The value to save
     * @param {boolean} [merge=false] Whether to replace the value or do a merge if value already exists
     * @returns {Object} the original value
     */
    put<T extends MmsObject | MmsObject[]>(key: string | string[], value: T, merge?: boolean): T {
        const m = typeof merge === 'undefined' ? false : merge;
        const realKey = this._makeKey(key);
        let currentValue: T = this.get<T>(realKey, true);
        if (currentValue && m) {
            _.mergeWith(currentValue, value, (a: unknown, b: unknown, id: string) => {
                if ((id === '_contents' || id === 'specification') && b && (b as ElementObject).type === 'Expression') {
                    return b;
                }
                if (Array.isArray(a) && Array.isArray(b) && b.length < a.length) {
                    a.length = 0;
                    a.push(...(b as unknown[]));
                    return a as unknown[];
                }
                if (id === '_displayedElementIds' && b) {
                    return b;
                }
                return undefined;
            });
        } else {
            this.cache[realKey] = value;
            currentValue = value;
        }
        return currentValue;
    }

    /**
     * @name CacheService#link
     * Create a link to another cached items. This link will be automatically followed/resolved by cache service
     *
     * @param {string | string[]} sourceKey
     * @param {string | string[]} targetKey
     */
    public link(sourceKey: string | string[], targetKey: string | string[]): void {
        const realSourceKey: string = this._makeKey(sourceKey);
        if (this.cache.hasOwnProperty(realSourceKey) && typeof this.cache[realSourceKey] !== 'string') {
            delete this.cache[realSourceKey];
        }

        this.cache[realSourceKey] = this._makeKey(targetKey);
    }

    /**
     * @name CacheService#remove
     * Remove value from cache and return it
     *
     * @param {Array.<string>|string} key String key or Array of hierarchical keys
     * @returns {Object} value that was removed or undefined
     */
    remove<T>(key: string | string[]): T {
        let realKey: string;
        if (Array.isArray(key)) {
            realKey = this._makeKey(key);
        } else {
            realKey = key;
        }
        if (!this.cache.hasOwnProperty(realKey)) {
            return null;
        }
        const removed = this.cache[realKey];
        delete this.cache[realKey];
        if (typeof removed === 'string') {
            return this.remove(removed);
        }
        return removed as T;
    }

    /**
     * @name CacheService#exists
     * Check if value exists with a specific key
     *
     * @param {Array.<string>|string} key String key or Array of hierarchical keys
     * @returns {boolean} whether value exists for key
     */
    exists(key: string | string[]): boolean {
        let realKey = '';
        if (Array.isArray(key)) {
            realKey = this._makeKey(key);
        } else {
            realKey = key;
        }
        if (!this.cache.hasOwnProperty(realKey)) {
            return false;
        }
        const val = this.cache[realKey];
        if (typeof val === 'object') {
            return true;
        }
        if (typeof val === 'string') {
            return this.exists(val);
        }
        return false;
    }

    private _makeKey(keys: string | string[]): string {
        if (Array.isArray(keys)) {
            return keys.join('|');
        } else {
            return keys;
        }
    }

    reset = (): void => {
        const keys = Object.keys(this.cache);
        for (let i = 0; i < keys.length; i++) {
            delete this.cache[keys[i]];
        }
    };
}

veUtils.service('CacheService', CacheService);
