import { URLService } from '@ve-utils/mms-api-client'

import { veUtils } from '@ve-utils'
/**
 * @ngdoc service
 * @name veUtils/ApplicationService
 * @requires $q
 * @requires $http
 * @requires URLService
 * * Provide general applications functions such as getting MMS Version, getting username,
 * creating unique IDs, etc...
 */
export class ApplicationService {
    private state: { inDoc: boolean; fullDoc: boolean; currentDoc: string } = {
        inDoc: false,
        fullDoc: false,
        currentDoc: null,
    }

    public getState(): {
        inDoc: boolean
        fullDoc: boolean
        currentDoc: string
    } {
        return this.state
    }
}

veUtils.service('ApplicationService', ApplicationService)
