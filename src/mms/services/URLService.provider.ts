import * as angular from "angular";
var mms = angular.module('mms');


export class URLServiceProvider {
    private baseUrl = '/api';
    private mmsUrl = 'localhost:8080';

    constructor() {
    };

   setBaseUrl(base) {
        this.baseUrl = base;
    };
   setMmsUrl(mms) {
        this.mmsUrl = mms;
    };
    $get() {
        return new URLService(this.baseUrl,this.mmsUrl);
    }
}

mms.provider('URLService', URLServiceProvider)
/**
 * @ngdoc service
 * @name mms.URLService
 *
 * @description
 * This utility service gives back url paths for use in other services in communicating
 * with the server, arguments like projectId, refId, commitId are expected to be strings and
 * not null or undefined. This service is usually called by higher level services and
 * should rarely be used directly by applications.
 *
 * To configure the base url of the mms server, you can use the URLServiceProvider
 * in your application module's config. By default, the baseUrl is '/api', but is
 * effectively '/' relative to the service layer due to the rewrite rule.
 *  <pre>
        angular.module('myApp', ['mms'])
        .config(function(URLServiceProvider) {
            URLServiceProvider.setBaseUrl('https://url/context/path');
        });
 </pre>
 * (You may run into problems like cross origin security policy that prevents it from
 *  actually getting the resources from a different server, solution TBD)
 */
export class URLService {
    readonly root

    private  token

    constructor(private baseUrl, private mmsUrl) {
        this.root = this.mmsUrl + this.baseUrl;
    }

    getRoot() {
        return this.root;
    };

    setToken(t) {
        this.token = t;
    };

    getAuthorizationHeaderValue() {
        return ('Bearer ' + this.token);
    };

    getAuthorizationHeader(headers) {
        if (!this.token) {
            return headers;
        }
        if (!headers) {
            headers = this.getHeaders();
        }
        headers.Authorization = this.getAuthorizationHeaderValue();
        return headers;
    };

    getJMSHostname() {
        return this.root + '/connection/jms';
    };

    getMmsServer() {
        return this.mmsUrl;
    };

    /**
     * @ngdoc method
     * @name mms.URLService#setHeader
     * @methodOf mms.URLService
     *
     * @description
     * Adds generates Default Headers using this.token
     *
     * @returns {object} The HTTP header format
     */
    getHeaders() {
        return {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + this.token
        };
    };

    /**
     * @ngdoc method
     * @name mms.URLService#isTimestamp
     * @methodOf mms.URLService
     *
     * @description
     * self explanatory
     *
     * @param {string} version A version string or timestamp
     * @returns {boolean} Returns true if the string has '-' in it
     */
    isTimestamp(version?) {
        if (!version)
            return false;
        else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}[+]?-\d{4}$/.test(version.trim()))
            return true;
        return false;
    };

    /**
     * @ngdoc method
     * @name mms.URLService#getMmsVersionURL
     * @methodOf mms.URLService
     *
     * @description
     * self explanatory
     *
     * @returns {object} Returns object with mmsversion
     */
    getMmsVersionURL() {
        return this.root + "/mmsversion";
    };

    /**
     * @ngdoc method
     * @name mms.URLService#getSiteDashboardURL
     * @methodOf mms.URLService
     *
     * @description
     * Gets the path for a site dashboard.
     *
     * @param {string} site Site name (not title!).
     * @returns {string} The path for site dashboard.
     */
    getSiteDashboardURL(site) {
        return this.root + "/orgs/" + site + "/projects/" + site + "/branches/master/elements";
    };

    /**
     * @ngdoc method
     * @name mms.URLService#getExportHtmlUrl
     * @methodOf mms.URLService
     *
     * @description
     * Gets url that to convert HTML to PDF or Word
     * @param {string} projectId id of the project
     * @param {string} refId id of the ref
     * @returns {string} The url
     */
    getExportHtmlUrl(projectId, refId) {
        return this.root + "/projects/" + projectId +
            "/refs/" + refId + '/convert';
    };


    getAuthenticationUrl() {
        return this.root + "/authentication";
    };

    getPermissionsLookupURL() {
        return this.root + "/permissions";
    };

    getOrgURL(orgId) {
        return this.root + '/orgs/' + orgId;
    };

    getOrgsURL() {
        return this.root + "/orgs";
    };

    getProjectsURL(orgId) {
        if (orgId)
            return this.root + '/projects?orgId=' + orgId;
        return this.root + '/projects';
    };

    getProjectURL(projectId) {
        return this.root + "/projects/" + projectId;
    };

    getProjectMountsURL(projectId, refId) {
        return this.root + '/projects/' + projectId + '/refs/' + refId + '/mounts';
    };

    getRefsURL(projectId) {
        return this.root + '/projects/' + projectId + '/refs';
    };

    getRefURL(projectId, refId) {
        return this.root + '/projects/' + projectId + '/refs/' + refId;
    };

    getRefHistoryURL(projectId, refId, timestamp?) {
        if (timestamp !== '' && this.isTimestamp(timestamp)) {
            return this.root + '/projects/' + projectId + '/refs/' + refId + '/commits' + '&maxTimestamp=' + timestamp + '&limit=1';
        }
        return this.root + '/projects/' + projectId + '/refs/' + refId + '/commits';
    };

    getGroupsURL(projectId, refId) {
        return this.root + '/projects/' + projectId + '/refs/' + refId + '/groups';
    };

    /**
     * @ngdoc method
     * @name mms.URLService#getSiteProductsURL
     * @methodOf mms.URLService
     *
     * @description
     * Gets the url for all documents in a ref
     *
     * @param {object} reqOb object with keys as described in ElementService.
     * @returns {string} The url
     */
    getProjectDocumentsURL(reqOb) {
        var r = this.root + "/projects/" + reqOb.projectId +
            "/refs/" + reqOb.refId +
            "/documents";
        return this.addExtended(this.addVersion(r, reqOb.commitId), reqOb.extended);
    };

    /**
     * @ngdoc method
     * @name mms.URLService#getImageURL
     * @methodOf mms.URLService
     *
     * @description
     * Gets the url for querying an image url
     * (this is not the actual image path)
     *
     * @returns {string} The path for image url queries.
     */
    getImageURL(reqOb) {
        var r = this.root + '/projects/' + reqOb.projectId + '/refs/' + reqOb.refId + '/elements/' +
            reqOb.elementId;
        return this.addVersion(r, reqOb.commitId);
    };

    /**
     * @ngdoc method
     * @name mms.URLService#getElementURL
     * @methodOf mms.URLService
     *
     * @description
     * Gets the path for an element
     *
     * @param {object} reqOb object with keys as described in ElementService.
     * @returns {string} The url.
     */
    getElementURL(reqOb) {
        var r = this.root + '/projects/' + reqOb.projectId + '/refs/' + reqOb.refId + '/elements/' + reqOb.elementId;
        return this.addExtended(this.addVersion(r, reqOb.commitId), reqOb.extended);
    };

    getViewElementIdsURL(reqOb) {
        var r = this.root + '/projects/' + reqOb.projectId + '/refs/' + reqOb.refId + '/elements/' + reqOb.elementId + '/cfids';
        return r;
    };

    getViewsURL(reqOb) {
        var r = this.root + '/projects/' + reqOb.projectId + '/refs/' + reqOb.refId + '/views/' + reqOb.elementId;
        return r;
    };

    getOwnedElementURL(reqOb) {
        var recurseString = 'recurse=true';
        if (reqOb.depth)
            recurseString = 'depth=' + reqOb.depth;
        var r = this.root + '/projects/' + reqOb.projectId + '/refs/' + reqOb.refId + '/elements/' + reqOb.elementId;
        r = this.addVersion(r, reqOb.commitId);
        if (r.indexOf('?') > 0) {
            r += '&' + recurseString;
        } else {
            r += '?' + recurseString;
        }
        return this.addExtended(r, reqOb.extended);
    };

    /**
     * @ngdoc method
     * @name mms.URLService#getElementVersionsURL
     * @methodOf mms.URLService
     *
     * @description
     * Gets the url to query for element history
     *
     * @param {object} reqOb object with keys as described in ElementService.
     * @returns {string} The url.
     */
    getElementHistoryURL(reqOb) {
        return this.root + '/projects/' + reqOb.projectId + '/refs/' + reqOb.refId + '/elements/' + reqOb.elementId + '/commits';
    };

    /**
     * @ngdoc method
     * @name mms.URLService#getPostElementsURL
     * @methodOf mms.URLService
     *
     * @description
     * Gets the path for posting element changes.
     *
     * @param {object} reqOb object with keys as described in ElementService.
     * @returns {string} The post elements url.
     */
    getPostElementsURL(reqOb) {
        return this.addExtended(this.addChildViews(this.root + '/projects/' + reqOb.projectId + '/refs/' + reqOb.refId + '/views', reqOb.returnChildViews), reqOb.extended);
    };

    /**
     * @ngdoc method
     * @name mms.URLService#getPutElementsURL
     * @methodOf mms.URLService
     *
     * @description
     * Gets the path for getting multiple elements (using put with body).
     *
     * @param {object} reqOb object with keys as described in ElementService.
     * @returns {string} The post elements url.
     */
    getPutElementsURL(reqOb) {
        var r = this.root + '/projects/' + reqOb.projectId + '/refs/' + reqOb.refId + '/views';
        return this.addExtended(this.addVersion(r, reqOb.commitId), reqOb.extended);
    };

    /**
     * @ngdoc method
     * @name mms.URLService#getElementSearchURL
     * @methodOf mms.URLService
     *
     * @description
     * Gets the url for element keyword search.
     *
     * @param {object} reqOb object with keys as described in ElementService.
     * @returns {string} The post elements url.
     */
    getElementSearchURL(reqOb) {
        var r = this.root + '/projects/' + reqOb.projectId + '/refs/' + reqOb.refId + '/search' + (reqOb.checkType ? '?checkType=true' : '');
        return this.addExtended(r, true);
    };

    /**
     * @ngdoc method
     * @name mms.URLService#getSearchURL
     * @methodOf mms.URLService
     *
     * @description
     * Gets the url for default search. Can optionally provide query parameters
     * i.e. `checkType=true&literal=true`
     *
     * @param {string} projectId Project Id
     * @param {string} refId Ref Id
     * @param {string} urlParams provide optional query parameters
     * @returns {string} The url with ticket
     */
    getSearchURL(projectId, refId, urlParams?) {
        var r;
        if (urlParams !== undefined && urlParams !== null && urlParams !== '') {
            // ie '/search?checkType=true&literal=true';
            r = this.root + '/projects/' + projectId + '/refs/' + refId + '/search?' + urlParams;
        } else {
            r = this.root + '/projects/' + projectId + '/refs/' + refId + '/search';
        }
        return r;
    };

    /**
     * @ngdocs method
     * @name mms.URLService#getArtifactURL
     * @methodOf mms.URLService
     *
     * @description
     * Gets the url for an artifact
     *
     * @param {object} reqOb object with keys
     * @param {string} artifactExtension (optional) string with the desired artifact extension
     * @returns {string} url
     */
    getArtifactURL(reqOb, artifactExtension) {
        var ext = (artifactExtension !== undefined) ? artifactExtension : reqOb.artifactExtension;
        var r = this.root + '/projects/' + reqOb.projectId + '/refs/' + reqOb.refId + '/elements/' + reqOb.elementId + '/' + ext;
        return this.addToken(this.addVersion(r, reqOb.commitId));
    };

    /**
     * @ngdocs method
     * @name mms.URLService#getArtifactEmbedURL
     * @methodOf mms.URLService
     *
     * @description
     * Gets the url without added this.token for an artifact
     *
     * @param {object} reqOb object with keys
     * @param {string} artifactExtension (optional) string with the desired artifact extension
     * @returns {string} url
     */
    getArtifactEmbedURL(reqOb, artifactExtension) {
        var ext = (artifactExtension !== undefined) ? artifactExtension : reqOb.artifactExtension;
        var r = this.root + '/projects/' + reqOb.projectId + '/refs/' + reqOb.refId + '/elements/' + reqOb.elementId + '/' + ext;
        return this.addVersion(r, reqOb.commitId);
    };

    /**
     * @ngdocs method
     * @name mms.URLService#getPutArtifactsURL
     * @methodOf mms.URLService
     *
     * @description
     * Gets the url for an artifact
     *
     * @param {object} reqOb object with keys
     * @returns {string} url
     */
    getPutArtifactsURL(reqOb) {
        var r = this.root + '/projects/' + reqOb.projectId + '/refs/' + reqOb.refId + '/elements/' + reqOb.elementId;
        return this.addVersion(r, reqOb.commitId);
    };

    /**
     * @ngdocs method
     * @name mms.URLService#getArtifactHistoryURL
     * @methodOf mms.URLService
     *
     * @description
     * Gets the url for an artifact commit history
     *
     * @param {object} reqOb object with keys
     * @returns {string} url
     */
    getArtifactHistoryURL(reqOb) {
        return this.getElementHistoryURL(reqOb);
    };

    getCheckTokenURL() {
        return this.root + '/checkAuth'; //TODO remove when server returns 404
    };

    getPersonURL(username) {
        //return this.root + '/checkAuth';
        return this.root + '/users?user=' + username;
    };

    /**
     * @ngdoc method
     * @name mms.URLService#handleHttpStatus
     * @methodOf mms.URLService
     *
     * @description
     * Utility for setting the state of a deferred object based on the status
     * of http error. The arguments are the same as angular's $http error
     * callback
     *
     * @param {Object} data The http response
     * @param {number} status Http return status
     * @param {Object} header Http return header
     * @param {Object} config Http config
     * @param {Object} deferred A deferred object that would be rejected
     *      with this object based on the http status:
     *      ```
     *          {
     *              status: status,
     *              message: http status message,
     *              data: data
     *          }
     *      ```
     */
    handleHttpStatus(data, status, header, config, deferred) {
        var result = {status: status, data: data, message: ''};
        if (status === 404)
            result.message = "Not Found";
        else if (status === 500) {
            if (angular.isString(data) && data.indexOf("ENOTFOUND") >= 0)
                result.message = "Network Error (Please check network)";
            else
                result.message = "Server Error";
        } else if (status === 401 || status === 403)
            result.message = "Permission Error";
        else if (status === 409)
            result.message = "Conflict";
        else if (status === 400)
            result.message = "Bad Request";
        else if (status === 410)
            result.message = "Deleted";
        else if (status === 408)
            result.message = "Timed Out";
        else if (status === 501) {
            result.message = "Caching";
        } else
            result.message = "Timed Out (Please check network)";
        deferred.reject(result);
    };

    /**
     * @ngdoc method
     * @name mms.URLService#addServer
     * @methodOf mms.URLService
     *
     * @description
     * Adds mmsServer parameter to URL string, mainly used for PMA jobs
     *
     * @param {String} url The url string for which to add mmsServer parameter argument.
     * @param {String} server The mms server url for where elements are stored
     * @returns {string} The url with server parameter added.
     */
    private addServer(url, server) {
        if (url.indexOf('?') > 0)
            return url + '&mmsServer=' + server;
        else
            return url + '?mmsServer=' + server;
    };

    /**
     * @ngdoc method
     * @name mms.URLService#addVersion
     * @methodOf mms.URLService
     *
     * @description
     * Adds commitId parameter to URL string
     *
     * @param {String} url The url string for which to add version parameter argument.
     * @param {String} version The commit id
     * @returns {string} The url with commitId parameter added.
     */
    private addVersion(url, version) {
        if (version === 'latest')
            return url;
        else if (version) {
            if (url.indexOf('?') > 0)
                return url + '&commitId=' + version;
            else
                return url + '?commitId=' + version;
        }
        return url;
    };

    private addExtended(url, extended) {
        var r = url;
        if (!extended)
            return r;
        if (r.indexOf('?') > 0)
            r += '&extended=true';
        else
            r += '?extended=true';
        return r;
    };

    private addChildViews(url, add) {
        var r = url;
        if (!add)
            return r;
        if (r.indexOf('?') > 0)
            r += '&childviews=true';
        else
            r += '?childviews=true';
        return r;
    };

    /**
     * @ngdoc method
     * @name mms.URLService#addToken
     * @methodOf mms.URLService
     *
     * @description
     * Adds token parameter to URL string
     *
     * @param {String} url The url string for which to add token parameter argument.
     * @returns {string} The url with commitId parameter added.
     */
    addToken(url) {
            if (url.indexOf('?') > 0)
                return url + '&token=' + this.token;
            else
                return url + '?token=' + this.token;
    };
}
