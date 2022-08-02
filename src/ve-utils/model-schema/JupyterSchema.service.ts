import {veUtils} from "@ve-utils";
import {SchemaMapping} from "@ve-utils/model-schema/Schema.service";

export class JupyterSchemaService implements SchemaMapping {

    static $inject = []

    constructor() {}

    jsonName: string = 'jupyter';

}

veUtils.service('JupyterSchemaService', JupyterSchemaService)
