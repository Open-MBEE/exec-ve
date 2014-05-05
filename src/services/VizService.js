'use strict';

angular.module('mms')
.factory('VizService', ['$q', '$http', 'URLService', VizService]);

/**
 * @ngdoc service
 * @name mms.VizService
 * @requires $q
 * @requires $http
 * @requires mms.URLService
 * 
 * @description
 * This service handles visualization needs and diagramming (TBD)
 */
function VizService($q, $http, URLService) {

    /**
     * @ngdoc method
     * @name mms.VizService#getImageURL
     * @methodOf mms.VizService
     * 
     * @description
     * Gets the url for an image link based on the Magicdraw diagram id 
     * 
     * @param {string} id The id of the Magicdraw diagram.
     * @returns {Promise} The promise will be resolved with the latest image url
     */
    var getImageURL = function(id) {
        var deferred = $q.defer();
        return deferred.promise;
    };

    return {
        getImageURL: getImageURL,
    };

}