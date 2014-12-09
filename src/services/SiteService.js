'use strict';

angular.module('mms')
.factory('SiteService', ['$q', '$http', 'URLService', 'CacheService', '_', SiteService]);

/**
 * @ngdoc service
 * @name mms.SiteService
 * @requires $q
 * @requires $http
 * @requires mms.URLService
 * @requires mms.CacheService
 * 
 * @description
 * This is a utility service for getting alfresco site information, such as 
 * list of all sites and their categories
 */
function SiteService($q, $http, URLService, CacheService, _) {
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
    var getSite = function(site, version) {
        var deferred = $q.defer();
        var ver = !version ? 'latest' : version;
        getSites(version).then(function(data) {
            var result = CacheService.get(['sites', 'master', ver, site]);
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
    var getSites = function(version) {
        if (inProgress)
            return inProgress;
        var ver = !version ? 'latest' : version;
        var deferred = $q.defer();
        var cacheKey = ['sites', 'master', ver];
        if (CacheService.exists(cacheKey)) {
            deferred.resolve(CacheService.get(cacheKey));
        } else {
            inProgress = deferred.promise;
            $http.get(URLService.getSitesURL('master', ver))
            .success(function(data, status, headers, config) {
                CacheService.put(cacheKey, data.sites, true, function(site, i) {
                    return {key: ['sites', 'master', ver, site.name], value: site, merge: true};
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