'use strict';

angular.module('mms')
.provider('URLService', function URLServiceProvider() {
    var baseUrl = '/alfresco/service';
    
    this.setBaseUrl = function(base) {
        baseUrl = base;
    };
    
    this.$get = [function URLServiceFactory() {
        return urlService(baseUrl);
    }];
});

/**
 * @ngdoc service
 * @name mms.URLService
 * 
 * @description
 * This utility service gives back url paths for use in other services in communicating
 * with the server, arguments like workspace, version are expected to be strings and
 * not null or undefined. This service is usually called by higher level services and
 * should rarely be used directly by applications.
 *
 * To configure the base url of the ems server, you can use the URLServiceProvider
 * in your application module's config. By default, the baseUrl is '/alfresco/service' 
 * which assumes your application is hosted on the same machine as the ems. 
 *  <pre>
        angular.module('myApp', ['mms'])
        .config(function(URLServiceProvider) {
            URLServiceProvider.setBaseUrl('https://ems.jpl.nasa.gov/alfresco/service');
        });
    </pre>
 * (You may run into problems like cross origin security policy that prevents it from
 *  actually getting the resources from a different server, solution TBD)
 */
function urlService(baseUrl) {
    var root = baseUrl;

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
        if (String(version).indexOf('-') >= 0)
            return true;
        return false;
    };

    /**
     * @ngdoc method
     * @name mms.URLService#getConfigSnapshotsURL
     * @methodOf mms.URLService
     *
     * @description
     * Gets url that gets or posts snapshots for a configuration in a site
     *
     * @param {string} id Id of the configuration
     * @param {string} workspace Workspace name
     * @returns {string} The url
     */
    var getConfigSnapshotsURL = function(id, workspace) {
        return root + "/workspaces/" + workspace +
                      "/configurations/" + id +
                      "/snapshots";                
    };

    /**
     * @ngdoc method
     * @name mms.URLService#getProductSnapshotsURL
     * @methodOf mms.URLService
     *
     * @description
     * Gets url that gets or creates snapshots for a product in a site
     *
     * @param {string} id Id of the product
     * @param {string} site Site name
     * @param {string} workspace Workspace name
     * @returns {string} The url
     */
    var getProductSnapshotsURL = function(id, site, workspace) {
        return root + "/workspaces/" + workspace +
                      "/sites/" + site +
                      "/products/" + id +
                      "/snapshots";                
    };

    /**
     * @ngdoc method
     * @name mms.URLService#getCheckLoginURL
     * @methodOf mms.URLService
     *
     * @description
     * Gets url that checks the login
     *
     * @returns {string} The url
     */
    var getCheckLoginURL = function() {
        return root + "/checklogin";
    };

    /**
     * @ngdoc method
     * @name mms.URLService#getSiteConfigsURL
     * @methodOf mms.URLService
     *
     * @description
     * Gets url that gets or creates configurations in a site
     *
     * @param {string} workspace Workspace name
     * @returns {string} The url
     */
    var getConfigsURL = function(workspace) {
        return root + "/workspaces/" + workspace +
                      "/configurations";
    };

    /**
     * @ngdoc method
     * @name mms.URLService#getConfigProductsURL
     * @methodOf mms.URLService
     *
     * @description
     * Gets url that gets or posts products in a configuration
     *
     * @param {string} id Id of the configuration
     * @param {string} site Site name
     * @param {string} workspace Workspace name
     * @returns {string} The url
     */
    var getConfigProductsURL = function (id, site, workspace) {
        return root + "/workspaces/" + workspace +
                      "/sites/" + site +
                      "/configurations/" + id +
                      "/products";                        
    };

    /**
     * @ngdoc method
     * @name mms.URLService#getConfigURL
     * @methodOf mms.URLService
     *
     * @description
     * Gets url that gets a configuration
     *
     * @param {string} id Id of the configuration
     * @param {string} workspace Workspace name
     * @returns {string} The url
     */
    var getConfigURL = function(id, workspace) {
        return root + "/workspaces/" + workspace + 
                      "/configurations/" + id;
    };

    /**
     * @ngdoc method
     * @name mms.URLService#getConfigProductsURL
     * @methodOf mms.URLService
     *
     * @description
     * Gets url that gets products in a site
     *
     * @param {string} site Site name
     * @param {string} workspace Workspace name
     * @param {string} version timestamp
     * @returns {string} The url
     */
    var getSiteProductsURL = function(site, workspace, version) {
        var r = root + "/workspaces/" + workspace + 
                      "/sites/" + site + 
                      "/products";
        return addVersion(r, version);
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
     * @param {string} id The id of the image
     * @param {string} workspace Workspace name
     * @param {string} version Timestamp or version number
     * @returns {string} The path for image url queries.
     */
    var getImageURL = function(id, workspace, version) {
        var r = root + '/workspaces/' + workspace + '/artifacts/' + id;
        return addVersion(r, version);
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
        return "/share/page/site/" + site + "/dashboard";
    };

    /**
     * @ngdoc method
     * @name mms.URLService#getElementURL
     * @methodOf mms.URLService
     * 
     * @description
     * Gets the path for an element
     * 
     * @param {string} id The element id.
     * @param {string} workspace Workspace name
     * @param {string} version Timestamp or version number
     * @returns {string} The url.
     */
    var getElementURL = function(id, workspace, version) {        
        var r = root + '/workspaces/' + workspace + '/elements/' + id;
        return addVersion(r, version);
    };

    var getOwnedElementURL = function(id, workspace, version) {
        
        var r = root + '/workspaces/' + workspace + '/elements/' + id + '?recurse=true';
        // TODO return addVersion(r, version);
        return r;
        
    };

    /**
     * @ngdoc method
     * @name mms.URLService#getDocumentViewsURL
     * @methodOf mms.URLService
     * 
     * @description
     * Gets the url to get all views in a document
     * 
     * @param {string} id The document id.
     * @param {string} workspace Workspace name
     * @param {string} version Timestamp or version number
     * @param {boolean} simple Whether to get simple views (without specialization, for performance reasons)
     * @returns {string} The url.
     */
    var getDocumentViewsURL = function(id, workspace, version, simple) {
        //var r = root + "/javawebscripts/products/" + id + "/views";
        var r = root + "/workspaces/" + workspace + "/products/" + id + "/views";
        r = addVersion(r, version);
        if (simple) {
            if (r.indexOf('?') > 0)
                r += '&simple=true';
            else
                r += '?simple=true';
        }
        return r;
    };

    /**
     * @ngdoc method
     * @name mms.URLService#getViewElementsURL
     * @methodOf mms.URLService
     * 
     * @description
     * Gets the url to get all elements referenced in a view
     * 
     * @param {string} id The view id.
     * @param {string} workspace Workspace name
     * @param {string} version Timestamp or version number
     * @returns {string} The url.
     */
    var getViewElementsURL = function(id, workspace, version) {
        //var r = root + "/javawebscripts/views/" + id + "/elements";
        var r = root + "/workspaces/" + workspace + "/views/" + id + "/elements";
        return addVersion(r, version);
    };

    /**
     * @ngdoc method
     * @name mms.URLService#getElementVersionsURL
     * @methodOf mms.URLService
     * 
     * @description
     * Gets the url to query for element history
     * 
     * @param {string} id The element id.
     * @param {string} workspace Workspace name
     * @returns {string} The url.
     */
    var getElementVersionsURL = function(id, workspace) {
        return root + "/javawebscripts/elements/" + id + "/versions";
        //return root + '/workspaces/' + workspace + '/elements/' + id + '/versions';
    };

    /**
     * @ngdoc method
     * @name mms.URLService#getPostElementsURL
     * @methodOf mms.URLService
     * 
     * @description
     * Gets the path for posting element changes.
     * 
     * @param {string} workspace Workspace name
     * @returns {string} The post elements url.
     */
    var getPostElementsURL = function(workspace) {
        return root + '/workspaces/' + workspace + '/elements';
    };

    var getPostElementsWithSiteURL = function(workspace, site) {
        if (root && workspace && site) {
            // TODO maybe move this check elsewhere to keep this method simple
            if (site === 'no-site') {
                site = 'no_site';
            }
            return root + '/workspaces/' + workspace + '/sites/' + site + '/elements';
        }
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
            result.message = "Timed Out (Please check network)";
        else
            result.message = "Failed (Please check network)";
        deferred.reject(result);
    };

    /**
     * @ngdoc method
     * @name mms.URLService#getSitesURL
     * @methodOf mms.URLService
     * 
     * @description
     * Gets the url to query sites.
     * 
     * @param {string} workspace the workspace
     * @param {string} version timestamp
     * @returns {string} The url.
     */
    var getSitesURL = function(workspace, version) {
        var r = root + '/workspaces/' + workspace + '/sites';
        return addVersion(r, version);
    };

    /**
     * @ngdoc method
     * @name mms.URLService#getElementSearchURL
     * @methodOf mms.URLService
     * 
     * @description
     * Gets the url for element keyword search.
     * 
     * @param {string} query Keyword query
     * @param {Array.<string>} filters if not null, put in filters
     * @param {string} propertyName if not null put in propertyName
     * @param {string} workspace Workspace name to search under
     * @returns {string} The post elements url.
     */
    var getElementSearchURL = function(query, filters, propertyName, workspace) {
        var r = root + '/workspaces/' + workspace + '/search?keyword=' + query;
        if (filters) {
            var l = filters.join();
            r += '&filters=' + l;
        }
        if (propertyName) {
            r += '&propertyName=' + propertyName;
        }
        return r;
    };

    var getWorkspacesURL = function() {
        return root + '/workspaces';
    };

    var getWorkspaceURL = function(ws) {
        return root + '/workspaces/' + ws;
    };

    var getWsDiffURL = function(ws1, ws2, ws1time, ws2time) {
        var r = root + '/diff?workspace1=' + ws1 + '&workspace2=' + ws2;
        if (ws1time && ws1time !== 'latest')
            r += '&timestamp1=' + ws1time;
        if (ws2time && ws2time !== 'latest')
            r += '&timestamp2=' + ws2time;
        return r;
    };

    var getPostWsDiffURL = function(sourcetime) {
        var r = root + '/diff';
        if (sourcetime && isTimestamp(sourcetime))
            r += '?timestamp2=' + sourcetime;
        return r;
    };


    var addVersion = function(url, version) {
        if (version === 'latest')
            return url;
        if (isTimestamp(version))
            return url + '?timestamp=' + version;
        else
            return url + '/versions/' + version;
    };

    return {
        getSiteDashboardURL: getSiteDashboardURL,
        getElementURL: getElementURL,
        getOwnedElementURL: getOwnedElementURL,
        getElementVersionsURL: getElementVersionsURL,
        getPostElementsURL: getPostElementsURL,
        getPostElementsWithSiteURL: getPostElementsWithSiteURL,
        handleHttpStatus: handleHttpStatus,
        getSitesURL: getSitesURL,
        getElementSearchURL: getElementSearchURL,
        getImageURL: getImageURL,
        getProductSnapshotsURL: getProductSnapshotsURL,
        getConfigSnapshotsURL: getConfigSnapshotsURL,
        getSiteProductsURL: getSiteProductsURL,
        getConfigURL: getConfigURL,
        getConfigsURL: getConfigsURL,
        getConfigProductsURL : getConfigProductsURL,
        getDocumentViewsURL: getDocumentViewsURL,
        getViewElementsURL: getViewElementsURL,
        getWsDiffURL: getWsDiffURL,
        getPostWsDiffURL: getPostWsDiffURL,
        getWorkspacesURL: getWorkspacesURL,
        getWorkspaceURL: getWorkspaceURL,
        getCheckLoginURL: getCheckLoginURL,
        isTimestamp: isTimestamp
    };

}