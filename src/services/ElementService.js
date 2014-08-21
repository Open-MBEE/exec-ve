'use strict';

angular.module('mms')
.factory('ElementService', ['$q', '$http', 'URLService', 'UtilsService', 'CacheService', '_', ElementService]);

/**
 * @ngdoc service
 * @name mms.ElementService
 * @requires $q
 * @requires $http
 * @requires mms.URLService
 * @requires mms.UtilsService
 * @requires mms.VersionService
 * @requires _
 * 
 * @description
 * An element cache and CRUD service. Maintains a cache of element id to element objects.
 * This maintains a single source of truth for applications that use this service. Do not
 * directly modify the attributes of elements returned from this service but use the update
 * methods instead. Consider saving to html5 local storage for edited things incase of crashes.
 * The element objects will contain all its attributes including view and document keys.
 *
 * For element json example, see [here](https://ems.jpl.nasa.gov/alfresco/scripts/raml/index.html)
 */
function ElementService($q, $http, URLService, UtilsService, CacheService, _) {
    
    var inProgress = {};
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
     * ## Example
     *  <pre>
        ElementService.getElement('element_id').then(
            function(element) { //element is an element object (see json schema)
                alert('got ' + element.name);
            }, 
            function(reason) {
                alert('get element failed: ' + reason.message); 
                //see mms.URLService#handleHttpStatus for the reason object
            }
        );
        </pre>
     * ## Example with timestamp
     *  <pre>
        ElementService.getElement('element_id', false, 'master', '2014-07-01T08:57:36.915-0700').then(
            function(element) { //element is an element object (see json schema)
                alert('got ' + element.name);
            }, 
            function(reason) {
                alert('get element failed: ' + reason.message); 
                //see mms.URLService#handleHttpStatus for the reason object
            }
        );
        </pre>
     * 
     * @param {string} id The id of the element to get.
     * @param {boolean} [updateFromServer=false] (optional) whether to always get the latest 
     *      from server, even if it's already in cache (this will update everywhere
     *      it's displayed, except for the editables)
     * @param {string} [workspace=master] (optional) workspace to use
     * @param {string} [version=latest] (optional) alfresco version number or timestamp
     * @returns {Promise} The promise will be resolved with the element object, 
     *      multiple calls to this method with the same parameters would give the
     *      same object
     */
    var getElement = function(id, updateFromServer, workspace, version) {
        var n = normalize(id, updateFromServer, workspace, version);
        var key = 'getElement(' + id + n.update + n.ws + n.ver + ')';

        if (inProgress.hasOwnProperty(key))
            return inProgress[key];

        var deferred = $q.defer();
        if (CacheService.exists(n.cacheKey) && !n.update) {
            deferred.resolve(CacheService.get(n.cacheKey));
            return deferred.promise;
        }
        inProgress[key] = deferred.promise;
        $http.get(URLService.getElementURL(id, n.ws, n.ver))
        .success(function(data, status, headers, config) {
            deferred.resolve(CacheService.put(n.cacheKey, UtilsService.cleanElement(data.elements[0]), true));
            delete inProgress[key];
        }).error(function(data, status, headers, config) {
            URLService.handleHttpStatus(data, status, headers, config, deferred);
            delete inProgress[key];
        });
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
     * @param {string} [workspace=master] (optional) workspace to use
     * @param {string} [version=latest] (optional) alfresco version number or timestamp
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
     * Gets an element object to edit by id. (this is different from getElement in 
     * that the element is a clone and not the same reference. The rationale is to
     * consider angular data bindings so editing an element does not cause unintentional
     * updates to other parts of the view, separating reads and edits)
     * 
     * ## Example
     *  <pre>
        ElementService.getElementForEdit('element_id').then(
            function(editableElement) {
                editableElement.name = 'changed name'; //immediately change a name
                ElementService.updateElement(editableElement).then(
                    function(updatedElement) { //at this point the regular getElement would show the update
                        alert('updated');
                    },
                    function(reason) {
                        alert('update failed');
                    }
                );
            },
            function(reason) {
                alert('get element failed: ' + reason.message);
            }
        );
        </pre>
     * 
     * @param {string} id The id of the element to get.
     * @param {boolean} [updateFromServer=false] Get the latest from server first, e
     *      else just make a copy of what's in the element cache
     * @param {string} [workspace=master] (optional) workspace to use
     * @returns {Promise} The promise will be resolved with the element object, 
     *      multiple calls to this method with the same id would result in 
     *      references to the same object. This object can be edited without
     *      affecting the same element object that's used for displays
     */
    var getElementForEdit = function(id, updateFromServer, workspace) {
        var n = normalize(id, updateFromServer, workspace, null, true);

        var deferred = $q.defer();
        if (CacheService.exists(n.cacheKey) && !n.update)
            deferred.resolve(CacheService.get(n.cacheKey));
        else {
            getElement(id, n.update, n.ws)
            .then(function(data) {
                var edit = _.cloneDeep(data);
                deferred.resolve(CacheService.put(n.cacheKey, UtilsService.cleanElement(edit, true), true));
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
     * @param {string} [workspace=master] (optional) workspace to use
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
     * Gets element's owned element objects. TBD (stub)
     * 
     * @param {string} id The id of the elements to get owned elements for
     * @param {string} [workspace=master] (optional) workspace to use
     * @param {string} [version=latest] (optional) alfresco version number or timestamp
     * @returns {Promise} The promise will be resolved with an array of 
     * element objects 
     */
    var getOwnedElements = function(id, updateFromServer, workspace, version) {
        var n = normalize(id, updateFromServer, workspace, version);
        return getGenericElements(URLService.getOwnedElementURL(id, n.ws, n.ver), 'elements', n.update, n.ws, n.ver);
    };

    /**
     * @ngdoc method
     * @name mms.ElementService#getGenericElements
     * @methodOf mms.ElementService
     *
     * @description
     * This is a method to call a predefined url that returns elements json, so 
     * the ElementService can cache those results. A key provies the key of the json
     * that has the elements array. Workspace and version tells which workspace and
     * version these elements come from. These 2 arguments doesn't change the url 
     * that actually gets called but only affects where the returned elements are cached.
     *
     * ## Example (used by ViewService to get products in a site)
     *  <pre>
        ElementService.getGenericElements('/alfresco/service/sites/europa/products', 'products')
        .then(
            function(products) {
                alert('got ' + products.length + ' products');
            },
            function(reason) {
                alert('failed: ' + reason.message);
            }
        );
        </pre>
     *
     * @param {string} url the url to get
     * @param {string} key json key that has the element array value
     * @param {boolean} [updateFromServer=false] update cache
     * @param {string} [workspace=master] workspace associated, this will not change the url
     * @param {string} [version=latest] timestamp associated, this will not change the url
     */
    var getGenericElements = function(url, key, updateFromServer, workspace, version) {
        var n = normalize(null, updateFromServer, workspace, version);

        var progress = 'getGenericElements(' + url + key + n.update + n.ws + n.ver + ')';
        if (inProgress.hasOwnProperty(progress))
            return inProgress[progress];

        var deferred = $q.defer();
       
        inProgress[progress] = deferred.promise;
        $http.get(url)
        .success(function(data, status, headers, config) {
            var result = [];
            data[key].forEach(function(element) {
                var ekey = UtilsService.makeElementKey(element.sysmlid, n.ws, n.ver);
                result.push(CacheService.put(ekey, UtilsService.cleanElement(element), true));
            }); 
            delete inProgress[progress];
            deferred.resolve(result); 
        }).error(function(data, status, headers, config) {
            URLService.handleHttpStatus(data, status, headers, config, deferred);
            delete inProgress[progress];
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
     * {@link mms.ElementService#methods_getElementForEdit see also getElementForEdit}
     *
     * ## Example
     *  <pre>
        var update = {
            'sysmlid': 'element_id',
            'read': '2014-07-01T08:57:36.915-0700', //time the element was last read from the server
            'name': 'updated name',
            'documentation': '<p>updated doc</p>',
            'specialization': {
                'type': 'Property',
                'value': [
                    {
                        'type': 'LiteralString', 
                        'string': 'updated string value'
                    }
                ]
            }
        };
        ElementService.updateElement(update).then(
            function(updatedElement) { //this element will have the latest info as well as read time
                alert('update successful');
            },
            function(reason) {
                alert('update failed: ' + reason.message);
            }
        );
        </pre>
     * 
     * @param {Object} elem An object that contains element id and any property changes to be saved.
     * @param {string} [workspace=master] (optional) workspace to use
     * @returns {Promise} The promise will be resolved with the updated cache element reference if 
     *      update is successful.
     */
    var updateElement = function(elem, workspace) {
        var deferred = $q.defer();
        if (!elem.hasOwnProperty('sysmlid'))
            deferred.reject('Element id not found, create element first!');
        else {
            if (elem.hasOwnProperty('owner'))
                delete elem.owner; //hack for getting around a 400 error when owner
                                    //isn't found on server - ok for now since
                                    //owner can't be changed from the web
            var n = normalize(elem.sysmlid, null, workspace, null);
            $http.post(URLService.getPostElementsURL(n.ws), {'elements': [elem]})
            .success(function(data, status, headers, config) {
                var resp = CacheService.put(n.cacheKey, UtilsService.cleanElement(data.elements[0]), true);
                deferred.resolve(resp);
                /* TODO better way to sync edits on update, maybe app level*/
                var edit = CacheService.get(UtilsService.makeElementKey(elem.sysmlid, n.ws, null, true));
                if (edit) {
                    _.merge(edit, resp);
                    UtilsService.cleanElement(edit, true);
                }
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
     * @param {string} [workspace=master] (optional) workspace to use
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
     * ## Example
     *  <pre>
        var create = {
            'name': 'new name',
            'owner': 'owner_id',
            'documentation': '<p>new doc</p>',
            'specialization': {
                'type': 'Property',
                'value': [
                    {
                        'type': 'LiteralString', 
                        'string': 'new value'
                    }
                ]
            }
        };
        ElementService.createElement(create).then(
            function(createdElement) { //this element will have a generated id
                alert('create successful with id: ' + createdElement.sysmlid);
            },
            function(reason) {
                alert('create failed: ' + reason.message);
            }
        );
        </pre>
     * 
     * @param {Object} elem Element object that must have an owner id.
     * @param {string} [workspace=master] (optional) workspace to use
     * @returns {Promise} The promise will be resolved with the created element references if 
     *      create is successful.
     */
    var createElement = function(elem, workspace) {
        var n = normalize(null, null, workspace, null);

        var deferred = $q.defer();
        if (!elem.hasOwnProperty('owner')) {
        //    deferred.reject('Element create needs an owner'); //relax this?
        //    return deferred.promise;
            elem.owner = 'holding_bin_project'; //hardcode a holding bin for owner for propose element
        }
        if (elem.hasOwnProperty('sysmlid')) {
            deferred.reject({status: 200, message: 'Element create cannot have id'});
            return deferred.promise;
        }
        $http.post(URLService.getPostElementsURL(n.ws), {'elements': [elem]})
        .success(function(data, status, headers, config) {
            var resp = data.elements[0];
            var key = UtilsService.makeElementKey(resp.sysmlid, n.ws, 'latest');
            deferred.resolve(CacheService.put(key, UtilsService.cleanElement(resp), true));
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
     * @param {string} [workspace=master] (optional) workspace to use
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
    var isDirty = function(id, workspace) {
        var editKey = UtilsService.makeElementKey(id, workspace, null, true);
        var normalKey = UtilsService.makeElementKey(id, workspace);
        var normal = CacheService.get(normalKey);
        var edit = CacheService.get(editKey);
        if (edit && !_.isEqual(normal, edit))
            return true;
        return false;
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
     * @param {boolean} [updateFromServer=false] Whether to update cache of returned elements
     * @param {string} [workspace=master] (optional) workspace to use
     * @returns {Promise} The promise will be resolved with an array of element objects
     */
    var search = function(query, updateFromServer, workspace) {
        var n = normalize(null, updateFromServer, workspace, null);
        return getGenericElements(URLService.getElementSearchURL(query, n.ws), 'elements', n.update, n.ws, n.ver);
    };

    /**
     * @ngdoc method
     * @name mms.ElementService#getElementVersions
     * @methodOf mms.ElementService
     * 
     * @description
     * Queries for an element's entire version history
     *
     * @param {string} id The id of the element
     * @param {boolean} [updateFromServer=false] update element version cache
     * @param {string} [workspace=master] workspace
     * @returns {Promise} The promise will be resolved with an array of version objects.
     */
    var getElementVersions = function(id, updateFromServer, workspace) {
        var n = normalize(id, updateFromServer, workspace, 'versions');
        var deferred = $q.defer();
        if (CacheService.exists(n.cacheKey) && !n.update) {
            deferred.resolve(CacheService.get(n.cacheKey));
            return deferred.promise;
        }
        $http.get(URLService.getElementVersionsURL(id, n.ws))
        .success(function(data, statas, headers, config){
            deferred.resolve(CacheService.put(n.cacheKey, data.versions, true));
        }).error(function(data, status, headers, config){
            URLService.handleHttpStatus(data, status, headers, config, deferred);
        });
        return deferred.promise;
    };

    var normalize = function(id, updateFromServer, workspace, version, edit) {
        var res = UtilsService.normalize({update: updateFromServer, workspace: workspace, version: version});
        res.cacheKey = UtilsService.makeElementKey(id, res.ws, res.ver, edit);
        return res;
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
        getElementVersions: getElementVersions,
        isDirty: isDirty,
        search: search
    };
}