'use strict';

angular.module('mms')
.factory('VizService', ['$q', '$http', 'URLService', VizService]);

function VizService($q, $http, URLService) {

    var getImageURL = function(id) {
        
    };

    return {
        getImageURL: getImageURL,
    };

}