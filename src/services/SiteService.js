'use strict';

angular.module('mms')
.factory('SiteService', ['$q', '$http', 'URLService', 'ProjectService', 'CacheService', '_', SiteService]);

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
function SiteService($q, $http, URLService, ProjectService, CacheService, _) {
    var currentSite = 'europa';
    var inProgress = null;

    /* TODO remove */
    var setCurrentSite = function(site) {
        currentSite = site;
    };

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
     *
     * @param {string} site The name of site to get.
     * @returns {Promise} Resolves to the site info object.
     */
    var getSite = function(site) {
        var deferred = $q.defer();
        getSites().then(function(data) {
            var result = CacheService.get(['sites', 'master', site]);
            if (result)
                deferred.resolve(result);
            else
                deferred.reject("Site not found");
        });
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
        var cacheKey = ['sites', 'master'];
        if (CacheService.exists(cacheKey)) {
            deferred.resolve(CacheService.get(cacheKey));
        } else {
            inProgress = deferred.promise;
            $http.get(URLService.getSitesURL())
            .success(function(data, status, headers, config) {
                CacheService.put(cacheKey, data, true, function(site, i) {
                    return {key: ['sites', 'master', site.name], value: site, merge: true};
                });
                deferred.resolve(CacheService.get(cacheKey));
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
        getSites: getSites,
        getSite: getSite,
        getSiteProjects: getSiteProjects
    };
}