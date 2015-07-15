'use strict';

angular.module('mms')
.factory('ElementService', ['$q', '$http', 'URLService', 'UtilsService', 'CacheService', 'HttpService', '_', ElementService]);

/**
 * @ngdoc service
 * @name mms.ElementService
 * @requires $q
 * @requires $http
 * @requires mms.URLService
 * @requires mms.UtilsService
 * @requires mms.CacheService
 * @requires _
 * 
 * @description
 * An element CRUD service with additional convenience methods for managing edits.
 *
 * For element json example, see [here](https://ems.jpl.nasa.gov/alfresco/mms/raml/index.html)
 */
function ElementService($q, $http, URLService, UtilsService, CacheService, HttpService,  _) {
    
    var inProgress = {};
    /**
     * @ngdoc method
     * @name mms.ElementService#getElement
     * @methodOf mms.ElementService
     * 
     * @description
     * Gets an element object by id. If the element object is already in the cache,
     * resolve the existing reference, if not or update is true, request it from server, 
     * add/merge into the cache. 
     * 
     * Most of these methods return promises that will reject with a reason object
     * when a server call fails, see
     * {@link mms.URLService#methods_handleHttpStatus the return object}
     *
     * ## Example Usage
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
     * @param {boolean} [update=false] (optional) whether to always get the latest 
     *      from server, even if it's already in cache (this will update the cache if exists)
     * @param {string} [workspace=master] (optional) workspace to use
     * @param {string} [version=latest] (optional) alfresco version number or timestamp
     * @returns {Promise} The promise will be resolved with the element object, 
     *      multiple calls to this method with the same parameters would give the
     *      same object
     */
    var getElement = function(id, update, workspace, version) {
        var n = normalize(id, update, workspace, version);
        var key = 'getElement(' + id + n.update + n.ws + n.ver + ')';

        if (inProgress.hasOwnProperty(key)) {
            HttpService.ping(URLService.getElementURL(id, n.ws, n.ver));
            return inProgress[key];
        }

        var deferred = $q.defer();
        if (CacheService.exists(n.cacheKey) && !n.update) {
            var cached = CacheService.get(n.cacheKey);
            if ((cached.specialization.type === 'View' ||
                cached.specialization.type === 'Product') &&
                !cached.specialization.hasOwnProperty('contains') &&
                !cached.specialization.hasOwnProperty('contents')) {
            } else {
                deferred.resolve(cached);
                return deferred.promise;
            }
        }
        inProgress[key] = deferred.promise;
        HttpService.get(URLService.getElementURL(id, n.ws, n.ver),
            function(data, status, headers, config) {
                deferred.resolve(CacheService.put(n.cacheKey, UtilsService.cleanElement(data.elements[0]), true));
                delete inProgress[key];
            },
            function(data, status, headers, config) {
                URLService.handleHttpStatus(data, status, headers, config, deferred);
                delete inProgress[key];
            }
        );
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
     * @param {boolean} [update=false] (optional) whether to always get latest from server.
     * @param {string} [workspace=master] (optional) workspace to use
     * @param {string} [version=latest] (optional) alfresco version number or timestamp
     * @returns {Promise} The promise will be resolved with an array of element objects, 
     *      multiple calls to this method with the same ids would result in an array of 
     *      references to the same objects.
     */
    var getElements = function(ids, update, workspace, version) {
        var promises = [];
        ids.forEach(function(id) {
            promises.push(getElement(id, update, workspace, version));
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
                editableElement.name = 'changed name'; //immediately change a name and save
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
     * @param {boolean} [update=false] Get the latest from server first, 
     *      else just make a copy of what's in the element cache
     * @param {string} [workspace=master] (optional) workspace to use
     * @returns {Promise} The promise will be resolved with the element object, 
     *      multiple calls to this method with the same id would result in 
     *      references to the same object. This object can be edited without
     *      affecting the same element object that's used for displays
     */
    var getElementForEdit = function(id, update, workspace) {
        var n = normalize(id, update, workspace, null, true);
        var key = 'getElementForEdit(' + id + n.update + n.ws + ')';
        if (inProgress.hasOwnProperty(key))
            return inProgress[key];
        var deferred = $q.defer();
        
        if (CacheService.exists(n.cacheKey) && !n.update)
            deferred.resolve(CacheService.get(n.cacheKey));
        else {
            inProgress[key] = deferred.promise;
            getElement(id, n.update, n.ws)
            .then(function(data) {
                var edit = _.cloneDeep(data);
                deferred.resolve(CacheService.put(n.cacheKey, UtilsService.cleanElement(edit, true), true));
                delete inProgress[key];
            }, function(reason) {
                deferred.reject(reason);
                delete inProgress[key];
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
     * @param {boolean} [update=false] Get latest from server first
     * @param {string} [workspace=master] (optional) workspace to use
     * @returns {Promise} The promise will be resolved with an array of editable
     * element objects that won't affect the corresponding displays
     */
    var getElementsForEdit = function(ids, update, workspace) {
        var promises = [];
        ids.forEach(function(id) {
            promises.push(getElementForEdit(id, update, workspace));
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
     * @param {boolean} [update=false] update elements from server
     * @param {string} [workspace=master] (optional) workspace to use
     * @param {string} [version=latest] (optional) alfresco version number or timestamp
     * @returns {Promise} The promise will be resolved with an array of 
     * element objects 
     */
    var getOwnedElements = function(id, update, workspace, version) {
        var n = normalize(id, update, workspace, version);
        return getGenericElements(URLService.getOwnedElementURL(id, n.ws, n.ver), 'elements', n.update, n.ws, n.ver);
    };

    /**
     * @ngdoc method
     * @name mms.ElementService#getGenericElements
     * @methodOf mms.ElementService
     *
     * @description
     * This is a method to call a predefined url that returns elements json.
     * A key provides the key of the json that has the elements array. 
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
     * @param {boolean} [update=false] update cache
     * @param {string} [workspace=master] workspace associated, this will not change the url
     * @param {string} [version=latest] timestamp associated, this will not change the url
     */
    var getGenericElements = function(url, key, update, workspace, version) {
        var n = normalize(null, update, workspace, version);

        var progress = 'getGenericElements(' + url + key + n.update + n.ws + n.ver + ')';
        if (inProgress.hasOwnProperty(progress)) {
            HttpService.ping(url);
            return inProgress[progress];
        }

        var deferred = $q.defer();
       
        inProgress[progress] = deferred.promise;
        
        HttpService.get(url, 
            function(data, status, headers, config) {
                var result = [];
                data[key].forEach(function(element) {
                    if (!element) //check for null, seen before
                        return;
                    var ekey = UtilsService.makeElementKey(element.sysmlid, n.ws, n.ver);
                    result.push(CacheService.put(ekey, UtilsService.cleanElement(element), true));
                }); 
                delete inProgress[progress];
                deferred.resolve(result); 
            },
            function(data, status, headers, config) {
                URLService.handleHttpStatus(data, status, headers, config, deferred);
                delete inProgress[progress];
            }
        );

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
     *      update is successful. If a conflict occurs, the promise will be rejected with status of 409
     */
    var updateElement = function(elem, workspace) {

        var deferred = $q.defer();

        var handleSuccess = function(n, data) {
            var resp = CacheService.put(n.cacheKey, UtilsService.cleanElement(data.elements[0]), true);
            var edit = CacheService.get(UtilsService.makeElementKey(elem.sysmlid, n.ws, null, true));
            if (edit) {
                // Only want to merge the properties that were updated:
                var updated = UtilsService.filterProperties(elem, resp);
                _.merge(edit, updated);
                UtilsService.cleanElement(edit, true);
            }
            //special case for products view2view updates and view contents
            if (elem.specialization && elem.specialization.view2view)
                resp.specialization.view2view = elem.specialization.view2view;
            if (elem.specialization && elem.specialization.contents)
                resp.specialization.contents = elem.specialization.contents;
            deferred.resolve(resp);
        };

        if (!elem.hasOwnProperty('sysmlid'))
            deferred.reject('Element id not found, create element first!');
        else {
            var n = normalize(elem.sysmlid, null, workspace, null);
            $http.post(URLService.getPostElementsURL(n.ws), {'elements': [elem]}, {timeout: 10000})
            .success(function(data, status, headers, config) {
                handleSuccess(n, data);
            }).error(function(data, status, headers, config) {
                if (status === 409) {
                    var server = data.elements[0];
                    UtilsService.cleanElement(server);
                    var orig = CacheService.get(UtilsService.makeElementKey(elem.sysmlid, n.ws, null, false));
                    if (!orig) {
                        URLService.handleHttpStatus(data, status, headers, config, deferred);
                    } else {
                        UtilsService.cleanElement(orig);
                        if (!UtilsService.hasConflict(elem, orig, server)) {
                            elem.read = server.read;
                            elem.modified = server.modified;
                            updateElement(elem, workspace)
                            .then(function(good){
                                deferred.resolve(good);
                            }, function(reason) {
                                deferred.reject(reason);
                            });
                        } else {
                            URLService.handleHttpStatus(data, status, headers, config, deferred);
                        }
                    }
                } else
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
        /*var promises = [];
        elems.forEach(function(elem) {
            promises.push(updateElement(elem, workspace));
        });
        return $q.all(promises);*/
        var deferred = $q.defer();
        var ws = !workspace ? 'master' : workspace;
        $http.post(URLService.getPostElementsURL(ws), {'elements': elems})
        .success(function(data, status, headers, config) {
            data.elements.forEach(function(elem) {
                var cacheKey = UtilsService.makeElementKey(elem.sysmlid, ws, null, false);
                var resp = CacheService.put(cacheKey, UtilsService.cleanElement(elem), true);
                //special case for products view2view updates 
                if (resp.specialization && resp.specialization.view2view &&
                    elem.specialization && elem.specialization.view2view)
                    resp.specialization.view2view = elem.specialization.view2view;
                var edit = CacheService.get(UtilsService.makeElementKey(elem.sysmlid, ws, null, true));
                if (edit) {
                    _.merge(edit, resp);
                    UtilsService.cleanElement(edit, true);
                }
            });
            deferred.resolve(data.elements);
        }).error(function(data, status, headers, config) {
            URLService.handleHttpStatus(data, status, headers, config, deferred);
        });
        return deferred.promise;
    };

    /**
     * @ngdoc method
     * @name mms.ElementService#createElement
     * @methodOf mms.ElementService
     * 
     * @description
     * Create element on alfresco.
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
     * @param {string} [site=null] (optional) site to post to (if the element has no predefined owner,
     *      give the site argument so the server can put it in the site's holding bin)
     * @returns {Promise} The promise will be resolved with the created element references if 
     *      create is successful.
     */
    var createElement = function(elem, workspace, site) {
        var n = normalize(null, null, workspace, null);

        var deferred = $q.defer();
        //if (!elem.hasOwnProperty('owner')) {
        //    deferred.reject('Element create needs an owner'); //relax this?
        //    return deferred.promise;
        //    elem.owner = 'holding_bin_project'; //hardcode a holding bin for owner for propose element
        //}
        
        /*if (elem.hasOwnProperty('sysmlid')) {
            deferred.reject({status: 400, message: 'Element create cannot have id'});
            return deferred.promise;
        }*/

        var url = URLService.getPostElementsURL(n.ws);
        if (site)
            url = URLService.getPostElementsWithSiteURL(n.ws, site);
        $http.post(url, {'elements': [elem]})
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
     * @name mms.ElementService#isCacheOutdated
     * @methodOf mms.ElementService
     *
     * @description
     * Checks if the current cached element has been updated on the server, does not update the cache. 
     * If the element doesn't exist in the cache, it's considered not outdated
     *
     * @param {string} id Element id
     * @param {string} [workspace=master] workspace
     * @returns {Promise} Resolved with {status: false} if cache is up to date, 
     *      Resolved with {status: true, server: server element, cache: cache element} if cache is outdated
     */
    var isCacheOutdated = function(id, workspace) {
        var deferred = $q.defer();
        var ws = !workspace ? 'master' : workspace;
        var orig = CacheService.get(UtilsService.makeElementKey(id, ws, null, false));
        if (!orig) {
            deferred.resolve({status: false});
            return deferred.promise;
        }
        $http.get(URLService.getElementURL(id, ws, 'latest'))
        .success(function(data, status, headers, config) {
            var server = _.cloneDeep(data.elements[0]);
            delete server.modified;
            delete server.read;
            delete server.creator;
            UtilsService.cleanElement(server);
            var current = _.cloneDeep(orig);
            delete current.modified;
            delete current.read;
            delete current.creator;
            UtilsService.cleanElement(current);
            if (angular.equals(server, current)) {
                deferred.resolve({status: false});
            } else {
                deferred.resolve({status: true, server: data.elements[0], cache: orig});
            }
        }).error(function(data, status, headers, config) {
            URLService.handleHttpStatus(data, status, headers, config, deferred);
        });
        return deferred.promise;
    };

    /**
     * @ngdoc method
     * @name mms.ElementService#isDirty
     * @methodOf mms.ElementService
     * 
     * @description
     * TBD, do not use. Check if element has been edited and not saved to server
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
     * @param {string} query A keyword
     * @param {Array.<string>} [filters=null] An array of string of what to search in,
     *                                        can be name, documentation, id, value
     * @param {string} [propertyName=null] if filter is value, propertyName is used to further filter
     * @param {boolean} [update=false] Whether to update from server
     * @param {string} [workspace=master] (optional) workspace to use
     * @returns {Promise} The promise will be resolved with an array of element objects.
     *                  the server will return each element's properties as another array of element objects
     *                  in each object's 'properties' key, the array isn't stored in the cache with the element
     *                  but elements in the properties array will be stored in the cache
     *                  The element results returned will be a clone of the original server response and not cache references
     */
    var search = function(query, filters, propertyName, update, workspace) {
        //var n = normalize(null, update, workspace, null);
        //return getGenericElements(URLService.getElementSearchURL(query, n.ws), 'elements', n.update, n.ws, n.ver);
        var n = normalize(null, update, workspace, null);
        var url = URLService.getElementSearchURL(query, filters, propertyName, n.ws);
        var progress = 'search(' + url + n.update + n.ws + ')';
        if (inProgress.hasOwnProperty(progress)) {
            HttpService.ping(url);
            return inProgress[progress];
        }

        var deferred = $q.defer();
        inProgress[progress] = deferred.promise;
        HttpService.get(url, 
            function(data, status, headers, config) {
                var result = [];
                data.elements.forEach(function(element) {
                    var properties = element.properties;
                    if (properties)
                        delete element.properties;
                    var ekey = UtilsService.makeElementKey(element.sysmlid, n.ws, n.ver);
                    CacheService.put(ekey, UtilsService.cleanElement(element), true);
                    if (properties) {
                        properties.forEach(function(property) {
                            var pkey = UtilsService.makeElementKey(property.sysmlid, n.ws, n.ver);
                            CacheService.put(pkey, UtilsService.cleanElement(property), true);
                        });
                    }
                    var toAdd = JSON.parse(JSON.stringify(element));
                    toAdd.properties = properties;
                    result.push(toAdd);
                }); 
                delete inProgress[progress];
                deferred.resolve(result); 
            },
            function(data, status, headers, config) {
                URLService.handleHttpStatus(data, status, headers, config, deferred);
                delete inProgress[progress];
            }
        );
        return deferred.promise;
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
     * @param {boolean} [update=false] update element version cache
     * @param {string} [workspace=master] workspace
     * @returns {Promise} The promise will be resolved with an array of version objects.
     */
    var getElementVersions = function(id, update, workspace) {
        var n = normalize(id, update, workspace, 'versions');
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

    /**
     * @ngdoc method
     * @name mms.ElementService#deleteElement
     * @methodOf mms.ElementService
     * 
     * @description
     * Delete an element 
     *
     * @param {string} id The id of the element
     * @param {string} [workspace=master] workspace
     * @returns {Promise} The promise will be resolved with server response if delete is successful.
     */
    var deleteElement = function(id, workspace) {
        var ws = !workspace ? 'master' : workspace;
        var deferred = $q.defer();
        var key = UtilsService.makeElementKey(id, ws, null, false);
        $http.delete(URLService.getElementURL(id, ws, 'latest'))
        .success(function(data, status, headers, config) {
            CacheService.remove(key);
            deferred.resolve(data);
        }).error(function(data, status, headers, config) {
            URLService.handleHttpStatus(data, status, headers, config, deferred);
        });
        return deferred.promise;
    };

    /**
     * @ngdoc method
     * @name mms.ElementService#deleteElements
     * @methodOf mms.ElementService
     * 
     * @description
     * Delete elements from alfresco and update the cache if successful.
     * 
     * @param {Array.<string>} ids Array of element ids to delete
     * @param {string} [workspace=master] (optional) workspace to use
     * @returns {Promise} The promise will be resolved with an array of updated element references if 
     *      delete is successful.
     */
    var deleteElements = function(ids, workspace) {
        var promises = [];
        ids.forEach(function(id) {
            promises.push(deleteElement(id, workspace));
        });
        return $q.all(promises);
    };

    var normalize = function(id, update, workspace, version, edit) {
        var res = UtilsService.normalize({update: update, workspace: workspace, version: version});
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
        deleteElement: deleteElement,
        deleteElements: deleteElements,
        isCacheOutdated: isCacheOutdated,
        isDirty: isDirty,
        search: search
    };
}