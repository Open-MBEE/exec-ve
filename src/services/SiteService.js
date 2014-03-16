'use strict';

angular.module('mms')
.factory('SiteService', ['$q', '$http', 'URLService', SiteService]);

function SiteService($q, $http, URLService) {
    var currentSite = 'europa';

    var setSite = function(site) {
        currentSite = site;
    };

    var getSite = function() {
        return currentSite;
    };

    var getSites = function() {

    };

    var getDocuments = function() {

    };

    var getProjects = function() {

    };
    
    return {
        getSite: getSite,
        setSite: setSite,
        getSites: getSites
    };
}