'use strict';

angular.module('mms')
.factory('ViewService', ['$q', '$http', 'URLService', 'ElementService', ViewService]);

function ViewService($q, $http, URLService, ElementService) {
    var views = {};

    var getView = function(id) { //should this also kick off getting all view elements?
        var deferred = $q.defer();
        if (views.hasOwnProperty(id))
            deferred.resolve(views[id]);
        else {
            $http.get(URLService.getRoot() + '/views/' + id)
            .success(function(data, status, headers, config) {
                if (data.views.length > 0) {
                    if (views.hasOwnProperty(id))
                        deferred.resolve(views[id]);
                    else {
                        views[id] = data.views[0];
                        deferred.resolve(views[id]);
                    }
                } else {
                    deferred.reject("Not Found");
                }
            }).error(function(data, status, headers, config) {
                if (status === 404)
                    deferred.reject("Not Found");
                else if (status === 500)
                    deferred.reject("Server Error");
                else if (status === 401 || status === 403)
                    deferred.reject("Unauthorized");
                else
                    deferred.reject("Failed");
            });
        }
        return deferred.promise;
    };

    var getViews = function(ids) {

    };

    var updateView = function(element) {

    };

    var updateViews = function(elements) {

    };

    var getDocument = function(id) {

    };

    return {
        
    };

}