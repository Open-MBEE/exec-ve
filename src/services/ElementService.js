'use strict';

angular.module('mms')
.factory('ElementService', ['$q', '$http', 'URLService', ElementService]);

/**
 * @ngdoc service
 * @name mms.ElementService
 * @requires $q
 * @requires $http
 * @requires mms.URLService
 * 
 * @description
 * An element cache and CRUD service. Maintains a cache of element id to element objects.
 * This maintains a single source of truth for applications that use this service. Do not
 * directly modify the attributes of elements returned from this service but use the update
 * methods instead. Consider forking and editable element support in future.
 */
function ElementService($q, $http, URLService) {
    var elements = {};

    /**
     * @ngdoc method
     * @name mms.ElementService#getElement
     * @methodOf mms.ElementService
     * 
     * @description
     * Gets an element object by id. If the element object is already in the cache,
     * resolve the existing reference, if not, request it from the repository, add 
     * it to the cache, and resolve the new object
     * 
     * @param {string} id The id of the element to get
     * @returns {Promise} The promise will be resolved with the element object, 
     *      multiple calls to this method with the same id would result in 
     *      references to the same object
     */
    var getElement = function(id) {
        var deferred = $q.defer();
        if (elements.hasOwnProperty(id))
            deferred.resolve(elements[id]);
        else {
            $http.get(URLService.getRoot() + '/elements/' + id)
            .success(function(data, status, headers, config) {
                if (data.elements.length > 0) {
                    if (elements.hasOwnProperty(id))
                        deferred.resolve(elements[id]);
                    else {
                        elements[id] = data.elements[0];
                        deferred.resolve(elements[id]);
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

    /**
     * @ngdoc method
     * @name mms.ElementService#getElements
     * @methodOf mms.ElementService
     * 
     * @description
     * Same as getElement, but for multiple ids
     * 
     * @param {Array.<string>} ids The id sof the elements to get
     * @returns {Promise} The promise will be resolved with an array of element objects, 
     *      multiple calls to this method with the same ids would result in an array of 
     *      references to the same objects
     */
    var getElements = function(ids) {
        var promises = [];
        ids.forEach(function(id) {
            promises.push(getElement(id));
        });
        return $q.all(promises);
    };

    var getViewElements = function(viewid) {
        var deferred = $q.defer();
        $http.get(URLService.getRoot() + '/views/' + viewid + '/elements')
        .success(function(data, status, headers, config) {
            var result = [];
            data.elements.forEach(function(element) {
                if (elements.hasOwnProperty(element.id))
                    result.push(elements[element.id]);
                else {
                    elements[element.id] = element;
                    result.push(elements[element.id]);
                }
            });
            deferred.resolve(result); 
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
        
        return deferred.promise;
    };

    var updateElement = function(elem) {
        var deferred = $q.defer();
        if (elements.hasOwnProperty(elem.id)) {
            $http.post(URLService.getRoot() + '/elements', {'elements': [elem]})
            .success(function(data, status, headers, config) {
                //todo: update all things in elem
                elements[elem.id].name = elem.name;
                deferred.resolve(elements[elem.id]);
            }).error(function(data, status, headers, config) {
                deferred.reject('Error');
            });
            //elements[elem.id].name = elem.name;
            //deferred.resolve(elements[elem.id]);
        } else
            deferred.reject("Not in Cache");
        return deferred.promise;
    };

    var updateElements = function(elems) {
        var promises = [];
        elems.forEach(function(elem) {
            promises.push(updateElement(elem));
        });
        return $q.all(promises);
    };

    var mergeElements = function(elems) {
        var result = [];
        elems.forEach(function(elem) {
            if (elements.hasOwnProperty(elem.id)) {
                result.push(elements[elem.id]);
            } else {
                elements[elem.id] = elem;
                result.push(elements[elem.id]);
            }
        });
        return result;
    };

    return {
        getElement: getElement,
        getElements: getElements,
        getViewElements: getViewElements,
        updateElement: updateElement,
        updateElements: updateElements,
        mergeElements: mergeElements
    };
}