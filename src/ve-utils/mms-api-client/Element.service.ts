import * as angular from 'angular'
import _ from 'lodash'

import { CacheService } from '@ve-utils/mms-api-client/Cache.service'
import {
    httpCallback,
    HttpService,
} from '@ve-utils/mms-api-client/Http.service'
import { URLService } from '@ve-utils/mms-api-client/URL.provider'
import { ApplicationService, UtilsService } from '@ve-utils/services'

import { veUtils } from '@ve-utils'

import {
    CommitObject,
    CommitResponse,
    ElementCreationRequest,
    ElementObject,
    ElementsRequest,
    ElementsResponse,
    QueryObject,
    QueryParams,
    RequestObject,
    SearchResponse,
} from '@ve-types/mms'
import { VePromiseReason } from '@ve-types/view-editor'

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
    private inProgressElements: {
        [key: string]: angular.IPromise<ElementObject>
    } = {}
    private inProgressArrays: {
        [key: string]: angular.IPromise<ElementObject[]>
    } = {}

    static $inject = [
        '$q',
        '$http',
        'growl',
        'URLService',
        'UtilsService',
        'CacheService',
        'HttpService',
        'ApplicationService',
    ]

    constructor(
        private $q: angular.IQService,
        private $http: angular.IHttpService,
        private growl: angular.growl.IGrowlService,
        private uRLSvc: URLService,
        private utilsSvc: UtilsService,
        private cacheSvc: CacheService,
        private httpSvc: HttpService,
        private applicationSvc: ApplicationService
    ) {}

    /**
     * @ngdoc method
     * @name veUtils/ElementService#getElement
     * @methodOf veUtils/ElementService
     *
     * @description
     * Gets an element object by projectId and elementId. If the element object is already in the cache,
     * resolve the existing reference, if not or update is true, request it from server,
     * add/merge into the cache.
     *
     * Most of these methods return promises that will reject with a reason object
     * when a server call fails, see
     * {@link veUtils/URLService#handleHttpStatus the return object}
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
    getElement(
        reqOb: ElementsRequest,
        weight?: number,
        refresh?: boolean,
        allowEmpty?: boolean
    ): angular.IPromise<ElementObject> {
        this.utilsSvc.normalize(reqOb)
        const requestCacheKey = this.getElementKey(reqOb)
        if (!reqOb.projectId) {
            console.log('foo')
        }
        const url = this.uRLSvc.getElementURL(reqOb)
        const key = url
        // if it's in the this.inProgress queue get it immediately
        if (
            this.inProgressElements &&
            this.inProgressElements.hasOwnProperty(key)
        ) {
            //change to change priority if it's already in the queue
            this.httpSvc.ping(key, weight)
            return this.inProgressElements[key]
        }
        const deferred: angular.IDeferred<ElementObject> = this.$q.defer()
        const cached: ElementObject =
            this.cacheSvc.get<ElementObject>(requestCacheKey)
        if (
            cached &&
            !refresh &&
            (!reqOb.extended || (reqOb.extended && cached._qualifiedId))
        ) {
            deferred.resolve(cached)
            return deferred.promise
        }
        const deletedRequestCacheKey = this.getElementKey(reqOb)
        deletedRequestCacheKey.push('deleted')
        const deleted = this.cacheSvc.get<ElementObject>(deletedRequestCacheKey)
        if (deleted) {
            deferred.reject({
                status: 410,
                data: { recentVersionOfElement: deleted },
                message: 'Deleted',
            })
            return deferred.promise
        }
        this.inProgressElements[key] = deferred.promise
        const successCallback: httpCallback<ElementsResponse> = (
            data: ElementsResponse
        ) => {
            if (Array.isArray(data.elements) && data.elements.length > 0) {
                deferred.resolve(this.cacheElement(reqOb, data.elements[0]))
            } else if (allowEmpty) {
                deferred.resolve(null)
            } else {
                deferred.reject({
                    status: 500,
                    data: '',
                    message: 'Server Error: empty response',
                }) //TODO
            }
            delete this.inProgressElements[key]
        }
        this.httpSvc.get<ElementsResponse>(
            url,
            successCallback,
            (data, status, headers, config) => {
                const reason: VePromiseReason<ElementsResponse> =
                    this.uRLSvc.handleHttpStatus<ElementsResponse>(
                        data,
                        status,
                        headers,
                        config
                    )
                if (
                    data.deleted &&
                    data.deleted.length > 0 &&
                    data.deleted[0].id === reqOb.elementId
                ) {
                    reason.recentVersionOfElement = data.deleted[0]
                    this.cacheDeletedElement(reqOb, data.deleted[0])
                }
                deferred.reject(reason)
                delete this.inProgressElements[key]
            },
            weight
        )
        return deferred.promise
    }

    /**
     * @ngdoc method
     * @name veUtils/ElementService#getElements
     * @methodOf veUtils/ElementService
     *
     * @description
     * Same as getElement, but for multiple ids.
     *
     * @param {object} reqOb keys - {projectId, refId, elementIds (array of ids), commitId, extended}
     * @param {integer} [weight=1] priority of request (2 is immediate, 1 is normal, 0 is low)
     * @param {boolean} [refresh=false] (optional) whether to always get the latest
     *      from server, even if it's already in cache (this will refresh the cache if exists)
     * @returns {Promise} The promise will be resolved with an array of element objects,
     *      multiple calls to this method with the same parameters would give the
     *      same objects
     */
    getElements(
        reqOb: ElementsRequest,
        weight: number,
        refresh?: boolean
    ): angular.IPromise<ElementObject[]> {
        const deferred: angular.IDeferred<ElementObject[]> = this.$q.defer()
        const request: { elements: { id: string }[] } = { elements: [] }
        const existing: ElementObject[] = []
        this.utilsSvc.normalize(reqOb)
        for (let i = 0; i < reqOb.elementId.length; i++) {
            const id = reqOb.elementId[i]
            const requestCacheKey = this.getElementKey(reqOb, id)
            const exist = this.cacheSvc.get<ElementObject>(requestCacheKey)
            if (
                exist &&
                !refresh &&
                (!reqOb.extended || (reqOb.extended && exist._qualifiedId))
            ) {
                existing.push(exist)
                continue
            }
            request.elements.push({ id: id })
        }
        if (request.elements.length === 0) {
            deferred.resolve(existing)
            return deferred.promise
        }
        this.$http.put(this.uRLSvc.getPutElementsURL(reqOb), request).then(
            (response: angular.IHttpResponse<ElementsResponse>) => {
                const data = response.data.elements
                let i
                if (data && data.length > 0) {
                    for (let i = 0; i < data.length; i++) {
                        existing.push(this.cacheElement(reqOb, data[i]))
                    }
                }
                const deleted = response.data.deleted
                if (deleted && deleted.length > 0) {
                    for (let i = 0; i < deleted.length; i++) {
                        this.cacheDeletedElement(reqOb, deleted[i])
                    }
                }
                deferred.resolve(existing)
            },
            (response: angular.IHttpResponse<ElementObject[]>) =>
                deferred.reject(this._handleResponse<ElementObject[]>(response))
        )

        return deferred.promise
    }

    /**
     * @ngdoc method
     * @name veUtils/ElementService#this.cacheElement
     * @methodOf veUtils/ElementService
     *
     * @description
     * handles caching of element objects - in case the metadata of reqOb is different
     * from the element's canonical projectId/refId/commitId (due to being requested
     * from a different project context), it'll become an alias
     *
     * @param {object} reqOb request keys - {projectId, refId, elementId, commitId, extended}
     * @param {object} elementOb object to cache
     * @param {boolean} [edit=false] whether object to cache is for editor
     * @returns {object} cached object
     */
    cacheElement(
        reqOb: ElementsRequest,
        elementOb: ElementObject,
        edit?: boolean
    ): ElementObject {
        let result: ElementObject | string = this.utilsSvc.cleanElement(
            elementOb,
            edit
        )
        const requestCacheKey = this.getElementKey(reqOb, result.id, edit)
        const origResultCommit = result._commitId
        if (reqOb.commitId === 'latest') {
            const resultCommitCopy: ElementsRequest =
                this.utilsSvc.makeElementRequestObject(
                    _.clone<ElementObject>(result)
                )
            result._commitId = 'latest' //so realCacheKey is right later
            const commitCacheKey =
                this.utilsSvc.makeElementKey(resultCommitCopy) //save historic element
            if (!edit) {
                this.cacheSvc.put(commitCacheKey, result, true)
            }
        }
        const resultReqOb = this.utilsSvc.makeElementRequestObject(result)
        const realCacheKey = this.utilsSvc.makeElementKey(resultReqOb, edit)
        result._commitId = origResultCommit //restore actual commitId
        if (!_.isEqual(realCacheKey, requestCacheKey)) {
            this.cacheSvc.link(requestCacheKey, realCacheKey)
        }
        result = this.cacheSvc.put<ElementObject>(realCacheKey, result, true)
        return result
    }

    cacheDeletedElement(reqOb: ElementsRequest, deletedOb: ElementObject) {
        const requestCacheKey = this.getElementKey(reqOb, deletedOb.id)
        requestCacheKey.push('deleted')
        const deletedReqOb: ElementsRequest = {
            elementId: deletedOb.id,
            projectId: deletedOb._projectId,
            refId: deletedOb._refId,
            commitId: deletedOb._commitId,
        }
        const commitCacheKey = this.utilsSvc.makeElementKey(deletedReqOb)
        this.cacheSvc.link(requestCacheKey, commitCacheKey)
        this.cacheSvc.put(commitCacheKey, deletedOb, true)
    }

    /**
     * @ngdoc method
     * @name veUtils/ElementService#getElementForEdit
     * @methodOf veUtils/ElementService
     *
     * @description
     * Gets an element object to edit by id. (this is different from getElement in
     * that the element is a clone and not the same reference. The rationale is to
     * consider angular data bindings so editor an element does not cause unintentional
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
     * @param {boolean} [refresh=false] update from server
     * @returns {Promise} The promise will be resolved with the element object,
     *      multiple calls to this method with the same id would result in
     *      references to the same object. This object can be edited without
     *      affecting the same element object that's used for displays
     */
    getElementForEdit(
        reqOb: ElementsRequest,
        weight?: number,
        refresh?: boolean
    ): angular.IPromise<ElementObject> {
        this.utilsSvc.normalize(reqOb)
        const id = Array.isArray(reqOb.elementId)
            ? reqOb.elementId[0]
            : reqOb.elementId
        const requestCacheKey = this.getElementKey(reqOb, id, true)
        const key = this.uRLSvc.getElementURL(reqOb) + 'edit'
        if (this.inProgressElements.hasOwnProperty(key)) {
            return this.inProgressElements[key]
        }
        const deferred: angular.IDeferred<ElementObject> = this.$q.defer()
        const cached = this.cacheSvc.get<ElementObject>(requestCacheKey)
        if (cached && !refresh) {
            deferred.resolve(cached)
            return deferred.promise
        }
        this.inProgressElements[key] = deferred.promise
        this.getElement(reqOb, weight, refresh)
            .then(
                (result) => {
                    const copy = _.cloneDeep<ElementObject>(result)
                    deferred.resolve(this.cacheElement(reqOb, copy, true))
                },
                (reason) => {
                    deferred.reject(reason)
                }
            )
            .finally(() => {
                delete this.inProgressElements[key]
            })
        return deferred.promise
    }

    /**
     * @ngdoc method
     * @name veUtils/ElementService#getOwnedElements
     * @methodOf veUtils/ElementService
     *
     * @description
     * Gets element's owned element objects. TBD (stub)
     *
     * @param {object} reqOb see description of getElement, add 'depth' key.
     * @param {integer} [weight=1] priority
     * @param {boolean} [refresh=false] update from server
     * @returns {Promise} The promise will be resolved with an array of
     * element objects
     */
    getOwnedElements(
        reqOb: ElementsRequest,
        weight?: number,
        refresh?: boolean
    ) {
        this.utilsSvc.normalize(reqOb)
        if (!reqOb.depth) {
            reqOb.depth = -1
        }
        return this.getGenericElements(
            this.uRLSvc.getOwnedElementURL(reqOb),
            reqOb,
            'elements',
            weight,
            refresh
        )
    }

    /**
     * @ngdoc method
     * @name veUtils/ElementService#getGenericElements
     * @methodOf veUtils/ElementService
     *
     * @description
     * This is a method to call a predefined url that returns elements json.
     * A key provides the key of the json that has the elements array.
     *
     * @param {string} url the url to get
     * @param {ElementsRequest} reqOb see description of getElement.
     * @param {string} jsonKey json key that has the element array value
     * @param {integer} [weight=1] priority
     * @param {boolean} [refresh=false] update from server
     */
    getGenericElements(
        url: string,
        reqOb: ElementsRequest,
        jsonKey: string,
        weight: number,
        refresh?: boolean
    ): angular.IPromise<ElementObject[]> {
        this.utilsSvc.normalize(reqOb)
        if (this.inProgressElements.hasOwnProperty(url)) {
            this.httpSvc.ping(url, weight)
            return this.inProgressArrays[url]
        }
        const requestCacheKey = this.getElementKey(reqOb)
        const deferred: angular.IDeferred<ElementObject[]> = this.$q.defer()
        this.inProgressArrays[url] = deferred.promise
        const cached = this.cacheSvc.get<ElementObject[]>(requestCacheKey)
        if (cached && !refresh) {
            deferred.resolve(cached)
            return deferred.promise
        }
        this.httpSvc.get<{ [jsonKey: string]: ElementObject[] }>(
            url,
            (data) => {
                const results: ElementObject[] = []
                const elements = data[jsonKey]
                for (let i = 0; i < elements.length; i++) {
                    const element = elements[i]
                    if (!element) {
                        //check for possible null
                        continue
                    }
                    results.push(this.cacheElement(reqOb, element))
                }
                delete this.inProgressArrays[url]
                deferred.resolve(results)
            },
            (data, status, headers, config) => {
                deferred.reject(
                    this.uRLSvc.handleHttpStatus(data, status, headers, config)
                )
                delete this.inProgressArrays[url]
            },
            weight
        )
        return deferred.promise
    }

    //called by updateElement, fills in all keys for element to be updated
    //will also send any cached edited field for the element to be updated
    fillInElement(elementOb: ElementObject): ElementObject {
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
        const ob = _.cloneDeep(elementOb) //make a copy
        ob._commitId = 'latest'
        const editOb = this.cacheSvc.get<ElementObject>(
            this.utilsSvc.makeElementKey(
                this.utilsSvc.makeElementRequestObject(ob),
                true
            )
        )
        //for (var key in elementOb) {
        //    ob[key] = elementOb[key];
        //}
        if (editOb) {
            for (const key in editOb) {
                if (!elementOb.hasOwnProperty(key)) {
                    ob[key] = editOb[key]
                }
            }
        }
        if (ob._displayedElementIds) {
            delete ob._displayedElementIds
        }
        if (ob._allowedElementIds) {
            delete ob._allowedElementIds
        }
        if (ob._childViews && !elementOb._childViews) {
            delete ob._childViews
        }
        delete ob._commitId
        return ob
        /*
            deferred.resolve(ob);
        }, () => {
            deferred.resolve(elementOb);
        });
        return deferred.promise;
        */
    }

    /**
     * @ngdoc method
     * @name veUtils/ElementService#updateElement
     * @methodOf veUtils/ElementService
     *
     * @description
     * Save element to mms and update the cache if successful, the element object
     * must have an id, and whatever property that needs to be updated.
     *
     * {@link veUtils/ElementService#getElementForEdit see also getElementForEdit}
     *
     * @param {ElementObject} elementOb An object that contains _projectId, _refId, sysmlId and any property changes to be saved.
     * @param {boolean} returnChildViews
     * @param {boolean} allowEmpty
     * @returns {angular.IPromise<ElementObject>} The promise will be resolved with the updated cache element reference if
     *      update is successful. If a conflict occurs, the promise will be rejected with status of 409
     */
    updateElement(
        elementOb: ElementObject,
        returnChildViews?: boolean,
        allowEmpty?: boolean
    ): angular.IPromise<ElementObject> {
        //elementOb should have the keys needed to make url

        const deferred: angular.IDeferred<ElementObject> = this.$q.defer()
        const handleSuccess = (data: ElementsResponse) => {
            let e: ElementObject = data.elements[0]

            if (data.elements.length > 1 && elementOb.id) {
                for (let i = 0; i < data.elements.length; i++) {
                    if (data.elements[i].id === elementOb.id) {
                        e = data.elements[i]
                    }
                }
            }
            const metaOb = {
                projectId: e._projectId,
                refId: e._refId,
                commitId: 'latest',
                elementId: e.id,
            }
            const resp: ElementObject = this.cacheElement(metaOb, e)
            const editCopy = _.cloneDeep(e)
            this.cacheElement(metaOb, editCopy, true)
            const history = this.cacheSvc.get<CommitObject[]>([
                'history',
                metaOb.projectId,
                metaOb.refId,
                metaOb.elementId,
            ])
            if (history) {
                const id = e._commitId ? e._commitId : 'latest'
                history.unshift({
                    _creator: e._modifier,
                    _created: e._modified,
                    id: id,
                    _refId: e._refId,
                    _projectId: e._projectId,
                })
            }
            deferred.resolve(resp)
        }

        if (!elementOb.hasOwnProperty('id')) {
            deferred.reject({
                status: 400,
                data: '',
                message: 'Element id not found, create element first!',
            })
            return deferred.promise
        }
        const postElem = this.fillInElement(elementOb)
        //.then((postElem) => {
        this.$http
            .post(
                this.uRLSvc.getPostViewsURL({
                    projectId: postElem._projectId,
                    refId: postElem._refId,
                    returnChildViews: returnChildViews,
                }),
                {
                    elements: [postElem],
                    source: this.applicationSvc.getSource(),
                },
                { timeout: 60000 }
            )
            .then(
                (response: angular.IHttpResponse<ElementsResponse>) => {
                    const rejected = response.data.rejected
                    if (
                        rejected &&
                        rejected.length > 0 &&
                        rejected[0].code === 304 &&
                        rejected[0].object
                    ) {
                        //elem will be rejected if server detects no changes
                        deferred.resolve(rejected[0].object)
                        return
                    }

                    if (
                        !Array.isArray(response.data.elements) ||
                        response.data.elements.length === 0
                    ) {
                        if (allowEmpty) {
                            deferred.resolve(null)
                        } else {
                            deferred.reject({
                                status: 500,
                                data: '',
                                message: 'Server Error: empty response',
                            })
                        }
                        return
                    }
                    handleSuccess(response.data)
                },
                (response: angular.IHttpResponse<ElementsResponse>) => {
                    if (response.status === 409) {
                        const serverOb = response.data.elements[0]
                        this.utilsSvc.cleanElement(serverOb)
                        const origCommit = elementOb._commitId
                        elementOb._commitId = 'latest'
                        const origOb = this.cacheSvc.get(
                            this.utilsSvc.makeElementKey({
                                elementId: elementOb.id,
                                projectId: elementOb._projectId,
                                refId: elementOb._refId,
                                commitId: elementOb._commitId,
                            })
                        )
                        elementOb._commitId = origCommit
                        if (!origOb) {
                            deferred.reject(
                                this.uRLSvc.handleHttpStatus(
                                    response.data,
                                    response.status,
                                    response.headers,
                                    response.config
                                )
                            )
                            return
                        }
                        if (
                            !this.utilsSvc.hasConflict(
                                postElem,
                                origOb,
                                serverOb
                            )
                        ) {
                            elementOb._read = serverOb._read
                            elementOb._modified = serverOb._modified
                            this.updateElement(
                                elementOb,
                                returnChildViews
                            ).then(
                                (good) => {
                                    deferred.resolve(good)
                                },
                                (reason) => {
                                    deferred.reject(reason)
                                }
                            )
                        } else {
                            deferred.reject(
                                this.uRLSvc.handleHttpStatus(
                                    response.data,
                                    response.status,
                                    response.headers,
                                    response.config
                                )
                            )
                        }
                    } else
                        deferred.reject(
                            this.uRLSvc.handleHttpStatus(
                                response.data,
                                response.status,
                                response.headers,
                                response.config
                            )
                        )
                }
            )
        //});
        return deferred.promise
    }

    /**
     * @ngdoc method
     * @name veUtils/ElementService#updateElements
     * @methodOf veUtils/ElementService
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
    updateElements(
        elementObs: ElementObject[],
        returnChildViews?: boolean
    ): angular.IPromise<ElementObject[]> {
        const deferred: angular.IDeferred<ElementObject[]> = this.$q.defer()
        if (this._validate(elementObs)) {
            const postElements = elementObs.map((elementOb) => {
                return this.fillInElement(elementOb)
            })

            const groupOfElements =
                this._groupElementsByProjectIdAndRefId(postElements)
            const promises: angular.IPromise<ElementObject[]>[] = []

            Object.keys(groupOfElements).forEach((key) => {
                promises.push(
                    this._bulkUpdate(groupOfElements[key], returnChildViews)
                )
            })

            // responses is an array of response corresponding to both successful and failed requests with the following format
            // [ { state: 'fulfilled', value: the value returned by the server },
            //   { state: 'rejected', reason: {status, data, message} -- Specified by handleHttpStatus method }
            // ]
            this.$q.allSettled(promises).then(
                (responses: angular.PromiseValue<ElementObject[]>[]) => {
                    // get all the successful requests
                    const successfulRequests = responses.filter((response) => {
                        return response.state === 'fulfilled'
                    })

                    const successValues = _.flatten(
                        successfulRequests.map((response) => {
                            return response.value
                        })
                    )

                    if (successfulRequests.length === promises.length) {
                        // All requests succeeded
                        deferred.resolve(successValues)
                    } else {
                        // some requests failed
                        const rejectionReasons: unknown[] = responses
                            .filter((response) => {
                                return response.state === 'rejected'
                            })
                            .map((response): unknown => {
                                return response.reason
                            })

                        // since we could have multiple failed requests when having some successful requests,
                        // reject with the following format so that the client can deal with them at a granular level if
                        // desired
                        deferred.reject({
                            failedRequests: rejectionReasons,
                            successfulRequests: successValues,
                        })
                    }
                },
                (reason) => {
                    deferred.reject(reason)
                }
            )
        } else {
            deferred.reject({
                failedRequests: [
                    {
                        status: 400,
                        data: elementObs,
                        message:
                            'Some of the elements do not have id, _projectId, _refId',
                    },
                ],
                successfulRequests: [],
            })
        }
        return deferred.promise
    }

    /**
     * @ngdoc method
     * @name veUtils/ElementService#createElement
     * @methodOf veUtils/ElementService
     *
     * @description
     * Create element on veUtils/
     *
     * @param {object} reqOb see description of getElement, instead of elementId, 'element' key should be
     *                  the element object to create
     * @returns {Promise} The promise will be resolved with the created element references if
     *      create is successful.
     */
    createElement(
        reqOb: ElementCreationRequest
    ): angular.IPromise<ElementObject> {
        this.utilsSvc.normalize(reqOb)
        const deferred: angular.IDeferred<ElementObject> = this.$q.defer()

        const url = this.uRLSvc.getPostElementsURL(reqOb)
        this.$http
            .post(url, {
                elements: reqOb.elements,
                source: this.applicationSvc.getSource(),
            })
            .then(
                (response: angular.IHttpResponse<ElementsResponse>) => {
                    if (
                        !Array.isArray(response.data.elements) ||
                        response.data.elements.length === 0
                    ) {
                        deferred.reject({
                            status: 500,
                            data: '',
                            message: 'Server Error: empty response',
                        })
                        return
                    }
                    let resp: ElementObject = response.data.elements[0]
                    if (
                        response.data.elements.length > 1 &&
                        reqOb.elements[0].id
                    ) {
                        for (
                            let i = 0;
                            i < response.data.elements.length;
                            i++
                        ) {
                            if (
                                response.data.elements[i].id ===
                                reqOb.elements[0].id
                            ) {
                                resp = response.data.elements[i]
                            }
                        }
                    }
                    deferred.resolve(this.cacheElement(reqOb, resp))
                },
                (response: angular.IHttpResponse<ElementsResponse>) =>
                    deferred.reject(
                        this._handleResponse<ElementsResponse>(response)
                    )
            )
        return deferred.promise
    }

    /**
     * @ngdoc method
     * @name veUtils/ElementService#createElements
     * @methodOf veUtils/ElementService
     *
     * @description
     * Create elements to alfresco and update the cache if successful.
     *
     * @param {object} reqOb see description of getElement, instead of elementId, 'elements' key should be
     *                  the array of element object to create
     * @returns {Promise} The promise will be resolved with an array of created element references if
     *      create is successful.
     */
    createElements(
        reqOb: ElementCreationRequest
    ): angular.IPromise<ElementObject[]> {
        this.utilsSvc.normalize(reqOb)
        const deferred: angular.IDeferred<ElementObject[]> = this.$q.defer()
        const url = this.uRLSvc.getPostElementsURL(reqOb)
        this.$http
            .post(url, {
                elements: reqOb.elements,
                source: this.applicationSvc.getSource(),
            })
            .then(
                (response: angular.IHttpResponse<ElementsResponse>) => {
                    if (
                        !Array.isArray(response.data.elements) ||
                        response.data.elements.length === 0
                    ) {
                        deferred.reject({
                            status: 500,
                            data: '',
                            message: 'Server Error: empty response',
                        })
                        return
                    }
                    const results: ElementObject[] = []
                    for (let i = 0; i < response.data.elements.length; i++) {
                        results.push(
                            this.cacheElement(reqOb, response.data.elements[i])
                        )
                        const editCopy = _.cloneDeep(response.data.elements[i])
                        this.cacheElement(reqOb, editCopy, true)
                    }
                    deferred.resolve(results)
                },
                (response: angular.IHttpResponse<ElementsResponse>) => {
                    deferred.reject(this._handleResponse(response))
                }
            )
        return deferred.promise
    }

    /**
     * @ngdoc method
     * @name veUtils/ElementService#isCacheOutdated
     * @methodOf veUtils/ElementService
     *
     * @description
     * Checks if the current cached element has been updated on the server, does not update the cache.
     * If the element doesn't exist in the cache, it's considered not outdated
     *
     * @param {ElementObject} elementOb see description of getElement
     * @returns {Promise} Resolved with {status: false} if cache is up to date,
     *      Resolved with {status: true, server: server element, cache: cache element} if cache is outdated
     */
    isCacheOutdated(elementOb: ElementObject): angular.IPromise<{
        status?: boolean
        server?: ElementObject
        cache?: ElementObject
    }> {
        const reqOb: ElementsRequest = {
            projectId: elementOb._projectId,
            refId: elementOb._refId,
            elementId: elementOb.id,
        }
        const deferred: angular.IDeferred<{
            status?: boolean
            server?: ElementObject
            cache?: ElementObject
        }> = this.$q.defer()
        deferred.resolve({ status: false })
        const orig = this.cacheSvc.get<ElementObject>(
            this.utilsSvc.makeElementKey(reqOb, false)
        )
        if (!orig) {
            deferred.resolve({ status: false })
            return deferred.promise
        }
        this.$http.get(this.uRLSvc.getElementURL(reqOb)).then(
            (response: angular.IHttpResponse<ElementsResponse>) => {
                let server = _.cloneDeep(response.data.elements[0])
                delete server._modified
                delete server._read
                delete server._creator
                server = this.utilsSvc.cleanElement(server)
                let current: ElementObject = _.cloneDeep(orig)
                delete current._modified
                delete current._read
                delete current._creator
                current = this.utilsSvc.cleanElement(current)
                if (_.isEqual(server, current)) {
                    deferred.resolve({ status: false })
                } else {
                    deferred.resolve({
                        status: true,
                        server: response.data.elements[0],
                        cache: orig,
                    })
                }
            },
            (response: angular.IHttpResponse<ElementsResponse>) => {
                deferred.reject(this._handleResponse(response))
            }
        )
        return deferred.promise
    }

    /**
     * @ngdoc method
     * @name veUtils/ElementService#search
     * @methodOf veUtils/ElementService
     *
     * @description
     * Search for elements based on some query
     *
     * @param {RequestObject} reqOb see description of getElement
     * @param {QueryObject} query object with MMS4 query format
     * @param {QueryParams} queryParams
     * @param {integer} [weight=1] priority
     * @returns {Promise} The promise will be resolved with an array of element objects.
     *                  The element results returned will be a clone of the original server response and not cache references
     */
    search(
        reqOb: RequestObject,
        query: QueryObject,
        queryParams?: QueryParams,
        weight?
    ): angular.IPromise<SearchResponse> {
        this.utilsSvc.normalize(reqOb)
        const url = this.uRLSvc.getElementSearchURL(reqOb, queryParams)
        const deferred: angular.IDeferred<SearchResponse> = this.$q.defer()
        this.$http.post(url, query).then(
            (response: angular.IHttpResponse<SearchResponse>) => {
                //var result = [];
                //for (let i = 0; i < data.data.elements.length; i++) {
                //    var element = data.data.elements[i];
                //    var cacheE = this.cacheElement(reqOb, element);
                //    var toAdd = JSON.parse(JSON.stringify(element)); //make clone
                //    toAdd._relatedDocuments = cacheE._relatedDocuments;
                //    result.push(toAdd);
                //}
                //deferred.resolve(result);
                deferred.resolve(response.data)
            },
            (response: angular.IHttpResponse<SearchResponse>) =>
                deferred.reject(this._handleResponse(response))
        )
        return deferred.promise
    }

    /**
     * @ngdoc method
     * @name veUtils/ElementService#getElementVersions
     * @methodOf veUtils/ElementService
     *
     * @description
     * Queries for an element's entire version history
     *
     * @param {object} reqOb see getElement
     * @param {integer} [weight=1] priority
     * @param {boolean} [update=false] update from server
     * @returns {Promise} The promise will be resolved with an array of commit objects.
     */
    getElementHistory(
        reqOb: ElementsRequest,
        weight: number,
        update?: boolean
    ): angular.IPromise<CommitObject[]> {
        this.utilsSvc.normalize(reqOb)

        const key = this.uRLSvc.getElementHistoryURL(reqOb)
        if (this.inProgressArrays.hasOwnProperty(key)) {
            return this.inProgressArrays[key]
        }
        const id = Array.isArray(reqOb.elementId)
            ? reqOb.elementId[0]
            : reqOb.elementId
        const requestCacheKey: string[] = [
            'history',
            reqOb.projectId,
            reqOb.refId,
            id,
        ]
        const deferred: angular.IDeferred<CommitObject[]> = this.$q.defer()
        if (this.cacheSvc.exists(requestCacheKey) && !update) {
            deferred.resolve(this.cacheSvc.get(requestCacheKey))
            return deferred.promise
        }
        this.inProgressArrays[key] = deferred.promise
        this.$http.get(this.uRLSvc.getElementHistoryURL(reqOb)).then(
            (response: angular.IHttpResponse<CommitResponse>) => {
                this.cacheSvc.put<CommitObject[]>(
                    requestCacheKey,
                    response.data.commits,
                    true
                )
                deferred.resolve(
                    this.cacheSvc.get<CommitObject[]>(requestCacheKey)
                )
                delete this.inProgress[key]
            },
            (response) => {
                this.uRLSvc.handleHttpStatus(
                    response.data,
                    response.status,
                    response.headers,
                    response.config,
                    deferred
                )
                delete this.inProgress[key]
            }
        )
        return deferred.promise
    }

    public getElementKey(
        reqOb: ElementsRequest,
        id?: string,
        edit?: boolean
    ): string[] {
        if (!id) {
            id = Array.isArray(reqOb.elementId)
                ? reqOb.elementId[0]
                : reqOb.elementId
        }
        return this.utilsSvc.makeElementKey(
            {
                projectId: reqOb.projectId,
                elementId: id,
                commitId: reqOb.commitId,
                refId: reqOb.refId,
            },
            edit
        )
    }

    public getElementQualifiedName(
        reqOb: ElementsRequest
    ): angular.IPromise<string> {
        const queryOb = {
            params: {
                id: reqOb.elementId,
            },
            recurse: {
                ownerId: 'id',
            },
        }
        return this.search(reqOb, queryOb).then((data: ElementsResponse) => {
            let qualifiedName = ''
            const elements = data.elements.reverse()
            const entries = elements.entries()
            for (const [i, element] of entries) {
                if (element.hasOwnProperty('name')) {
                    qualifiedName += element.name
                }
                if (i != elements.length - 1) {
                    qualifiedName += '/'
                }
            }
            return qualifiedName
        })
    }

    reset() {
        this.inProgress = {}
    }

    private _groupElementsByProjectIdAndRefId(elementObs: ElementObject[]) {
        return _.groupBy(elementObs, (element) => {
            return element._projectId + '|' + element._refId
        })
    }

    private _createMetaOb(element: ElementObject): ElementsRequest {
        return {
            projectId: element._projectId,
            refId: element._refId,
            commitId: 'latest',
            elementId: element.id,
        }
    }

    private _validate(elementObs: ElementObject[]) {
        return _.every(elementObs, (elementOb) => {
            return (
                elementOb.hasOwnProperty('id') &&
                elementOb.hasOwnProperty('_projectId') &&
                elementOb.hasOwnProperty('_refId')
            )
        })
    }

    private _bulkUpdate(
        elements: ElementObject[],
        returnChildViews?: boolean
    ): angular.IPromise<ElementObject[]> {
        const deferred: angular.IDeferred<ElementObject[]> = this.$q.defer()
        this.$http
            .post(
                this.uRLSvc.getPostElementsURL({
                    projectId: elements[0]._projectId,
                    refId: elements[0]._refId,
                    returnChildViews: returnChildViews
                        ? returnChildViews
                        : null,
                }),
                {
                    elements: elements,
                    source: this.applicationSvc.getSource(),
                },
                { timeout: 60000 }
            )
            .then(
                (response: angular.IHttpResponse<ElementsResponse>) => {
                    this._bulkUpdateSuccessHandler(response, deferred)
                },
                (response) => {
                    this._bulkUpdateFailHandler(response, deferred, elements)
                }
            )
        return deferred.promise
    }

    private _bulkUpdateSuccessHandler(
        serverResponse: angular.IHttpResponse<ElementsResponse>,
        deferred: angular.IDeferred<ElementObject[]>
    ): void {
        const results: ElementObject[] = []
        const elements = serverResponse.data.elements
        if (elements && elements.length > 0) {
            elements.forEach((e) => {
                const metaOb = this._createMetaOb(e)
                const editCopy = JSON.parse(JSON.stringify(e))
                results.push(this.cacheElement(metaOb, e))

                this.cacheElement(metaOb, editCopy, true)

                const history = this.cacheSvc.get<CommitObject[]>([
                    'history',
                    metaOb.projectId,
                    metaOb.refId,
                    metaOb.elementId,
                ])
                if (history) {
                    history.unshift({
                        _creator: e._modifier,
                        _created: e._modified,
                        id: e._commitId,
                        _refId: e._refId,
                        _projectId: e._projectId,
                    })
                }
            })
        }
        const rejected = serverResponse.data.rejected
        if (rejected && rejected.length > 0) {
            rejected.forEach((e) => {
                if (e.code === 304 && e.object) {
                    results.push(e.object) //add any server rejected elements because they haven't changed
                    this.growl.warning(
                        'Bulk Update Partially Rejected. Check logs for more details.'
                    )
                    console.log(
                        '[BULK UPDATE ELEMENT REJECTED]: ' +
                            e.code +
                            ': ' +
                            e.message
                    )
                    console.log(e.object.id)
                }
            })
        } else {
        }
        deferred.resolve(results)
    }

    /** For now, not doing anything special when there is a "conflict" error **/
    private _bulkUpdateFailHandler(
        response: angular.IHttpResponse<ElementsResponse>,
        deferred: angular.IDeferred<ElementObject[]>,
        elementObs?: ElementObject[]
    ) {
        // for now the server doesn't return anything for the data properties, so override with the input

        this.uRLSvc.handleHttpStatus(
            response.data,
            response.status,
            response.headers,
            response.config,
            deferred
        )
    }

    private _handleResponse<T>(
        response: angular.IHttpResponse<T>
    ): VePromiseReason<T> {
        return this.uRLSvc.handleHttpStatus<T>(
            response.data,
            response.status,
            response.headers,
            response.config
        )
    }
}

veUtils.service('ElementService', ElementService)
