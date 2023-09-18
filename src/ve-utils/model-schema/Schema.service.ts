import { veUtils } from '@ve-utils';

import { VeConfig } from '@ve-types/config';

export interface SchemaMapping {
    [key: string]: unknown;
}

export interface Schema {
    jsonName: string;
    schema: SchemaMapping;
    map?: SchemaMapping;
}

export class SchemaService {
    static $inject = ['$q', '$injector'];

    public veConfig: VeConfig = window.__env;
    public defaultSchema: 'cameo';
    public schemaList: { [key: string]: string } = {
        cameo: 'CameoSchema',
        jupyter: 'JupyterSchema',
    };

    public schemas: { [key: string]: Schema } = {};

    constructor(private $q, private $injector: angular.auto.IInjectorService) {
        for (const [key, value] of Object.entries(this.schemaList)) {
            this.schemas[key] = this.$injector.get(value);
        }
    }

    getSchema = <T>(name: string, schemaName?: string, sourceId?: string): T => {
        const schema: Schema = this._getSchema(schemaName, sourceId);
        if (schema.schema[name]) {
            return schema.schema[name] as T;
        } else {
            this._schemaError(name, schemaName);
        }
    };

    getValue = <T>(name: string, key: string, schemaName?: string, sourceId?: string): T => {
        const lookup = this.getSchema(name, schemaName, sourceId);
        if (lookup && typeof lookup === 'object') {
            return lookup[key] as T;
        }
    };

    getValues<T>(name: string, keys: string[], schemaName?: string, sourceId?: string): T[] | null {
        const lookup = this.getSchema(name, schemaName, sourceId);
        if (lookup && typeof lookup === 'object') {
            const response: T[] = [];
            keys.forEach((key) => {
                if (lookup.hasOwnProperty(key)) {
                    response.push(lookup[key] as T);
                }
            });
            return response;
        }
    }

    getMap = <T>(name: string, schemaName?: string, sourceId?: string): T => {
        const schema: Schema = this._getSchema(schemaName, sourceId);
        if (schema.map && schema.map[name]) {
            return schema.map[name] as T;
        } else {
            this._schemaError(name, schemaName);
            return null;
        }
    };

    getMappedValue = <T>(name: string, key: string, schemaName?: string, sourceId?: string): T => {
        const lookup = this.getMap(name, schemaName, sourceId);
        if (lookup && typeof lookup === 'object') {
            return lookup[key] as T;
        }
    };

    getKeyByValue = <T>(name: string, value: T, schemaName?: string, sourceId?: string): string => {
        const lookup = this.getSchema(name, schemaName, sourceId);
        if (lookup && typeof lookup === 'object') {
            let response = '';
            Object.keys(lookup).some((key) => {
                if (lookup[key] === value) {
                    response = key;
                    return true;
                }
                return false;
            });
            return response;
        }
    };

    private _schemaError = (name: string, schemaName?: string): void => {
        schemaName = schemaName ? schemaName : this.defaultSchema;
        if (this.veConfig.enableDebug) {
            console.log(schemaName + ' does not have table' + name + 'or it is not properly configured');
        }
    };

    private _getSchema = (schemaName?: string, id?: string): Schema | null => {
        schemaName = schemaName ? schemaName : this.defaultSchema;
        id = id ? id : 'error: unknown';
        if (this.schemas.hasOwnProperty(schemaName)) {
            return this.schemas[schemaName];
        } else {
            console.log(`Object ${id} uses an unknown schema ${schemaName}`);
        }
    };
}

veUtils.service('SchemaService', SchemaService);
