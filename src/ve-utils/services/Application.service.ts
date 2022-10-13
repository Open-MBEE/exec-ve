import {URLService} from "@ve-utils/mms-api-client";
import {veUtils} from "@ve-utils";

/**
 * @ngdoc service
 * @name veUtils/ApplicationService
 * @requires $q
 * @requires $http
 * @requires URLService
 *
 * @description
 * Provide general applications functions such as getting MMS Version, getting username,
 * creating unique IDs, etc...
 */
export class ApplicationService {
    private state: { inDoc: boolean, fullDoc: boolean, currentDoc: string } = {inDoc: false, fullDoc: false, currentDoc: null}

    constructor(private $q, private $http, private urlSvc : URLService) {}

    source = this.createUniqueId();

    createUniqueId() {
        const s = [];
        const hexDigits = "0123456789abcdef";
        for (let i = 0; i < 36; i++) {
            s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
        }

        s[14] = "4";
        s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);
        //s[8] = s[13] = s[18] = s[23] = "-";
        return s.join("");
    }

    getSource() {
        return this.source;
    }

    getMmsVersion() {
        const deferred = this.$q.defer();
        this.$http.get(this.urlSvc.getMmsVersionURL())
            .then((response) => {
                deferred.resolve(response.data.mmsVersion);
            }, (response) => {
                this.urlSvc.handleHttpStatus(response.data, response.status, response.headers, response.config, deferred);
            });
        return deferred.promise;
    }

    getState() {
        return this.state;
    }
}

ApplicationService.$inject = ['$q', '$http', 'URLService'];

veUtils.service('ApplicationService', ApplicationService);

