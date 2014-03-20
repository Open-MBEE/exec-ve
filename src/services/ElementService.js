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
 * methods instead. Consider forking and edited element cache support in future.
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
     * it to the cache, and resolve the new object.
     * 
     * @param {string} id The id of the element to get.
     * @returns {Promise} The promise will be resolved with the element object, 
     *      multiple calls to this method with the same id would result in 
     *      references to the same object.
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
     * Same as getElement, but for multiple ids.
     * 
     * @param {Array.<string>} ids The ids of the elements to get.
     * @returns {Promise} The promise will be resolved with an array of element objects, 
     *      multiple calls to this method with the same ids would result in an array of 
     *      references to the same objects.
     */
    var getElements = function(ids) {
        var promises = [];
        ids.forEach(function(id) {
            promises.push(getElement(id));
        });
        return $q.all(promises);
    };

    /**
     * @ngdoc method
     * @name mms.ElementService#getViewElements
     * @methodOf mms.ElementService
     * 
     * @description
     * Gets elements referenced in a view.
     * 
     * @param {string} viewid The id of the view.
     * @returns {Promise} The promise will be resolved with an array of element objects, 
     *      multiple calls to this method may return with different elements depending
     *      on if the view has changed on the server.
     */
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

    /**
     * @ngdoc method
     * @name mms.ElementService#updateElement
     * @methodOf mms.ElementService
     * 
     * @description
     * Save element to alfresco and update the cache if successful, the element object
     * must have an id, and whatever property that needs to be updated.
     * 
     * @param {Object} elem An object that contains element id and any property changes to be saved.
     * @returns {Promise} The promise will be resolved with the updated cache element reference if 
     *      update is successful.
     */
    var updateElement = function(elem) {
        var deferred = $q.defer();
        if (elements.hasOwnProperty(elem.id)) {
            elements[elem.id].name = elem.name;
            deferred.resolve(elements[elem.id]);
            //alfresco service not implemented yet
            /*$http.post(URLService.getRoot() + '/elements', {'elements': [elem]})
            .success(function(data, status, headers, config) {
                //todo: update all things in elem
                elements[elem.id].name = elem.name;
                deferred.resolve(elements[elem.id]);
            }).error(function(data, status, headers, config) {
                deferred.reject('Error');
            });*/
            //elements[elem.id].name = elem.name;
            //deferred.resolve(elements[elem.id]);
        } else
            deferred.reject("Not in Cache");
        return deferred.promise;
    };

    /**
     * @ngdoc method
     * @name mms.ElementService#updateElements
     * @methodOf mms.ElementService
     * 
     * @description
     * Save elements to alfresco and update the cache if successful.
     * 
     * @param {Array.<Object>} elems Array of element objects that contains element id and any property changes to be saved.
     * @returns {Promise} The promise will be resolved with an array of updated element references if 
     *      update is successful.
     */
    var updateElements = function(elems) {
        var promises = [];
        elems.forEach(function(elem) {
            promises.push(updateElement(elem));
        });
        return $q.all(promises);
    };

    /**
     * @ngdoc method
     * @name mms.ElementService#mergeElements
     * @methodOf mms.ElementService
     * 
     * @description
     * Adds element objects to the element cache if it doesn't exist (by id), if
     * it's already in cache, ignore. This will not update alfresco. This is to allow
     * other services that receive element objects (like search) to make sure any
     * new objects are added to the store.
     * 
     * @param {Array.<Object>} ids Element objects.
     * @returns {Array.<Object>} Array of store references to element objects that
     * were merged.
     */
    var mergeElements = function(elems) {
        var result = [];
        elems.forEach(function(elem) {
            if (elements.hasOwnProperty(elem.id)) {
                result.push(elements[elem.id]); //should this update the store with new property if different?
            } else {
                elements[elem.id] = elem;
                result.push(elements[elem.id]);
            }
        });
        return result; //change to promise?
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