import { veUtils } from '@ve-utils';

import { VePromiseReason } from '@ve-types/angular';
import { VeConfig } from '@ve-types/config';
import {
    ArtifactsRequest,
    BasicResponse,
    ElementsRequest,
    MmsObject,
    QueryParams,
    RequestObject,
    ViewsRequest,
} from '@ve-types/mms';

/**
 * @ngdoc service
 * @name veUtils/URLService
 * * This utility service gives back url paths for use in other services in communicating
 * with the server, arguments like projectId, refId, commitId are expected to be strings and
 * not null or undefined. This service is usually called by higher level services and
 * should rarely be used directly by applications.
 *
 * To configure the base url of the mms server, you can use the URLServiceProvider
 * in your application module's config. By default, the basePath is '/api', but is
 * effectively '/' relative to the service layer due to the rewrite rule.
 *  <pre>
        angular.module('myApp', ['ve-components'])
        .config(function(URLServiceProvider) {
            URLServiceProvider.setBasePath('https://url/context/path');
        });
 </pre>
 * (You may run into problems like cross origin security policy that prevents it from
 *  actually getting the resources from a different server, solution TBD)
 */
export class URLService {
    readonly root: string;
    readonly url: URL;
    private token: string;
    private veConfig: VeConfig = window.__env;

    static $inject = [];

    constructor(readonly basePath?: string, readonly apiUrl?: string) {
        if (!this.apiUrl) {
            this.apiUrl = this.veConfig.apiUrl;
        }
        if (!this.apiUrl) {
            throw new Error('Unable to find "apiUrl" configuration for MMS. Please check your configuration file.');
        }
        this.url = new URL(this.apiUrl);
        this.url.pathname = this.veConfig.basePath ? this.veConfig.basePath : '/';

        this.root = `${this.apiUrl}${this.basePath ? this.basePath : ''}`;
        const token = localStorage.getItem('token');
        this.token = `${token}`;
    }

    getRoot = (): string => {
        return this.root;
    };

    getUrl = (): URL => {
        return Object.assign({}, this.url);
    };

    setToken = (t: string): void => {
        this.token = t;
    };

    getAuthorizationHeaderValue = (): string => {
        return 'Bearer ' + this.token;
    };

    getAuthorizationHeader = (headers: angular.HttpHeaderType): angular.HttpHeaderType => {
        if (!this.token) {
            const token = localStorage.getItem('token');
            if (!token) {
                return headers;
            } else {
                this.setToken(token);
            }
        }
        if (!headers) {
            headers = this.getHeaders();
        }
        headers.Authorization = this.getAuthorizationHeaderValue();
        return headers;
    };

    getMmsServer = (): string => {
        return this.apiUrl;
    };

    /**
     * @name veUtils/URLService#setHeader
     * Adds generates Default Headers using this.token
     *
     * @returns {object} The HTTP header format
     */
    getHeaders(): angular.HttpHeaderType {
        return {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + this.token,
        };
    }

    /**
     * @name veUtils/URLService#isTimestamp
     * self explanatory
     *
     * @param {string} version A version string or timestamp
     * @returns {boolean} Returns true if the string has '-' in it
     */
    isTimestamp = (version?: string): boolean => {
        if (!version) return false;
        else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}[+]?-\d{4}$/.test(version.trim())) return true;
        return false;
    };

    /**
     * @name veUtils/URLService#getMmsVersionURL
     * self explanatory
     *
     * @returns {object} Returns object with mmsversion
     */
    getMmsVersionURL = (): string => {
        return `${this.root}/mmsversion`;
    };

    /**
     * @name veUtils/URLService#getSiteDashboardURL
     * Gets the path for a site dashboard.
     *
     * @param {string} site Site name (not title!).
     * @returns {string} The path for site dashboard.
     */
    getSiteDashboardURL = (site: string): string => {
        return `${this.root}/orgs/${site}/projects/${site}/branches/master/elements`;
    };

    /**
     * @name veUtils/URLService#getExportHtmlUrl
     * Gets url that to convert HTML to PDF or Word
     * @param {string} projectId id of the project
     * @param {string} refId id of the ref
     * @returns {string} The url
     */
    getExportHtmlUrl = (): string => {
        return this.veConfig.printUrl;
    };

    getAuthenticationUrl = (): string => {
        return `${this.root}/authentication`;
    };

    getPermissionsLookupURL = (): string => {
        return `${this.root}/permissions`;
    };

    getOrgURL = (orgId: string): string => {
        return `${this.root}/orgs/${orgId}`;
    };

    getOrgsURL = (): string => {
        return `${this.root}/orgs`;
    };

    getProjectsURL = (orgId?: string): string => {
        if (orgId) return `${this.root}/projects?orgId=${orgId}`;
        return `${this.root}/projects`;
    };

    getProjectURL = (projectId: string): string => {
        return `${this.root}/projects/${projectId}`;
    };

    getProjectMountsURL = (projectId: string, refId: string): string => {
        return `${this.root}/projects/${projectId}/refs/${refId}/mounts`;
    };

    getRefsURL = (projectId: string): string => {
        return `${this.root}/projects/${projectId}/refs`;
    };

    getRefURL = (projectId: string, refId: string): string => {
        return `${this.root}/projects/${projectId}/refs/${refId}`;
    };

    getCommitsURL = (projectId: string, refId: string, timestamp?: string, limit?: number): string => {
        let r = `${this.root}/projects/${projectId}/refs/${refId}/commits`;
        if (timestamp && this.isTimestamp(timestamp)) {
            r = this._addUrlParam({ maxTimestamp: timestamp }, r);
            if (!limit) {
                limit = 1;
            }
        }
        if (limit) {
            r = this._addUrlParam({ limit: limit }, r);
        }
        return r;
    };

    getCommitUrl = (projectId: string, refId: string, commitId: string): string => {
        return `${this.root}/projects/${projectId}/refs/${refId}/commits/${commitId}`;
    };

    getGroupsURL = (projectId: string, refId: string): string => {
        return `${this.root}/projects/${projectId}/refs/${refId}/groups`;
    };

    /**
     * @name veUtils/URLService#getProjectDocumentsURL
     * Gets the url for all documents in a ref
     *
     * @param {object} reqOb object with keys as described in ElementService.
     * @returns {string} The url
     */
    getProjectDocumentsURL = (reqOb: RequestObject): string => {
        const r = `${this.root}/projects/${reqOb.projectId}/refs/${reqOb.refId}/documents`;
        return this.addVersion(r, reqOb.commitId);
    };

    /**
     * @name veUtils/URLService#getImageURL
     * Gets the url for querying an image url
     * (this is not the actual image path)
     *
     * @returns {string} The path for image url queries.
     */
    getImageURL(reqOb: ElementsRequest<string>): string {
        const r = `${this.root}/projects/${reqOb.projectId}/refs/${reqOb.refId}/elements/${reqOb.elementId}`;
        return this.addVersion(r, reqOb.commitId);
    }

    /**
     * @name veUtils/URLService#getElementURL
     * Gets the path for an element
     *
     * @param {object} reqOb object with keys as described in ElementService.
     * @returns {string} The url.
     */
    getElementURL(reqOb: ElementsRequest<string>): string {
        const r = `${this.root}/projects/${reqOb.projectId}/refs/${reqOb.refId}/views/${reqOb.elementId}`;
        return this.addVersion(r, reqOb.commitId);
    }

    // getViewDataIdsURL (reqOb: RequestObject): string {
    //     const r =
    //         this.root +
    //         '/projects/' +
    //         reqOb.projectId +
    //         '/refs/' +
    //         reqOb.refId +
    //         '/elements/' +
    //         reqOb.elementId +
    //         '/cfids'
    //     return r
    // }
    //
    // getViewsURL (reqOb: RequestObject): string {
    //     const r =
    //         this.root +
    //         '/projects/' +
    //         reqOb.projectId +
    //         '/refs/' +
    //         reqOb.refId +
    //         '/views/' +
    //         reqOb.elementId
    //     return r
    // }

    getOwnedElementURL(reqOb: ElementsRequest<string>): string {
        let recurseString = 'recurse=true';
        if (reqOb.depth) recurseString = `depth=${reqOb.depth}`;
        let r = `${this.root}/projects/${reqOb.projectId}/refs/${reqOb.refId}/elements/${reqOb.elementId}`;
        r = this.addVersion(r, reqOb.commitId);
        if (r.indexOf('?') > 0) {
            r += '&' + recurseString;
        } else {
            r += '?' + recurseString;
        }
        return r;
    }

    /**
     * @name veUtils/URLService#getElementHistoryURL
     * Gets the url to query for element history
     *
     * @param {object} reqOb object with keys as described in ElementService.
     * @returns {string} The url.
     */
    getElementHistoryURL(reqOb: ElementsRequest<string>): string {
        return `${this.root}/projects/${reqOb.projectId}/refs/${reqOb.refId}/elements/${reqOb.elementId}/commits`;
    }

    /**
     *  @name veUtils/URLService#getPostViewsURL
     * Gets the path for posting view changes.
     * @param {RequestObject} reqOb
     * @return {string}
     */
    getPostViewsURL = (reqOb: ViewsRequest): string => {
        return this.addChildViews(
            `${this.root}/projects/${reqOb.projectId}/refs/${reqOb.refId}/views`,
            reqOb.returnChildViews
        );
    };

    /**
     * @name veUtils/URLService#getPostElementsURL
     * Gets the path for posting element changes.
     *
     * @param {object} reqOb object with keys as described in ElementService.
     * @returns {string} The post elements url.
     */
    getPostElementsURL = (reqOb: RequestObject): string => {
        return `${this.root}/projects/${reqOb.projectId}/refs/${reqOb.refId}/elements`;
    };

    /**
     * @name veUtils/URLService#getPutElementsURL
     * Gets the path for getting multiple elements (using put with body).
     *
     * @param {object} reqOb object with keys as described in ElementService.
     * @returns {string} The post elements url.
     */
    getPutElementsURL = (reqOb: RequestObject): string => {
        const r = `${this.root}/projects/${reqOb.projectId}/refs/${reqOb.refId}/views`;
        return this.addVersion(r, reqOb.commitId);
    };

    /**
     * @name veUtils/URLService#getElementSearchURL
     * Gets the url for element keyword search.
     *
     * @param {RequestObject} reqOb object with keys as described in ElementService.
     * @param {QueryParams} queryParams provide optional query parameters
     * @returns {string} The post elements url.
     */
    getElementSearchURL = (reqOb: RequestObject, queryParams?: QueryParams): string => {
        let r: string;
        let urlParams = '';
        if (queryParams) {
            urlParams = this._addUrlParam(queryParams);
        }
        if (urlParams !== '') {
            r = `${this.root}/projects/${reqOb.projectId}/refs/${reqOb.refId}/search${urlParams}`;
        } else {
            r = `${this.root}/projects/${reqOb.projectId}/refs/${reqOb.refId}/search`;
        }
        return r;
    };

    /**
     * @ngdocs method
     * @name veUtils/URLService#getArtifactURL
     * Gets the url for an artifact
     *
     * @param {object} reqOb object with keys
     * @param {string} artifactExtension (optional) string with the desired artifact extension
     * @returns {string} url
     */
    getArtifactURL(reqOb: ElementsRequest<string> | ArtifactsRequest<string>, artifactExtension?: string): string {
        const ext =
            artifactExtension !== undefined ? artifactExtension : (reqOb as ArtifactsRequest<string>).artifactExtension;
        const r = `${this.root}/projects/${reqOb.projectId}/refs/${reqOb.refId}/elements/${reqOb.elementId}/${ext}`;
        return this.addToken(this.addVersion(r, reqOb.commitId));
    }

    /**
     * @ngdocs method
     * @name veUtils/URLService#getArtifactEmbedURL
     * Gets the url without added this.token for an artifact
     *
     * @param {object} reqOb object with keys
     * @param {string} artifactExtension (optional) string with the desired artifact extension
     * @returns {string} url
     */
    getArtifactEmbedURL(reqOb: ArtifactsRequest<string>, artifactExtension: string): string {
        const ext = artifactExtension !== undefined ? artifactExtension : 'undefined';
        const r = `${this.root}/projects/${reqOb.projectId}/refs/${reqOb.refId}/elements/${reqOb.elementId}/${ext}`;
        return this.addVersion(r, reqOb.commitId);
    }

    /**
     * @ngdocs method
     * @name veUtils/URLService#getPutArtifactsURL
     * Gets the url for an artifact
     *
     * @param {object} reqOb object with keys
     * @returns {string} url
     */
    getPutArtifactsURL(reqOb: ElementsRequest<string>): string {
        const r = `${this.root}/projects/${reqOb.projectId}/refs/${reqOb.refId}/elements/${reqOb.elementId}`;
        return this.addVersion(r, reqOb.commitId);
    }

    /**
     * @ngdocs method
     * @name veUtils/URLService#getArtifactHistoryURL
     * Gets the url for an artifact commit history
     *
     * @param {object} reqOb object with keys
     * @returns {string} url
     */
    getArtifactHistoryURL(reqOb: ElementsRequest<string>): string {
        return this.getElementHistoryURL(reqOb);
    }

    getCheckTokenURL = (): string => {
        return `${this.root}/checkAuth`; //TODO remove when server returns 404
    };

    getPersonURL = (username: string): string => {
        return `${this.root}/users?user=${username}`;
    };

    /**
     * @name veUtils/URLService#handleHttpStatus
     * Utility for setting the state of a deferred object based on the status
     * of http error. The arguments are the same as angular's $http error
     * callback
     *
     * @param {Object} response The http response

     *      with this object based on the http status:
     *      ```
     *          {
     *              status: status,
     *              message: http status message,
     *              data: data
     *          }
     *      ```
     */
    handleHttpStatus<T extends MmsObject, U = BasicResponse<T>>(
        response: angular.IHttpResponse<U>
    ): VePromiseReason<U> {
        const result: VePromiseReason<U> = response;
        const data: U = result.data;
        if (result.status === 404) result.message = 'Not Found';
        else if (result.status === 500) {
            if (typeof data === 'string' && data.indexOf('ENOTFOUND') >= 0)
                result.message = 'Network Error (Please check network)';
            else result.message = 'Server Error';
        } else if (result.status === 401 || result.status === 403) result.message = 'Permission Error';
        else if (result.status === 409) result.message = 'Conflict';
        else if (result.status === 400) result.message = 'BadRequestObject';
        else if (result.status === 410) result.message = 'Deleted';
        else if (result.status === 408) result.message = 'Timed Out';
        else if (result.status === 501) {
            result.message = 'Caching';
        } else result.message = 'Timed Out (Please check network)';
        return result;
    }

    /**
     * @name veUtils/URLService#addVersion
     * Adds commitId parameter to URL string
     *
     * @param {String} url The url string for which to add version parameter argument.
     * @param {String} version The commit id
     * @returns {string} The url with commitId parameter added.
     */
    private addVersion = (url: string, version: string): string => {
        const r = url;
        if (version && version !== 'latest') {
            return this._addUrlParam({ commitId: version }, url);
        }
        return r;
    };

    private addChildViews = (url: string, add: boolean): string => {
        const r = url;
        if (!add) return r;
        return this._addUrlParam({ childviews: true }, r);
    };

    /**
     * @name veUtils/URLService#addToken
     * Adds token parameter to URL string
     *
     * @param {String} url The url string for which to add token parameter argument.
     * @returns {string} The url with commitId parameter added.
     */
    private addToken = (url: string): string => {
        return this._addUrlParam({ token: this.token }, url);
    };

    private _addUrlParam(
        paramOb: {
            [key: string]: string | boolean | number;
        },
        url?: string
    ): string {
        let urlParams = '';
        if (url) {
            urlParams = url;
        }
        for (const [key, value] of Object.entries(paramOb)) {
            let v: string;
            if (typeof value === 'string') v = value;
            else v = value.toString();
            if (urlParams.indexOf('?') > 0) {
                urlParams += `&${key}=${v}`;
            } else {
                urlParams += `?${key}=${v}`;
            }
        }
        return urlParams;
    }
}

veUtils.service('URLService', URLService);
