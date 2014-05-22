'use strict';

angular.module('mms')
.factory('ElementService', ['$q', '$http', 'URLService', 'VersionService', '_', ElementService]);

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
 * methods instead. Consider saving to html5 local storage for edited things incase of crashes.
 * The element objects will contain all its attributes including view and document keys.
 *
 * Current element object:
 * ```
 *      {
 *          "id": element id as string,
 *          "type": "Package" | "Property" | "Element" | "Dependency" | "Generalization" |
 *                  "DirectedRelationship" | "Conform" | "Expose" | "Viewpoint" | 
 *                  "LiteralReal" | "LiteralString" | "LiteralInteger" | "LiteralBoolean" |
 *                  "LiteralUnlimitedNatural" | "ElementValue" | "Expression" | "OpaqueExpression",
 *          "name": element name, empty string if no name,
 *          "documentation": element documentation as string, can contain html,
 *          "owner": owner element's id,
 *
 *          //if type is "Property"
 *          "propertyType": element id or null,
 *          "isDerived": true | false,
 *          "isSlot": true | false,
 *          "value": [elementIds],
 *          
 *          //if type is DirectedRelationship or Generalization or Dependency
 *          "source": source element id,
 *          "target": target element id,
 *
 *          //if type is Comment
 *          "body": comment body, can contain html,
 *          "annotatedElements": [elementIds]
 *
 *          //if type is the values
 *          //keys can include: boolean, integer, string, double, elementValueElement
 *      }
 * ```
 */
function ElementService($q, $http, URLService, VersionService, _) {
    var elements = {};
    var edits = {};
    var nonEditKeys = ['contains', 'view2view', 'childrenViews', 'displayedElements',
        'allowedElements'];
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
     * @param {boolean} [updateFromServer=false] (optional) whether to always get the latest 
     *      from server, even if it's already in cache (this will update everywhere
     *      it's displayed, except for the editables)
     * @returns {Promise} The promise will be resolved with the element object, 
     *      multiple calls to this method with the same id would result in 
     *      references to the same object.
     */
    var getElement = function(id, updateFromServer, workspace, version) {
        var update = !updateFromServer ? false : updateFromServer;
        var ws = !workspace ? 'master' : workspace;
        var ver = !version ? 'latest' : version;

        var deferred = $q.defer();
        if (ver === 'latest') {
            if (elements.hasOwnProperty(id)) {
                if (!update) {
                    deferred.resolve(elements[id]);
                    return deferred.promise;
                } 
            }
            $http.get(URLService.getElementURL(id, ws, ver))
            .success(function(data, status, headers, config) {
                if (data.elements.length > 0) {
                    if (elements.hasOwnProperty(id)) {
                        _.merge(elements[id], data.elements[0]);
                    } else {
                        elements[id] = data.elements[0];
                    }
                    deferred.resolve(elements[id]);
                } else {
                    deferred.reject("Not Found");
                }
            }).error(function(data, status, headers, config) {
                URLService.handleHttpStatus(data, status, headers, config, deferred);
            });
        } else {
            return VersionService.getElementByTimestamp(id, ws, ver);
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
     * @param {boolean} [updateFromServer=false] (optional) whether to always get latest from server.
     * @returns {Promise} The promise will be resolved with an array of element objects, 
     *      multiple calls to this method with the same ids would result in an array of 
     *      references to the same objects.
     */
    var getElements = function(ids, updateFromServer, workspace, version) {
        var promises = [];
        ids.forEach(function(id) {
            promises.push(getElement(id, updateFromServer, workspace, version));
        });
        return $q.all(promises);
    };

    /**
     * @ngdoc method
     * @name mms.ElementService#getElementForEdit
     * @methodOf mms.ElementService
     * 
     * @description
     * Gets an element object to edit by id. 
     * 
     * @param {string} id The id of the element to get.
     * @returns {Promise} The promise will be resolved with the element object, 
     *      multiple calls to this method with the same id would result in 
     *      references to the same object. This object can be edited without
     *      affecting the same element object that's used for displays
     */
    var getElementForEdit = function(id, updateFromServer, workspace) {
        var update = !updateFromServer ? false : updateFromServer;
        var ws = !workspace ? 'master' : workspace;

        var deferred = $q.defer();
        if (edits.hasOwnProperty(id) && !update)
            deferred.resolve(edits[id]);
        else {
            getElement(id, update, ws)
            .then(function(data) {
                if (edits.hasOwnProperty(id)) {
                    //merge?
                    deferred.resolve(edits[id]);
                } else {
                    var edit = _.cloneDeep(data);
                    edits[id] = edit;
                    for (var i = 0; i < nonEditKeys.length; i++) {
                        if (edit.hasOwnProperty(nonEditKeys[i])) {
                            delete edit[nonEditKeys[i]];
                        }
                    }
                    deferred.resolve(edit);
                }
            }, function(reason) {
                deferred.reject(reason);
            });
        }
        return deferred.promise;
    };

    /**
     * @ngdoc method
     * @name mms.ElementService#getElementsForEdit
     * @methodOf mms.ElementService
     * 
     * @description
     * Gets element objects to edit by ids. 
     * 
     * @param {Array.<string>} ids The ids of the elements to get for edit.
     * @returns {Promise} The promise will be resolved with an array of editable
     * element objects that won't affect the corresponding displays
     */
    var getElementsForEdit = function(ids, updateFromServer, workspace) {
        var promises = [];
        ids.forEach(function(id) {
            promises.push(getElementForEdit(id, updateFromServer, workspace));
        });
        return $q.all(promises);
    };

    /**
     * @ngdoc method
     * @name mms.ElementService#getOwnedElements
     * @methodOf mms.ElementService
     * 
     * @description
     * Gets element's owned element objects. 
     * 
     * @param {string} id The id of the elements to get owned elements for
     * @returns {Promise} The promise will be resolved with an array of 
     * element objects 
     */
    var getOwnedElements = function(id, updateFromServer, workspace, version) {
        
    };

    /**
     * @ngdoc method
     * @name mms.ElementService#getGenericElements
     * @methodOf mms.ElementService
     *
     * @description
     * This ia a method to call a predefined url that returns elements json, so 
     * the ElementService can cache those results. A key provies the key of the json
     * that has the elements array. Workspace and version tells which workspace and
     * version these elements come from. These 2 arguments doesn't change the url 
     * that actually gets called but only affects where the returned elements are cached.
     *
     * @param {string} url the url to get
     * @param {string} key json key
     * @param {string} [workspace=master] tbd
     * @param {string} [version=latest] tbd
     */
    var getGenericElements = function(url, key, updateFromServer, workspace, version) {
        var update = !updateFromServer ? false : updateFromServer;
        var ws = !workspace ? 'master' : workspace;
        var ver = !version ? 'latest' : version;

        var deferred = $q.defer();
        if (ver === 'latest') {
            $http.get(url)
            .success(function(data, status, headers, config) {
                var result = [];
                data[key].forEach(function(element) {
                    if (elements.hasOwnProperty(element.id)) {
                        if (update) {
                            _.merge(elements[element.id], element);
                        } 
                    } else {
                        elements[element.id] = element;
                    }
                    result.push(elements[element.id]);
                });
                deferred.resolve(result); 
            }).error(function(data, status, headers, config) {
                URLService.handleHttpStatus(data, status, headers, config, deferred);
            });
        } else {
            return VersionService.getElements(url, key, ws, ver);
        }
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
    var updateElement = function(elem, workspace) {
        var ws = !workspace ? 'master' : workspace;

        var deferred = $q.defer();
        if (!elem.hasOwnProperty('id'))
            deferred.reject('Element id not found, create element first!');
        else {
            $http.post(URLService.getPostElementsURL(ws), {'elements': [elem]})
            .success(function(data, status, headers, config) {
                var resp = data.elements[0];
                if (elements.hasOwnProperty(elem.id))
                    _.merge(elements[elem.id], resp);
                else
                    elements[elem.id] = resp;
                if (edits.hasOwnProperty(elem.id))
                    _.merge(edits[elem.id], elements[elem.id]);
                deferred.resolve(elements[elem.id]);
            }).error(function(data, status, headers, config) {
                URLService.handleHttpStatus(data, status, headers, config, deferred);
            });
        } 
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
    var updateElements = function(elems, workspace) {
        var promises = [];
        elems.forEach(function(elem) {
            promises.push(updateElement(elem, workspace));
        });
        return $q.all(promises);
    };

    /**
     * @ngdoc method
     * @name mms.ElementService#createElement
     * @methodOf mms.ElementService
     * 
     * @description
     * Create element on alfresco and update the cache if successful.
     * 
     * @param {Object} elem Element object that must have an owner id.
     * @returns {Promise} The promise will be resolved with the created element references if 
     *      create is successful.
     */
    var createElement = function(elem, workspace) {
        var ws = !workspace ? 'master' : workspace;

        var deferred = $q.defer();
        if (!elem.hasOwnProperty('owner')) {
            deferred.reject('Element create needs an owner'); //relax this?
            return deferred.promise;
        }
        if (elem.hasOwnProperty('id')) {
            deferred.reject('Element create cannot have id');
            return deferred.promise;
        }
        $http.post(URLService.getPostElementsURL(ws), {'elements': [elem]})
        .success(function(data, status, headers, config) {
            if (data.elements.length > 0) {
                var e = data.elements[0];
                elements[e.id] = e;
                deferred.resolve(elements[e.id]);
            }
        }).error(function(data, status, headers, config) {
            URLService.handleHttpStatus(data, status, headers, config, deferred);
        });
        return deferred.promise;
    };

    /**
     * @ngdoc method
     * @name mms.ElementService#createElements
     * @methodOf mms.ElementService
     * 
     * @description
     * Create elements to alfresco and update the cache if successful.
     * 
     * @param {Array.<Object>} elems Array of element objects that must contain owner id.
     * @returns {Promise} The promise will be resolved with an array of created element references if 
     *      create is successful.
     */
    var createElements = function(elems, workspace) {
        var promises = [];
        elems.forEach(function(elem) {
            promises.push(createElement(elem, workspace));
        });
        return $q.all(promises);
    };

    /**
     * @ngdoc method
     * @name mms.ElementService#isDirty
     * @methodOf mms.ElementService
     * 
     * @description
     * Check if element has been edited and not saved to server
     * 
     * @param {string} id Element id
     * @returns {boolean} Whether element is dirty
     */
    var isDirty = function(id) {
        if (!edits.hasOwnProperty(id))
            return false;
        if (_.isEqual(elements[id], edits[id]))
            return false;
        return true;
    };

    /**
     * @ngdoc method
     * @name mms.ElementService#search
     * @methodOf mms.ElementService
     * 
     * @description
     * Search for elements based on some query
     * 
     * @param {string} query A query string (TBD)
     * @returns {Promise} The promise will be resolved with an array of element objects
     */
    var search = function(query, updateFromServer, workspace) {
        var update = !updateFromServer ? false : updateFromServer;
        var ws = !workspace ? 'master' : workspace;

        var deferred = $q.defer();
        $http.get(URLService.getElementSearchURL(query, ws)) 
        .success(function(data, status, headers, config) {
            var result = [];
            data.elements.forEach(function(element) {
                if (elements.hasOwnProperty(element.id)) {
                    if (update)
                        _.merge(elements[element.id], element);
                } else {
                    elements[element.id] = element;
                }
                result.push(elements[element.id]);
            });
            deferred.resolve(result); 
        }).error(function(data, status, headers, config) {
            URLService.handleHttpStatus(data, status, headers, config, deferred);
        });
        return deferred.promise;
    };

    return {
        getElement: getElement,
        getElements: getElements,
        getElementForEdit: getElementForEdit,
        getElementsForEdit: getElementsForEdit,
        getOwnedElements: getOwnedElements,
        updateElement: updateElement,
        updateElements: updateElements,
        createElement: createElement,
        createElements: createElements,
        getGenericElements: getGenericElements,
        isDirty: isDirty,
        search: search
    };
}