import { IQResolveReject } from 'angular';
import _ from 'lodash';

import { CacheService } from '@ve-utils/core';
import { ElementService, URLService, ApiService } from '@ve-utils/mms-api-client';
import { BaseApiService } from '@ve-utils/mms-api-client/Base.service';
import { SchemaService } from '@ve-utils/model-schema';
import { Class, Expression, InstanceSpec, Package, ValueSpec } from '@ve-utils/utils';

import { veUtils } from '@ve-utils';

import { VePromise, VePromiseReason, VePromisesResponse, VeQService } from '@ve-types/angular';
import {
    DocumentObject,
    ElementObject,
    ElementsRequest,
    ExpressionObject,
    GroupObject,
    InstanceSpecObject,
    InstanceValueObject,
    LiteralObject,
    PackageObject,
    PresentationInstanceObject,
    RequestObject,
    SearchResponse,
    SlotObject,
    PresentTableObject,
    ValueObject,
    ViewCreationRequest,
    ViewInstanceSpec,
    ViewObject,
    ViewsRequest,
    PresentTextObject,
    PresentationReference,
    ElementsResponse,
    GenericResponse,
    BasicResponse,
} from '@ve-types/mms';
import { TreeBranch, View2NodeMap } from '@ve-types/tree';

export interface ViewData {
    id: string;
    api: ViewApi;
    number?: string;
    topLevel?: boolean;
    first?: boolean;
    data?: ViewObject;
}

export interface ViewApi {
    elementClicked(elementOb: ElementObject): void;
    elementTranscluded(elementOb: ElementObject, type: string): void;
}

export interface DocumentMetadata {
    numberingDepth: number;
    numberingSeparator: string;
    'top-left'?: string;
    top?: string;
    'top-right'?: string;
    'bottom-left'?: string;
    bottom?: string;
    'bottom-right'?: string;
}

/**
 * @ngdoc service
 * @name veUtils/ViewService
 * @requires $q
 * @requires $http
 * @requires URLService
 * @requires ElementService
 * @requires UtilsService
 * @requires CacheService
 * @requires _
 * * Similar to the ElementService and proxies a lot of functions to it, this provides
 * CRUD for views and products/documents/group
 *
 */
export class ViewService extends BaseApiService {
    private schema: string = 'cameo';

    static $inject = ['$q', '$http', 'URLService', 'ElementService', 'ApiService', 'CacheService', 'SchemaService'];
    constructor(
        private $q: VeQService,
        private $http: angular.IHttpService,
        private uRLSvc: URLService,
        private elementSvc: ElementService,
        private apiSvc: ApiService,
        private cacheSvc: CacheService,
        private schemaSvc: SchemaService
    ) {
        super();
    }

    /**
     * @name ViewService#downgradeDocument
     * Demote document to a view and update the applied stereotype instance
     *
     * @param {Object} elementOb A document object
     * @returns {Promise} The promise will be resolved with the downgraded view
     */
    public downgradeDocument(elementOb: ViewObject): VePromise<ViewObject, VePromisesResponse<ViewObject>> {
        return new this.$q<ViewObject, VePromisesResponse<ViewObject>>((resolve, reject) => {
            const clone = _.cloneDeep(elementOb);
            clone.appliedStereotypeIds = [this.schemaSvc.getSchema('VIEW_SID', this.schema)];
            this.elementSvc.updateElements([clone], false).then(
                (data) => {
                    const cacheKey = ['documents', elementOb._projectId, elementOb._refId];
                    let index = -1;
                    const projectDocs: ViewObject[] = this.cacheSvc.get<ViewObject[]>(cacheKey);
                    if (projectDocs) {
                        for (let i = 0; i < projectDocs.length; i++) {
                            if (projectDocs[i].id === elementOb.id) {
                                index = i;
                                break;
                            }
                        }
                        if (index >= 0) {
                            projectDocs.splice(index, 1);
                        }
                    }
                    return resolve(
                        data.filter((returnOb) => {
                            return returnOb.id === elementOb.id;
                        })[0]
                    );
                },
                (reason) => {
                    return reject(reason);
                }
            );
        });
    }

    public getAllViews(reqOb: RequestObject, update?: boolean): VePromise<ViewObject[]> {
        const key = this.apiSvc.makeCacheKey(reqOb, '', false, 'views');
        const inProgKey = key.join('-');
        if (!this._isInProgress(inProgKey)) {
            this._addInProgress<ViewObject>(
                inProgKey,
                new this.$q((resolve, reject) => {
                    const cached = this.cacheSvc.get<ViewObject[]>(key);
                    if (cached && !update) {
                        resolve(cached);
                        this._removeInProgress(inProgKey);
                    } else {
                        const searchTerms: VePromise<SearchResponse<ViewObject>, SearchResponse<ViewObject>>[] = [];
                        const stereoIds = [
                            this.schemaSvc.getSchema<string>('VIEW_SID', this.schema),
                            this.schemaSvc.getSchema<string>('DOCUMENT_SID', this.schema),
                            ...this.schemaSvc.getSchema<string[]>('OTHER_VIEW_SID', this.schema),
                        ];
                        stereoIds.forEach((stId) => {
                            searchTerms.push(
                                this.elementSvc.search<ViewObject>(reqOb, {
                                    params: { appliedStereotypeIds: stId },
                                })
                            );
                        });
                        this.$q
                            .all(searchTerms)
                            .then(
                                (results) => {
                                    let viewKeys = {};

                                    results.forEach((result) => {
                                        viewKeys = _(viewKeys).merge(_.keyBy(result.elements, 'id'));
                                    });
                                    const views = _(viewKeys).values().value() as ViewObject[];
                                    resolve(this.cacheSvc.put(key, views));
                                },
                                (reason: VePromiseReason<ElementsResponse<ViewObject>>) => {
                                    reject(reason);
                                }
                            )
                            .finally(() => {
                                this._removeInProgress(inProgKey);
                            });
                    }
                })
            );
        }
        return this._getInProgress(inProgKey) as VePromise<ViewObject[]>;
    }

    /**
     * @name ViewService#getViewElements
     * Gets the element objects for elements allowed in this view. The references are
     * the same as ones gotten from this.elementSvc.
     *
     * @param {object} reqOb see description at this.elementSvc.getElement, where elementId is id of the view
     * @param {integer} weight the priority of the request
     * @param {boolean} [update=false] (optional) whether to always get the latest
     *      from server, even if it's already in cache (this will update everywhere
     *      it's displayed, except for the editables)
     * @returns {Promise} The promise will be resolved with array of element objects.
     */
    public getViewElements(
        reqOb: ElementsRequest<string>,
        weight: number,
        update?: boolean
    ): VePromise<ElementObject[]> {
        this.apiSvc.normalize(reqOb);
        const key = this.apiSvc.makeCacheKey(reqOb, reqOb.elementId, false, 'viewElements').join('-');
        if (this._isInProgress(key)) {
            return this._getInProgress(key) as VePromise<ElementObject[]>;
        }
        const cached = this.cacheSvc.get<ElementObject[]>(key);
        if (cached && !update) {
            return this.$q.resolve(cached);
        }
        this._addInProgress<ElementObject>(
            key,
            new this.$q((resolve, reject) => {
                this.elementSvc.getElement(reqOb, weight, update).then(
                    (viewOrInstance: ViewObject | ViewInstanceSpec) => {
                        const toGet: string[] = [];
                        let results: ElementObject[] = [];
                        if (viewOrInstance.type === 'Class') {
                            const view: ViewObject = viewOrInstance as ViewObject;
                            if (view._displayedElementIds) {
                                const displayed: string[] = view._displayedElementIds;
                                if (Array.isArray(displayed) && displayed.length > 0) {
                                    toGet.push(...displayed);
                                }
                            }
                            if (view._contents && view._contents.operand) {
                                const contents = view._contents.operand;
                                for (let i = 0; i < contents.length; i++) {
                                    if (contents[i] && contents[i].instanceId) {
                                        toGet.push(contents[i].instanceId);
                                    }
                                }
                            }
                        } else if (viewOrInstance.type === 'InstanceSpecification') {
                            const view = viewOrInstance as ViewInstanceSpec;
                            if (view.specification) {
                                if (view.specification.operand) {
                                    const specContents = view.specification.operand as InstanceValueObject[];
                                    for (let j = 0; j < specContents.length; j++) {
                                        if (specContents[j] && specContents[j].instanceId) {
                                            toGet.push(specContents[j].instanceId);
                                        }
                                    }
                                }
                                if (
                                    this.isTable(view) &&
                                    view.specification &&
                                    view.specification.value &&
                                    typeof view.specification.value === 'string'
                                ) {
                                    const tableJson: PresentTableObject = JSON.parse(
                                        view.specification.value
                                    ) as PresentTableObject;
                                    if (tableJson.body) {
                                        toGet.push(...this.collectTableSources(tableJson));
                                    }
                                }
                            }
                        }

                        const toGetReqOb: ElementsRequest<string[]> = Object.assign(reqOb, { elementId: toGet });
                        this.elementSvc
                            .getElements(toGetReqOb, weight, update)
                            .then((data) => {
                                results = data;
                            })
                            .finally(() => {
                                this.cacheSvc.put(key, results);
                                this._removeInProgress(key);
                                resolve(results);
                            });
                    },
                    (reason) => {
                        this._removeInProgress(key);
                        reject(reason);
                    }
                );
            })
        );
        return this._getInProgress(key) as VePromise<ElementObject[]>;
    }

    public collectTableSources(table: PresentTableObject): string[] {
        const sources: string[] = [];
        const body = table.body;
        body.forEach((row) => {
            row.forEach((cell) => {
                cell.content.forEach((thing) => {
                    if (thing.type === 'Table' && thing.body) {
                        sources.push(...this.collectTableSources(thing as PresentTableObject));
                    } else if (thing.type === 'Paragraph' && thing.source) {
                        sources.push((thing as PresentTextObject).source);
                    }
                });
            });
        });
        return sources;
    }

    /**
     * @name veUtils/ViewService#handleChildViews
     * process the various views in the tree to produce a map of child views in order to populate the data for the
     * view tree
     *
     * @returns {Promise} The promise will be resolved with the new group object.
     * @param v
     * @param aggr
     * @param propId
     * @param projectId
     * @param refId
     * @param viewIdMap
     * @param curItemFunc
     * @param childrenFunc
     * @param seen
     */
    public handleChildViews(
        v: ViewObject,
        aggr: string,
        propId: string | undefined,
        projectId: string,
        refId: string,
        viewIdMap: View2NodeMap,
        curItemFunc: (v: ViewObject, aggr: string, propId?: string) => TreeBranch | string[],
        childrenFunc?: (
            currItem: TreeBranch | string[],
            childNodes: (string[] | TreeBranch)[],
            reject: IQResolveReject<VePromiseReason<unknown>>
        ) => void,
        seen?: { [key: string]: ViewObject }
    ): VePromise<TreeBranch | string[], unknown> {
        let seenViews = seen;
        if (!seenViews) seenViews = {};
        return new this.$q<TreeBranch | string[]>((resolve, reject) => {
            const curItem: TreeBranch | string[] = curItemFunc(v, aggr, propId);
            seenViews[v.id] = v;
            const childIds: string[] = [];
            const childAggrs: string[] = [];
            const childPropIds: string[] = [];
            if (!v._childViews || v._childViews.length === 0 || aggr === 'none') {
                if (!Array.isArray(curItem) && curItem.loading) {
                    curItem.loading = false;
                }
                resolve(curItem);
                return;
            }
            for (let i = 0; i < v._childViews.length; i++) {
                if (seenViews[v._childViews[i].id]) continue;
                childIds.push(v._childViews[i].id);
                childAggrs.push(v._childViews[i].aggregation);
                childPropIds.push(v._childViews[i].propertyId);
            }
            this.elementSvc
                .getElements(
                    {
                        elementId: childIds,
                        projectId: projectId,
                        refId: refId,
                    },
                    2
                )
                .then((childViews: ViewObject[]) => {
                    const mapping: { [id: string]: ViewObject } = {};
                    for (let i = 0; i < childViews.length; i++) {
                        mapping[childViews[i].id] = childViews[i];
                    }
                    const childPromises: VePromise<string[] | TreeBranch, unknown>[] = [];
                    const childNodes: (string[] | TreeBranch)[] = [];
                    const processedChildViews: ViewObject[] = [];
                    for (let i = 0; i < childIds.length; i++) {
                        const child = mapping[childIds[i]];
                        if (child && this.apiSvc.isView(child)) {
                            //what if not found??
                            childPromises.push(
                                this.handleChildViews(
                                    child,
                                    childAggrs[i],
                                    childPropIds[i],
                                    projectId,
                                    refId,
                                    viewIdMap,
                                    curItemFunc,
                                    childrenFunc,
                                    seenViews
                                )
                            );
                            childNodes.push(curItemFunc(child, childAggrs[i], childPropIds[i]));
                            processedChildViews.push({
                                id: child.id,
                                _projectId: child._projectId,
                                _refId: child._refId,
                                aggregation: childAggrs[i],
                                propertyId: childPropIds[i],
                            });
                        }
                    }
                    v._childViews = processedChildViews;
                    if (childrenFunc) {
                        childrenFunc(curItem, childNodes, reject);
                    }
                    this.$q.all(childPromises).then(() => {
                        resolve(curItem);
                    }, reject);
                }, reject);
        });
    }

    /**
     * @name ViewService#addViewToParentView
     * This updates a document to include a new view, the new view must be a child
     * of an existing view in the document
     *
     * @param {object} reqOb see Element.getElement for description, use parentViewId
     *                  and viewId instead of elementId, add 'aggr' key
     * @returns {Promise} The promise would be resolved with updated parent view object
     */
    public addViewToParentView(reqOb: ViewCreationRequest): VePromise<ViewObject> {
        this.apiSvc.normalize(reqOb);
        return new this.$q<ViewObject>((resolve, reject) => {
            this.elementSvc
                .getElement(
                    {
                        projectId: reqOb.projectId,
                        refId: reqOb.refId,
                        elementId: reqOb.parentViewId,
                    },
                    2
                )
                .then(
                    (data: ViewObject) => {
                        const clone: ViewObject = {
                            _projectId: data._projectId,
                            _refId: data._refId,
                            //_modified: data._modified,
                            id: data.id,
                            _childViews: [],
                            type: data.type,
                        };
                        clone._childViews = [];
                        if (data._childViews) {
                            clone._childViews.push(..._.cloneDeep(data._childViews));
                        }
                        clone._childViews.push({
                            id: reqOb.viewId,
                            aggregation: reqOb.aggr,
                            _projectId: data._projectId,
                            _refId: data._refId,
                            type: data.type,
                        });
                        this.elementSvc.updateElement(clone, true).then(
                            (data2) => {
                                resolve(data2);
                            },
                            (reason) => {
                                reject(reason);
                            }
                        );
                    },
                    (reason) => {
                        reject(reason);
                    }
                );
        });
    }

    /**
     * @name ViewService#removeViewFromParentView
     * This removes the specified view from the parent view
     *
     * @param {ViewsRequest} reqOb see this.elementSvc.getElement, use viewId and parentViewId
     * @returns {IPromise<ViewObject>} The promise would be resolved with updated parent View object
     */
    public removeViewFromParentView(reqOb: ViewsRequest): VePromise<ViewObject> {
        this.apiSvc.normalize(reqOb);
        return new this.$q<ViewObject>((resolve, reject) => {
            this.elementSvc
                .getElement(
                    {
                        projectId: reqOb.projectId,
                        refId: reqOb.refId,
                        elementId: reqOb.parentViewId,
                    },
                    2
                )
                .then(
                    (data: ViewObject) => {
                        if (data._childViews) {
                            const clone = {
                                _projectId: data._projectId,
                                _refId: data._refId,
                                //_modified: data._modified,
                                //_read: data._read,
                                id: data.id,
                                type: data.type,
                                _childViews: _.cloneDeep(data._childViews),
                            };
                            for (let i = 0; i < clone._childViews.length; i++) {
                                if (clone._childViews[i].id === reqOb.viewId) {
                                    clone._childViews.splice(i, 1);
                                    break;
                                }
                            }
                            this.elementSvc.updateElement(clone, true).then(
                                (data2) => {
                                    resolve(data2);
                                },
                                (reason) => {
                                    reject(reason);
                                }
                            );
                        } else {
                            resolve(data);
                        }
                    },
                    (reason) => {
                        reject(reason);
                    }
                );
        });
    }

    /**
     * @name ViewService#insertToViewOrSection
     * This updates a view or section to include a new element, the new element must be a child
     * of an existing element in the view
     *
     * @param {ViewsRequest} reqOb see this.elementSvc.getElement for description, elementId is the view
     *                          or section instance element id
     * @param {InstanceValueObject} instanceValOb the instanceValue object to add
     * @param {number} addPeIndex the index of where to add view or section (instance spec) object
     * @returns {IPromise<ViewObject>} The promise would be resolved with updated view or section object
     */

    public insertToViewOrSection(
        reqOb: ViewCreationRequest,
        instanceValOb: InstanceValueObject,
        addPeIndex: number
    ): VePromise<ViewObject> {
        this.apiSvc.normalize(reqOb);
        return new this.$q<ViewObject>((resolve, reject) => {
            this.elementSvc
                .getElement(
                    {
                        projectId: reqOb.projectId,
                        refId: reqOb.refId,
                        elementId: reqOb.viewId,
                    },
                    2
                )
                .then(
                    (data) => {
                        const clone: ElementObject = {
                            _projectId: data._projectId,
                            _refId: data._refId,
                            type: data.type,
                            id: data.id,
                        };
                        let key = '_contents';
                        if (this.isSection(data)) {
                            key = 'specification';
                        }
                        const keyValue: ValueObject = data[key] as ValueObject;
                        let cloneValue: ValueObject;
                        if (keyValue) {
                            cloneValue = _.cloneDeep(keyValue);
                            if (!cloneValue.id || !cloneValue.ownerId) {
                                cloneValue.id = this.isSection(data)
                                    ? this.apiSvc.createUniqueId()
                                    : data.id + '_vc_expression';
                                cloneValue.ownerId = this.isSection(data) ? data.id : data.id + '_vc';
                            }
                        } else {
                            cloneValue = new Expression({
                                operand: [],
                                type: 'Expression',
                                id: this.isSection(data) ? this.apiSvc.createUniqueId() : data.id + '_vc_expression',
                                _projectId: data._projectId,
                                _refId: data._refId,
                                ownerId: this.isSection(data) ? data.id : data.id + '_vc',
                            });
                        }
                        instanceValOb.ownerId = cloneValue.id;
                        if (!instanceValOb.id) {
                            instanceValOb.id = this.apiSvc.createUniqueId();
                        }
                        if (addPeIndex >= -1)
                            (cloneValue as ExpressionObject<InstanceValueObject>).operand.splice(
                                addPeIndex + 1,
                                0,
                                new ValueSpec(instanceValOb)
                            );
                        else {
                            (cloneValue as ExpressionObject<InstanceValueObject>).operand.push(
                                new ValueSpec(instanceValOb)
                            );
                        }

                        clone[key] = cloneValue;
                        this.elementSvc.updateElement(clone, false).then(
                            (data2) => {
                                resolve(data2);
                            },
                            (reason) => {
                                reject(reason);
                            }
                        );
                    },
                    (reason) => {
                        reject(reason);
                    }
                );
        });
    }

    /**
     * @name ViewService#removeElementFromViewOrSection
     * This removes the specified instanceVal from the contents of the View or Section
     *
     * @param {object} reqOb see this.elementSvc.getElement for description
     * @param {object} instanceVal to remove from the View or Section
     * @returns {Promise} The promise would be resolved with updated View or Section object
     */
    public removeElementFromViewOrSection(
        reqOb: ElementsRequest<string>,
        instanceVal?: InstanceValueObject
    ): VePromise<ViewObject> {
        this.apiSvc.normalize(reqOb);
        return new this.$q<ViewObject>((resolve, reject) => {
            if (instanceVal) {
                this.elementSvc.getElement(reqOb, 2).then(
                    (data) => {
                        const clone = {
                            _projectId: data._projectId,
                            _refId: data._refId,
                            type: data.type,
                            //_modified: data._modified,
                            id: data.id,
                        };
                        let key = '_contents';
                        if (this.isSection(data)) {
                            key = 'specification';
                        }
                        const keyValue = data[key] as ValueObject;
                        let cloneValue: ValueObject;
                        if (keyValue) {
                            cloneValue = _.cloneDeep(keyValue);
                            if (!cloneValue.id || !cloneValue.ownerId) {
                                cloneValue.id = this.isSection(data)
                                    ? this.apiSvc.createUniqueId()
                                    : data.id + '_vc_expression';
                                cloneValue.ownerId = this.isSection(data) ? data.id : data.id + '_vc';
                            }
                        } else {
                            cloneValue = new Expression({
                                operand: [],
                                type: 'Expression',
                                id: this.isSection(data) ? this.apiSvc.createUniqueId() : data.id + '_vc_expression',
                                _projectId: data._projectId,
                                _refId: data._refId,
                                ownerId: this.isSection(data) ? data.id : data.id + '_vc',
                            });
                        }
                        if (cloneValue && cloneValue.operand) {
                            const operands: InstanceValueObject[] = (keyValue as ExpressionObject<InstanceValueObject>)
                                .operand;
                            for (let i = 0; i < operands.length; i++) {
                                if (instanceVal.instanceId === operands[i].instanceId) {
                                    (cloneValue as ExpressionObject<InstanceValueObject>).operand.splice(i, 1);
                                    break;
                                }
                            }
                        }
                        clone[key] = cloneValue;
                        this.elementSvc.updateElement(clone, false).then(
                            (data2) => {
                                resolve(data2);
                            },
                            (reason) => {
                                reject(reason);
                            }
                        );
                    },
                    (reason) => {
                        reject(reason);
                    }
                );
            }
        });
    }

    /**
     * Adds a InstanceVal/InstanceSpecification to the contents of the View
     *
     * @param viewOrSectionOb
     * @param {string} type The type of element that is to be created, ie 'Paragraph'
     * @param {string} [name=Untitled <elementType>] (optional) InstanceSpecification name to use
     * @param {number} addPeIndex the index of where to add view or section (instance spec) object
     * @returns {Promise} The promise would be resolved with updated View object if addToView is true
     *                    otherwise the created InstanceSpecification
     */
    public createInstanceSpecification(
        viewOrSectionOb: ViewObject,
        type: string,
        name: string,
        addPeIndex: number
    ): VePromise<ValueObject> {
        let newInstanceId = this.apiSvc.createUniqueId();
        newInstanceId = '_hidden_' + newInstanceId + '_pei';
        return new this.$q<ViewObject>((resolve, reject) => {
            const realType: string = this.schemaSvc.getValue(
                'TYPE_TO_CLASSIFIER_TYPE',
                type,
                this.schema,
                viewOrSectionOb.id
            );
            let jsonType = realType;
            if (type === 'Comment' || type === 'Paragraph') jsonType = type;
            const instanceSpecSpec = {
                type: jsonType,
                sourceType: 'reference',
                source: newInstanceId,
                sourceProperty: 'documentation',
            };
            let instanceSpec: InstanceSpecObject = {
                id: newInstanceId,
                ownerId: 'view_instances_bin_' + viewOrSectionOb._projectId,
                _projectId: viewOrSectionOb._projectId,
                _refId: viewOrSectionOb._refId,
                name: name ? name : 'Untitled ' + type,
                documentation: '',
                type: 'InstanceSpecification',
                classifierIds: [
                    this.schemaSvc.getValue('TYPE_TO_CLASSIFIER_ID', realType, this.schema, viewOrSectionOb.id),
                ],
                specification: new ValueSpec({
                    value: JSON.stringify(instanceSpecSpec),
                    type: 'LiteralString',
                    ownerId: newInstanceId,
                    id: this.apiSvc.createUniqueId(),
                    _projectId: viewOrSectionOb._projectId,
                    _refId: viewOrSectionOb._refId,
                }),
                appliedStereotypeIds: [],
            };
            instanceSpec = new InstanceSpec(instanceSpec);
            if (type === 'Section') {
                //newData = newDataSInstance = null;
                instanceSpec.specification = new ValueSpec({
                    operand: [],
                    type: 'Expression',
                    ownerId: newInstanceId,
                    id: this.apiSvc.createUniqueId(),
                    _projectId: viewOrSectionOb._projectId,
                    _refId: viewOrSectionOb._refId,
                });
            }
            let clone: ElementObject = {
                _projectId: viewOrSectionOb._projectId,
                id: viewOrSectionOb.id,
                _refId: viewOrSectionOb._refId,
                type: viewOrSectionOb.type,
            };
            let key = '_contents';
            if (this.isSection(viewOrSectionOb)) {
                key = 'specification';
            }
            const keyValue: ValueObject = viewOrSectionOb[key] as ValueObject;
            let cloneValue: ValueObject;
            if (!keyValue) {
                cloneValue = new ValueSpec({
                    operand: [],
                    type: 'Expression',
                    id: this.isSection(viewOrSectionOb)
                        ? this.apiSvc.createUniqueId()
                        : viewOrSectionOb.id + '_vc_expression',
                    _projectId: viewOrSectionOb._projectId,
                    _refId: viewOrSectionOb._refId,
                    ownerId: this.isSection(viewOrSectionOb) ? viewOrSectionOb.id : viewOrSectionOb.id + '_vc',
                });
            } else {
                cloneValue = _.cloneDeep(keyValue);
                if (!cloneValue.id || !cloneValue.ownerId) {
                    cloneValue.id = this.isSection(viewOrSectionOb)
                        ? this.apiSvc.createUniqueId()
                        : viewOrSectionOb.id + '_vc_expression';
                    cloneValue.ownerId = this.isSection(viewOrSectionOb)
                        ? viewOrSectionOb.id
                        : viewOrSectionOb.id + '_vc';
                }
            }
            if (addPeIndex >= -1) {
                (cloneValue as ExpressionObject<InstanceValueObject>).operand.splice(
                    addPeIndex + 1,
                    0,
                    new ValueSpec({
                        instanceId: newInstanceId,
                        type: 'InstanceValue',
                        id: this.apiSvc.createUniqueId(),
                        ownerId: cloneValue.id,
                        _projectId: viewOrSectionOb._projectId,
                        _refId: viewOrSectionOb._refId,
                    })
                );
            } else {
                (cloneValue as ExpressionObject<InstanceValueObject>).operand.push(
                    new ValueSpec({
                        instanceId: newInstanceId,
                        type: 'InstanceValue',
                        id: this.apiSvc.createUniqueId(),
                        ownerId: cloneValue.id,
                        _projectId: viewOrSectionOb._projectId,
                        _refId: viewOrSectionOb._refId,
                    })
                );
            }
            clone[key] = cloneValue;
            clone = this.elementSvc.fillInElement(clone);
            const toCreate: ElementObject[] = [instanceSpec, clone];
            /*
        if (newData && newDataSInstance) {
            toCreate.push(newData);
            toCreate.push(newDataSInstance);
        }
        */
            const reqOb = {
                projectId: viewOrSectionOb._projectId,
                refId: viewOrSectionOb._refId,
                elements: toCreate,
                elementId: '',
            };
            this.elementSvc.createElements(reqOb).then(
                (data) => {
                    for (let i = 0; i < data.length; i++) {
                        const elem = data[i];
                        if (elem.id === newInstanceId) {
                            resolve(elem);
                            return;
                        }
                    }
                },
                (reason) => {
                    reject(reason);
                }
            );
        });
    }

    /**
     * @name ViewService#createView
     * Create a new view, owner must be specified (parent view), id cannot be specified,
     * if name isn't specified, "Untitled" will be used, a default contents with
     * paragraph of the view documentation will be used. If a document is specified,
     * will also add the view to the document, in this case the parent view should
     * already be in the document. The new view will be added as the last child of the
     * parent view.
     *
     * @param {ViewObject} ownerOb should contain _project and _ref, can be a parent view with _childViews
     * @param {ViewObject} viewOb can specify optional viewId, viewName, viewDoc to be used when
     *                          creating the new view, boolean isDoc indicate whether it's a document
     * @param {string} peDoc optional documentation to set for pe creation
     * @returns {Promise} The promise will be resolved with the new view.
     */
    public createView(ownerOb: ViewObject, viewOb: ViewObject, peDoc?: string): VePromise<ViewObject> {
        return new this.$q<ViewObject>((resolve, reject) => {
            const newViewId: string = viewOb.id && viewOb.id !== '' ? viewOb.id : this.apiSvc.createUniqueId();
            const newInstanceId = '_hidden_' + this.apiSvc.createUniqueId() + '_pei';
            const untitledName = viewOb.isDoc ? 'Untitled Document' : 'Untitled View';
            const view = new Class({
                id: newViewId,
                _projectId: viewOb._projectId,
                _refId: viewOb._refId,
                type: 'Class',
                ownerId: ownerOb.id,
                _allowedElements: [],
                _displayedElementIds: [newViewId],
                _childViews: [],
                _contents: new ValueSpec({
                    operand: [
                        new ValueSpec({
                            type: 'InstanceValue',
                            instanceId: newInstanceId,
                            _projectId: viewOb._projectId,
                            _refId: viewOb._refId,
                            id: newViewId + '_vc_expression_0',
                        }),
                    ],
                    type: 'Expression',
                    id: newViewId + '_vc_expression',
                    ownerId: newViewId + '_vc',
                    _projectId: viewOb._projectId,
                    _refId: viewOb._refId,
                }),
                name: viewOb.name ? viewOb.name : untitledName,
                documentation: viewOb.documentation ? viewOb.documentation : '',
                appliedStereotypeIds: [
                    viewOb.isDoc
                        ? this.schemaSvc.getSchema<string>('DOCUMENT_SID', this.schema)
                        : this.schemaSvc.getSchema<string>('VIEW_SID', this.schema),
                ],
            });
            let parentView: ViewObject = {
                _projectId: '',
                _refId: '',
                id: '',
                type: 'Class',
            };
            if (ownerOb && (ownerOb._childViews || this.apiSvc.isView(ownerOb))) {
                parentView = Object.assign(parentView, {
                    _projectId: ownerOb._projectId,
                    _refId: ownerOb._refId,
                    id: ownerOb.id,
                });
                parentView._childViews = [];
                if (ownerOb._childViews) {
                    parentView._childViews.push(..._.cloneDeep(ownerOb._childViews));
                }
                parentView._childViews.push({
                    id: newViewId,
                    _projectId: ownerOb._projectId,
                    _refId: ownerOb._refId,
                    aggregation: 'composite',
                    type: 'Class',
                });
            }
            const peSpec: PresentationInstanceObject = {
                type: 'Paragraph',
                sourceType: 'reference',
                source: newViewId,
                sourceProperty: 'documentation',
            };
            const pe = new InstanceSpec({
                id: newInstanceId,
                _projectId: viewOb._projectId,
                _refId: viewOb._refId,
                ownerId: 'view_instances_bin_' + ownerOb._projectId,
                name: 'View Paragraph',
                documentation: peDoc ? peDoc : '',
                classifierIds: [this.schemaSvc.getValue('TYPE_TO_CLASSIFIER_ID', 'ParagraphT', this.schema, viewOb.id)],
                specification: new ValueSpec({
                    value: JSON.stringify(peSpec),
                    type: 'LiteralString',
                    id: this.apiSvc.createUniqueId(),
                    ownerId: newInstanceId,
                    _projectId: viewOb._projectId,
                    _refId: viewOb._refId,
                }),
                appliedStereotypeIds: [],
            });
            const toCreate: ElementObject[] = [pe, view];
            if (parentView.id !== '') {
                const parentViewClass: ElementObject = this.elementSvc.fillInElement(parentView);
                toCreate.push(parentViewClass);
            }
            const reqOb = {
                projectId: ownerOb._projectId,
                refId: ownerOb._refId,
                elements: toCreate,
                returnChildViews: true,
                elementId: '',
            };
            this.elementSvc.createElements(reqOb).then(
                (data) => {
                    data.forEach((elem) => {
                        if (elem.id === newViewId) {
                            resolve(elem);
                        }
                    });
                },
                (reason) => {
                    reject(reason);
                }
            );
        });
    }

    /**
     * @name ViewService#createDocument
     * Create a new document,
     * if name isn't specified, "Untitled" will be used, a default contents with
     * paragraph of the view documentation will be used.
     *
     * @param {object} ownerOb see createView
     * @param {object} docOb see createView
     * @returns {Promise} The promise will be resolved with the new view.
     */
    public createDocument(ownerOb: ViewObject, docOb: ViewObject): VePromise<ViewObject> {
        return new this.$q<ViewObject>((resolve, reject) => {
            docOb.isDoc = true;
            this.createView(ownerOb, docOb).then(
                (data2: DocumentObject) => {
                    if (ownerOb && ownerOb.id.indexOf('holding_bin') < 0) {
                        data2._groupId = ownerOb.id;
                    }
                    const cacheKey = ['documents', ownerOb._projectId, ownerOb._refId];
                    const cachedView: ViewObject[] = this.cacheSvc.get(cacheKey, true);
                    if (cachedView) {
                        cachedView.forEach((document: DocumentObject, index) => {
                            if (document.id === data2.id) delete cachedView[index];
                        });
                        cachedView.push(data2);
                    }
                    resolve(data2);
                },
                (reason) => {
                    reject(reason);
                }
            );
        });
    }

    /**
     * @name ViewService#createGroup
     * create a group depending on what the user has selected:
     *   - if the user has not selected anything, create a group at the root level of the project
     *   - if the user has selected a group, create a child group
     *   - if the user has selected anything else, let the user know that they must select a group
     * owner must be specified (parent view/document)
     * id cannot be specified (automatically generated)
     * if name isn't specified, "Untitled" will be used.
     *
     * @param {object} name group name new-doc-or-group.html
     * @param {object} ownerOb parent id, projectId and refId
     * @param {string} orgId parent orgId
     * @returns {Promise} The promise will be resolved with the new group object.
     */
    public createGroup(name: string, ownerOb: ViewObject): VePromise<GroupObject> {
        return new this.$q<GroupObject>((resolve, reject) => {
            const PACKAGE_ID = this.apiSvc.createUniqueId();
            // Our Group package element
            const group: GroupObject = new Package({
                id: PACKAGE_ID,
                _projectId: ownerOb._projectId,
                _refId: ownerOb._refId,
                name: name ? name : 'Untitled',
                type: 'Package',
                ownerId: ownerOb.id,
                _isGroup: true,
                appliedStereotypeIds: [this.schemaSvc.getSchema('GROUP_ST_ID', this.schema)],
            });
            const toCreate = [group];
            const reqOb = {
                projectId: ownerOb._projectId,
                refId: ownerOb._refId,
                elements: toCreate,
                elementId: '',
            };
            this.elementSvc.createElements(reqOb).then(
                (data) => {
                    const cacheKey = ['groups', ownerOb._projectId, ownerOb._refId];
                    const groupObj = _.find(data, { id: PACKAGE_ID });
                    if (groupObj) {
                        groupObj._parentId = ownerOb.id.indexOf('holding') != -1 ? null : ownerOb.id;
                        if (this.cacheSvc.exists(cacheKey)) {
                            this.cacheSvc.get<ElementObject[]>(cacheKey).push(groupObj);
                        }
                        this.cacheSvc.put(['group', groupObj.projectId, groupObj.refId, groupObj.id], groupObj, true);
                        resolve(groupObj);
                    } else {
                        reject({
                            status: 500,
                            message: 'Failed to create group',
                        });
                    }
                },
                (reason) => {
                    console.log('POST failed:', reason);
                    reject(reason);
                }
            );
        });
    }

    /**
     * @name ViewService#removeGroup
     *
     * @description remove a group
     *
     * @param {object} packageOb group to remove
     * @returns {Promise} The promise will be resolved with the updated group object.
     */
    public removeGroup(packageOb: GroupObject): VePromise<PackageObject> {
        return new this.$q<PackageObject>((resolve, reject) => {
            const updatedPackage: PackageObject = {
                id: packageOb.id,
                type: 'Package',
                _projectId: packageOb._projectId,
                _refId: packageOb._refId,
                appliedStereotypeIds: [],
                classifierIds: null,
            };

            updatedPackage._isGroup = false;
            _.remove(packageOb.appliedStereotypeIds, (id: string): boolean => {
                return id === this.schemaSvc.getSchema('GROUP_ST_ID', this.schema);
            });

            if (packageOb.appliedStereotypeIds.length === 0) {
                updatedPackage.appliedStereotypeIds = packageOb.appliedStereotypeIds;
            }
            const toUpdate = [updatedPackage];
            this.elementSvc.updateElements<PackageObject>(toUpdate, false).then(
                (data) => {
                    // remove this group for cache
                    const cacheKey = ['groups', packageOb._projectId, packageOb._refId];
                    const groups: ElementObject[] = this.cacheSvc.get<PackageObject[]>(cacheKey, true) || [];
                    _.remove(groups, (group: PackageObject) => {
                        return group.id === packageOb.id;
                    });
                    data.forEach((elOb: ElementObject) => {
                        if (elOb.id === updatedPackage.id) {
                            resolve(elOb);
                        }
                    });
                },
                (reason) => {
                    if (reason.data.failedRequests) {
                        reject(reason.data.failedRequests[0]);
                    } else {
                        reject({
                            status: 400,
                            message: 'Something went wrong. Please try your action again',
                        });
                    }
                }
            );
        });
    }

    /**
     * @name ViewService#getProjectDocuments
     * Gets all the documents in a site
     *
     * @param {Object} reqOb object containing project and ref ids needed to resolve request
     * @param {boolean} [refresh=false] Update latest
     * @param {int} weight the priority of the request
     * @returns {Promise} The promise will be resolved with array of document objects
     */
    public getProjectDocuments(
        reqOb: ViewsRequest,
        weight?: number,
        refresh?: boolean
    ): VePromise<DocumentObject[], GenericResponse<DocumentObject>> {
        this.apiSvc.normalize(reqOb);
        const url = this.uRLSvc.getProjectDocumentsURL(reqOb);
        const cacheKey = ['documents', reqOb.projectId, reqOb.refId];
        const inProgKey = cacheKey.join('-');
        if (!this._isInProgress(inProgKey)) {
            this._addInProgress(
                inProgKey,
                new this.$q<DocumentObject[], GenericResponse<DocumentObject>>((resolve, reject) => {
                    if (this.cacheSvc.exists(cacheKey) && !refresh) {
                        resolve(this.cacheSvc.get(cacheKey));
                        this._removeInProgress(inProgKey);
                    } else {
                        if (refresh === undefined) {
                            refresh = false;
                        }
                        this.elementSvc
                            .getGenericElements(url, reqOb, 'documents', weight, refresh)
                            .then(
                                (data) => {
                                    this.cacheSvc.put(cacheKey, data, false);
                                    resolve(this.cacheSvc.get<DocumentObject[]>(cacheKey));
                                },
                                (reason) => {
                                    reject(reason);
                                }
                            )
                            .finally(() => {
                                this._removeInProgress(inProgKey);
                            });
                    }
                })
            );
        }
        return this._getInProgress(inProgKey) as VePromise<DocumentObject[], GenericResponse<DocumentObject>>;
    }

    /**
     * @name ViewService#getProjectDocument
     * Gets a specific the document from a Site
     *
     * @param {object} reqOb object containing project, ref, document ids needed to resolve request
     * @param {int} weight the priority of the request
     * @param {boolean} refresh [default=false] refresh latest
     * @returns {Promise} The promise will be resolved with array of document objects
     */
    public getProjectDocument(
        reqOb: ElementsRequest<string>,
        weight: number,
        refresh?: boolean
    ): VePromise<DocumentObject> {
        const cacheKey = this.elementSvc.getRequestKey(reqOb, reqOb.elementId);
        const inProgKey = cacheKey.join('-');
        if (!this._isInProgress(inProgKey)) {
            this._addInProgress(
                inProgKey,
                new this.$q<DocumentObject>((resolve, reject) => {
                    const cached = this.cacheSvc.get<DocumentObject>(cacheKey);
                    if (cached && !refresh) {
                        resolve(cached);
                        this._removeInProgress(inProgKey);
                    }
                    this.getProjectDocuments(reqOb, weight, refresh)
                        .then(
                            (result: DocumentObject[]) => {
                                const documentOb = result.filter((resultOb) => {
                                    return resultOb.id === reqOb.elementId;
                                })[0];
                                this.cacheSvc.put(cacheKey, documentOb, true);
                                resolve(this.cacheSvc.get<DocumentObject>(cacheKey));
                            },
                            (reason) => {
                                reject({ message: reason.message, status: reason.status });
                            }
                        )
                        .finally(() => this._removeInProgress(inProgKey));
                })
            );
        }
        return this._getInProgress(inProgKey) as VePromise<DocumentObject>;
    }

    /**
     * @name ViewService#getPresentationInstanceObject
     * Parses an instanceSpec of the expression reference tree in the contents
     * of a View, and returns the corresponding presentation element json object.
     *
     * @param {object} instanceSpec instance specification object
     * @returns {object} The json object for the corresponding presentation element
     */
    public getPresentationInstanceObject = (
        instanceSpec: InstanceSpecObject
    ): PresentationInstanceObject | InstanceSpecObject => {
        const instanceSpecSpec: ValueObject = instanceSpec.specification;
        if (!instanceSpecSpec) {
            return {
                type: 'Paragraph',
                sourceType: 'text',
                text: '',
            };
        }
        const type = instanceSpecSpec.type;

        if (type === 'LiteralString') {
            // If it is an Opaque List, Paragraph, Table, Image, List:
            const jsonString = (instanceSpecSpec as LiteralObject<string>).value;
            return JSON.parse(jsonString) as PresentationInstanceObject;
        } else if (type === 'Expression') {
            // If it is a Opaque Section, or a Expression:
            // If it is a Opaque Section then we want the instanceSpec:
            if (this.isSection(instanceSpec)) {
                return instanceSpec;
            } else {
                //??
                return instanceSpecSpec;
            }
        }
    };

    /**
     * @name ViewService#getElementReferenceTree
     * gets the presentation element tree as an array of tree nodes
     * a tree node is this:
     * <pre>
     {
            instanceId: id of the instance,
            instanceVal: instanceValue object,
            sectionElements: array of child tree nodes,
            instanceSpecification: instance specification object of the instance,
            presentationElement: json of the presentation element or a section instance spec with type = Section
        }
     * </pre>
     *
     * @param {object} reqOb see this.elementSvc.getElement
     * @param {object} contents an expression object from a view or section
     * @param {int} weight the priority of the request
     * @returns {Promise} The promise will be resolved with array of tree node objects
     */
    public getElementReferenceTree(
        reqOb: ElementsRequest<string>,
        contents: ExpressionObject<InstanceValueObject>,
        weight?: number
    ): VePromise<PresentationReference[], GenericResponse<PresentationReference>> {
        const promises: VePromise<PresentationReference, BasicResponse<PresentationReference>>[] = [];
        for (let i = 0; i < contents.operand.length; i++) {
            promises.push(this.getElementReference(reqOb, contents.operand[i], weight));
        }
        return this.$q.all(promises);
    }

    public getElementReference(
        reqOb: ElementsRequest<string>,
        instanceVal: InstanceValueObject,
        weight?: number
    ): VePromise<PresentationReference, BasicResponse<PresentationReference>> {
        return new this.$q<PresentationReference, BasicResponse<PresentationReference>>((resolve, reject) => {
            const presentationRef: PresentationReference = {
                instanceId: instanceVal.instanceId,
                sectionElements: [],
                instanceVal: instanceVal,
                isOpaque: false,
            };

            const req = _.cloneDeep(reqOb);
            req.elementId = instanceVal.instanceId;
            this.elementSvc.getElement<ViewInstanceSpec>(req, weight).then(
                (instanceSpecification) => {
                    presentationRef.instanceSpecification = instanceSpecification;
                    presentationRef.isOpaque =
                        instanceSpecification.classifierIds &&
                        instanceSpecification.classifierIds.length > 0 &&
                        this.schemaSvc
                            .getMap<string[]>('OPAQUE_CLASSIFIERS', this.schema)
                            .indexOf(instanceSpecification.classifierIds[0]) >= 0;
                    presentationRef.presentationElement = this.getPresentationInstanceObject(instanceSpecification);
                    if (this.isSection(instanceSpecification)) {
                        this.getElementReferenceTree(req, instanceSpecification.specification).then(
                            (sectionElementReferenceTree) => {
                                presentationRef.sectionElements = sectionElementReferenceTree;
                                resolve(presentationRef);
                            },
                            (reason) => {
                                reject(reason);
                            }
                        );
                    } else resolve(presentationRef);
                },
                (reason) => {
                    reject({ status: reason.status, message: reason.message });
                }
            );
        });
    }

    /**
     * @name ViewService#this.isSection
     * Returns true if the passed InstanceSpecification is a Section
     *
     * @param {Object} instanceSpec A InstanceSpecification json object
     * @returns {boolean} whether it's a section
     */
    public isSection = (instanceSpec: ViewInstanceSpec): boolean => {
        return (
            instanceSpec.classifierIds &&
            instanceSpec.classifierIds.length > 0 &&
            (instanceSpec.classifierIds[0] ===
                this.schemaSvc.getValue('TYPE_TO_CLASSIFIER_ID', 'Section', this.schema, instanceSpec.id) ||
                instanceSpec.classifierIds[0] ===
                    this.schemaSvc.getValue('TYPE_TO_CLASSIFIER_ID', 'SectionT', this.schema, instanceSpec.id))
        );
    };

    public isTable = (instanceSpec: InstanceSpecObject): boolean => {
        return (
            instanceSpec.classifierIds &&
            instanceSpec.classifierIds.length > 0 &&
            (instanceSpec.classifierIds[0] ===
                this.schemaSvc.getValue('TYPE_TO_CLASSIFIER_ID', 'Table', this.schema, instanceSpec.id) ||
                instanceSpec.classifierIds[0] ===
                    this.schemaSvc.getValue('TYPE_TO_CLASSIFIER_ID', 'TableT', this.schema, instanceSpec.id))
        );
    };

    public isFigure = (instanceSpec: InstanceSpecObject): boolean => {
        return (
            instanceSpec.classifierIds &&
            instanceSpec.classifierIds.length > 0 &&
            (instanceSpec.classifierIds[0] ===
                this.schemaSvc.getValue('TYPE_TO_CLASSIFIER_ID', 'ImageT', this.schema, instanceSpec.id) ||
                instanceSpec.classifierIds[0] ===
                    this.schemaSvc.getValue('TYPE_TO_CLASSIFIER_ID', 'Image', this.schema, instanceSpec.id) ||
                instanceSpec.classifierIds[0] ===
                    this.schemaSvc.getValue('TYPE_TO_CLASSIFIER_ID', 'Figure', this.schema, instanceSpec.id) ||
                instanceSpec.classifierIds[0] ===
                    this.schemaSvc.getValue('TYPE_TO_CLASSIFIER_ID', 'FigureT', this.schema, instanceSpec.id))
        );
    };

    public isEquation = (instanceSpec: InstanceSpecObject): boolean => {
        return (
            instanceSpec.classifierIds &&
            instanceSpec.classifierIds.length > 0 &&
            instanceSpec.classifierIds[0] ===
                this.schemaSvc.getValue('TYPE_TO_CLASSIFIER_ID', 'Equation', this.schema, instanceSpec.id)
        );
    };

    public getTreeType = (instanceSpec: ViewInstanceSpec): string => {
        if (this.isSection(instanceSpec)) return 'section';
        if (
            instanceSpec.specification &&
            instanceSpec.specification.value &&
            typeof instanceSpec.specification.value === 'string' &&
            (JSON.parse(instanceSpec.specification.value) as PresentationInstanceObject).excludeFromList
        ) {
            return 'none';
        }
        if (this.isTable(instanceSpec)) return 'table';
        if (this.isFigure(instanceSpec)) return 'figure';
        if (this.isEquation(instanceSpec)) return 'equation';
        let result = 'none';
        if (instanceSpec.classifierIds && instanceSpec.classifierIds.length > 0) {
            const peSids = this.schemaSvc.getSchema<{
                [peType: string]: string;
            }>('TYPE_TO_CLASSIFIER_ID', this.schema);

            for (const peType of Object.keys(peSids)) {
                if (
                    instanceSpec.classifierIds &&
                    instanceSpec.classifierIds.length > 0 &&
                    instanceSpec.classifierIds.includes(peSids[peType])
                ) {
                    result = peType.toLowerCase();
                    break;
                }
            }
        }

        return result;
    };

    public processSlotStrings(values: LiteralObject<unknown>[]): string[] {
        const res: string[] = [];
        if (!values || values.length === 0) {
            return res;
        }
        values.forEach((value) => {
            if (value.type !== 'LiteralString' || !value.value) return;
            res.push(value.value as string);
        });
        return res;
    }

    public processSlotIntegers(values: LiteralObject<unknown>[]): number[] {
        const res: number[] = [];
        if (!values || values.length === 0) {
            return res;
        }
        values.forEach((value) => {
            if (Number.isInteger(value.value)) {
                res.push(value.value as number);
            } else if (typeof value.value === 'string') {
                const val = parseInt(value.value);
                if (!isNaN(val)) {
                    res.push(val);
                }
            }
        });
        return res;
    }

    /**
     * @name ViewService#getDocumentMetadata
     * gets Document properties from docgen's stereotypes
     *
     * @param {object} reqOb see this.elementSvc.getElement
     * @param {integer} weight the priority of the request
     * @returns {Promise} The promise will be resolved with metadata object
     *                      with name value pairs corresponding to document stereotype
     */
    public getDocumentMetadata(reqOb: ElementsRequest<string>, weight?: number): VePromise<DocumentMetadata> {
        return new this.$q((resolve, reject) => {
            const metadata: DocumentMetadata = {
                numberingDepth: 0,
                numberingSeparator: '.',
            };
            const elementIds = [
                `${reqOb.elementId}_asi-slot-${this.schemaSvc.getValue<string>('DOCUMENT_IDS', 'Header', this.schema)}`, //header
                `${reqOb.elementId}_asi-slot-${this.schemaSvc.getValue<string>('DOCUMENT_IDS', 'Footer', this.schema)}`, //footer
                `${reqOb.elementId}_asi-slot-${this.schemaSvc.getValue<string>(
                    'DOCUMENT_IDS',
                    'NumDepth',
                    this.schema
                )}`, //numbering depth
                `${reqOb.elementId}_asi-slot-${this.schemaSvc.getValue<string>('DOCUMENT_IDS', 'NumSep', this.schema)}`, //numbering separator
            ];
            const metaReqOb: ElementsRequest<string[]> = Object.assign(reqOb, {
                elementId: elementIds,
            });
            this.elementSvc
                .getElements<SlotObject>(metaReqOb, weight)
                .then(
                    (data) => {
                        if (data.length === 0) {
                            return;
                        }
                        for (let i = 0; i < data.length; i++) {
                            const prop = data[i];
                            const feature: string = prop.definingFeatureId ? prop.definingFeatureId : null;
                            const value: LiteralObject<unknown>[] = prop.value ? prop.value : null;
                            if (!feature || !value || !Array.isArray(value)) {
                                continue;
                            }
                            let result: string[] | number[] = [];
                            if (feature === this.schemaSvc.getValue('DOCUMENT_IDS', 'Header', this.schema, prop.id)) {
                                //header
                                result = this.processSlotStrings(value);
                                metadata.top = result.length > 0 ? result[0] : '';
                                metadata['top-left'] = result.length > 1 ? result[1] : '';
                                metadata['top-right'] = result.length > 2 ? result[2] : '';
                            } else if (
                                feature == this.schemaSvc.getValue('DOCUMENT_IDS', 'Footer', this.schema, prop.id)
                            ) {
                                //footer
                                result = this.processSlotStrings(value);
                                metadata.bottom = result.length > 0 ? result[0] : '';
                                metadata['bottom-left'] = result.length > 1 ? result[1] : '';
                                metadata['bottom-right'] = result.length > 2 ? result[2] : '';
                            } else if (
                                feature == this.schemaSvc.getValue('DOCUMENT_IDS', 'NumDepth', this.schema, prop.id)
                            ) {
                                //depth
                                result = this.processSlotIntegers(value);
                                metadata.numberingDepth = result.length > 0 ? result[0] : 0;
                            } else if (
                                feature == this.schemaSvc.getValue('DOCUMENT_IDS', 'NumSep', this.schema, prop.id)
                            ) {
                                //separator
                                result = this.processSlotStrings(value);
                                metadata.numberingSeparator = result.length > 0 ? result[0] : '.';
                            }
                        }
                    },
                    () => {
                        /* Do nothing */
                    }
                )
                .finally(() => {
                    resolve(metadata);
                });
        });
    }

    public getPresentationElementType = (instanceSpec: ViewInstanceSpec): string => {
        if (instanceSpec.type === 'InstanceSpecification') {
            if (this.isSection(instanceSpec)) {
                return 'Section';
            } else if (this.isTable(instanceSpec)) {
                return 'Table';
            } else if (this.isFigure(instanceSpec)) {
                return 'Image';
            } else if (this.isEquation(instanceSpec)) {
                return 'Equation';
            } else if (instanceSpec.specification && instanceSpec.specification.value) {
                return (
                    JSON.parse(
                        (instanceSpec.specification as LiteralObject<string>).value
                    ) as PresentationInstanceObject
                ).type;
            }
        }
        return;
    };

    public isGroup(ob: InstanceSpecObject | GroupObject): boolean {
        if (ob._isGroup) return (ob as GroupObject)._isGroup;
        else {
            return (
                ob.appliedStereotypeIds !== undefined &&
                ob.appliedStereotypeIds.length > 0 &&
                ob.appliedStereotypeIds[0] === this.schemaSvc.getSchema('GROUP_ST_ID', this.schema)
            );
        }
    }

    public getElementType = (element: ElementObject): string => {
        // Get Type
        let elementType = '';
        if (this.apiSvc.isRequirement(element)) {
            elementType = 'Requirement';
        } else if (this.apiSvc.isDocument(element)) {
            elementType = 'Document';
        } else if (this.apiSvc.isView(element)) {
            elementType = 'View';
        } else if (this.isGroup(element)) {
            elementType = 'Group';
        } else {
            elementType = this.getPresentationElementType(element);
        }
        return elementType;
    };

    public reset = (): void => {
        this.inProgress = {};
    };
}

veUtils.service('ViewService', ViewService);
