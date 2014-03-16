'use strict';

angular.module('mms')
.factory('SearchService', ['$q', '$http', 'URLService', 'ElementService', SearchService]);

function SearchService($q, $http, URLService, ElementService) {
    
    var searchElements = function(keyword) {
        var deferred = $q.defer();
        $http.get(URLService.getRoot() + '/search/' + keyword) //?
        .success(function(data, status, headers, config) {
            deferred.resolve(ElementService.mergeElements(data.elements));
        }).error(function(data, status, headers, config) {
            deferred.reject("Error");
        });

        return deferred.promise;
    };

    return {
        searchElements: searchElements
        
    };

}