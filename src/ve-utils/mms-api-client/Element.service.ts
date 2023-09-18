import _ from 'lodash';

import { CacheService, EditObject, EditService } from '@ve-utils/core';
import { ApiService, httpCallback, HttpService, URLService } from '@ve-utils/mms-api-client';
import { BaseApiService } from '@ve-utils/mms-api-client/Base.service';

import { veUtils } from '@ve-utils';

import { VePromise, VePromiseReason, VePromisesResponse, VeQService } from '@ve-types/angular';
import {
    CommitObject,
    CommitResponse,
    ElementCreationRequest,
    ElementObject,
    ElementsRequest,
    ElementsResponse,
    GenericResponse,
    QueryObject,
    QueryParams,
    RejectedObject,
    RequestObject,
    SearchResponse,
    TaggedValueObject,
} from '@ve-types/mms';

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
export class ElementService extends BaseApiService {
    static $inject = ['$q', '$http', 'CacheService', 'EditService', 'URLService', 'ApiService', 'HttpService'];

    constructor(
        private $q: VeQService,
        private $http: angular.IHttpService,
        private cacheSvc: CacheService,
        private editSvc: EditService,
        private uRLSvc: URLService,
        private apiSvc: ApiService,
        private httpSvc: HttpService
    ) {
        super();
    }

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
        this.apiSvc.normalize(reqOb);
        const requestCacheKey = this.getRequestKey(reqOb, reqOb.elementId);
        if (!reqOb.projectId) {
            console.log('foo');
        }
        const url = this.uRLSvc.getElementURL(reqOb);
        const cached: T = this.cacheSvc.get<T>(requestCacheKey);
        // if it's in the this.inProgress queue get it immediately
        if (this._isInProgress(url)) {
            //change to change priority if it's already in the queue
            this.httpSvc.ping(url, weight);
            return this._getInProgress(url) as VePromise<T>;
        }
        const deletedRequestCacheKey = this.getRequestKey(reqOb, reqOb.elementId);
        deletedRequestCacheKey.push('deleted');
        const deleted = this.cacheSvc.get<ElementObject>(deletedRequestCacheKey);
        if (deleted && !refresh) {
            return new this.$q<T>((resolve, reject) => {
                return reject({
                    status: 410,
                    recentVersionOfElement: deleted,
                    message: 'Deleted',
                });
            });
        }
        if (cached && !refresh) {
            return new this.$q<T>((resolve, reject) => {
                return resolve(cached);
            });
        }
        this._addInProgress(
            url,
            new this.$q<T>((resolve, reject) => {
                const successCallback: httpCallback<ElementsResponse<T>> = (response) => {
                    const data = response.data;
                    this._removeInProgress(url);
                    if (Array.isArray(data.elements) && data.elements.length > 0) {
                        resolve(this.cacheElement<T>(reqOb, data.elements[0]));
                    } else if (allowEmpty) {
                        resolve(null);
                    } else {
                        reject({
                            status: 500,
                            message: 'Server Error: empty response',
                        }); //TODO
                    }
                };
                const errorCallback: httpCallback<ElementsResponse<T>> = (response) => {
                    const data = response.data;
                    const reason = this.uRLSvc.handleHttpStatus(response);
                    this._removeInProgress(url);
                    if (data && data.deleted && data.deleted.length > 0 && data.deleted[0].id === reqOb.elementId) {
                        reason.recentVersionOfElement = data.deleted[0];
                        this.cacheDeletedElement(reqOb, data.deleted[0]);
                    }
                    if (allowEmpty && response.status == 404) {
                        resolve(null);
                    } else {
                        reject(reason);
                    }
                };
                this.httpSvc.get<ElementsResponse<T>>(url, successCallback, errorCallback, weight);
            })
        );
        return this._getInProgress(url) as VePromise<T>;
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
    ): VePromise<T[], ElementsResponse<T>> {
        return new this.$q<T[], ElementsResponse<T>>((resolve, reject) => {
            const request: { elements: { id: string }[] } = { elements: [] };
            const existing: T[] = [];
            this.apiSvc.normalize(reqOb);
            for (let i = 0; i < reqOb.elementId.length; i++) {
                const id = reqOb.elementId[i];
                const requestCacheKey = this.getRequestKey(reqOb, id);
                const exist = this.cacheSvc.get<T>(requestCacheKey);
                if (exist && !refresh) {
                    existing.push(exist);
                    continue;
                }
                request.elements.push({ id: id });
            }
            if (request.elements.length === 0) {
                resolve(existing);
                return;
            }
            this.$http.put<ElementsResponse<T>>(this.uRLSvc.getPutElementsURL(reqOb), request).then(
                (response) => {
                    const data = response.data.elements;
                    let i;
                    if (data && data.length > 0) {
                        for (let i = 0; i < data.length; i++) {
                            existing.push(this.cacheElement<T>(reqOb, data[i]));
                        }
                    }
                    const deleted = response.data.deleted;
                    if (deleted && deleted.length > 0) {
                        for (let i = 0; i < deleted.length; i++) {
                            this.cacheDeletedElement(reqOb, deleted[i]);
                        }
                    }
                    resolve(existing);
                },
                (response: angular.IHttpResponse<ElementsResponse<T>>) =>
                    this.apiSvc.handleErrorCallback(response, reject)
            );
        });
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
    cacheElement<T extends ElementObject>(reqOb: RequestObject, elementOb: T): T {
        let result: T = this.apiSvc.cleanElement(elementOb);
        const requestCacheKey = this.getRequestKey(reqOb, result.id);
        const origResultCommit = result._commitId;
        if (reqOb.commitId === 'latest') {
            const resultCommitCopy: T = _.cloneDeep<T>(result);
            result._commitId = 'latest'; //so realCacheKey is right later
            const commitCacheKey = this.apiSvc.makeCacheKey(this.apiSvc.makeRequestObject(resultCommitCopy), result.id); //save historic element
            this.cacheSvc.put(commitCacheKey, resultCommitCopy, true);
        }

        const realCacheKey = this.getElementKey(result);
        result._commitId = origResultCommit; //restore actual commitId
        if (!_.isEqual(realCacheKey, requestCacheKey)) {
            this.cacheSvc.link(requestCacheKey, realCacheKey);
        }
        result = this.cacheSvc.put<T>(realCacheKey, result, true);
        return result;
    }

    openEdit<T extends ElementObject>(elementOb: T, clean: boolean): EditObject<T> {
        const result: T = clean ? this.apiSvc.cleanElement(elementOb, true) : elementOb;
        result._commitId = 'latest';
        const editKey = this.getEditElementKey(elementOb);

        return this.editSvc.addOrUpdate(editKey, result) as EditObject<T>;
    }

    cacheDeletedElement = (reqOb: RequestObject, deletedOb: ElementObject): void => {
        const requestCacheKey = this.getRequestKey(reqOb, deletedOb.id);
        requestCacheKey.push('deleted');
        const deletedReqOb: RequestObject = {
            projectId: deletedOb._projectId,
            refId: deletedOb._refId,
            commitId: deletedOb._commitId,
        };
        const commitCacheKey = this.apiSvc.makeCacheKey(deletedReqOb, deletedOb.id);
        this.cacheSvc.link(requestCacheKey, commitCacheKey);
        this.cacheSvc.put(commitCacheKey, deletedOb, true);
    };

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
        overwrite?: boolean
    ): VePromise<EditObject<T>, ElementsResponse<T>> {
        this.apiSvc.normalize(reqOb);
        const requestCacheKey = this.getEditKey(reqOb);
        const url = this.uRLSvc.getElementURL(reqOb) + 'edit';
        if (!this._isInProgress(url)) {
            const openEdit = this.editSvc.get<T>(requestCacheKey);
            if (openEdit && !overwrite) {
                return new this.$q<EditObject<T>, ElementsResponse<T>>((resolve, reject) => {
                    return resolve(openEdit);
                });
            }
            this._addInProgress(
                url,
                new this.$q<EditObject<T>, ElementsResponse<T>>((resolve, reject) => {
                    this.getElement<T>(reqOb, weight)
                        .then(
                            (result) => {
                                const copy = this.apiSvc.cleanElement(_.cloneDeep(result), true);
                                resolve(this.editSvc.addOrUpdate(requestCacheKey, copy, overwrite) as EditObject<T>);
                            },
                            (reason) => {
                                reject(reason);
                            }
                        )
                        .finally(() => {
                            this._removeInProgress(url);
                        });
                })
            );
        }
        return this._getInProgress(url) as VePromise<EditObject<T>, ElementsResponse<T>>;
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
    // TODO this doesn't work, need to use search
    getOwnedElements(
        reqOb: ElementsRequest<string>,
        weight?: number,
        refresh?: boolean
    ): VePromise<ElementObject[], GenericResponse<ElementObject>> {
        this.apiSvc.normalize(reqOb);
        if (!reqOb.depth) {
            reqOb.depth = -1;
        }
        return this.getGenericElements(this.uRLSvc.getOwnedElementURL(reqOb), reqOb, 'elements', weight, refresh);
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
        this.apiSvc.normalize(reqOb);
        const requestCacheKey = this.getRequestKey(reqOb, jsonKey);
        if (this._isInProgress(url)) {
            this.httpSvc.ping(url, weight);
            return this._getInProgress(url) as VePromise<T[], GenericResponse<T>>;
        }
        const cached = this.cacheSvc.get<T[]>(requestCacheKey);
        if (cached && !refresh) {
            return new this.$q<T[], GenericResponse<T>>((resolve, reject) => {
                return resolve(cached);
            });
        }
        this._addInProgress(
            url,
            new this.$q<T[], GenericResponse<T>>((resolve, reject) => {
                this.httpSvc.get<GenericResponse<T>>(
                    url,
                    (response) => {
                        const results: T[] = [];
                        const elements: T[] = response.data[jsonKey];
                        for (let i = 0; i < elements.length; i++) {
                            const element = elements[i];
                            if (!element) {
                                //check for possible null
                                continue;
                            }
                            results.push(this.cacheElement(reqOb, element));
                        }
                        this._removeInProgress(url);
                        resolve(results);
                        return;
                    },
                    (response: angular.IHttpResponse<GenericResponse<T>>) => {
                        this._removeInProgress(url);
                        reject(this.uRLSvc.handleHttpStatus(response));
                    },
                    weight
                );
            })
        );
        return this._getInProgress<T, GenericResponse<T>>(url) as VePromise<T[], GenericResponse<T>>;
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
        const ob = _.cloneDeep(elementOb); //make a copy
        ob._commitId = 'latest';
        const editOb = this.editSvc.get(this.getEditElementKey(elementOb));
        if (editOb && editOb.element) {
            Object.keys(editOb.element).forEach((key) => {
                if (!elementOb.hasOwnProperty(key)) {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                    ob[key] = editOb.element[key];
                }
            });
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
        if (ob.type && ob.type.endsWith('TaggedValue') && ob.value && (ob as TaggedValueObject).value.length > 0) {
            // make sure value array only has the value
            const newvalues = [];
            for (const val of (ob as TaggedValueObject).value) {
                if (ob.type === 'ElementTaggedValue') {
                    newvalues.push(val.elementId);
                } else {
                    newvalues.push({ value: val.value });
                }
            }
            if (ob.type === 'ElementTaggedValue') {
                ob.valueIds = newvalues;
                delete ob.value;
            } else {
                ob.value = newvalues;
            }
        }
        delete ob._commitId;
        return ob;
        /*
            resolve(ob);
        }, () => {
            resolve(elementOb);
        });
        });
        */
    };

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
    ): VePromise<T, ElementsResponse<T>> {
        //elementOb should have the keys needed to make url

        return new this.$q<T>((resolve, reject) => {
            const handleSuccess = (data: ElementsResponse<T>): void => {
                let e: T = data.elements[0];

                if (data.elements.length > 1 && elementOb.id) {
                    for (let i = 0; i < data.elements.length; i++) {
                        if (data.elements[i].id === elementOb.id) {
                            e = data.elements[i];
                        }
                    }
                }
                const metaOb: ElementsRequest<string> = {
                    projectId: e._projectId,
                    refId: e._refId,
                    commitId: 'latest',
                    elementId: e.id,
                };
                const resp: T = this.cacheElement(metaOb, e);
                // const editCopy = _.cloneDeep(e)
                // this.cacheElement(metaOb, editCopy, true)
                const history = this.cacheSvc.get<CommitObject[]>(
                    this.apiSvc.makeCacheKey(metaOb, metaOb.elementId, false, 'history')
                );
                if (history) {
                    const id = e._commitId ? e._commitId : 'latest';
                    history.unshift({
                        _creator: e._modifier,
                        _created: e._modified,
                        id: id,
                        _refId: e._refId,
                        _projectId: e._projectId,
                    });
                }
                resolve(resp);
            };

            if (!elementOb.hasOwnProperty('id')) {
                reject({
                    status: 400,
                    message: 'Element id not found, create element first!',
                });
            }
            const postElem = this.fillInElement(elementOb);
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
                        const rejected = response.data.rejected;
                        if (rejected && rejected.length > 0 && rejected[0].code === 304 && rejected[0].object) {
                            //elem will be rejected if server detects no changes
                            resolve(rejected[0].object);
                            return;
                        }

                        if (!Array.isArray(response.data.elements) || response.data.elements.length === 0) {
                            if (allowEmpty) {
                                resolve(null);
                            } else {
                                reject({
                                    status: 500,
                                    message: 'Server Error: empty response',
                                });
                            }
                            return;
                        }
                        handleSuccess(response.data);
                    },
                    (response: angular.IHttpResponse<ElementsResponse<T>>) => {
                        if (response.status === 409) {
                            const serverOb = response.data.elements[0];
                            this.apiSvc.cleanElement(serverOb);
                            const origCommit = elementOb._commitId;
                            elementOb._commitId = 'latest';
                            const origOb = this.cacheSvc.get<ElementObject>(
                                this.apiSvc.makeCacheKey(
                                    {
                                        projectId: elementOb._projectId,
                                        refId: elementOb._refId,
                                        commitId: elementOb._commitId,
                                    },
                                    elementOb.id
                                )
                            );
                            elementOb._commitId = origCommit;
                            if (!origOb) {
                                reject(this.uRLSvc.handleHttpStatus(response));
                                return;
                            }
                            if (!this.apiSvc.hasConflict(postElem, origOb, serverOb)) {
                                elementOb._modified = serverOb._modified;
                                this.updateElement(elementOb, returnChildViews).then(
                                    (good) => {
                                        resolve(good);
                                    },
                                    (reason) => {
                                        reject(reason);
                                    }
                                );
                            } else {
                                reject(this.uRLSvc.handleHttpStatus(response));
                            }
                        } else reject(this.uRLSvc.handleHttpStatus(response));
                    }
                );
        });
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
    updateElements<T extends ElementObject>(
        elementObs: T[],
        returnChildViews?: boolean
    ): VePromise<T[], VePromisesResponse<T>> {
        return new this.$q<T[], VePromisesResponse<T>>((resolve, reject) => {
            if (this._validate(elementObs)) {
                const postElements = elementObs.map((elementOb) => {
                    return this.fillInElement(elementOb) as T;
                });

                const groupOfElements = this._groupElementsByProjectIdAndRefId(postElements);
                const promises: VePromise<T[], ElementsResponse<T>>[] = [];

                Object.keys(groupOfElements).forEach((key) => {
                    promises.push(this._bulkUpdate<T>(groupOfElements[key], returnChildViews));
                });

                // responses is an array of response corresponding to both successful and failed requests with the following format
                // [ { state: 'fulfilled', value: the value returned by the server },
                //   { state: 'rejected', reason: {status, data, message} -- Specified by handleHttpStatus method }
                // ]
                this.$q.allSettled(promises).then((responses) => {
                    // get all the successful requests
                    const successfulRequests = responses.filter((response) => {
                        return response.state === 'fulfilled';
                    });

                    const successValues = _.flatten(
                        successfulRequests.map((response) => {
                            return response.value;
                        })
                    );

                    if (successfulRequests.length === promises.length) {
                        // All requests succeeded
                        resolve(successValues);
                    } else {
                        // some requests failed
                        const rejectionReasons: VePromiseReason<ElementsResponse<T>>[] = responses
                            .filter((response) => {
                                return response.state === 'rejected';
                            })
                            .map((response): unknown => {
                                return response.reason as VePromiseReason<ElementsResponse<T>>;
                            }) as VePromiseReason<ElementsResponse<T>>[];

                        // since we could have multiple failed requests when having some successful requests,
                        // reject with the following format so that the client can deal with them at a granular level if
                        // desired
                        reject({
                            status: 400,
                            message: 'Some elements failed',
                            data: {
                                failedRequests: rejectionReasons,
                                successfulRequests: successValues,
                            },
                        });
                    }
                }, reject);
            } else {
                const response: VePromiseReason<VePromisesResponse<T>> = {
                    status: 400,
                    message: 'Some of the elements do not have id, _projectId, _refId',
                    data: {},
                };
                reject(response);
            }
        });
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
        this.apiSvc.normalize(reqOb);
        return new this.$q<T>((resolve, reject) => {
            const url = this.uRLSvc.getPostElementsURL(reqOb);
            this.$http
                .post<ElementsResponse<T>>(url, {
                    elements: reqOb.elements,
                    source: `ve-${this.apiSvc.getVeVersion()}`,
                })
                .then(
                    (response: angular.IHttpResponse<ElementsResponse<T>>) => {
                        if (!Array.isArray(response.data.elements) || response.data.elements.length === 0) {
                            reject({
                                status: 500,

                                message: 'Server Error: empty response',
                            });
                            return;
                        }
                        let resp: T = response.data.elements[0];
                        if (response.data.elements.length > 1 && reqOb.elements[0].id) {
                            for (let i = 0; i < response.data.elements.length; i++) {
                                if (response.data.elements[i].id === reqOb.elements[0].id) {
                                    resp = response.data.elements[i];
                                }
                            }
                        }
                        resolve(this.cacheElement(reqOb, resp));
                    },
                    (response: angular.IHttpResponse<ElementsResponse<T>>) =>
                        this.apiSvc.handleErrorCallback(response, reject)
                );
        });
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
    createElements<T extends ElementObject>(reqOb: ElementCreationRequest<T>): VePromise<T[], ElementsResponse<T>> {
        this.apiSvc.normalize(reqOb);
        return new this.$q<T[], ElementsResponse<T>>((resolve, reject) => {
            const url = this.uRLSvc.getPostElementsURL(reqOb);
            this.$http
                .post<ElementsResponse<T>>(url, {
                    elements: reqOb.elements,
                    source: `ve-${this.apiSvc.getVeVersion()}`,
                })
                .then(
                    (response) => {
                        if (!Array.isArray(response.data.elements) || response.data.elements.length === 0) {
                            reject({
                                status: 500,

                                message: 'Server Error: empty response',
                            });
                            return;
                        }
                        const results: T[] = [];
                        for (let i = 0; i < response.data.elements.length; i++) {
                            results.push(this.cacheElement(reqOb, response.data.elements[i]));
                            // const editCopy = _.cloneDeep(response.data.elements[i])
                            // this.cacheElement(reqOb, editCopy, true)
                        }
                        resolve(results);
                    },
                    (response: angular.IHttpResponse<ElementsResponse<T>>) => {
                        this.apiSvc.handleErrorCallback(response, reject);
                    }
                );
        });
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
            status?: boolean;
            server?: T;
            cache?: T;
        },
        ElementsResponse<T>
    > {
        const reqOb: ElementsRequest<string> = {
            projectId: elementOb._projectId,
            refId: elementOb._refId,
            elementId: elementOb.id,
        };
        return new this.$q<
            {
                status?: boolean;
                server?: T;
                cache?: T;
            },
            ElementsResponse<T>
        >((resolve, reject) => {
            const orig = this.cacheSvc.get<T>(this.apiSvc.makeCacheKey(reqOb, elementOb.id, false));
            if (!orig) {
                return resolve({ status: false });
            }
            this.$http.get<ElementsResponse<T>>(this.uRLSvc.getElementURL(reqOb)).then(
                (response) => {
                    let server = _.cloneDeep(response.data.elements[0]);
                    delete server._modified;
                    delete server._read;
                    delete server._creator;
                    server = this.apiSvc.cleanElement(server);
                    let current: ElementObject = _.cloneDeep(orig);
                    delete current._modified;
                    delete current._read;
                    delete current._creator;
                    current = this.apiSvc.cleanElement(current);
                    if (_.isEqual(server, current)) {
                        resolve({ status: false });
                    } else {
                        resolve({
                            status: true,
                            server: response.data.elements[0],
                            cache: orig,
                        });
                    }
                },
                (response: angular.IHttpResponse<ElementsResponse<T>>) => {
                    this.apiSvc.handleErrorCallback(response, reject);
                }
            );
        });
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
        this.apiSvc.normalize(reqOb);
        const url = this.uRLSvc.getElementSearchURL(reqOb, queryParams);
        return new this.$q<SearchResponse<T>, SearchResponse<T>>((resolve, reject) => {
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
                    //resolve(result);
                    resolve(response.data);
                },
                (response: angular.IHttpResponse<SearchResponse<T>>) =>
                    this.apiSvc.handleErrorCallback(response, reject)
            );
        });
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
        this.apiSvc.normalize(reqOb);
        const url = this.uRLSvc.getElementHistoryURL(reqOb);
        if (this._isInProgress(url)) {
            return this._getInProgress(url) as VePromise<CommitObject[], CommitResponse>;
        }
        const requestCacheKey: string[] = this.apiSvc.makeCacheKey(reqOb, reqOb.elementId, false, 'history');
        if (this.cacheSvc.exists(requestCacheKey) && !update) {
            return new this.$q<CommitObject[], CommitResponse>((resolve, reject) => {
                return resolve(this.cacheSvc.get(requestCacheKey));
            });
        }
        this._addInProgress<CommitObject[], CommitResponse>(
            url,
            new this.$q<CommitObject[], CommitResponse>((resolve, reject) => {
                this.$http.get(this.uRLSvc.getElementHistoryURL(reqOb)).then(
                    (response: angular.IHttpResponse<CommitResponse>) => {
                        this.cacheSvc.put<CommitObject[]>(requestCacheKey, response.data.commits, true);
                        this._removeInProgress(url);
                        resolve(this.cacheSvc.get<CommitObject[]>(requestCacheKey));
                    },
                    (response: angular.IHttpResponse<CommitResponse>) => {
                        this._removeInProgress(url);
                        this.apiSvc.handleErrorCallback(response, reject);
                    }
                );
            })
        );
        return this._getInProgress(url) as VePromise<CommitObject[], CommitResponse>;
    }

    public getRequestKey(reqOb: RequestObject, id: string, edit?: boolean): string[] {
        return this.apiSvc.makeCacheKey(reqOb, id, edit);
    }

    public getElementRequest(elementOb: ElementObject): ElementsRequest<string> {
        const req = this.apiSvc.makeRequestObject(elementOb);
        (req as ElementsRequest<string>).elementId = elementOb.id;
        return req as ElementsRequest<string>;
    }

    public getElementKey(elementOb: ElementObject, edit?: boolean): string[] {
        return this.getRequestKey(this.getElementRequest(elementOb), elementOb.id, edit);
    }

    public getEditKey(reqOb: ElementsRequest<string>): string[] {
        const key: string[] = [];
        if (reqOb !== null) {
            if (reqOb.projectId) key.push(reqOb.projectId);
            if (reqOb.refId !== null) key.push(!reqOb.refId ? 'master' : reqOb.refId);
        }
        key.push(reqOb.elementId);
        return key;
    }

    public getEditElementKey(e: ElementObject): string[] {
        return [e._projectId, e._refId, e.id];
    }

    public getElementQualifiedName(reqOb: ElementsRequest<string>): VePromise<string, SearchResponse<ElementObject>> {
        // TODO this only gets the latest version - would need to walk the element owner gets manually for a commit
        return new this.$q<string, SearchResponse<ElementObject>>((resolve, reject) => {
            const queryOb = {
                params: {
                    id: reqOb.elementId,
                },
                recurse: {
                    ownerId: 'id',
                },
            };
            this.search<ElementObject>(reqOb, queryOb).then(
                (data) => {
                    let qualifiedName = '';
                    const elements = data.elements.reverse();
                    const entries = elements.entries();
                    for (const [i, element] of entries) {
                        if (element.hasOwnProperty('name')) {
                            qualifiedName += element.name;
                        }
                        if (i != elements.length - 1) {
                            qualifiedName += '/';
                        }
                    }
                    return resolve(qualifiedName);
                },
                (reason) => {
                    reject(reason);
                }
            );
        });
    }

    private _groupElementsByProjectIdAndRefId<T extends ElementObject>(elementObs: T[]): _.Dictionary<T[]> {
        return _.groupBy(elementObs, (element) => {
            return element._projectId + '|' + element._refId;
        });
    }

    private _createMetaOb(element: ElementObject): ElementsRequest<string> {
        return {
            projectId: element._projectId,
            refId: element._refId,
            commitId: 'latest',
            elementId: element.id,
        };
    }

    private _validate(elementObs: ElementObject[]): boolean {
        return _.every(elementObs, (elementOb) => {
            return (
                elementOb.hasOwnProperty('id') &&
                elementOb.hasOwnProperty('_projectId') &&
                elementOb.hasOwnProperty('_refId')
            );
        });
    }

    private _bulkUpdate<T extends ElementObject, U = ElementsResponse<T>>(
        elements: T[],
        returnChildViews?: boolean
    ): VePromise<T[], U> {
        return new this.$q<T[], U>((resolve, reject) => {
            const url = returnChildViews
                ? this.uRLSvc.getPostViewsURL({
                      projectId: elements[0]._projectId,
                      refId: elements[0]._refId,
                      returnChildViews: returnChildViews ? returnChildViews : null,
                  })
                : this.uRLSvc.getPostElementsURL({
                      projectId: elements[0]._projectId,
                      refId: elements[0]._refId,
                  });
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
                        this._bulkUpdateSuccessHandler(response, resolve);
                    },
                    (response: angular.IHttpResponse<U>) => {
                        this.apiSvc.handleErrorCallback(response, reject);
                    }
                );
        });
    }

    private _bulkUpdateSuccessHandler<T extends ElementObject>(
        serverResponse: angular.IHttpResponse<ElementsResponse<T>>,
        resolve: angular.IQResolveReject<T[]>
    ): void {
        const results: T[] = [];
        const elements = serverResponse.data.elements;
        if (elements && elements.length > 0) {
            elements.forEach((e) => {
                const metaOb = this._createMetaOb(e);
                //const editCopy = _.cloneDeep(e)
                results.push(this.cacheElement(metaOb, e));

                //this.cacheElement(metaOb, editCopy, true)

                const history = this.cacheSvc.get<CommitObject[]>(
                    this.apiSvc.makeCacheKey(metaOb, metaOb.elementId, false, 'history')
                );
                if (history) {
                    history.unshift({
                        _creator: e._modifier,
                        _created: e._modified,
                        id: e._commitId,
                        _refId: e._refId,
                        _projectId: e._projectId,
                    });
                }
            });
        }
        const rejected: RejectedObject<T>[] = serverResponse.data.rejected;
        if (rejected && rejected.length > 0) {
            rejected.forEach((e) => {
                if (e.code === 304 && e.object) {
                    results.push(e.object); //add any server rejected elements because they haven't changed
                    console.log(`[BULK UPDATE ELEMENT REJECTED]: ${e.code}: ${e.message}`);
                    console.log(e.object.id);
                }
            });
        }
        resolve(results);
    }
}

veUtils.service('ElementService', ElementService);
