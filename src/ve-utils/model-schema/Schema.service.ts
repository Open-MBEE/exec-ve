import * as angular from 'angular';
import {veUtils} from "@ve-utils";
import {VeConfig} from "@ve-types/config";

export interface SchemaMapping {
    jsonName: string
    [key: string]: any
}

export class SchemaService {

    static $inject = ['$q', '$injector', 'growl']

    public veConfig: VeConfig = window.__env
    public defaultSchema: 'cameo';
    public schemas: {[key: string]: string} = {
        'cameo': 'CameoSchemaService',
        'jupyter': 'JupyterSchemaService'
    }

    public schemaServices: {[key: string]: any}  = {}



    constructor(private $q, private $injector: angular.auto.IInjectorService, private growl: angular.growl.IGrowlService) {
        for (const [key, value] of Object.entries(this.schemas)) {
            this.schemaServices[key] = this.$injector.get(value)
        }

    }

    get(name:string, schema?:string, sourceId?: string): any {
        const schemaService: any | null = this._getSchema(schema, sourceId);
        if (schemaService[name]) {
            return schemaService[name]
        }else {
            this._schemaError(name,schema);
        }
    }

    getValue(name: string, key: string, schema?:string, sourceId?: string): any {
        const lookup = this.get(name,schema, sourceId)
        if (lookup && typeof lookup === 'object') {
            return lookup[key]
        }
    }

    getValues(name, keys: string[], schema?:string, sourceId?: string): any[] | null {
        const lookup = this.get(name,schema,sourceId)
        if (lookup && typeof lookup === 'object') {
            const response = [];
            for (const key in keys) {
                if (lookup.hasOwnProperty(key)) {
                    response.push(lookup[key]);
                }
            }
            return response
        }
    }

    getKeyByValue(name: string, value: any, schema?: string, sourceId?: string): any {
        const lookup = this.get(name,schema,sourceId)
        if (lookup && typeof lookup === 'object') {
            let response = '';
            Object.keys(lookup).some((key) => {
                if (lookup[key] === value) {
                    response = key
                    return true
                }
                return false
            })
            return response
        }
    }

    private _schemaError(name: string, schema?:string) {
        schema = (schema) ? schema : this.defaultSchema
        this.growl.error('Schema Lookup Error');
        if (this.veConfig.enableDebug) {
            console.log(schema + ' does not have table' + name + 'or it is not properly configured')
        }
    }

    private _getSchema(schema?: string, id?: string): any | null {
        schema = (schema) ? schema : this.defaultSchema
        id = (id) ? id : "error: unknown"
        if (this.schemaServices.hasOwnProperty(schema)) {
            return this.schemaServices[schema]
        }else {
            this.growl.error('Object ' + id + ' uses an unsupported schema ' + schema);
        }
    }

}

veUtils.service('SchemaService', SchemaService);
