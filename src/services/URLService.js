'use strict';

angular.module('mms')
.provider('URLService', function URLServiceProvider() {
    var baseUrl = '/api';
    var mmsUrl = 'localhost:8080';
    this.setBaseUrl = function (base) {
        baseUrl = base;
    };
    this.setMmsUrl = function (mms) {
        mmsUrl = mms;
    };
    this.$get = [function URLServiceFactory() {
        return urlService(baseUrl, mmsUrl);
    }];
});

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
function urlService(baseUrl, mmsUrl) {
    var root = mmsUrl + baseUrl;
    var jobsRoot = 'https://cae-pma-int:8443/';
    var token;

    var getRoot = function() {
        return root;
    };

    var setToken = function(t) {
        token = t;
    };

    var getAuthorizationHeaderValue = function() {
        return ('Bearer ' + token);
    };

    var getAuthorizationHeader = function(headers) {
        if(!token) {
            return headers;
        }
        if(!headers) {
            headers = getHeaders();
        }
        headers.Authorization = getAuthorizationHeaderValue();
        return headers;
    };
    
    var getJMSHostname = function(){
        return root + '/connection/jms';
    };

    var getMmsServer = function() {
        return mmsUrl;
    };

    /**
     * @ngdoc method
     * @name mms.URLService#setHeader
     * @methodOf mms.URLService
     *
     * @description
     * Adds generates Default Headers using token
     *
     * @returns {object} The HTTP header format
     */
    var getHeaders = function() {
        return {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + token
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
    var isTimestamp = function(version) {
        if (!version)
            return false;
        if(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}[+]?-\d{4}$/.test(version.trim()))
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
    var getMmsVersionURL = function() {
        return root + "/mmsversion";
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
    var getSiteDashboardURL = function(site) {
        return root + "/orgs/" + site + "/projects/" + site + "/branches/master/elements";
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
    var getExportHtmlUrl = function(projectId, refId) {
        return root + "/projects/" + projectId +
            "/refs/" + refId + '/convert';
    };


    var getAuthenticationUrl = function() {
        return root + "/authentication";
    };

    var getPermissionsLookupURL = function() {
        return root + "/permissions";
    };

    var getOrgURL = function(orgId) {
        return root + '/orgs/' + orgId;
    };

    var getOrgsURL = function() {
        return root + "/orgs";
    };

    var getProjectsURL = function(orgId) {
        if (orgId)
            return root + '/projects?orgId=' + orgId;
        return root + '/projects';
    };

    var getProjectURL = function(projectId) {
        return root + "/projects/" + projectId;
    };

    var getProjectMountsURL = function(projectId, refId) {
        return root + '/projects/' + projectId + '/refs/' + refId + '/mounts';
    };

    var getRefsURL = function(projectId) {
        return root + '/projects/' + projectId + '/refs';
    };

    var getRefURL = function(projectId, refId) {
        return root + '/projects/' + projectId + '/refs/' + refId;
    };

    var getRefHistoryURL = function(projectId, refId, timestamp) {
        if (timestamp !== '' && isTimestamp(timestamp)) {
            return root + '/projects/' + projectId + '/refs/' + refId + '/commits' + '&maxTimestamp=' + timestamp + '&limit=1';
        }
        return root + '/projects/' + projectId + '/refs/' + refId + '/commits';
    };

    var getGroupsURL = function(projectId, refId) {
        return root + '/projects/' + projectId + '/refs/' + refId + '/groups';
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
    var getProjectDocumentsURL = function(reqOb) {
        var r = root + "/projects/" + reqOb.projectId +
            "/refs/" + reqOb.refId +
            "/documents";
        return addExtended(addVersion(r, reqOb.commitId), reqOb.extended);
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
    var getImageURL = function(reqOb) {
        var r = root + '/projects/' + reqOb.projectId + '/refs/' + reqOb.refId + '/elements/' +
            reqOb.elementId;
        return addVersion(r, reqOb.commitId);
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
    var getElementURL = function(reqOb) {
        var r = root + '/projects/' + reqOb.projectId + '/refs/' + reqOb.refId + '/elements/' + reqOb.elementId;
        return addExtended(addVersion(r, reqOb.commitId), reqOb.extended);
    };

    var getViewElementIdsURL = function(reqOb) {
        var r = root + '/projects/' + reqOb.projectId + '/refs/' + reqOb.refId + '/elements/' + reqOb.elementId + '/cfids';
        return r;
    };

    var getViewsURL = function(reqOb) {
        var r = root + '/projects/' + reqOb.projectId + '/refs/' + reqOb.refId + '/views/' + reqOb.elementId;
        return r;
    };

    var getOwnedElementURL = function(reqOb) {
        var recurseString = 'recurse=true';
        if (reqOb.depth)
            recurseString = 'depth=' + reqOb.depth;
        var r = root + '/projects/' + reqOb.projectId + '/refs/' + reqOb.refId + '/elements/' + reqOb.elementId;
        r = addVersion(r, reqOb.commitId);
        if (r.indexOf('?') > 0) {
            r += '&' + recurseString;
        } else {
            r += '?' + recurseString;
        }
        return addExtended(r, reqOb.extended);
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
    var getElementHistoryURL = function(reqOb) {
        return root + '/projects/' + reqOb.projectId + '/refs/' + reqOb.refId + '/elements/' + reqOb.elementId + '/commits';
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
    var getPostElementsURL = function(reqOb) {
        return addExtended(addChildViews(root + '/projects/' + reqOb.projectId + '/refs/' + reqOb.refId + '/views', reqOb.returnChildViews), reqOb.extended);
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
    var getPutElementsURL = function(reqOb) {
        var r = root + '/projects/' + reqOb.projectId + '/refs/' + reqOb.refId + '/views';
        return addExtended(addVersion(r, reqOb.commitId), reqOb.extended);
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
    var getElementSearchURL = function(reqOb) {
        var r = root + '/projects/' + reqOb.projectId + '/refs/' + reqOb.refId + '/search' + (reqOb.checkType ? '?checkType=true' : '');
        return addExtended(r, true);
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
    var getSearchURL = function(projectId, refId, urlParams) {
        var r;
        if (urlParams !== undefined && urlParams !== null && urlParams !== ''){
            // ie '/search?checkType=true&literal=true';
            r = root + '/projects/' + projectId + '/refs/' + refId + '/search?' + urlParams;
        } else {
            r = root + '/projects/' + projectId + '/refs/' + refId + '/search';
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
    var getArtifactURL = function(reqOb,artifactExtension) {
        var ext = (artifactExtension !== undefined) ? artifactExtension : reqOb.artifactExtension;
        var r = root + '/projects/' + reqOb.projectId + '/refs/' + reqOb.refId + '/elements/' + reqOb.elementId + '/' + ext;
        return addToken(addVersion(r, reqOb.commitId));
    };

    /**
     * @ngdocs method
     * @name mms.URLService#getArtifactEmbedURL
     * @methodOf mms.URLService
     *
     * @description
     * Gets the url without added token for an artifact
     *
     * @param {object} reqOb object with keys
     * @param {string} artifactExtension (optional) string with the desired artifact extension
     * @returns {string} url
     */
    var getArtifactEmbedURL = function(reqOb,artifactExtension) {
        var ext = (artifactExtension !== undefined) ? artifactExtension : reqOb.artifactExtension;
        var r = root + '/projects/' + reqOb.projectId + '/refs/' + reqOb.refId + '/elements/' + reqOb.elementId + '/' + ext;
        return addVersion(r, reqOb.commitId);
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
    var getPutArtifactsURL = function(reqOb) {
        var r = root + '/projects/' + reqOb.projectId + '/refs/' + reqOb.refId + '/elements/' + reqOb.elementId;
        return addVersion(r, reqOb.commitId);
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
    var getArtifactHistoryURL = function(reqOb) {
        return getElementHistoryURL(reqOb);
    };

    var getCheckTokenURL = function(t) {
        return root + '/checkAuth'; //TODO remove when server returns 404
    };

    var getPersonURL = function(username) {
        //return root + '/checkAuth';
        return root + '/users?user=' + username;
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
    var handleHttpStatus = function(data, status, header, config, deferred) {
        var result = {status: status, data: data};
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
            result.message = "Cacheing";
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
    var addServer = function(url, server) {
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
    var addVersion = function(url, version) {
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

    var addExtended = function(url, extended) {
        var r = url;
        if (!extended)
            return r;
        if (r.indexOf('?') > 0)
            r += '&extended=true';
        else
            r += '?extended=true';
        return r;
    };

    var addChildViews = function(url, add) {
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
    var addToken = function(url) {
            if (url.indexOf('?') > 0)
                return url + '&token=' + token;
            else
                return url + '?token=' + token;
    };


    return {
        getRoot: getRoot,
        setToken: setToken,
        getAuthorizationHeaderValue: getAuthorizationHeaderValue,
        getAuthorizationHeader: getAuthorizationHeader,
        getHeaders: getHeaders,
        getJMSHostname: getJMSHostname,
        getMmsServer: getMmsServer,
        isTimestamp: isTimestamp,
        getMmsVersionURL: getMmsVersionURL,
        getSiteDashboardURL: getSiteDashboardURL,
        getOrgURL: getOrgURL,
        getOrgsURL: getOrgsURL,
        getProjectsURL: getProjectsURL,
        getProjectURL: getProjectURL,
        getProjectMountsURL: getProjectMountsURL,
        getRefsURL: getRefsURL,
        getRefURL: getRefURL,
        getRefHistoryURL: getRefHistoryURL,
        getGroupsURL: getGroupsURL,
        getElementURL: getElementURL,
        getViewElementIdsURL: getViewElementIdsURL,
        getPutElementsURL: getPutElementsURL,
        getPostElementsURL: getPostElementsURL,
        getOwnedElementURL: getOwnedElementURL,
        getElementHistoryURL: getElementHistoryURL,
        getElementSearchURL: getElementSearchURL,
        getSearchURL: getSearchURL,
        getProjectDocumentsURL: getProjectDocumentsURL,
        getImageURL: getImageURL,
        getExportHtmlUrl: getExportHtmlUrl,
        getArtifactURL: getArtifactURL,
        getArtifactEmbedURL: getArtifactEmbedURL,
        getPutArtifactsURL: getPutArtifactsURL,
        getArtifactHistoryURL: getArtifactHistoryURL,
        getCheckTokenURL: getCheckTokenURL,
        getPersonURL: getPersonURL,
        handleHttpStatus: handleHttpStatus,
        getAuthenticationUrl: getAuthenticationUrl,
        getViewsURL: getViewsURL,
        getPermissionsLookupURL: getPermissionsLookupURL
    };


}
