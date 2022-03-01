import * as angular from 'angular'
import * as _ from "lodash";
import {CacheService} from "./CacheService.factory";
import {URLService} from "./URLService.provider";
import {ApplicationService} from "./ApplicationService.service";
import {UtilsService} from "./UtilsService.factory";
import {HttpService} from "./HttpService.factory";
var mms = angular.module('mms');

/**
 * @ngdoc service
 * @name ElementService
 * @requires $q
 * @requires $http
 * @requires URLService
 * @requires UtilsService
 * @requires CacheService
 * @requires HttpService
 *
 * @description
 * An element CRUD service with additional convenience methods for managing edits.
 */
export class ElementService {
    private inProgress = {};
    
    constructor(private $q, private $http, private uRLSvc : URLService, private utilsSvc : UtilsService, private cacheSvc : CacheService, private httpSvc : HttpService, private applicationSvc : ApplicationService) {}

    /**
     * @ngdoc method
     * @name mms.ElementService#getElement
     * @methodOf mms.ElementService
     *
     * @description
     * Gets an element object by projectId and elementId. If the element object is already in the cache,
     * resolve the existing reference, if not or update is true, request it from server,
     * add/merge into the cache.
     *
     * Most of these methods return promises that will reject with a reason object
     * when a server call fails, see
     * {@link mms.URLService#methods_handleHttpStatus the return object}
     *
     * ## Example Usage
     *  <pre>
     this.elementSvc.this.getElement({projectId: 'projectId', elementId: 'element_id'}).then(
     (element) => { //element is an element object (see json schema)
                alert('got ' + element.name);
            },
     (reason) => {
                alert('get element failed: ' + reason.message); 
                //see mms.URLService#handleHttpStatus for the reason object
            }
     );
     </pre>
     * ## Example with commitId
     *  <pre>
     this.elementSvc.this.getElement({
            projectId: 'projectId', 
            elementId: 'elementId', 
            refId: 'refId',         //default 'master'
            commitId: 'commitId',   //default 'latest'
            extended: true          //default false (extended includes _qualifiedName, _qualifiedId, _childViews)
        }).then(
     (element) => { //element is an element object (see json schema)
                alert('got ' + element.name);
            },
     (reason) => {
                alert('get element failed: ' + reason.message); 
                //see mms.URLService#handleHttpStatus for the reason object
            }
     );
     </pre>
     *
     * @param {object} reqOb object with keys as described in private description.
     * @param {integer} [weight=1] priority of request (2 is immediate, 1 is normal, 0 is low)
     * @param {boolean} [update=false] (optional) whether to always get the latest
     *      from server, even if it's already in cache (this will update the cache if exists)
     * @returns {Promise} The promise will be resolved with the element object,
     *      multiple calls to this method with the same parameters would give the
     *      same object
     */
    getElement(reqOb, weight, update?) {
        this.utilsSvc.normalize(reqOb);
        var requestCacheKey = this.getElementKey(reqOb);
        var url = this.uRLSvc.getElementURL(reqOb);
        var key = url;
        // if it's in the this.inProgress queue get it immediately
        if (this.inProgress.hasOwnProperty(key)) { //change to change proirity if it's already in the queue
            this.httpSvc.ping(key, weight);
            return this.inProgress[key];
        }
        var deferred = this.$q.defer();
        var cached = this.cacheSvc.get(requestCacheKey);
        if (cached && !update && (!reqOb.extended || (reqOb.extended && cached._qualifiedId))) {
            deferred.resolve(cached);
            return deferred.promise;
        }
        var deletedRequestCacheKey = this.getElementKey(reqOb);
        deletedRequestCacheKey.push('deleted');
        var deleted = this.cacheSvc.get(deletedRequestCacheKey);
        if (deleted) {
            deferred.reject({status: 410, data: {recentVersionOfElement: deleted}, message: 'Deleted'});
            return deferred.promise;
        }
        this.inProgress[key] = deferred.promise;

        this.httpSvc.get(url,
            (data, status, headers, config) => {
                if (angular.isArray(data.elements) && data.elements.length > 0) {
                    deferred.resolve(this.cacheElement(reqOb, data.elements[0]));
                } else {
                    deferred.reject({status: 500, data: '', message: "Server Error: empty response"}); //TODO 
                }
                delete this.inProgress[key];
            },
            (data, status, headers, config) => {
                if (data.deleted && data.deleted.length > 0 && data.deleted[0].id === reqOb.elementId) {
                    data.recentVersionOfElement = data.deleted[0];
                    this.cacheDeletedElement(reqOb, data.deleted[0]);
                }
                this.uRLSvc.handleHttpStatus(data, status, headers, config, deferred);
                delete this.inProgress[key];
            },
            weight
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
     * @param {object} reqOb keys - {projectId, refId, elementIds (array of ids), commitId, extended}
     * @param {integer} [weight=1] priority of request (2 is immediate, 1 is normal, 0 is low)
     * @param {boolean} [update=false] (optional) whether to always get the latest
     *      from server, even if it's already in cache (this will update the cache if exists)
     * @returns {Promise} The promise will be resolved with an array of element objects,
     *      multiple calls to this method with the same parameters would give the
     *      same objects
     */
    getElements(reqOb, weight, update?) {
        var deferred = this.$q.defer();
        var request = {elements: []};
        var existing = [];
        this.utilsSvc.normalize(reqOb);
        for (var i = 0; i < reqOb.elementIds.length; i++) {
            var id = reqOb.elementIds[i];
            var requestCacheKey = this.getElementKey(reqOb, id);
            var exist = this.cacheSvc.get(requestCacheKey);
            if (exist && !update && (!reqOb.extended || (reqOb.extended && exist._qualifiedId))) {
                existing.push(exist);
                continue;
            }
            request.elements.push({id: id});
        }
        if (request.elements.length === 0) {
            deferred.resolve(existing);
            return deferred.promise;
        }
        this.$http.put(this.uRLSvc.getPutElementsURL(reqOb), request)
            .then((response) => {
                var data = response.data.elements;
                var i;
                if (data && data.length > 0) {
                    for (i = 0; i < data.length; i++) {
                        existing.push(this.cacheElement(reqOb, data[i]));
                    }
                }
                var deleted = response.data.deleted;
                if (deleted && deleted.length > 0) {
                    for (i = 0; i < deleted.length; i++) {
                        this.cacheDeletedElement(reqOb, deleted[i]);
                    }
                }
                deferred.resolve(existing);
            }, (response) => {
                this.uRLSvc.handleHttpStatus(response.data, response.status, response.headers, response.config, deferred);
            });
        return deferred.promise;
    };

    /**
     * @ngdoc method
     * @name mms.ElementService#this.cacheElement
     * @methodOf mms.ElementService
     *
     * @description
     * handles caching of element objects - in case the metadata of reqOb is different
     * from the element's canonical projectId/refId/commitId (due to being requested
     * from a different project context), it'll become an alias
     *
     * @param {object} reqOb request keys - {projectId, refId, elementId, commitId, extended}
     * @param {object} elementOb object to cache
     * @param {boolean} [edit=false] whether object to cache is for editing
     * @returns {object} cached object
     */
    cacheElement(reqOb, elementOb, edit?) {
        var result = this.utilsSvc.cleanElement(elementOb, edit);
        var requestCacheKey = this.getElementKey(reqOb, result.id, edit);
        var origResultCommit = result._commitId;
        if (reqOb.commitId === 'latest') {
            var resultCommitCopy = JSON.parse(JSON.stringify(result));
            result._commitId = 'latest'; //so realCacheKey is right later
            var commitCacheKey = this.utilsSvc.makeElementKey(resultCommitCopy); //save historic element
            if (!edit) {
                this.cacheSvc.put(commitCacheKey, resultCommitCopy, true);
            }
        }
        var realCacheKey = this.utilsSvc.makeElementKey(result, edit);
        result._commitId = origResultCommit; //restore actual commitId
        if (angular.equals(realCacheKey, requestCacheKey)) {
            result = this.cacheSvc.put(requestCacheKey, result, true);
        } else {
            this.cacheSvc.put(requestCacheKey, realCacheKey.join('|'));
            result = this.cacheSvc.put(realCacheKey, result, true);
        }
        return result;
    };

    cacheDeletedElement(reqOb, deletedOb) {
        var requestCacheKey = this.getElementKey(reqOb, deletedOb.id);
        requestCacheKey.push('deleted');
        var commitCacheKey = this.utilsSvc.makeElementKey(deletedOb);
        this.cacheSvc.put(requestCacheKey, commitCacheKey.join('|'));
        this.cacheSvc.put(commitCacheKey, deletedOb, true);
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
     this.elementSvc.getElementForEdit(reqOb).then(
     (editableElement) => {
                editableElement.name = 'changed name'; //immediately change a name and save
                this.elementSvc.updateElement(editableElement).then(
                    (updatedElement) => { //at this point the regular getElement would show the update
                        alert('updated');
                    },
                    (reason) => {
                        alert('update failed');
                    }
                );
            },
     (reason) => {
                alert('get element failed: ' + reason.message);
            }
     );
     </pre>
     *
     * @param {object} reqOb see description of getElement.
     * @param {integer} [weight=1] priority
     * @param {boolean} [update=false] update from server
     * @returns {Promise} The promise will be resolved with the element object,
     *      multiple calls to this method with the same id would result in
     *      references to the same object. This object can be edited without
     *      affecting the same element object that's used for displays
     */
    getElementForEdit(reqOb, weight, update) {
        this.utilsSvc.normalize(reqOb);
        var requestCacheKey = this.getElementKey(reqOb, reqOb.elementId, true);
        var key = this.uRLSvc.getElementURL(reqOb) + 'edit';
        if (this.inProgress.hasOwnProperty(key)) {
            return this.inProgress[key];
        }
        var deferred = this.$q.defer();
        var cached = this.cacheSvc.get(requestCacheKey);
        if (cached && !update) {
            deferred.resolve(cached);
            return deferred.promise;
        }
        this.inProgress[key] = deferred.promise;
        this.getElement(reqOb, weight, update)
            .then((result) => {
                var copy = JSON.parse(JSON.stringify(result));
                deferred.resolve(this.cacheElement(reqOb, copy, true));
            }, (reason) => {
                deferred.reject(reason);
            }).finally(() => {
            delete this.inProgress[key];
        });
        return deferred.promise;
    };

    /**
     * @ngdoc method
     * @name mms.ElementService#getOwnedElements
     * @methodOf mms.ElementService
     *
     * @description
     * Gets element's owned element objects. TBD (stub)
     *
     * @param {object} reqOb see description of getElement, add 'depth' key.
     * @param {integer} [weight=1] priority
     * @param {boolean} [update=false] update from server
     * @returns {Promise} The promise will be resolved with an array of
     * element objects
     */
    getOwnedElements(reqOb, weight, update) {
        this.utilsSvc.normalize(reqOb);
        if (!reqOb.depth) {
            reqOb.depth = -1;
        }
        return this.getGenericElements(this.uRLSvc.getOwnedElementURL(reqOb), reqOb, 'elements', weight, update);
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
     * @param {string} url the url to get
     * @param {object} reqOb see description of getElement.
     * @param {string} jsonKey json key that has the element array value
     * @param {integer} [weight=1] priority
     * @param {boolean} [update=false] update from server
     */
    getGenericElements(url, reqOb, jsonKey, weight, update?) {
        this.utilsSvc.normalize(reqOb);
        if (this.inProgress.hasOwnProperty(url)) {
            this.httpSvc.ping(url, weight);
            return this.inProgress[url];
        }
        var deferred = this.$q.defer();
        this.inProgress[url] = deferred.promise;

        this.httpSvc.get(url,
            (data, status, headers, config) => {
                var results = [];
                var elements = data[jsonKey];
                for (var i = 0; i < elements.length; i++) {
                    var element = elements[i];
                    if (!element) {//check for possible null
                        continue;
                    }
                    results.push(this.cacheElement(reqOb, element));
                }
                delete this.inProgress[url];
                deferred.resolve(results);
            },
            (data, status, headers, config) => {
                this.uRLSvc.handleHttpStatus(data, status, headers, config, deferred);
                delete this.inProgress[url];
            },
            weight
        );
        return deferred.promise;
    };

    //called by updateElement, fills in all keys for element to be updated
    //will also send any cached edited field for the element to be updated
    fillInElement(elementOb) {
        /*
        var deferred = this.$q.defer();
        this.getElement({
            projectId: elementOb._projectId,
            elementId: elementOb.id,
            commitId: 'latest',
            refId: elementOb._refId
        }, 2)
        .then((data) => {
        */
        var ob = JSON.parse(JSON.stringify(elementOb)); //make a copy
        ob._commitId = 'latest';
        var editOb = this.cacheSvc.get(this.utilsSvc.makeElementKey(ob, true));
        //for (var key in elementOb) {
        //    ob[key] = elementOb[key];
        //}
        if (editOb) {
            for (var key in editOb) {
                if (!elementOb.hasOwnProperty(key)) {
                    ob[key] = editOb[key];
                }
            }
        }
        if (ob._displayedElementIds) {
            delete ob._displayedElementIds;
        }
        if (ob._allowedElementIds) {
            delete ob._allowedElementIds;
        }
        if (ob._childViews && !elementOb._childViews) {
            delete ob._childViews;
        }
        delete ob._commitId;
        return ob;
        /*
            deferred.resolve(ob);
        }, () => {
            deferred.resolve(elementOb);
        });
        return deferred.promise;
        */
    };

    /**
     * @ngdoc method
     * @name mms.ElementService#updateElement
     * @methodOf mms.ElementService
     *
     * @description
     * Save element to mms and update the cache if successful, the element object
     * must have an id, and whatever property that needs to be updated.
     *
     * {@link mms.ElementService#methods_getElementForEdit see also getElementForEdit}
     *
     * @param {object} elementOb An object that contains _projectId, _refId, sysmlId and any property changes to be saved.
     * @returns {Promise} The promise will be resolved with the updated cache element reference if
     *      update is successful. If a conflict occurs, the promise will be rejected with status of 409
     */
    updateElement(elementOb, returnChildViews) { //elementOb should have the keys needed to make url

        var deferred = this.$q.defer();
        const handleSuccess = (data) => {
            var e = null;
            if (data.elements.length > 1 && elementOb.id) {
                for (var i = 0; i < data.elements.length; i++) {
                    if (data.elements[i].id === elementOb.id) {
                        e = data.elements[i];
                    }
                }
                if (!e) {//TODO shouldn't happen
                    e = data.elements[0];
                }
            } else {
                e = data.elements[0];
            }
            var metaOb = {
                projectId: e._projectId,
                refId: e._refId,
                commitId: 'latest',
                elementId: e.id
            };
            var resp = this.cacheElement(metaOb, e);
            var editCopy = JSON.parse(JSON.stringify(e));
            this.cacheElement(metaOb, editCopy, true);
            var history = this.cacheSvc.get(['history', metaOb.projectId, metaOb.refId, metaOb.elementId]);
            if (history) {
                history.unshift({_creator: e._modifier, _created: e._modified, id: e._commitId});
            }
            deferred.resolve(resp);
        };

        if (!elementOb.hasOwnProperty('id')) {
            deferred.reject({status: 400, data: '', message: 'Element id not found, create element first!'});
            return deferred.promise;
        }
        var postElem = this.fillInElement(elementOb);
        //.then((postElem) => {
        this.$http.post(this.uRLSvc.getPostElementsURL({
            projectId: postElem._projectId,
            refId: postElem._refId,
            returnChildViews: returnChildViews
        }), {
            elements: [postElem],
            source: this.applicationSvc.getSource()
        }, Object.assign({timeout: 60000}))
            .then((response) => {
                var rejected = response.data.rejected;
                if (rejected && rejected.length > 0 && rejected[0].code === 304 && rejected[0].element) { //elem will be rejected if server detects no changes
                    deferred.resolve(rejected[0].element);
                    return;
                }
                if (!angular.isArray(response.data.elements) || response.data.elements.length === 0) {
                    deferred.reject({status: 500, data: '', message: "Server Error: empty response"});
                    return;
                }
                handleSuccess(response.data);
            }, (response) => {
                if (response.status === 409) {
                    var serverOb = response.data.elements[0];
                    this.utilsSvc.cleanElement(serverOb);
                    var origCommit = elementOb._commitId;
                    elementOb._commitId = 'latest';
                    var origOb = this.cacheSvc.get(this.utilsSvc.makeElementKey(elementOb));
                    elementOb._commitId = origCommit;
                    if (!origOb) {
                        this.uRLSvc.handleHttpStatus(response.data, response.status, response.headers, response.config, deferred);
                        return;
                    }
                    if (!this.utilsSvc.hasConflict(postElem, origOb, serverOb)) {
                        elementOb._read = serverOb._read;
                        elementOb._modified = serverOb._modified;
                        this.updateElement(elementOb, returnChildViews)
                            .then((good) =>{
                                deferred.resolve(good);
                            }, (reason) => {
                                deferred.reject(reason);
                            });
                    } else {
                        this.uRLSvc.handleHttpStatus(response.data, response.status, response.headers, response.config, deferred);
                    }
                } else
                    this.uRLSvc.handleHttpStatus(response.data, response.status, response.headers, response.config, deferred);
            });
        //}); 
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
     * @param {Array.<Object>} elementObs, array of element objects that contains element id and any property changes to be saved.
     * @param {boolean} returnChildViews, whether to include childViews
     * @returns {Promise} The promise will be resolved with an array of updated element references if
     *      update is successful and will be rejected with an object with the following format:
     *      {failedRequests: list of rejection reasons, successfulRequests: array of updated elements }
     */
    updateElements(elementObs, returnChildViews) {
        var deferred = this.$q.defer();
        if ( this._validate(elementObs) ) {
            var postElements = elementObs.map((elementOb) => {
                return this.fillInElement(elementOb);
            });

            var groupOfElements = this._groupElementsByProjectIdAndRefId(postElements);
            var promises = [];

            Object.keys(groupOfElements).forEach((key) => {
                promises.push(this._bulkUpdate(groupOfElements[key], returnChildViews));
            });

            // responses is an array of response corresponding to both successful and failed requests with the following format
            // [ { state: 'fulfilled', value: the value returned by the server },
            //   { state: 'rejected', reason: {status, data, message} -- Specified by handleHttpStatus method }
            // ]
            this.$q.allSettled(promises).then((responses) => {
                // get all the successful requests
                var successfulRequests = responses.filter((response) => {
                    return response.state === 'fulfilled';
                });

                var successValues = _.flatten( successfulRequests.map((response) =>{
                    return response.value;
                }));

                if ( successfulRequests.length === promises.length ) {
                    // All requests succeeded
                    deferred.resolve(successValues);
                } else {
                    // some requests failed
                    var rejectionReasons = responses.filter((response) => {
                        return response.state === 'rejected';
                    }).map((response) => {
                        return response.reason;
                    });

                    // since we could have multiple failed requests when having some successful requests,
                    // reject with the following format so that the client can deal with them at a granular level if
                    // desired
                    deferred.reject({
                        failedRequests: rejectionReasons,
                        successfulRequests: successValues
                    });
                }
            });
        } else {
            deferred.reject( {
                failedRequests: [ { status: 400, data: elementObs, message: 'Some of the elements do not have id, _projectId, _refId' } ],
                successfulRequests: []
            });
        }
        return deferred.promise;
    };

    /**
     * @ngdoc method
     * @name mms.ElementService#createElement
     * @methodOf mms.ElementService
     *
     * @description
     * Create element on mms.
     *
     * @param {object} reqOb see description of getElement, instead of elementId, 'element' key should be
     *                  the element object to create
     * @returns {Promise} The promise will be resolved with the created element references if
     *      create is successful.
     */
    createElement(reqOb) {
        this.utilsSvc.normalize(reqOb);
        var deferred = this.$q.defer();

        var url = this.uRLSvc.getPostElementsURL(reqOb);
        this.$http.post(url, {'elements': [reqOb.element], 'source': this.applicationSvc.getSource()})
            .then((response) => {
                if (!angular.isArray(response.data.elements) || response.data.elements.length === 0) {
                    deferred.reject({status: 500, data: '', message: "Server Error: empty response"});
                    return;
                }
                var resp = null;
                if (response.data.elements.length > 1 && reqOb.element.id) {
                    for (var i = 0; i < response.data.elements.length; i++) {
                        if (response.data.elements[i].id === reqOb.element.id) {
                            resp = response.data.elements[i];
                        }
                    }
                    if (!resp) {//shouldn't happen!
                        resp = response.data.elements[0];
                    }
                } else {
                    resp = response.data.elements[0];
                }
                deferred.resolve(this.cacheElement(reqOb, resp));
            }, (response) => {
                this.uRLSvc.handleHttpStatus(response.data, response.status, response.headers, response.config, deferred);
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
     * @param {object} reqOb see description of getElement, instead of elementId, 'elements' key should be
     *                  the array of element object to create
     * @returns {Promise} The promise will be resolved with an array of created element references if
     *      create is successful.
     */
    createElements(reqOb) {
        this.utilsSvc.normalize(reqOb);
        var deferred = this.$q.defer();
        var url = this.uRLSvc.getPostElementsURL(reqOb);
        this.$http.post(url, {'elements': reqOb.elements, 'source': this.applicationSvc.getSource()})
            .then((response) => {
                if (!angular.isArray(response.data.elements) || response.data.elements.length === 0) {
                    deferred.reject({status: 500, data: '', message: "Server Error: empty response"});
                    return;
                }
                var results = [];
                for (var i = 0; i < response.data.elements.length; i++) {
                    results.push(this.cacheElement(reqOb, response.data.elements[i]));
                    var editCopy = JSON.parse(JSON.stringify(response.data.elements[i]));
                    this.cacheElement(reqOb, editCopy, true);
                }
                deferred.resolve(results);
            }, (response) => {
                this.uRLSvc.handleHttpStatus(response.data, response.status, response.headers, response.config, deferred);
            });
        return deferred.promise;
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
     * @param {object} reqOb see description of getElement
     * @returns {Promise} Resolved with {status: false} if cache is up to date,
     *      Resolved with {status: true, server: server element, cache: cache element} if cache is outdated
     */
    isCacheOutdated(reqOb) {//TODO
        var deferred = this.$q.defer();
        deferred.resolve({status: false});
        /*var ws = !workspace ? 'master' : workspace;
        var orig = this.cacheSvc.get(this.utilsSvc.makeElementKey(id, ws, null, false));
        if (!orig) {
            deferred.resolve({status: false});
            return deferred.promise;
        }
        this.$http.get(this.uRLSvc.getElementURL(id, ws, 'latest'))
        .success((data, status, headers, config) => {
            var server = _.cloneDeep(data.elements[0]);
            delete server._modified;
            delete server._read;
            delete server._creator;
            this.utilsSvc.cleanElement(server);
            var current = _.cloneDeep(orig);
            delete current._modified;
            delete current._read;
            delete current._creator;
            this.utilsSvc.cleanElement(current);
            if (angular.equals(server, current)) {
                deferred.resolve({status: false});
            } else {
                deferred.resolve({status: true, server: data.elements[0], cache: orig});
            }
        }).error((data, status, headers, config) => {
            this.uRLSvc.handleHttpStatus(data, status, headers, config, deferred);
        });*/
        return deferred.promise;
    };

    /**
     * @ngdoc method
     * @name mms.ElementService#search
     * @methodOf mms.ElementService
     *
     * @description
     * Search for elements based on some query
     *
     * @param {object} reqOb see description of getElement
     * @param {object} query JSON object with Elastic query format
     * @param {integer} [weight=1] priority
     * @returns {Promise} The promise will be resolved with an array of element objects.
     *                  The element results returned will be a clone of the original server response and not cache references
     */
    search(reqOb, query, weight) {
        this.utilsSvc.normalize(reqOb);
        var url = this.uRLSvc.getElementSearchURL(reqOb);
        var deferred = this.$q.defer();
        this.$http.post(url, query)
            .then((data) => {
                //var result = [];
                //for (var i = 0; i < data.data.elements.length; i++) {
                //    var element = data.data.elements[i];
                //    var cacheE = this.cacheElement(reqOb, element);
                //    var toAdd = JSON.parse(JSON.stringify(element)); //make clone
                //    toAdd._relatedDocuments = cacheE._relatedDocuments;
                //    result.push(toAdd);
                //}
                //deferred.resolve(result);
                deferred.resolve(data.data);
            }, (data) => {
                this.uRLSvc.handleHttpStatus(data.data, data.status, data.headers, data.config, deferred);
            });
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
     * @param {object} reqOb see getElement
     * @param {integer} [weight=1] priority
     * @param {boolean} [update=false] update from server
     * @returns {Promise} The promise will be resolved with an array of commit objects.
     */
    getElementHistory(reqOb, weight, update) {
        this.utilsSvc.normalize(reqOb);

        var key = this.uRLSvc.getElementHistoryURL(reqOb);
        if (this.inProgress.hasOwnProperty(key)) {
            return this.inProgress[key];
        }
        var requestCacheKey = ['history', reqOb.projectId, reqOb.refId, reqOb.elementId];
        var deferred = this.$q.defer();
        if (this.cacheSvc.exists(requestCacheKey) && !update) {
            deferred.resolve(this.cacheSvc.get(requestCacheKey));
            return deferred.promise;
        }
        this.inProgress[key] = deferred.promise;
        this.$http.get(this.uRLSvc.getElementHistoryURL(reqOb))
            .then((response) =>{
                deferred.resolve(this.cacheSvc.put(requestCacheKey, response.data.commits, true));
                delete this.inProgress[key];
            }, (response) => {
                this.uRLSvc.handleHttpStatus(response.data, response.status, response.headers, response.config, deferred);
                delete this.inProgress[key];
            });
        return deferred.promise;
    };

    getElementKey(reqOb, id?, edit?) {
        var cacheKey = this.utilsSvc.makeElementKey({
            _projectId: reqOb.projectId,
            id: id ? id : reqOb.elementId,
            _commitId: reqOb.commitId,
            _refId: reqOb.refId
        }, edit);
        return cacheKey;
    };

    reset() {
        this.inProgress = {};
    };

    private _groupElementsByProjectIdAndRefId(elementObs) {
        return _.groupBy(elementObs, (element) => {
            return element._projectId + '|' + element._refId;
        });
    }

    private _createMetaOb(element) {
        return {
            projectId: element._projectId,
            refId: element._refId,
            commitId: 'latest',
            elementId: element.id
        };
    }

    private _validate(elementObs) {
        return _.every( elementObs, ( elementOb ) => {
            return elementOb.hasOwnProperty('id') && elementOb.hasOwnProperty('_projectId') && elementOb.hasOwnProperty('_refId');
        });
    }

    private _bulkUpdate(elements, returnChildViews) {
        var deferred = this.$q.defer();
        this.$http.post(this.uRLSvc.getPostElementsURL({
            projectId: elements[0]._projectId,
            refId: elements[0]._refId,
            returnChildViews: returnChildViews
        }), {
            elements: elements,
            source: this.applicationSvc.getSource()
        }, {timeout: 60000})
            .then((response) => {
                this._bulkUpdateSuccessHandler(response, deferred);
            }, (response) => {
                this._bulkUpdateFailHandler(response, deferred, elements);
            });
        return deferred.promise;
    }

    private _bulkUpdateSuccessHandler(serverResponse, deferred) {
        var results = [];
        var elements = serverResponse.data.elements;
        elements.forEach((e) => {
            var metaOb = this._createMetaOb(e);
            var editCopy = JSON.parse(JSON.stringify(e));
            results.push(this.cacheElement(metaOb, e));

            this.cacheElement(metaOb, editCopy, true);

            var history = this.cacheSvc.get(['history', metaOb.projectId, metaOb.refId, metaOb.elementId]);
            if (history) {
                history.unshift({_creator: e._modifier, _created: e._modified, id: e._commitId});
            }
        });
        var rejected = serverResponse.data.rejected;
        if (rejected && rejected.length > 0) {
            rejected.forEach((e) => {
                if (e.code === 304 && e.element) {
                    results.push(e.element); //add any server rejected elements because they haven't changed
                }
            });
        }
        deferred.resolve(results);
    }

    /** For now, not doing anything special when there is a "conflict" error **/
    private _bulkUpdateFailHandler(response, deferred, elementObs) {
        // for now the server doesn't return anything for the data properties, so override with the input
        response.data = elementObs;
        this.uRLSvc.handleHttpStatus(response.data, response.status, response.headers, response.config, deferred);
    }
}

ElementService.$inject = ['$q', '$http', 'URLService', 'UtilsService', 'CacheService', 'HttpService', 'ApplicationService'];

mms.service('ElementService', ElementService);