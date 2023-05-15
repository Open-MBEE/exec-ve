import { Schema, SchemaMapping } from '@ve-utils/model-schema/Schema.service';

import { veUtils } from '@ve-utils';

export class JupyterSchema implements Schema {
    static $inject = [];

    jsonName: string = 'jupyter';
    schema: SchemaMapping = {};
}

veUtils.service('JupyterSchema', JupyterSchema);
