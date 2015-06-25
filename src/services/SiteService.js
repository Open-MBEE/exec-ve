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
    var inProgress = {};

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
     * Gets site information - name, title, categories, site info is always from master workspace
     *
     * @param {string} site The name of site to get.
     * @param {string} [version=latest] timestamp
     * @returns {Promise} Resolves to the site info object.
     */
    var getSite = function(site, version) {
        var deferred = $q.defer();
        var ver = !version ? 'latest' : version;
        getSites(version).then(function(data) {
            var result = CacheService.get(['sites', 'master', ver, site]);
            if (result)
                deferred.resolve(result);
            else if (site === 'no_site')
                deferred.resolve({name:'No Site', sysmlid:'no-site'});
            else
                deferred.reject({status: 404, data: '', message: "Site not found"});
        }, function(reason) {
            deferred.reject(reason);
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
     *
     * @param {string} [version=latest] timestamp
     * @returns {Promise} Resolves into array of site info objects.
     */
    var getSites = function(version) {
        var ver = !version ? 'latest' : version;
        if (inProgress.hasOwnProperty(ver))
            return inProgress[ver];
        var deferred = $q.defer();
        var cacheKey = ['sites', 'master', ver];
        if (CacheService.exists(cacheKey)) {
            deferred.resolve(CacheService.get(cacheKey));
        } else {
            inProgress[ver] = deferred.promise;
            $http.get(URLService.getSitesURL('master', ver))
            .success(function(data, status, headers, config) {
                CacheService.put(cacheKey, data.sites, false, function(site, i) {
                    return {key: ['sites', 'master', ver, site.sysmlid], value: site, merge: true};
                });
                deferred.resolve(CacheService.get(cacheKey));
                delete inProgress[ver];
            }).error(function(data, status, headers, config) {
                URLService.handleHttpStatus(data, status, headers, config, deferred);
                delete inProgress[ver];
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