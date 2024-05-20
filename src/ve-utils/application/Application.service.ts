import { veUtils } from '@ve-utils';

import { VePromise, VeQService } from '@ve-types/angular';
/**
 * @ngdoc service
 * @name veUtils/ApplicationService
 * @requires $q
 * @requires $http
 * @requires URLService
 * * Provide general applications functions such as getting MMS Version, getting username,
 * creating unique IDs, etc...
 */

export interface VeApplicationState {
    inDoc: boolean;
    fullDoc: boolean;
    currentDoc: string;
    user: string;
}

export class ApplicationService {
    private state: VeApplicationState = {
        inDoc: false,
        fullDoc: false,
        currentDoc: null,
        user: null,
    };

    public PROJECT_URL_PREFIX = '#/projects/';

    static $inject = ['$q'];

    constructor(private $q: VeQService) {}

    public getState(): VeApplicationState {
        return this.state;
    }

    public copyToClipboard(target: JQuery<HTMLElement>, $event: JQuery.ClickEvent): VePromise<void, unknown> {
        $event.stopPropagation();
        return new this.$q((resolve, reject) => {
            navigator.clipboard.writeText(target[0].childNodes[0].textContent).then(resolve, reject);
        });
    }
}

veUtils.service('ApplicationService', ApplicationService);
