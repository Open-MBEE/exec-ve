'use strict';

angular.module('mms')
.factory('SiteService', ['$q', '$http', 'URLService', 'ViewService', SiteService]);

/**
 * @ngdoc service
 * @name mms.SiteService
 * @requires $q
 * @requires $http
 * @requires mms.URLService
 * @requires mms.ViewService
 * 
 * @description
 * This is a utility service for getting alfresco site information, such as 
 * list of all sites, their categories, documents, projects, tags, etc.
 */
function SiteService($q, $http, URLService, ViewService) {
    var currentSite = 'europa';
    var sites = {};
    var siteDocuments = {};

    /**
     * @ngdoc method
     * @name mms.SiteService#setCurrentSite
     * @methodOf mms.SiteService
     * 
     * @description
     * Sets the current site
     *
     * @param {string} site The new site name.
     *
     * @returns {string} The new site name.
     */
    var setCurrentSite = function(site) {
        currentSite = site;
    };

    /**
     * @ngdoc method
     * @name mms.SiteService#getCurrentSite
     * @methodOf mms.SiteService
     * 
     * @description
     * Gets the current site
     *     
     * @returns {string} The current site name.
     */
    var getCurrentSite = function() {
        return currentSite;
    };

    var getSite = function(site) {

    };

    var getSites = function() {

    };

    var getSiteDocuments = function(site) {

    };

    var getSiteProjects = function(site) {

    };

    var getTags = function(site) {

    };
    
    return {
        getCurrentSite: getCurrentSite,
        setCurrentSite: setCurrentSite,
        getSites: getSites,
        getSite: getSite,
        getSiteDocuments: getSiteDocuments,
        getSiteProjects: getSiteProjects
    };
}