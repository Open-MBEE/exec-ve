import {URLService} from "@ve-utils/mms-api-client";
import {UtilsService} from "./Utils.service";
import {veUtils} from "@ve-utils";


export class ShortenUrlService {

    public dynamicPopover: {
        templateUrl: 'shareUrlTemplate.html',
        title: 'Share'
    }
    constructor(private $http, private $q, private uRLSvc : URLService, private utilsSvc : UtilsService) {}

    public getShortUrl(currentUrl, scope) {
        const SHARE_URL = 'https://opencae.jpl.nasa.gov/goto/';
        return this.$http.post('https://purl-prod.jpl.nasa.gov/create', {'url': currentUrl}, {headers: {'Authorization': 'Basic Og=='}})
            .then((response) => {
                scope.shortUrl = SHARE_URL + response.data.link;
            }, (response) => {
                return this.uRLSvc.handleHttpStatus(response.data, response.status, response.headers, response.config, this.$q.defer());
            });
    }

    public copyToClipboard($event) {
        this.utilsSvc.copyToClipboard($('#ve-short-url'), $event);
    }
}

ShortenUrlService.$inject = ['$http', '$q', 'URLService', 'UtilsService'];

veUtils.service('ShortenUrlService', ShortenUrlService);

