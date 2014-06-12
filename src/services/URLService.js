'use strict';

angular.module('mms')
.factory('URLService', ['$q', '$http', '$location', URLService]);

/**
 * @ngdoc service
 * @name mms.URLService
 * @requires $q
 * @requires $http
 * @requires $location
 * 
 * @description
 * This utility service gives back url paths for use in other services in communicating
 * with the server
 */
function URLService($q, $http, $location) {
    var root = "/alfresco/service";

    /**
     * @ngdoc method
     * @name mms.URLService#getRoot
     * @methodOf mms.URLService
     * 
     * @description
     * Gives back the service root of the server, currently "/alfresco/service".
     *
     * @returns {string} The current service root.
     */
    var getRoot = function() {
        return root;
    };

    /**
     * @ngdoc method
     * @name mms.URLService#setRoot
     * @methodOf mms.URLService
     * 
     * @description
     * Sets the service root of the server.
     * 
     * @param {string} r The new service root.
     * @returns {string} The new service root.
     */
    var setRoot = function(r) {
        root = r;
        return root;
    };

    var getConfigSnapshotURL = function(id, site, workspace) {
        return root + "/workspaces/" + workspace + "/sites/" + site + "/configurations/" + id + "/snapshots";                
    };

    var getProductSnapshotURL = function(workspace, site, prodId) {
        return root + "/workspaces/" + workspace + "/sites/" + site + "/products/" + prodId + "/snapshots";                
    };

    var getConfigsURL = function(workspace, site) {
        return root + "/workspaces/" + workspace + "/sites/" + site + "/configurations";
    };

    var getConfigProductURL = function (configId, site, workspace) {
        return root + "/workspaces/" + workspace + "/sites/" + site + "/configurations/" + configId + "/products";                        
    };

    var getConfigURL = function(workspace, site, configId) {
        return root + "/workspaces/" + workspace + "/sites/" + site + "/configurations/" + configId;
    };

    var getProductURL = function(workspace, site) {
        return root + "/workspaces/" + workspace + "/sites/" + site + "/products";
    };

    /**
     * @ngdoc method
     * @name mms.URLService#getImageURL
     * @methodOf mms.URLService
     * 
     * @description
     * Gets the path for querying the latest image url
     * 
     * @param {string} id The id of the image
     * @returns {string} The path for image url queries.
     */
    var getImageURL = function(id) {

    };

    /**
     * @ngdoc method
     * @name mms.URLService#getSiteDashboardURL
     * @methodOf mms.URLService
     * 
     * @description
     * Gets the path for a site dashboard.
     * 
     * @param {string} site The site name (not title!).
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
     * Gets the path for an element object json.
     * 
     * @param {string} id The element id.
     * @returns {string} The element json path.
     */
    var getElementURL = function(id, workspace, version) {
        return root + "/javawebscripts/elements/" + id;
    };

    var getElementVersionsURL = function(id, workspace) {
        return root + "/javawebscripts/elements/" + id + "/versions";
    };

    /**
     * @ngdoc method
     * @name mms.URLService#getPostElementsURL
     * @methodOf mms.URLService
     * 
     * @description
     * Gets the path for posting element changes.
     * 
     * @returns {string} The post elements path.
     */
    var getPostElementsURL = function(workspace) {
        return root + "/javawebscripts/sites/europa/projects/123456/elements";
    };

    var getPostViewsURL = function() {
        return root + "/javawebscripts/views";
    };

    var getPostDocumentsURL = function() {
        return root + "/javawebscripts/products";
    };

    /**
     * @ngdoc method
     * @name mms.URLService#getViewURL
     * @methodOf mms.URLService
     * 
     * @description
     * Gets the path for a view object json
     * 
     * @param {string} id The view id.
     * @returns {string} The view json path.
     */
    var getViewURL = function(id, workspace, version) {
        return root + "/javawebscripts/views/" + id;
    };

    /**
     * @ngdoc method
     * @name mms.URLService#getDocumentURL
     * @methodOf mms.URLService
     * 
     * @description
     * Gets the path for a document object json
     * 
     * @param {string} id The document id.
     * @returns {string} The document json path.
     */
    var getDocumentURL = function(id, workspace, version) {
        return root + "/javawebscripts/products/" + id;
    };

    var handleHttpStatus = function(data, status, header, config, deferred) {
        var result = {status: status, data: data};
        if (status === 404)
            result.message = "Not Found";
        else if (status === 500)
            result.message = "Server Error";
        else if (status === 401 || status === 403)
            result.message = "Permission Error";
        else if (status === 409)
            result.message = "Conflict";
        else
            result.message = "Failed";
        deferred.reject(result);
    };

    var getSitesURL = function() {
        return root + "/rest/sites";
    };

    var getElementSearchURL = function(query, workspace) {
        return root + "/javawebscripts/element/search?keyword=" + query;
    };

    return {
        getRoot: getRoot,
        setRoot: setRoot,
        getSiteDashboardURL: getSiteDashboardURL,
        getElementURL: getElementURL,
        getElementVersionsURL: getElementVersionsURL,
        getPostElementsURL: getPostElementsURL,
        getPostViewsURL: getPostViewsURL,
        getPostDocumentsURL: getPostDocumentsURL,
        getViewURL: getViewURL,
        getDocumentURL: getDocumentURL,
        handleHttpStatus: handleHttpStatus,
        getSitesURL: getSitesURL,
        getElementSearchURL: getElementSearchURL,
        getProductSnapshotURL: getProductSnapshotURL,
        getConfigSnapshotURL: getConfigSnapshotURL,
        getProductURL: getProductURL,
        getConfigURL: getConfigURL,
        getConfigsURL: getConfigsURL,
        getConfigProductURL : getConfigProductURL
    };

}