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

    var getSnapshotURL = function(id) {
        
    };

    var getTagURL = function(id) {

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
    var getElementURL = function(id) {
        return root + "/javawebscripts/elements/" + id;
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
    var getPostElementsURL = function() {
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
    var getViewURL = function(id) {
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
    var getDocumentURL = function(id) {
        return root + "/javawebscripts/products/" + id;
    };

    var handleHttpStatus = function(data, status, header, config, deferred) {
        if (status === 404)
            deferred.reject("Not Found");
        else if (status === 500)
            deferred.reject("Server Error");
        else if (status === 401 || status === 403)
            deferred.reject("Unauthorized");
        else
            deferred.reject("Failed");
    };

    var getSitesURL = function() {
        return root + "/rest/sites";
    };

    return {
        getRoot: getRoot,
        setRoot: setRoot,
        getSiteDashboardURL: getSiteDashboardURL,
        getElementURL: getElementURL,
        getPostElementsURL: getPostElementsURL,
        getPostViewsURL: getPostViewsURL,
        getPostDocumentsURL: getPostDocumentsURL,
        getViewURL: getViewURL,
        getDocumentURL: getDocumentURL,
        handleHttpStatus: handleHttpStatus,
        getSitesURL: getSitesURL
    };

}