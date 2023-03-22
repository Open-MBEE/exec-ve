import _ from 'lodash'

import { ApiService, CacheService, httpCallback, HttpService, URLService } from '@ve-utils/mms-api-client'

import { veUtils } from '@ve-utils'

import { VePromise, VePromiseReason, VeQService } from '@ve-types/angular'
import {
    BulkResponse,
    CommitObject,
    CommitResponse,
    ElementCreationRequest,
    ElementObject,
    ElementsRequest,
    ElementsResponse,
    GenericResponse,
    MmsObject,
    QueryObject,
    QueryParams,
    RejectedObject,
    RequestObject,
    SearchResponse,
} from '@ve-types/mms'

/**
 * @ngdoc service
 * @name ElementService
 * @requires $q
 * @requires $http
 * @requires URLService
 * @requires UtilsService
 * @requires CacheService
 * @requires HttpService
 * * An element CRUD service with additional convenience methods for managing edits.
 */
export class ElementService {
    private inProgressElements: {
        [key: string]: VePromise<MmsObject | MmsObject[]>
    } = {}

    static $inject = ['$q', '$http', 'URLService', 'ApiService', 'CacheService', 'HttpService']

    constructor(
        private $q: VeQService,
        private $http: angular.IHttpService,
        private uRLSvc: URLService,
        private apiSvc: ApiService,
        private cacheSvc: CacheService,
        private httpSvc: HttpService
    ) {}

    /**
     * @name veUtils/ElementService#getElement
     *
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
     * @template {ElementObject} T
     * @param {object} reqOb object with keys as described in private description.
     * @param {integer} [weight=1] priority of request (2 is immediate, 1 is normal, 0 is low)
     * @param refresh
     * @param allowEmpty
     *      from server, even if it's already in cache (this will update the cache if exists)
     * @returns {IPromise<T> | VePromise<T>} The promise will be resolved with the element object,
     *      multiple calls to this method with the same parameters would give the
     *      same object
     */
    getElement<T extends ElementObject>(
        reqOb: ElementsRequest<string>,
        weight?: number,
        refresh?: boolean,
        allowEmpty?: boolean
    ): VePromise<T> {
        this.apiSvc.normalize(reqOb)
        const requestCacheKey = this.getElementKey(reqOb, reqOb.elementId)
        if (!reqOb.projectId) {
            console.log('foo')
        }
        const url = this.uRLSvc.getElementURL(reqOb)
        const key = url
        // if it's in the this.inProgress queue get it immediately
        if (this.inProgressElements && this.inProgressElements.hasOwnProperty(key)) {
            //change to change priority if it's already in the queue
            this.httpSvc.ping(key, weight)
            return this.inProgressElements[key] as VePromise<T>
        }
        const deferred = this.$q.defer<T>()
        const cached: T = this.cacheSvc.get<T>(requestCacheKey)
        if (cached && !refresh) {
            deferred.resolve(cached)
            return deferred.promise
        }
        const deletedRequestCacheKey = this.getElementKey(reqOb, reqOb.elementId)
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
        const successCallback: httpCallback<ElementsResponse<T>> = (response) => {
            const data = response.data
            if (Array.isArray(data.elements) && data.elements.length > 0) {
                deferred.resolve(this.cacheElement<T>(reqOb, data.elements[0]))
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
        const errorCallback: httpCallback<ElementsResponse<T>> = (response) => {
            const data = response.data
            const reason = this.uRLSvc.handleHttpStatus(response)
            if (data && data.deleted && data.deleted.length > 0 && data.deleted[0].id === reqOb.elementId) {
                reason.recentVersionOfElement = data.deleted[0]
                this.cacheDeletedElement(reqOb, data.deleted[0])
            }
            deferred.reject(reason)
            delete this.inProgressElements[key]
        }
        this.httpSvc.get<ElementsResponse<T>>(url, successCallback, errorCallback, weight)
        return deferred.promise
    }

    /**
     * @name veUtils/ElementService#getElements
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
    getElements<T extends ElementObject>(
        reqOb: ElementsRequest<string[]>,
        weight: number,
        refresh?: boolean
    ): VePromise<T[]> {
        const deferred = this.$q.defer<T[]>()
        const request: { elements: { id: string }[] } = { elements: [] }
        const existing: T[] = []
        this.apiSvc.normalize(reqOb)
        for (let i = 0; i < reqOb.elementId.length; i++) {
            const id = reqOb.elementId[i]
            const requestCacheKey = this.getElementKey(reqOb, id)
            const exist = this.cacheSvc.get<T>(requestCacheKey)
            if (exist && !refresh) {
                existing.push(exist)
                continue
            }
            request.elements.push({ id: id })
        }
        if (request.elements.length === 0) {
            deferred.resolve(existing)
            return deferred.promise
        }
        this.$http.put<ElementsResponse<T>>(this.uRLSvc.getPutElementsURL(reqOb), request).then(
            (response) => {
                const data = response.data.elements
                let i
                if (data && data.length > 0) {
                    for (let i = 0; i < data.length; i++) {
                        existing.push(this.cacheElement<T>(reqOb, data[i]))
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
            (response: angular.IHttpResponse<ElementObject[]>) => this.apiSvc.handleErrorCallback(response, deferred)
        )

        return deferred.promise
    }

    /**
     * @name veUtils/ElementService#this.cacheElement
     * handles caching of element objects - in case the metadata of reqOb is different
     * from the element's canonical projectId/refId/commitId (due to being requested
     * from a different project context), it'll become an alias
     *
     * @param {object} reqOb request keys - {projectId, refId, elementId, commitId, extended}
     * @param {object} elementOb object to cache
     * @param {boolean} [edit=false] whether object to cache is for editor
     * @returns {object} cached object
     */
    cacheElement<T extends ElementObject>(reqOb: RequestObject, elementOb: T, edit?: boolean): T {
        let result: T = this.apiSvc.cleanElement(elementOb, edit)
        const requestCacheKey = this.getElementKey(reqOb, result.id, edit)
        const origResultCommit = result._commitId
        if (reqOb.commitId === 'latest') {
            const resultCommitCopy: RequestObject = this.apiSvc.makeRequestObject(_.clone<ElementObject>(result))
            result._commitId = 'latest' //so realCacheKey is right later
            const commitCacheKey = this.apiSvc.makeCacheKey(resultCommitCopy, result.id) //save historic element
            if (!edit) {
                this.cacheSvc.put(commitCacheKey, result, true)
            }
        }
        const resultReqOb = this.apiSvc.makeRequestObject(result)
        const realCacheKey = this.apiSvc.makeCacheKey(resultReqOb, result.id, edit)
        result._commitId = origResultCommit //restore actual commitId
        if (!_.isEqual(realCacheKey, requestCacheKey)) {
            this.cacheSvc.link(requestCacheKey, realCacheKey)
        }
        result = this.cacheSvc.put<T>(realCacheKey, result, true)
        return result
    }

    cacheDeletedElement = (reqOb: RequestObject, deletedOb: ElementObject): void => {
        const requestCacheKey = this.getElementKey(reqOb, deletedOb.id)
        requestCacheKey.push('deleted')
        const deletedReqOb: RequestObject = {
            projectId: deletedOb._projectId,
            refId: deletedOb._refId,
            commitId: deletedOb._commitId,
        }
        const commitCacheKey = this.apiSvc.makeCacheKey(deletedReqOb, deletedOb.id)
        this.cacheSvc.link(requestCacheKey, commitCacheKey)
        this.cacheSvc.put(commitCacheKey, deletedOb, true)
    }

    /**
     * @name veUtils/ElementService#getElementForEdit
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
    getElementForEdit<T extends ElementObject>(
        reqOb: ElementsRequest<string>,
        weight?: number,
        refresh?: boolean
    ): VePromise<T> {
        this.apiSvc.normalize(reqOb)
        const requestCacheKey = this.getElementKey(reqOb, reqOb.elementId, true)
        const key = this.uRLSvc.getElementURL(reqOb) + 'edit'
        const inProgress = this._getInProgress<T>(key)
        if (inProgress != null) {
            return inProgress as VePromise<T>
        }
        const deferred = this.$q.defer<T>()
        const cached = this.cacheSvc.get<T>(requestCacheKey)
        if (cached && !refresh) {
            deferred.resolve(cached)
            return deferred.promise
        }
        this.inProgressElements[key] = deferred.promise
        this.getElement<T>(reqOb, weight, refresh)
            .then(
                (result) => {
                    const copy = _.cloneDeep(result)
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
     * @name veUtils/ElementService#getOwnedElements
     * Gets element's owned element objects. TBD (stub)
     *
     * @param {object} reqOb see description of getElement, add 'depth' key.
     * @param {integer} [weight=1] priority
     * @param {boolean} [refresh=false] update from server
     * @returns {Promise} The promise will be resolved with an array of
     * element objects
     */
    getOwnedElements(
        reqOb: ElementsRequest<string>,
        weight?: number,
        refresh?: boolean
    ): VePromise<ElementObject[], GenericResponse<ElementObject>> {
        this.apiSvc.normalize(reqOb)
        if (!reqOb.depth) {
            reqOb.depth = -1
        }
        return this.getGenericElements(this.uRLSvc.getOwnedElementURL(reqOb), reqOb, 'elements', weight, refresh)
    }

    /**
     * @name veUtils/ElementService#getGenericElements
     * This is a method to call a predefined url that returns elements json.
     * A key provides the key of the json that has the elements array.
     *
     * @param {string} url the url to get
     * @param {ElementsRequest} reqOb see description of getElement.
     * @param {string} jsonKey json key that has the element array value
     * @param {integer} [weight=1] priority
     * @param {boolean} [refresh=false] update from server
     */
    getGenericElements<T extends ElementObject>(
        url: string,
        reqOb: RequestObject,
        jsonKey: string,
        weight: number,
        refresh?: boolean
    ): VePromise<T[], GenericResponse<T>> {
        this.apiSvc.normalize(reqOb)
        if (this.inProgressElements.hasOwnProperty(url)) {
            this.httpSvc.ping(url, weight)
            return this._getInProgress<T, GenericResponse<T>>(url) as VePromise<T[], GenericResponse<T>>
        }
        const requestCacheKey = this.getElementKey(reqOb, jsonKey)
        const deferred = this.$q.defer<T[]>()
        this._addInProgress(url, deferred.promise)
        const cached = this.cacheSvc.get<T[]>(requestCacheKey)
        if (cached && !refresh) {
            deferred.resolve(cached)
            return deferred.promise
        }
        this.httpSvc.get<GenericResponse<T>>(
            url,
            (response) => {
                const results: T[] = []
                const elements: T[] = response.data[jsonKey]
                for (let i = 0; i < elements.length; i++) {
                    const element = elements[i]
                    if (!element) {
                        //check for possible null
                        continue
                    }
                    results.push(this.cacheElement(reqOb, element))
                }
                this._removeInProgress(url)
                deferred.resolve(results)
            },
            (response: angular.IHttpResponse<GenericResponse<T>>) => {
                deferred.reject(this.uRLSvc.handleHttpStatus(response))
                this._removeInProgress(url)
            },
            weight
        )
        return deferred.promise
    }

    //called by updateElement, fills in all keys for element to be updated
    //will also send any cached edited field for the element to be updated
    fillInElement = (elementOb: ElementObject): ElementObject => {
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
            this.apiSvc.makeCacheKey(this.apiSvc.makeRequestObject(ob), ob.id, true)
        )
        if (editOb) {
            Object.keys(editOb).forEach((key) => {
                if (!elementOb.hasOwnProperty(key)) {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                    ob[key] = editOb[key]
                }
            })
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
        if (ob.type.includes('TaggedValue') && ob.value && ob.value.length > 0) {
            // make sure value array only has the value
            let newvalues = []
            for (let val of ob.value) {
                if (ob.type === 'ElementTaggedValue') {
                    newvalues.push(val.elementId)
                } else {
                    newvalues.push({value: val.value})
                }
            }
            if (ob.type === 'ElementTaggedValue') {
                ob.valueIds = newvalues
                delete ob.value
            } else {
                ob.value = newvalues
            }
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
     * @name veUtils/ElementService#updateElement
     * Save element to mms and update the cache if successful, the element object
     * must have an id, and whatever property that needs to be updated.
     *
     * {@link veUtils/ElementService#getElementForEdit see also getElementForEdit}
     *
     * @param {ElementObject} elementOb An object that contains _projectId, _refId, sysmlId and any property changes to be saved.
     * @param {boolean} returnChildViews
     * @param {boolean} allowEmpty
     * @returns {VePromise<ElementObject>} The promise will be resolved with the updated cache element reference if
     *      update is successful. If a conflict occurs, the promise will be rejected with status of 409
     */
    updateElement<T extends ElementObject>(
        elementOb: T,
        returnChildViews?: boolean,
        allowEmpty?: boolean
    ): VePromise<T> {
        //elementOb should have the keys needed to make url

        const deferred = this.$q.defer<T>()
        const handleSuccess = (data: ElementsResponse<T>): void => {
            let e: T = data.elements[0]

            if (data.elements.length > 1 && elementOb.id) {
                for (let i = 0; i < data.elements.length; i++) {
                    if (data.elements[i].id === elementOb.id) {
                        e = data.elements[i]
                    }
                }
            }
            const metaOb: ElementsRequest<string> = {
                projectId: e._projectId,
                refId: e._refId,
                commitId: 'latest',
                elementId: e.id,
            }
            const resp: T = this.cacheElement(metaOb, e)
            const editCopy = _.cloneDeep(e)
            this.cacheElement(metaOb, editCopy, true)
            const history = this.cacheSvc.get<CommitObject[]>(
                this.apiSvc.makeCacheKey(metaOb, metaOb.elementId, false, 'history')
            )
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
            .post<ElementsResponse<T>>(
                this.uRLSvc.getPostViewsURL({
                    projectId: postElem._projectId,
                    refId: postElem._refId,
                    returnChildViews: returnChildViews,
                }),
                {
                    elements: [postElem],
                    source: `ve-${this.apiSvc.getVeVersion()}`,
                },
                { timeout: 60000 }
            )
            .then(
                (response) => {
                    const rejected = response.data.rejected
                    if (rejected && rejected.length > 0 && rejected[0].code === 304 && rejected[0].object) {
                        //elem will be rejected if server detects no changes
                        deferred.resolve(rejected[0].object)
                        return
                    }

                    if (!Array.isArray(response.data.elements) || response.data.elements.length === 0) {
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
                (response: angular.IHttpResponse<ElementsResponse<T>>) => {
                    if (response.status === 409) {
                        const serverOb = response.data.elements[0]
                        this.apiSvc.cleanElement(serverOb)
                        const origCommit = elementOb._commitId
                        elementOb._commitId = 'latest'
                        const origOb = this.cacheSvc.get<ElementObject>(
                            this.apiSvc.makeCacheKey(
                                {
                                    projectId: elementOb._projectId,
                                    refId: elementOb._refId,
                                    commitId: elementOb._commitId,
                                },
                                elementOb.id
                            )
                        )
                        elementOb._commitId = origCommit
                        if (!origOb) {
                            deferred.reject(this.uRLSvc.handleHttpStatus(response))
                            return
                        }
                        if (!this.apiSvc.hasConflict(postElem, origOb, serverOb)) {
                            elementOb._modified = serverOb._modified
                            this.updateElement(elementOb, returnChildViews).then(
                                (good) => {
                                    deferred.resolve(good)
                                },
                                (reason) => {
                                    deferred.reject(reason)
                                }
                            )
                        } else {
                            deferred.reject(this.uRLSvc.handleHttpStatus(response))
                        }
                    } else deferred.reject(this.uRLSvc.handleHttpStatus(response))
                }
            )
        //});
        return deferred.promise
    }

    /**
     * @name veUtils/ElementService#updateElements
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
    ): VePromise<ElementObject[], BulkResponse<ElementObject>> {
        const deferred = this.$q.defer<ElementObject[]>()
        if (this._validate(elementObs)) {
            const postElements = elementObs.map((elementOb) => {
                return this.fillInElement(elementOb)
            })

            const groupOfElements = this._groupElementsByProjectIdAndRefId(postElements)
            const promises: VePromise<ElementObject[]>[] = []

            Object.keys(groupOfElements).forEach((key) => {
                promises.push(this._bulkUpdate(groupOfElements[key], returnChildViews))
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
                        const rejectionReasons: VePromiseReason<ElementObject>[] = responses
                            .filter((response) => {
                                return response.state === 'rejected'
                            })
                            .map((response): unknown => {
                                return response.reason as VePromiseReason<ElementObject>
                            }) as VePromiseReason<ElementObject>[]

                        // since we could have multiple failed requests when having some successful requests,
                        // reject with the following format so that the client can deal with them at a granular level if
                        // desired
                        deferred.reject({
                            data: {
                                failedRequests: rejectionReasons,
                                successfulRequests: successValues,
                            },
                        })
                    }
                },
                (reason) => {
                    deferred.reject(reason)
                }
            )
        } else {
            deferred.reject({
                data: {
                    failedRequests: [
                        {
                            status: 400,
                            data: elementObs,
                            message: 'Some of the elements do not have id, _projectId, _refId',
                        },
                    ],
                    successfulRequests: [],
                },
            })
        }
        return deferred.promise
    }

    /**
     * @name veUtils/ElementService#createElement
     * Create element on veUtils/
     *
     * @param {object} reqOb see description of getElement, instead of elementId, 'element' key should be
     *                  the element object to create
     * @returns {Promise} The promise will be resolved with the created element references if
     *      create is successful.
     */
    createElement<T extends ElementObject>(reqOb: ElementCreationRequest<T>): VePromise<T> {
        this.apiSvc.normalize(reqOb)
        const deferred = this.$q.defer<T>()

        const url = this.uRLSvc.getPostElementsURL(reqOb)
        this.$http
            .post<ElementsResponse<T>>(url, {
                elements: reqOb.elements,
                source: `ve-${this.apiSvc.getVeVersion()}`,
            })
            .then(
                (response: angular.IHttpResponse<ElementsResponse<T>>) => {
                    if (!Array.isArray(response.data.elements) || response.data.elements.length === 0) {
                        deferred.reject({
                            status: 500,
                            data: '',
                            message: 'Server Error: empty response',
                        })
                        return
                    }
                    let resp: T = response.data.elements[0]
                    if (response.data.elements.length > 1 && reqOb.elements[0].id) {
                        for (let i = 0; i < response.data.elements.length; i++) {
                            if (response.data.elements[i].id === reqOb.elements[0].id) {
                                resp = response.data.elements[i]
                            }
                        }
                    }
                    deferred.resolve(this.cacheElement(reqOb, resp))
                },
                (response: angular.IHttpResponse<ElementsResponse<T>>) =>
                    this.apiSvc.handleErrorCallback(response, deferred)
            )
        return deferred.promise
    }

    /**
     * @name veUtils/ElementService#createElements
     * Create elements to alfresco and update the cache if successful.
     *
     * @param {object} reqOb see description of getElement, instead of elementId, 'elements' key should be
     *                  the array of element object to create
     * @returns {Promise} The promise will be resolved with an array of created element references if
     *      create is successful.
     */
    createElements<T extends ElementObject>(reqOb: ElementCreationRequest<T>): VePromise<T[]> {
        this.apiSvc.normalize(reqOb)
        const deferred = this.$q.defer<T[]>()
        const url = this.uRLSvc.getPostElementsURL(reqOb)
        this.$http
            .post<ElementsResponse<T>>(url, {
                elements: reqOb.elements,
                source: `ve-${this.apiSvc.getVeVersion()}`,
            })
            .then(
                (response) => {
                    if (!Array.isArray(response.data.elements) || response.data.elements.length === 0) {
                        deferred.reject({
                            status: 500,
                            data: '',
                            message: 'Server Error: empty response',
                        })
                        return
                    }
                    const results: T[] = []
                    for (let i = 0; i < response.data.elements.length; i++) {
                        results.push(this.cacheElement(reqOb, response.data.elements[i]))
                        const editCopy = _.cloneDeep(response.data.elements[i])
                        this.cacheElement(reqOb, editCopy, true)
                    }
                    deferred.resolve(results)
                },
                (response: angular.IHttpResponse<ElementsResponse<T>>) => {
                    this.apiSvc.handleErrorCallback(response, deferred)
                }
            )
        return deferred.promise
    }

    /**
     * @name veUtils/ElementService#isCacheOutdated
     * Checks if the current cached element has been updated on the server, does not update the cache.
     * If the element doesn't exist in the cache, it's considered not outdated
     *
     * @param {ElementObject} elementOb see description of getElement
     * @returns {Promise} Resolved with {status: false} if cache is up to date,
     *      Resolved with {status: true, server: server element, cache: cache element} if cache is outdated
     */
    isCacheOutdated<T extends ElementObject>(
        elementOb: T
    ): VePromise<
        {
            status?: boolean
            server?: T
            cache?: T
        },
        ElementsResponse<T>
    > {
        const reqOb: ElementsRequest<string> = {
            projectId: elementOb._projectId,
            refId: elementOb._refId,
            elementId: elementOb.id,
        }
        const deferred: angular.IDeferred<{
            status?: boolean
            server?: T
            cache?: T
        }> = this.$q.defer()
        deferred.resolve({ status: false })
        const orig = this.cacheSvc.get<T>(this.apiSvc.makeCacheKey(reqOb, elementOb.id, false))
        if (!orig) {
            deferred.resolve({ status: false })
            return deferred.promise
        }
        this.$http.get<ElementsResponse<T>>(this.uRLSvc.getElementURL(reqOb)).then(
            (response) => {
                let server = _.cloneDeep(response.data.elements[0])
                delete server._modified
                delete server._read
                delete server._creator
                server = this.apiSvc.cleanElement(server)
                let current: ElementObject = _.cloneDeep(orig)
                delete current._modified
                delete current._read
                delete current._creator
                current = this.apiSvc.cleanElement(current)
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
            (response: angular.IHttpResponse<ElementsResponse<T>>) => {
                this.apiSvc.handleErrorCallback(response, deferred)
            }
        )
        return deferred.promise
    }

    /**
     * @name veUtils/ElementService#search
     * Search for elements based on some query
     *
     * @param {RequestObject} reqOb see description of getElement
     * @param {QueryObject} query object with MMS4 query format
     * @param {QueryParams} queryParams
     * @param {integer} [weight=1] priority
     * @returns {Promise} The promise will be resolved with an array of element objects.
     *                  The element results returned will be a clone of the original server response and not cache references
     */
    search<T>(
        reqOb: RequestObject,
        query: QueryObject,
        queryParams?: QueryParams,
        weight?
    ): VePromise<SearchResponse<T>, SearchResponse<T>> {
        this.apiSvc.normalize(reqOb)
        const url = this.uRLSvc.getElementSearchURL(reqOb, queryParams)
        const deferred = this.$q.defer<SearchResponse<T>>()
        this.$http.post(url, query).then(
            (response: angular.IHttpResponse<SearchResponse<T>>) => {
                //var result = [];
                //for (let i = 0; i < data.data.elements.length; i++) {
                //    var element = data.data.elements[i];
                //    var cacheE = this.cacheElement(reqOb, element);
                //    var toAdd = _.cloneDeep(element); //make clone
                //    toAdd._relatedDocuments = cacheE._relatedDocuments;
                //    result.push(toAdd);
                //}
                //deferred.resolve(result);
                deferred.resolve(response.data)
            },
            (response: angular.IHttpResponse<SearchResponse<T>>) => this.apiSvc.handleErrorCallback(response, deferred)
        )
        return deferred.promise
    }

    /**
     * @name veUtils/ElementService#getElementVersions
     * Queries for an element's entire version history
     *
     * @param {object} reqOb see getElement
     * @param {integer} [weight=1] priority
     * @param {boolean} [update=false] update from server
     * @returns {Promise} The promise will be resolved with an array of commit objects.
     */
    getElementHistory(
        reqOb: ElementsRequest<string>,
        weight: number,
        update?: boolean
    ): VePromise<CommitObject[], CommitResponse> {
        this.apiSvc.normalize(reqOb)

        const key = this.uRLSvc.getElementHistoryURL(reqOb)
        if (this._isInProgress(key)) {
            return this._getInProgress(key) as VePromise<CommitObject[], CommitResponse>
        }
        const requestCacheKey: string[] = this.apiSvc.makeCacheKey(reqOb, reqOb.elementId, false, 'history')
        const deferred = this.$q.defer<CommitObject[]>()
        if (this.cacheSvc.exists(requestCacheKey) && !update) {
            deferred.resolve(this.cacheSvc.get(requestCacheKey))
            return deferred.promise
        }
        this._addInProgress<CommitObject[]>(key, deferred.promise)
        this.$http.get(this.uRLSvc.getElementHistoryURL(reqOb)).then(
            (response: angular.IHttpResponse<CommitResponse>) => {
                this.cacheSvc.put<CommitObject[]>(requestCacheKey, response.data.commits, true)
                deferred.resolve(this.cacheSvc.get<CommitObject[]>(requestCacheKey))
                this._removeInProgress(key)
            },
            (response: angular.IHttpResponse<CommitObject[]>) => {
                this.apiSvc.handleErrorCallback(response, deferred)
                this._removeInProgress(key)
            }
        )
        return deferred.promise
    }

    public getElementKey(reqOb: RequestObject, id: string, edit?: boolean): string[] {
        return this.apiSvc.makeCacheKey(reqOb, id, edit)
    }

    public getElementQualifiedName(reqOb: ElementsRequest<string>): VePromise<string, string> {
        const deferred = this.$q.defer<string>()
        const queryOb = {
            params: {
                id: reqOb.elementId,
            },
            recurse: {
                ownerId: 'id',
            },
        }
        this.search(reqOb, queryOb).then(
            (data: SearchResponse<ElementObject>) => {
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
                return deferred.resolve(qualifiedName)
            },
            (reason) => {
                deferred.reject(reason)
            }
        )
        return deferred.promise
    }

    public reset = (): void => {
        this.inProgressElements = {}
    }

    private _groupElementsByProjectIdAndRefId(elementObs: ElementObject[]): _.Dictionary<ElementObject[]> {
        return _.groupBy(elementObs, (element) => {
            return element._projectId + '|' + element._refId
        })
    }

    private _createMetaOb(element: ElementObject): ElementsRequest<string> {
        return {
            projectId: element._projectId,
            refId: element._refId,
            commitId: 'latest',
            elementId: element.id,
        }
    }

    private _validate(elementObs: ElementObject[]): boolean {
        return _.every(elementObs, (elementOb) => {
            return (
                elementOb.hasOwnProperty('id') &&
                elementOb.hasOwnProperty('_projectId') &&
                elementOb.hasOwnProperty('_refId')
            )
        })
    }

    private _bulkUpdate<T extends ElementObject>(elements: T[], returnChildViews?: boolean): VePromise<T[]> {
        const deferred = this.$q.defer<T[]>()
        const url = returnChildViews
            ? this.uRLSvc.getPostViewsURL({
                  projectId: elements[0]._projectId,
                  refId: elements[0]._refId,
                  returnChildViews: returnChildViews ? returnChildViews : null,
              })
            : this.uRLSvc.getPostElementsURL({
                  projectId: elements[0]._projectId,
                  refId: elements[0]._refId,
              })
        this.$http
            .post<ElementsResponse<T>>(
                url,
                {
                    elements: elements,
                    source: `ve-${this.apiSvc.getVeVersion()}`,
                },
                { timeout: 60000 }
            )
            .then(
                (response) => {
                    this._bulkUpdateSuccessHandler(response, deferred)
                },
                (response: angular.IHttpResponse<ElementsResponse<T>>) => {
                    this.apiSvc.handleErrorCallback(response, deferred)
                }
            )
        return deferred.promise
    }

    private _bulkUpdateSuccessHandler<T extends ElementObject>(
        serverResponse: angular.IHttpResponse<ElementsResponse<T>>,
        deferred: angular.IDeferred<T[]>
    ): void {
        const results: T[] = []
        const elements = serverResponse.data.elements
        if (elements && elements.length > 0) {
            elements.forEach((e) => {
                const metaOb = this._createMetaOb(e)
                const editCopy = _.cloneDeep(e)
                results.push(this.cacheElement(metaOb, e))

                this.cacheElement(metaOb, editCopy, true)

                const history = this.cacheSvc.get<CommitObject[]>(
                    this.apiSvc.makeCacheKey(metaOb, metaOb.elementId, false, 'history')
                )
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
        const rejected: RejectedObject<T>[] = serverResponse.data.rejected
        if (rejected && rejected.length > 0) {
            rejected.forEach((e) => {
                if (e.code === 304 && e.object) {
                    results.push(e.object) //add any server rejected elements because they haven't changed
                    console.log(`[BULK UPDATE ELEMENT REJECTED]: ${e.code}: ${e.message}`)
                    console.log(e.object.id)
                }
            })
        } else {
        }
        deferred.resolve(results)
    }

    private _isInProgress = (key: string): boolean => {
        return this.inProgressElements.hasOwnProperty(key)
    }

    private _getInProgress<T extends ElementObject, U = ElementsResponse<T>>(key: string): VePromise<T | T[], U> {
        if (this._isInProgress(key)) return this.inProgressElements[key] as unknown as VePromise<T | T[], U>
        else return
    }

    private _addInProgress<T extends MmsObject>(key: string, promise: VePromise<T | T[]>): void {
        this.inProgressElements[key] = promise
    }

    private _removeInProgress = (key: string): void => {
        delete this.inProgressElements[key]
    }
}

veUtils.service('ElementService', ElementService)
