'use strict';

angular.module('mms')
.factory('SiteService', ['$q', '$http', 'URLService', 'ViewService', 'ProjectService', SiteService]);

/**
 * @ngdoc service
 * @name mms.SiteService
 * @requires $q
 * @requires $http
 * @requires mms.URLService
 * @requires mms.ViewService
 * @requires mms.ProjectService
 * 
 * @description
 * This is a utility service for getting alfresco site information, such as 
 * list of all sites, their categories, documents, projects, tags, etc.
 */
function SiteService($q, $http, URLService, ViewService, ProjectService) {
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

    /**
     * @ngdoc method
     * @name mms.SiteService#getSite
     * @methodOf mms.SiteService
     * 
     * @description
     * Gets site information - name, title, categories
     * @param {string} site The name of site to get.
     * @returns {Promise} Resolves to the site info object.
     */
    var getSite = function(site) {

    };

    /**
     * @ngdoc method
     * @name mms.SiteService#getSites
     * @methodOf mms.SiteService
     * 
     * @description
     * Gets sites information - name, title, categories for all sites on the server
     * @returns {Promise} Resolves into array of site info objects.
     */
    var getSites = function() {

    };

    /**
     * @ngdoc method
     * @name mms.SiteService#getSiteDocuments
     * @methodOf mms.SiteService
     * 
     * @description
     * Gets all documents on a site
     * @param {string} site The site name to get documents for.
     * @returns {Promise} Resolves into array of document objects.
     */
    var getSiteDocuments = function(site) {

    };

    /**
     * @ngdoc method
     * @name mms.SiteService#getSiteProjects
     * @methodOf mms.SiteService
     * 
     * @description
     * Gets all projects on a site
     * @param {string} site The site name to get projects for.
     * @returns {Promise} Resolves into array of project objects.
     */
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