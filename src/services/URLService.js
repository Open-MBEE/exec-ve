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

    var getSiteDocWebURL = function(site) {

    };

    var getSiteViewEditorURL = function(site) {

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
        return root + "/elements/" + id;
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
        return root + "/elements";
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
        return root + "/views/" + id;
    };

    return {
        getRoot: getRoot,
        setRoot: setRoot,
        getSiteDashboardURL: getSiteDashboardURL,
        getElementURL: getElementURL,
        getPostElementsURL: getPostElementsURL,
        getViewURL: getViewURL
    };

}