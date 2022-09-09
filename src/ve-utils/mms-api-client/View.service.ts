import * as angular from 'angular'
import * as _ from 'lodash'
import {ElementService, CacheService, URLService} from '@ve-utils/mms-api-client'
import {UtilsService, EventService} from '@ve-utils/core-services'
import {TreeBranch, View2NodeMap} from '@ve-types/tree'
import {DocumentObject, ElementObject, ElementsRequest, PresentationInstanceObject, ViewObject,} from '@ve-types/mms'
import {Class, InstanceSpec, Package, ValueSpec} from "@ve-utils/utils";
import {veUtils} from "@ve-utils";
import {SchemaService} from "@ve-utils/model-schema";

export interface ViewElement {
    id: any
    api: ViewApi
    number?: any
    topLevel?: boolean
    first?: boolean
}

export interface ViewApi {
    elementClicked(elementOb: ElementObject): any
    elementTranscluded(elementOb: ElementObject, type: string): any
}



export interface DocMetadata {
    numberingDepth: number
    numberingSeparator: string
    top?: string
    bottom?: string
    topl?: string
    bottoml?: string
    topr?: string
    bottomr?: string
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
 *
 * @description
 * Similar to the ElementService and proxies a lot of functions to it, this provides
 * CRUD for views and products/documents/group
 *
 */
export class ViewService {
    public inProgress = {}
    private schema: string = 'cameo'

    static $inject = [
        '$q',
        '$http',
        'growl',
        'URLService',
        'ElementService',
        'UtilsService',
        'CacheService',
        'EventService',
        'SchemaService'
    ]
    constructor(
        private $q: angular.IQService,
        private $http: angular.IHttpService,
        private growl: angular.growl.IGrowlService,
        private uRLSvc: URLService,
        private elementSvc: ElementService,
        private utilsSvc: UtilsService,
        private cacheSvc: CacheService,
        private eventSvc: EventService,
        private schemaSvc: SchemaService
    ) {}

    /**
     * @ngdoc method
     * @name ViewService#downgradeDocument
     * @methodOf veUtils/ViewService
     *
     * @description
     * Demote document to a view and update the applied stereotype instance
     *
     * @param {Object} elementOb A document object
     * @returns {Promise} The promise will be resolved with the downgraded view
     */
    public downgradeDocument(
        elementOb: ViewObject
    ): angular.IPromise<ViewObject> {
        var deferred: angular.IDeferred<ViewObject> = this.$q.defer()
        var clone = JSON.parse(JSON.stringify(elementOb))
        clone._appliedStereotypeIds = [this.schemaSvc.get('VIEW_SID', this.schema)]
        var asi = {
            id: elementOb.id + '_asi',
            ownerId: elementOb.id,
            classifierIds: [this.schemaSvc.get('VIEW_SID', this.schema)],
            type: 'InstanceSpecification',
            _projectId: elementOb._projectId,
            _refId: elementOb._refId,
            stereotypedElementId: elementOb.id,
        }
        this.elementSvc.updateElements([clone, asi], false).then(
            (data) => {
                var cacheKey = [
                    'documents',
                    elementOb._projectId,
                    elementOb._refId,
                ]
                var index = -1
                var projectDocs: ViewObject[] = this.cacheSvc.get<ViewObject[]>(cacheKey)
                if (projectDocs) {
                    for (var i = 0; i < projectDocs.length; i++) {
                        if (projectDocs[i].id === elementOb.id) {
                            index = i
                            break
                        }
                    }
                    if (index >= 0) {
                        projectDocs.splice(index, 1)
                    }
                }
                return deferred.resolve(
                    data.filter((returnOb) => {
                        return returnOb.id === elementOb.id
                    })[0]
                )
            },
            (reason) => {
                return deferred.reject(reason)
            }
        )
        return deferred.promise
    }

    /**
     * @ngdoc method
     * @name ViewService#getViewElements
     * @methodOf veUtils/ViewService
     *
     * @description
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
        reqOb: ElementsRequest,
        weight: number,
        update?: boolean
    ) {
        this.utilsSvc.normalize(reqOb)
        var deferred = this.$q.defer()
        var key =
            'viewElements' +
            reqOb.projectId +
            reqOb.refId +
            reqOb.elementId +
            reqOb.commitId
        if (this.inProgress[key]) {
            return this.inProgress[key]
        }
        var requestCacheKey = [
            'elements',
            reqOb.projectId,
            reqOb.refId,
            reqOb.elementId,
            reqOb.commitId,
        ]
        var cached = this.cacheSvc.get(requestCacheKey)
        if (cached && !update) {
            deferred.resolve(cached)
            return deferred.promise
        }
        this.inProgress[key] = deferred.promise
        this.elementSvc.getElement(reqOb, weight, update).then(
            (view) => {
                var toGet: any[] = []
                var results: ElementObject[] = []
                if (view._displayedElementIds) {
                    var displayed = view._displayedElementIds
                    if (!Array.isArray(displayed)) {
                        displayed = JSON.parse(displayed)
                    }
                    if (Array.isArray(displayed) && displayed.length > 0) {
                        toGet = displayed
                    }
                }
                if (view._contents && view._contents.operand) {
                    var contents = view._contents.operand
                    for (var i = 0; i < contents.length; i++) {
                        if (contents[i] && contents[i].instanceId) {
                            toGet.push(contents[i].instanceId)
                        }
                    }
                }
                if (view.specification && view.specification.operand) {
                    var specContents = view.specification.operand
                    for (var j = 0; j < specContents.length; j++) {
                        if (specContents[j] && specContents[j].instanceId) {
                            toGet.push(specContents[j].instanceId)
                        }
                    }
                }
                if (
                    this.isTable(view) &&
                    view.specification &&
                    view.specification.value
                ) {
                    try {
                        var tableJson = JSON.parse(view.specification.value)
                        if (tableJson.body) {
                            this.collectTableSources(toGet, tableJson.body)
                        }
                    } catch (e) {}
                }

                var toGetSet = new Set(toGet)
                reqOb.elementId = Array.from(toGetSet)
                this.elementSvc
                    .getElements(reqOb, weight, update)
                    .then((data) => {
                        results = data
                    })
                    .finally(() => {
                        this.cacheSvc.put(requestCacheKey, results)
                        deferred.resolve(results)
                        delete this.inProgress[key]
                    })
            },
            (reason) => {
                deferred.reject(reason)
                delete this.inProgress[key]
            }
        )
        return deferred.promise
    }

    public collectTableSources(sources, body) {
        var i, j, k
        for (i = 0; i < body.length; i++) {
            var row = body[i]
            for (j = 0; j < row.length; j++) {
                var cell = row[j]
                for (k = 0; k < cell.content.length; k++) {
                    var thing = cell.content[k]
                    if (thing.type === 'Table' && thing.body) {
                        this.collectTableSources(sources, thing.body)
                    } else if (thing.type === 'Paragraph' && thing.source) {
                        sources.push(thing.source)
                    }
                }
            }
        }
    }

    /**
     * @ngdoc method
     * @name veUtils/ViewService#handleChildViews
     * @methodOf veUtils/ViewService
     *
     * @description
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
        curItemFunc: (
            v: ViewObject,
            aggr: string,
            propId?: string
        ) => TreeBranch | string[],
        childrenFunc?: (currItem: TreeBranch | string[], childNodes: TreeBranch[]) => void,
        seen?: { [key: string]: ViewObject }
    ): angular.IPromise<TreeBranch | string[]> {
        var seenViews = seen
        if (!seenViews) seenViews = {}
        var deferred: angular.IDeferred<TreeBranch | string[]> = this.$q.defer()
        var curItem: TreeBranch | string[] = curItemFunc(v, aggr, propId)
        seenViews[v.id] = v
        var childIds: string[] = []
        var childAggrs: string[] = []
        var childPropIds: string[] = []
        if (!v._childViews || v._childViews.length === 0 || aggr === 'none') {
            if (!Array.isArray(curItem) && curItem.loading) {
                curItem.loading = false
            }
            deferred.resolve(curItem)
            return deferred.promise
        } else {
        }
        for (var i = 0; i < v._childViews.length; i++) {

            if (seenViews[v._childViews[i].id]) continue
            childIds.push(v._childViews[i].id)
            childAggrs.push(v._childViews[i].aggregation)
            childPropIds.push(v._childViews[i].propertyId)
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
            .then(
                (childViews: ViewObject[]) => {
                    var mapping = {}
                    for (var i = 0; i < childViews.length; i++) {
                        mapping[childViews[i].id] = childViews[i]
                    }
                    var childPromises: angular.IPromise<string[] | TreeBranch>[] = []
                    var childNodes: any[] = []
                    var processedChildViews: any[] = []
                    for (i = 0; i < childIds.length; i++) {
                        var child = mapping[childIds[i]]
                        if (child && this.utilsSvc.isView(child)) {
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
                            )
                            childNodes.push(
                                curItemFunc(
                                    child,
                                    childAggrs[i],
                                    childPropIds[i]
                                )
                            )
                            processedChildViews.push({
                                id: child.id,
                                aggregation: childAggrs[i],
                                propertyId: childPropIds[i],
                            })
                        }
                    }
                    v._childViews = processedChildViews
                    if (childrenFunc) {
                        childrenFunc(curItem, childNodes)
                    }
                    this.$q.all(childPromises).then(
                        () => {
                            deferred.resolve(curItem)
                        },
                        (reason) => {
                            deferred.reject(reason)
                        }
                    )
                },
                (reason) => {
                    deferred.reject(reason)
                }
            )
        return deferred.promise
    }

    /**
     * @ngdoc method
     * @name ViewService#addViewToParentView
     * @methodOf veUtils/ViewService
     *
     * @description
     * This updates a document to include a new view, the new view must be a child
     * of an existing view in the document
     *
     * @param {object} reqOb see Element.getElement for description, use parentViewId
     *                  and viewId instead of elementId, add 'aggr' key
     * @returns {Promise} The promise would be resolved with updated parent view object
     */
    public addViewToParentView(reqOb) {
        this.utilsSvc.normalize(reqOb)
        var deferred = this.$q.defer()
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
                (data) => {
                    var clone: ViewObject = {
                        _projectId: data._projectId,
                        _refId: data._refId,
                        //_modified: data._modified,
                        id: data.id,
                        _childViews: [],
                        type: data.type
                    }
                    clone._childViews = []
                    if (data._childViews) {
                        clone._childViews.push(...JSON.parse(
                            JSON.stringify(data._childViews)
                        ))
                    }
                    clone._childViews.push({
                        id: reqOb.viewId,
                        aggregation: reqOb.aggr,
                        _projectId: data._projectId,
                        _refId: data._refId,
                        type: data.type
                    })
                    this.elementSvc.updateElement(clone, true).then(
                        function (data2) {
                            deferred.resolve(data2)
                        },
                        (reason) => {
                            deferred.reject(reason)
                        }
                    )
                },
                (reason) => {
                    deferred.reject(reason)
                }
            )
        return deferred.promise
    }

    /**
     * @ngdoc method
     * @name ViewService#removeViewFromParentView
     * @methodOf veUtils/ViewService
     *
     * @description
     * This removes the specified view from the parent view
     *
     * @param {object} reqOb see this.elementSvc.getElement, use viewId and parentViewId
     * @returns {Promise} The promise would be resolved with updated parent View object
     */
    public removeViewFromParentView(reqOb) {
        this.utilsSvc.normalize(reqOb)
        var deferred = this.$q.defer()
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
                (data) => {
                    if (data._childViews) {
                        var clone = {
                            _projectId: data._projectId,
                            _refId: data._refId,
                            //_modified: data._modified,
                            //_read: data._read,
                            id: data.id,
                            type: data.type,
                            _childViews: JSON.parse(
                                JSON.stringify(data._childViews)
                            ),
                        }
                        for (var i = 0; i < clone._childViews.length; i++) {
                            if (clone._childViews[i].id === reqOb.viewId) {
                                clone._childViews.splice(i, 1)
                                break
                            }
                        }
                        this.elementSvc.updateElement(clone, true).then(
                            function (data2) {
                                deferred.resolve(data2)
                            },
                            (reason) => {
                                deferred.reject(reason)
                            }
                        )
                    } else {
                        deferred.resolve(data)
                    }
                },
                (reason) => {
                    deferred.reject(reason)
                }
            )
        return deferred.promise
    }

    /**
     * @ngdoc method
     * @name ViewService#addElementToViewOrSection
     * @methodOf veUtils/ViewService
     *
     * @description
     * This updates a view or section to include a new element, the new element must be a child
     * of an existing element in the view
     *
     * @param {object} reqOb see this.elementSvc.getElement for description, elementId is the view
     *                          or section instance element id
     * @param {object} elementOb the element object to add (this should be an instanceValue)
     * @param {number} addPeIndex the index of where to add view or section (instance spec) object
     * @returns {Promise} The promise would be resolved with updated view or section object
     */
    public addElementToViewOrSection(reqOb, elementOb, addPeIndex) {
        this.utilsSvc.normalize(reqOb)
        var deferred = this.$q.defer()
        this.elementSvc
            .getElement(
                {
                    projectId: reqOb._projectId,
                    refId: reqOb._refId,
                    elementId: reqOb.id,
                },
                2
            )
            .then(
                (data) => {
                    var clone = {
                        _projectId: data._projectId,
                        _refId: data._refId,
                        type: data.type,
                        //_modified: data._modified,
                        id: data.id,
                    }
                    var key = '_contents'
                    if (this.isSection(data)) {
                        key = 'specification'
                    }
                    if (data[key]) {
                        clone[key] = JSON.parse(JSON.stringify(data[key]))
                        if (!clone[key].id || !clone[key].ownerId) {
                            clone[key].id = this.isSection(data)
                                ? this.utilsSvc.createMmsId()
                                : data.id + '_vc_expression'
                            clone[key].ownerId = this.isSection(data)
                                ? data.id
                                : data.id + '_vc'
                        }
                    } else {
                        clone[key] = new ValueSpec({
                            operand: [],
                            type: 'Expression',
                            id: this.isSection(data)
                                ? this.utilsSvc.createMmsId()
                                : data.id + '_vc_expression',
                            _projectId: data._projectId,
                            _refId: data._refId,
                            ownerId: this.isSection(data)
                                ? data.id
                                : data.id + '_vc',
                        })
                    }
                    elementOb.ownerId = clone[key].id
                    if (!elementOb.id) {
                        elementOb.id = this.utilsSvc.createMmsId()
                    }
                    if (addPeIndex >= -1)
                        clone[key].operand.splice(
                            addPeIndex + 1,
                            0,
                            new ValueSpec(elementOb)
                        )
                    else
                        clone[key].operand.push(
                            new ValueSpec(elementOb)
                        )
                    // clone[key].operand.push(new ValueSpec(elementOb));
                    this.elementSvc.updateElement(clone, false).then(
                        function (data2) {
                            deferred.resolve(data2)
                        },
                        (reason) => {
                            deferred.reject(reason)
                        }
                    )
                },
                (reason) => {
                    deferred.reject(reason)
                }
            )
        return deferred.promise
    }

    /**
     * @ngdoc method
     * @name ViewService#removeElementFromViewOrSection
     * @methodOf veUtils/ViewService
     *
     * @description
     * This removes the specified instanceVal from the contents of the View or Section
     *
     * @param {object} reqOb see this.elementSvc.getElement for description
     * @param {object} instanceVal to remove from the View or Section
     * @returns {Promise} The promise would be resolved with updated View or Section object
     */
    public removeElementFromViewOrSection(reqOb: ElementsRequest, instanceVal?: any) {
        this.utilsSvc.normalize(reqOb)
        var deferred = this.$q.defer()

        if (instanceVal) {
            this.elementSvc.getElement(reqOb, 2).then(
                (data) => {
                    var clone = {
                        _projectId: data._projectId,
                        _refId: data._refId,
                        type: data.type,
                        //_modified: data._modified,
                        id: data.id,
                    }
                    var key = '_contents'
                    if (this.isSection(data)) {
                        key = 'specification'
                    }
                    if (data[key]) {
                        clone[key] = JSON.parse(JSON.stringify(data[key]))
                        if (!clone[key].id || !clone[key].ownerId) {
                            clone[key].id = this.isSection(data)
                                ? this.utilsSvc.createMmsId()
                                : data.id + '_vc_expression'
                            clone[key].ownerId = this.isSection(data)
                                ? data.id
                                : data.id + '_vc'
                        }
                    } else {
                        clone[key] = new ValueSpec({
                            operand: [],
                            type: 'Expression',
                            id: this.isSection(data)
                                ? this.utilsSvc.createMmsId()
                                : data.id + '_vc_expression',
                            _projectId: data._projectId,
                            _refId: data._refId,
                            ownerId: this.isSection(data)
                                ? data.id
                                : data.id + '_vc',
                        })
                    }
                    if (clone[key] && clone[key].operand) {
                        var operands = data[key].operand
                        for (var i = 0; i < operands.length; i++) {
                            if (
                                instanceVal.instanceId ===
                                operands[i].instanceId
                            ) {
                                clone[key].operand.splice(i, 1)
                                break
                            }
                        }
                    }
                    this.elementSvc.updateElement(clone, false).then(
                        function (data2) {
                            deferred.resolve(data2)
                        },
                        (reason) => {
                            deferred.reject(reason)
                        }
                    )
                },
                (reason) => {
                    deferred.reject(reason)
                }
            )
        }
        return deferred.promise
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
    ): angular.IPromise<any> {
        var deferred = this.$q.defer()

        var newInstanceId = this.utilsSvc.createMmsId()
        newInstanceId = '_hidden_' + newInstanceId + '_pei'

        var realType = this.schemaSvc.getValue('TYPE_TO_CLASSIFIER_TYPE',type,this.schema,viewOrSectionOb.id)
        var jsonType = realType
        if (type === 'Comment' || type === 'Paragraph') jsonType = type
        /*
        var newDataId = this.utilsSvc.createMmsId();
        var newDataSInstanceId = this.utilsSvc.createMmsId();
        var newData = new Class({
            id: newDataId,
            name: name + '_' + newDataId,
            ownerId: 'holding_bin_' + viewOrSectionOb._projectId,
            documentation: '',
            _appliedStereotypeIds: [this.utilsSvc.BLOCK_SID],
            appliedStereotypeInstanceId: newDataSInstanceId
        });
        var newDataSInstance = new Instance({
            id: newDataSInstanceId,
            stereotypedElementId: newDataId,
            ownerId: newDataId,
            classifierIds: [this.utilsSvc.BLOCK_SID]
        });
        */
        var instanceSpecSpec = {
            type: jsonType,
            sourceType: 'reference',
            source: newInstanceId,
            sourceProperty: 'documentation',
        }
        var instanceSpec: ElementObject = {
            id: newInstanceId,
            ownerId: 'view_instances_bin_' + viewOrSectionOb._projectId,
            _projectId: viewOrSectionOb._projectId,
            _refId: viewOrSectionOb._refId,
            name: name ? name : 'Untitled ' + type,
            documentation: '',
            type: 'InstanceSpecification',
            classifierIds: [this.schemaSvc.getValue('TYPE_TO_CLASSIFIER_ID',realType,this.schema,viewOrSectionOb.id)],
            specification: new ValueSpec({
                value: JSON.stringify(instanceSpecSpec),
                type: 'LiteralString',
                ownerId: newInstanceId,
                id: this.utilsSvc.createMmsId(),
                _projectId: viewOrSectionOb._projectId,
                _refId: viewOrSectionOb._refId,
            }),
            _appliedStereotypeIds: [],
        }
        instanceSpec = new InstanceSpec(instanceSpec)
        if (type === 'Section') {
            //newData = newDataSInstance = null;
            instanceSpec.specification = new ValueSpec({
                operand: [],
                type: 'Expression',
                ownerId: newInstanceId,
                id: this.utilsSvc.createMmsId(),
                _projectId: viewOrSectionOb._projectId,
                _refId: viewOrSectionOb._refId,
            })
        }
        var clone: ElementObject = {
            _projectId: viewOrSectionOb._projectId,
            id: viewOrSectionOb.id,
            _refId: viewOrSectionOb._refId,
            type: viewOrSectionOb.type,
        }
        var key = '_contents'
        if (this.isSection(viewOrSectionOb)) {
            key = 'specification'
        }
        if (!viewOrSectionOb[key]) {
            clone[key] = new ValueSpec({
                operand: [],
                type: 'Expression',
                id: this.isSection(viewOrSectionOb)
                    ? this.utilsSvc.createMmsId()
                    : viewOrSectionOb.id + '_vc_expression',
                _projectId: viewOrSectionOb._projectId,
                _refId: viewOrSectionOb._refId,
                ownerId: this.isSection(viewOrSectionOb)
                    ? viewOrSectionOb.id
                    : viewOrSectionOb.id + '_vc',
            })
        } else {
            clone[key] = JSON.parse(JSON.stringify(viewOrSectionOb[key]))
            if (!clone[key].id || !clone[key].ownerId) {
                clone[key].id = this.isSection(viewOrSectionOb)
                    ? this.utilsSvc.createMmsId()
                    : viewOrSectionOb.id + '_vc_expression'
                clone[key].ownerId = this.isSection(viewOrSectionOb)
                    ? viewOrSectionOb.id
                    : viewOrSectionOb.id + '_vc'
            }
        }
        if (addPeIndex >= -1) {
            clone[key].operand.splice(
                addPeIndex + 1,
                0,
                new ValueSpec({
                    instanceId: newInstanceId,
                    type: 'InstanceValue',
                    id: this.utilsSvc.createMmsId(),
                    ownerId: clone[key].id,
                    _projectId: viewOrSectionOb._projectId,
                    _refId: viewOrSectionOb._refId,
                })
            )
        } else {
            clone[key].operand.push(
                new ValueSpec({
                    instanceId: newInstanceId,
                    type: 'InstanceValue',
                    id: this.utilsSvc.createMmsId(),
                    ownerId: clone[key].id,
                    _projectId: viewOrSectionOb._projectId,
                    _refId: viewOrSectionOb._refId,
                })
            )
        }
        clone = this.elementSvc.fillInElement(clone)
        var toCreate: ElementObject[] = [instanceSpec, clone]
        /*
        if (newData && newDataSInstance) {
            toCreate.push(newData);
            toCreate.push(newDataSInstance);
        }
        */
        var reqOb = {
            projectId: viewOrSectionOb._projectId,
            refId: viewOrSectionOb._refId,
            elements: toCreate,
            elementId: ''
        }
        this.elementSvc.createElements(reqOb).then(
            (data) => {
                for (var i = 0; i < data.length; i++) {
                    var elem = data[i]
                    if (elem.id === newInstanceId) {
                        if (type === 'Section') {
                            this.eventSvc.$broadcast('viewctrl.add.section', {
                                elementOb: elem,
                                viewOb: viewOrSectionOb,
                            })
                        }
                        deferred.resolve(elem)
                        return
                    }
                }
            },
            (reason) => {
                deferred.reject(reason)
            }
        )
        return deferred.promise
    }

    /**
     * @ngdoc method
     * @name ViewService#createView
     * @methodOf veUtils/ViewService
     *
     * @description
     * Create a new view, owner must be specified (parent view), id cannot be specified,
     * if name isn't specified, "Untitled" will be used, a default contents with
     * paragraph of the view documentation will be used. If a document is specified,
     * will also add the view to the document, in this case the parent view should
     * already be in the document. The new view will be added as the last child of the
     * parent view.
     *
     * @param {object} ownerOb should contain _project and _ref, can be a parent view with _childViews
     * @param {object} viewOb can specify optional viewId, viewName, viewDoc to be used when
     *                          creating the new view, boolean isDoc indicate whether it's a document
     * @param {string} peDoc optional documentation to set for pe creation
     * @returns {Promise} The promise will be resolved with the new view.
     */
    public createView(
        ownerOb: ElementObject,
        viewOb: ElementObject,
        peDoc?
    ): angular.IPromise<ViewObject> {
        var deferred: angular.IDeferred<ViewObject> = this.$q.defer()

        var newViewId =
            viewOb.id && viewOb.id !== ''
                ? viewOb.id
                : this.utilsSvc.createMmsId()
        var newInstanceId = '_hidden_' + this.utilsSvc.createMmsId() + '_pei'

        var untitledName = viewOb.isDoc ? 'Untitled Document' : 'Untitled View'
        var view = new Class({
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
                        id: newViewId + '_vc_expression_0'
                    }),
                ],
                type: 'Expression',
                id: newViewId + '_vc_expression',
                ownerId: newViewId + '_vc',
                _projectId: viewOb._projectId,
                _refId: viewOb._refId,
            }),
            name: viewOb.name ? viewOb.name : untitledName,
            documentation: viewOb.viewDoc ? viewOb.viewDoc : '',
            _appliedStereotypeIds: [
                viewOb.isDoc
                    ? this.schemaSvc.get('DOCUMENT_SID', this.schema)
                    : this.schemaSvc.get('VIEW_SID', this.schema)
            ],
            appliedStereotypeInstanceId: newViewId + '_asi',
        })
        let parentView: ViewObject = {
            _projectId: '',
            _refId: '',
            id: '',
            type:  'Class'
        }
        if (ownerOb && (ownerOb._childViews || this.utilsSvc.isView(ownerOb))) {
            parentView = Object.assign(parentView,{
                _projectId: ownerOb._projectId,
                _refId: ownerOb._refId,
                id: ownerOb.id,
            })
            parentView._childViews = []
            if (ownerOb._childViews) {
                parentView._childViews.push(...JSON.parse(
                    JSON.stringify(ownerOb._childViews)))
            }
            parentView._childViews.push({
                id: newViewId,
                _projectId: ownerOb._projectId,
                _refId: ownerOb._refId,
                aggregation: 'composite',
                type: 'Class'
            })
        }
        var peSpec: PresentationInstanceObject = {
            type: 'Paragraph',
            sourceType: 'reference',
            source: newViewId,
            sourceProperty: 'documentation',
        }
        var pe = new InstanceSpec({
            id: newInstanceId,
            _projectId: viewOb._projectId,
            _refId: viewOb._refId,
            ownerId: 'view_instances_bin_' + ownerOb._projectId,
            name: 'View Paragraph',
            documentation: peDoc ? peDoc : '',
            classifierIds: [this.schemaSvc.getValue('TYPE_TO_CLASSIFIER_ID','ParagraphT',this.schema,viewOb.id)],
            specification: new ValueSpec({
                value: JSON.stringify(peSpec),
                type: 'LiteralString',
                id: this.utilsSvc.createMmsId(),
                ownerId: newInstanceId,
                _projectId: viewOb._projectId,
                _refId: viewOb._refId,
            }),
            _appliedStereotypeIds: [],
        })
        var asi = new InstanceSpec({
            //create applied stereotype instance
            id: newViewId + '_asi',
            _projectId: viewOb._projectId,
            _refId: viewOb._refId,
            ownerId: newViewId,
            documentation: '',
            name: '',
            classifierIds: [
                viewOb.isDoc
                    ? this.schemaSvc.get('DOCUMENT_SID', this.schema)
                    : this.schemaSvc.get('VIEW_SID', this.schema)
            ],
            _appliedStereotypeIds: [],
            stereotypedElementId: newViewId,
        })
        var toCreate: ElementObject[] = [pe, view, asi]
        if (parentView.id !== '') {
            let parentViewClass: ElementObject = this.elementSvc.fillInElement(parentView);
            toCreate.push(parentViewClass)
        }
        var reqOb = {
            projectId: ownerOb._projectId,
            refId: ownerOb._refId,
            elements: toCreate,
            returnChildViews: true,
            elementId: ''
        }
        this.elementSvc.createElements(reqOb).then(
            (data) => {
                data.forEach((elem) => {
                    if (elem.id === newViewId) {
                        deferred.resolve(elem)
                    }
                })
            },
            (reason) => {
                deferred.reject(reason)
            }
        )
        return deferred.promise
    }

    /**
     * @ngdoc method
     * @name ViewService#createDocument
     * @methodOf veUtils/ViewService
     *
     * @description
     * Create a new document,
     * if name isn't specified, "Untitled" will be used, a default contents with
     * paragraph of the view documentation will be used.
     *
     * @param {object} ownerOb see createView
     * @param {object} docOb see createView
     * @returns {Promise} The promise will be resolved with the new view.
     */
    public createDocument(ownerOb: ViewObject, docOb: ViewObject): angular.IPromise<ViewObject> {
        var deferred: angular.IDeferred<ViewObject> = this.$q.defer()
        docOb.isDoc = true
        this.createView(ownerOb, docOb).then(
            (data2: DocumentObject) => {
                if (ownerOb && ownerOb.id.indexOf('holding_bin') < 0) {
                    data2._groupId = ownerOb.id
                }
                var cacheKey = ['documents', ownerOb._projectId, ownerOb._refId]
                let cachedView = this.cacheSvc.get<ViewObject>(cacheKey)
                if (cachedView) {
                    cachedView.push(data2)
                }
                deferred.resolve(data2)
            },
            (reason) => {
                deferred.reject(reason)
            }
        )
        return deferred.promise
    }

    /**
     * @ngdoc method
     * @name ViewService#createGroup
     * @methodOf veUtils/ViewService
     *
     * @description
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
    public createGroup(name, ownerOb, orgId) {
        var deferred = this.$q.defer()

        var PACKAGE_ID = this.utilsSvc.createMmsId(),
            PACKAGE_ASI_ID = PACKAGE_ID + '_asi'
        // Our Group package element
        var group = new Package({
            id: PACKAGE_ID,
            _projectId: ownerOb._projectId,
            _refId: ownerOb._refId,
            name: name ? name : 'Untitled',
            type: 'Package',
            ownerId: ownerOb.id,
            _isGroup: true,
            _appliedStereotypeIds: [this.schemaSvc.get('GROUP_ST_ID',this.schema)],
            appliedStereotypeInstanceId: PACKAGE_ASI_ID,
        })
        var groupAsi = new InstanceSpec({
            classifierIds: [this.schemaSvc.get('GROUP_ST_ID',this.schema)],
            id: PACKAGE_ASI_ID,
            _projectId: ownerOb._projectId,
            _refId: ownerOb._refId,
            ownerId: PACKAGE_ID,
            visibility: null,
            stereotypedElementId: PACKAGE_ID,
        })
        var toCreate = [group, groupAsi]
        var reqOb = {
            projectId: ownerOb._projectId,
            refId: ownerOb._refId,
            elements: toCreate,
            elementId: ''
        }
        this.elementSvc.createElements(reqOb).then(
            (data) => {
                var cacheKey = ['groups', ownerOb._projectId, ownerOb._refId]
                var groupObj = _.find(data, { id: PACKAGE_ID })
                if (groupObj) {
                    groupObj._parentId =
                        ownerOb.id.indexOf('holding') != -1 ? null : ownerOb.id
                    groupObj._link =
                        '/share/page/repository#filter=path|/Sites/' +
                        orgId +
                        '/documentLibrary/' +
                        groupObj._projectId +
                        '/' +
                        groupObj.id
                    if (this.cacheSvc.exists(cacheKey)) {
                        this.cacheSvc.get<ElementObject[]>(cacheKey).push(groupObj)
                    }
                    this.cacheSvc.put(
                        [
                            'group',
                            groupObj.projectId,
                            groupObj.refId,
                            groupObj.id,
                        ],
                        groupObj,
                        true
                    )
                    deferred.resolve(groupObj)
                } else {
                    deferred.reject({
                        status: 500,
                        message: 'Failed to create group',
                    })
                }
            },
            (reason) => {
                console.log('POST failed:', reason)
                deferred.reject(reason)
            }
        )
        return deferred.promise
    }

    /**
     * @ngdoc method
     * @name ViewService#deleteGroup
     * @methodOf veUtils/ViewService
     *
     * @description remove a group
     *
     * @param {object} elementOb group to remove
     * @returns {Promise} The promise will be resolved with the updated group object.
     */
    public removeGroup(elementOb) {
        elementOb._isGroup = false
        _.remove(elementOb._appliedStereotypeIds, (id) => {
            return id === this.schemaSvc.get('GROUP_ST_ID',this.schema)
        })
        elementOb.appliedStereotypeInstanceId =
            elementOb._appliedStereotypeIds.length > 0
                ? elementOb.appliedStereotypeInstanceId
                : null
        var updatedElement: ViewObject = {
            id: elementOb.id,
            type: 'Package',
            _projectId: elementOb._projectId,
            _refId: elementOb._refId,
            _appliedStereotypeIds: elementOb._appliedStereotypeIds,
            appliedStereotypeInstanceId: elementOb.appliedStereotypeInstanceId,
            _isGroup: elementOb._isGroup,
            classifierIds: null,
        }
        var toUpdate = [updatedElement]
        if (updatedElement.appliedStereotypeInstanceId !== null) {
            let updateOb = {
                id: elementOb.id + '_asi',
                _refId: elementOb._refId,
                _projectId: elementOb._projectId,
                classifierIds: updatedElement._appliedStereotypeIds,
                _isGroup: elementOb._isGroup,
                _appliedStereotypeIds: null,
                appliedStereotypeInstanceId: null,
            }
            toUpdate.push(updateOb)
        } else {
            this.$http.delete(
                this.uRLSvc.getElementURL({
                    elementId: elementOb.id + '_asi',
                    refId: elementOb._refId,
                    projectId: elementOb._projectId,
                })
            )
        }
        return this.elementSvc.updateElements(toUpdate, false).then(
            (data) => {
                // remove this group for cache
                var cacheKey = [
                    'groups',
                    elementOb._projectId,
                    elementOb._refId,
                ]
                var groups: ElementObject[] = this.cacheSvc.get<ElementObject[]>(cacheKey) || []
                _.remove(groups, (group: ElementObject) => {
                    return group.id === elementOb.id
                })
                return data
            },
            (reason) => {
                return reason
            }
        )
    }

    /**
     * @ngdoc method
     * @name ViewService#getProjectDocuments
     * @methodOf veUtils/ViewService
     *
     * @description
     * Gets all the documents in a site
     *
     * @param {Object} reqOb object containing project and ref ids needed to resolve request
     * @param {boolean} [refresh=false] Update latest
     * @param {int} weight the priority of the request
     * @returns {Promise} The promise will be resolved with array of document objects
     */
    public getProjectDocuments(
        reqOb,
        weight,
        refresh?
    ): angular.IPromise<ViewObject[]> {
        this.utilsSvc.normalize(reqOb)
        var deferred: angular.IDeferred<ViewObject[]> = this.$q.defer()
        var url = this.uRLSvc.getProjectDocumentsURL(reqOb)
        var cacheKey = ['documents', reqOb.projectId, reqOb.refId]
        if (this.cacheSvc.exists(cacheKey) && !refresh) {
            deferred.resolve(this.cacheSvc.get(cacheKey))
        } else {
            if (refresh === undefined) {
                refresh = false
            }
            this.elementSvc
                .getGenericElements(url, reqOb, 'documents', weight, refresh)
                .then(
                    (data) => {
                        this.cacheSvc.put(cacheKey, data, false)
                        deferred.resolve(
                            this.cacheSvc.get<ViewObject[]>(cacheKey)
                        )
                    },
                    (reason) => {
                        deferred.reject(reason)
                    }
                )
        }
        return deferred.promise
    }

    /**
     * @ngdoc method
     * @name ViewService#getProjectDocument
     * @methodOf veUtils/ViewService
     *
     * @description
     * Gets a specific the document from a Site
     *
     * @param {object} reqOb object containing project, ref, document ids needed to resolve request
     * @param {int} weight the priority of the request
     * @param {boolean} refresh [default=false] refresh latest
     * @returns {Promise} The promise will be resolved with array of document objects
     */
    public getProjectDocument(
        reqOb,
        weight,
        refresh?
    ): angular.IPromise<ViewObject> {
        reqOb.elementId = reqOb.documentId
        var cacheKey = this.elementSvc.getElementKey(reqOb)
        var deferred: angular.IDeferred<ViewObject> = this.$q.defer()
        var cached = this.cacheSvc.get<ViewObject>(cacheKey)
        if (refresh === undefined) {
            refresh = false
        }
        if (
            cached &&
            !refresh &&
            (!reqOb.extended || (reqOb.extended && cached._qualifiedId))
        ) {
            deferred.resolve(cached)
            return deferred.promise
        }
        this.getProjectDocuments(reqOb, weight, refresh).then(
            (result) => {
                var documentOb = result.filter((resultOb) => {
                    return resultOb.id === reqOb.documentId
                })[0]
                this.cacheSvc.put(cacheKey, documentOb, true)
                deferred.resolve(this.cacheSvc.get<ViewObject>(cacheKey))
            },
            (reason) => {
                deferred.reject(reason)
            }
        )
        return deferred.promise
    }

    /**
     * @ngdoc method
     * @name ViewService#getPresentationInstanceObject
     * @methodOf veUtils/ViewService
     *
     * @description
     * Parses an instanceSpec of the expression reference tree in the contents
     * of a View, and returns the corresponding presentation element json object.
     *
     * @param {object} instanceSpec instance specification object
     * @returns {object} The json object for the corresponding presentation element
     */
    public getPresentationInstanceObject(instanceSpec: ElementObject): PresentationInstanceObject | ElementObject {
        var instanceSpecSpec = instanceSpec.specification
        if (!instanceSpecSpec) {
            this.growl.error('missing specification');
        }
        var type = instanceSpecSpec.type

        if (type === 'LiteralString') {
            // If it is a Opaque List, Paragraph, Table, Image, List:
            var jsonString = instanceSpecSpec.value
            return JSON.parse(jsonString)
        } else if (type === 'Expression') {
            // If it is a Opaque Section, or a Expression:
            // If it is a Opaque Section then we want the instanceSpec:
            if (this.isSection(instanceSpec)) {
                return instanceSpec
            } else {
                //??
                return instanceSpecSpec
            }
        }
    }

    /**
     * @ngdoc method
     * @name ViewService#getElementReferenceTree
     * @methodOf veUtils/ViewService
     *
     * @description
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
    public getElementReferenceTree(reqOb: ElementsRequest, contents: ElementObject, weight?: number) : angular.IPromise<ElementObject[]> {
        var promises: angular.IPromise<ElementObject>[] = []
        for (var i = 0; i < contents.operand.length; i++) {
            promises.push(
                this.getElementReference(reqOb, contents.operand[i], weight)
            )
        }
        return this.$q.all(promises)
    }

    public getElementReference(reqOb: ElementsRequest, instanceVal: ElementObject, weight?: number): angular.IPromise<ElementObject> {
        var deferred: angular.IDeferred<ElementObject> = this.$q.defer()
        var elementObject: ElementObject = {
            id: (Array.isArray(reqOb.elementId)) ? reqOb.elementId[0] : reqOb.elementId,
            _projectId: reqOb.projectId,
            _refId: reqOb.refId,
            instanceId: instanceVal.instanceId,
            instanceVal: instanceVal,
            sectionElements: [],
            instanceSpecification: [],
            isOpaque: false,
            presentationElement: [],
        }

        var req = JSON.parse(JSON.stringify(reqOb))
        req.elementId = instanceVal.instanceId
        this.elementSvc.getElement(req, weight).then(
            (instanceSpecification) => {
                elementObject.instanceSpecification = instanceSpecification
                if (
                    instanceSpecification.classifierIds &&
                    instanceSpecification.classifierIds.length > 0 &&
                    this.schemaSvc.get('OPAQUE_CLASSIFIERS',this.schema).indexOf(
                        instanceSpecification.classifierIds[0]
                    ) >= 0
                ) {
                    elementObject.isOpaque = true
                } else {
                    elementObject.isOpaque = false
                }
                // var presentationElement: PresentationInstanceObject = this.getPresentationInstanceObject(
                //     instanceSpecification
                // )
                // elementObject.presentationElement = presentationElement
                if (this.isSection(instanceSpecification)) {
                    this.getElementReferenceTree(
                        req,
                        instanceSpecification.specification
                    ).then(
                        (sectionElementReferenceTree) => {
                            elementObject.sectionElements =
                                sectionElementReferenceTree
                            deferred.resolve(elementObject)
                        },
                        (reason) => {
                            deferred.reject(reason)
                        }
                    )
                } else deferred.resolve(elementObject)
            },
            (reason) => {
                deferred.reject(reason)
            }
        )
        return deferred.promise
    }

    /**
     * @ngdoc method
     * @name ViewService#this.isSection
     * @methodOf veUtils/ViewService
     *
     * @description
     * Returns true if the passed InstanceSpecification is a Section
     *
     * @param {Object} instanceSpec A InstanceSpecification json object
     * @returns {boolean} whether it's a section
     */
    public isSection(instanceSpec: ElementObject): boolean {
        return (
            instanceSpec.classifierIds &&
            instanceSpec.classifierIds.length > 0 &&
            (instanceSpec.classifierIds[0] ===
                this.schemaSvc.getValue('TYPE_TO_CLASSIFIER_ID','Section',this.schema,instanceSpec.id) ||
                instanceSpec.classifierIds[0] ===
                    this.schemaSvc.getValue('TYPE_TO_CLASSIFIER_ID','SectionT',this.schema,instanceSpec.id))
        )
    }

    public isTable(instanceSpec: ElementObject): boolean {
        return (
            instanceSpec.classifierIds &&
            instanceSpec.classifierIds.length > 0 &&
            (instanceSpec.classifierIds[0] ===
                this.schemaSvc.getValue('TYPE_TO_CLASSIFIER_ID','Table',this.schema,instanceSpec.id) ||
                instanceSpec.classifierIds[0] ===
                    this.schemaSvc.getValue('TYPE_TO_CLASSIFIER_ID','TableT',this.schema,instanceSpec.id))
        )
    }

    public isFigure(instanceSpec: ElementObject): boolean {
        return (
            instanceSpec.classifierIds &&
            instanceSpec.classifierIds.length > 0 &&
            (instanceSpec.classifierIds[0] ===
                this.schemaSvc.getValue('TYPE_TO_CLASSIFIER_ID','ImageT',this.schema,instanceSpec.id) ||
                instanceSpec.classifierIds[0] ===
                    this.schemaSvc.getValue('TYPE_TO_CLASSIFIER_ID','Image',this.schema,instanceSpec.id) ||
                instanceSpec.classifierIds[0] ===
                    this.schemaSvc.getValue('TYPE_TO_CLASSIFIER_ID','Figure',this.schema,instanceSpec.id) ||
                instanceSpec.classifierIds[0] ===
                    this.schemaSvc.getValue('TYPE_TO_CLASSIFIER_ID','FigureT',this.schema,instanceSpec.id))
        )
    }

    public isEquation(instanceSpec: ElementObject): boolean {
        return (
            instanceSpec.classifierIds &&
            instanceSpec.classifierIds.length > 0 &&
            instanceSpec.classifierIds[0] ===
                this.schemaSvc.getValue('TYPE_TO_CLASSIFIER_ID','Equation',this.schema,instanceSpec.id)
        )
    }

    public getTreeType(instanceSpec: ElementObject): string {
        if (this.isSection(instanceSpec)) return 'section'
        if (
            instanceSpec.specification &&
            instanceSpec.specification.value &&
            JSON.parse(instanceSpec.specification.value).excludeFromList
        ) {
            return 'none'
        }
        if (this.isTable(instanceSpec)) return 'table'
        if (this.isFigure(instanceSpec)) return 'figure'
        if (this.isEquation(instanceSpec)) return 'equation'
        return 'none'
    }

    public processSlotStrings(values): string[] {
        var res: string[] = []
        if (!values || values.length === 0) {
            return res
        }
        values.forEach((value) => {
            if (value.type !== 'LiteralString' || !value.value) return
            res.push(value.value)
        })
        return res
    }

    public processSlotIntegers(values): number[] {
        var res: number[] = []
        if (!values || values.length === 0) {
            return res
        }
        values.forEach((value) => {
            if (Number.isInteger(value.value)) {
                res.push(value.value)
            } else if (typeof value.value === 'string') {
                var val = parseInt(value.value)
                if (!isNaN(val)) {
                    res.push(val)
                }
            }
        })
        return res
    }

    /**
     * @ngdoc method
     * @name ViewService#getDocMetadata
     * @methodOf veUtils/ViewService
     *
     * @description
     * gets Document properties from docgen's stereotypes
     *
     * @param {object} reqOb see this.elementSvc.getElement
     * @param {integer} weight the priority of the request
     * @returns {Promise} The promise will be resolved with metadata object
     *                      with name value pairs corresponding to document stereotype
     */
    public getDocMetadata(reqOb, weight): angular.IPromise<DocMetadata> {
        var deferred: angular.IDeferred<DocMetadata> = this.$q.defer()
        var metadata: DocMetadata = {
            numberingDepth: 0,
            numberingSeparator: '.',
        }
        reqOb.elementIds = [
            reqOb.elementId +
                '_asi-slot-_17_0_1_407019f_1326234342817_186479_2256', //header
            reqOb.elementId +
                '_asi-slot-_17_0_1_407019f_1326234349580_411867_2258', //footer
            reqOb.elementId +
                '_asi-slot-_18_5_3_8bf0285_1526605771405_96327_15754', //numbering depth
            reqOb.elementId +
                '_asi-slot-_18_5_3_8bf0285_1526605817077_688557_15755', //numbering separator
        ]
        this.elementSvc
            .getElements(reqOb, weight)
            .then(
                (data) => {
                    if (data.length === 0) {
                        return
                    }
                    for (var i = 0; i < data.length; i++) {
                        var prop = data[i]
                        var feature = prop.definingFeatureId
                            ? prop.definingFeatureId
                            : null
                        var value: any = prop.value ? prop.value : 'empty'
                        if (!feature || !value || value.length === 0) {
                            continue
                        }
                        var result: any[] = []
                        if (
                            feature === this.schemaSvc.getValue('DOCUMENT_IDS','HEADER',this.schema,prop.id)
                        ) {
                            //header
                            result = this.processSlotStrings(value)
                            metadata.top = result.length > 0 ? result[0] : ''
                            metadata.topl = result.length > 1 ? result[1] : ''
                            metadata.topr = result.length > 2 ? result[2] : ''
                        } else if (
                            feature == this.schemaSvc.getValue('DOCUMENT_IDS','FOOTER',this.schema,prop.id)
                        ) {
                            //footer
                            result = this.processSlotStrings(value)
                            metadata.bottom = result.length > 0 ? result[0] : ''
                            metadata.bottoml =
                                result.length > 1 ? result[1] : ''
                            metadata.bottomr =
                                result.length > 2 ? result[2] : ''
                        } else if (
                            feature == this.schemaSvc.getValue('DOCUMENT_IDS','NUM_DEPTH',this.schema,prop.id)
                        ) {
                            //depth
                            result = this.processSlotIntegers(value)
                            metadata.numberingDepth =
                                result.length > 0 ? result[0] : 0
                        } else if (
                            feature == this.schemaSvc.getValue('DOCUMENT_IDS','NUM_SEP',this.schema,prop.id)
                        ) {
                            //separator
                            result = this.processSlotStrings(value)
                            metadata.numberingSeparator =
                                result.length > 0 ? result[0] : '.'
                        }
                    }
                },
                (reason) => {}
            )
            .finally(() => {
                deferred.resolve(metadata)
            })
        return deferred.promise
    }

    public getPresentationElementType(instanceSpec) {
        if (instanceSpec.type === 'InstanceSpecification') {
            if (this.isSection(instanceSpec)) {
                return 'Section'
            } else if (this.isTable(instanceSpec)) {
                return 'Table'
            } else if (this.isFigure(instanceSpec)) {
                return 'Image'
            } else if (this.isEquation(instanceSpec)) {
                return 'Equation'
            } else if (
                instanceSpec.specification &&
                instanceSpec.specification.value
            ) {
                // var type = JSON.parse(instanceSpec.specification.value).type;
                // return type.toLowerCase();
                return JSON.parse(instanceSpec.specification.value).type
            }
        }
        return false
    }

    public isGroup(instanceSpec) {
        return (
            instanceSpec._appliedStereotypeIds !== undefined &&
            instanceSpec._appliedStereotypeIds.length > 0 &&
            instanceSpec._appliedStereotypeIds[0] === this.schemaSvc.get('GROUP_ST_ID',this.schema)
        )
    }

    public getElementType(element) {
        // Get Type
        var elementType = ''
        if (this.utilsSvc.isRequirement(element)) {
            elementType = 'Requirement'
        } else if (this.utilsSvc.isDocument(element)) {
            elementType = 'Document'
        } else if (this.utilsSvc.isView(element)) {
            elementType = 'View'
        } else if (this.isGroup(element)) {
            elementType = 'Group'
        } else {
            elementType = this.getPresentationElementType(element)
        }
        return elementType
    }

    public reset() {
        this.inProgress = {}
    }
}

veUtils.service('ViewService', ViewService)
