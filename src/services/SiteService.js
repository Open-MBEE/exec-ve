'use strict';

angular.module('mms')
.factory('SiteService', ['$q', '$http', 'URLService', 'ProjectService', '_', SiteService]);

/**
 * @ngdoc service
 * @name mms.SiteService
 * @requires $q
 * @requires $http
 * @requires mms.URLService
 * @requires mms.ProjectService
 * 
 * @description
 * This is a utility service for getting alfresco site information, such as 
 * list of all sites, their categories, documents, projects, tags, etc.
 *
 * Current site object:
 * ```
 *      {
 *          "name": site name (like id),
 *          "title": user friendly name,
 *          "categories": [string]  
 *      }
 * ```
 */
function SiteService($q, $http, URLService, ProjectService, _) {
    var currentSite = 'europa';
    var currentWorkspace = 'master';
    var sites = {};
    var workspaces = {};
    var siteDocuments = {};
    var inProgress = null;


    var setCurrentSite = function(site) {
        currentSite = site;
    };


    var getCurrentSite = function() {
        return currentSite;
    };


    var setCurrentWorkspace = function(workspace) {
        currentWorkspace = workspace;
    };


    var getCurrentWorkspace = function() {
        return currentWorkspace;
    };

    /**
     * @ngdoc method
     * @name mms.SiteService#getSite
     * @methodOf mms.SiteService
     * 
     * @description
     * Gets site information - name, title, categories
     *
     * @param {string} site The name of site to get.
     * @returns {Promise} Resolves to the site info object.
     */
    var getSite = function(site) {
        var deferred = $q.defer();
        if (sites.hasOwnProperty(site)) 
            deferred.resolve(sites[site]);
        else {
            getSites().then(function(data) {
                if (sites.hasOwnProperty(site))
                    deferred.resolve(sites[site]);
                else
                    deferred.reject("Site not found");
            });
        }
        return deferred.promise;
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
        if (inProgress)
            return inProgress;
        var deferred = $q.defer();
        if (!_.isEmpty(sites)) {
            deferred.resolve(_.values(sites));
        } else {
            inProgress = deferred.promise;
            $http.get(URLService.getSitesURL())
            .success(function(data, status, headers, config) {
                _.forEach(data, function(site) {
                    if (!sites.hasOwnProperty(site.name))
                        sites[site.name] = site;
                    else
                        _.merge(sites[site.name], site);
                });
                deferred.resolve(_.values(sites));
                inProgress = null;
            }).error(function(data, status, headers, config) {
                URLService.handleHttpStatus(data, status, headers, config, deferred);
                inProgress = null;
            });
        }
        return deferred.promise;
    };


    var getSiteProjects = function(site) {

    };
    
    return {
        getCurrentSite: getCurrentSite,
        setCurrentSite: setCurrentSite,
        getCurrentWorkspace: getCurrentWorkspace,
        setCurrentWorkspace: setCurrentWorkspace,
        getSites: getSites,
        getSite: getSite,
        getSiteProjects: getSiteProjects
    };
}