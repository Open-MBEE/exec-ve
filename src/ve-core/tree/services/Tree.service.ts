import angular from 'angular'

import { TreeApi } from '@ve-core/tree'
import {
    ApplicationService,
    EventService,
    RootScopeService,
} from '@ve-utils/services'

import { veCore } from '@ve-core'

import { VePromise, VePromiseReason, VeQService } from '@ve-types/angular'
import { ElementObject, RefObject } from '@ve-types/mms'
import { TreeBranch, TreeConfig, TreeOptions, TreeRow } from '@ve-types/tree'
import { VeApiObject } from '@ve-types/view-editor'

export class TreeService {
    private treeData: TreeBranch[]
    private treeRows: TreeRow[]

    private treeApi: VeApiObject<TreeApi> = {}

    static events = {
        UPDATED: 'tree.updated',
        RELOAD: 'tree.reload',
    }

    static MetaTypes = [
        'tag',
        'connector',
        'dependency',
        'directedrelationship',
        'element',
        'property',
        'generalization',
        'package',
        'section',
        'group',
        'snapshot',
        'view',
        'branch',
        'table',
        'figure',
        'equation',
        'view-composite',
        'view-shared',
        'view-none',
    ]

    static $inject = [
        '$q',
        '$timeout',
        'growl',
        'ApplicationService',
        'RootScopeService',
        'EventService',
    ]

    constructor(
        private $q: VeQService,
        private $timeout: angular.ITimeoutService,
        private growl: angular.growl.IGrowlService,
        private applicationSvc: ApplicationService,
        private rootScopeSvc: RootScopeService,
        private eventSvc: EventService
    ) {}

    public waitForApi = (id: string): VePromise<TreeApi, void> => {
        if (!this.treeApi.hasOwnProperty(id)) {
            this.treeApi[id] = {}
            this.treeApi[id].promise = new this.$q<TreeApi>(
                (resolve, reject) => {
                    this.treeApi[id].resolve = resolve
                    this.treeApi[id].reject = reject
                }
            )
        }
        return this.treeApi[id].promise
    }

    public initApi(
        config: TreeConfig,
        treeOptions: TreeOptions,
        ref: RefObject
    ): TreeApi {
        const id = config.id

        const api = new TreeApi(
            this.$q,
            this.$timeout,
            this.eventSvc,
            this.rootScopeSvc,
            this,
            config
        )

        if (!this.treeApi[id]) {
            this.treeApi[id] = {
                api,
            }
        } else {
            this.treeApi[id].api = api
        }
        if (!this.treeApi[id].resolve) {
            this.treeApi[id].promise = new this.$q((resolve, reject) => {
                this.treeApi[id].resolve = resolve
                this.treeApi[id].reject = reject
            })
        }
        this.treeApi[id].refId = ref.id
        this.treeApi[id].projectId = ref._projectId
        if (this.rootScopeSvc.treeInitialSelection())
            api.initialSelection = this.rootScopeSvc.treeInitialSelection()
        api.treeOptions = treeOptions
        this.treeApi[id].resolve(api)
        return api
    }

    public checkRef = (id: string, ref: RefObject): boolean => {
        return (
            this.treeApi[id] &&
            this.treeApi[id].refId === ref.id &&
            this.treeApi[id].projectId === ref._projectId
        )
    }

    public getTreeData = (): TreeBranch[] => {
        return this.treeData
    }

    public setTreeData = (treeData: TreeBranch[]): void => {
        this.treeData = treeData
    }

    public getTreeRows = (): TreeRow[] => {
        return this.treeRows
    }

    public setTreeRows = (treeData: TreeRow[]): void => {
        this.treeRows = treeData
    }

    public getApi = (id: string): TreeApi => {
        if (this.treeApi[id] && this.treeApi[id].api) {
            return this.treeApi[id].api
        }
    }

    /**
     * @name veUtils/TreeService#buildTreeHierarchy
     * builds hierarchy of tree branch objects
     *
     * @param {array} elementObs array of objects
     * @param {string} idKey key of id field
     * @param {string} type type of object
     * @param {string} parentKey key of parent field
     * @param {callback} level2_Func function to get child objects
     * @returns {void} root node
     */
    public buildTreeHierarchy = (
        elementObs: ElementObject[],
        idKey: string,
        type: string,
        parentKey: string,
        level2_Func: (elementOb: ElementObject, node: TreeBranch) => void
    ): TreeBranch[] => {
        const rootNodes: TreeBranch[] = []
        const data2Node: { [key: string]: TreeBranch } = {}
        elementObs.forEach((elementOb) => {
            data2Node[elementOb[idKey] as string] = {
                label: elementOb.name,
                type: type,
                data: elementOb,
                children: [],
                loading: true,
            }
        })

        // make second pass to associate data to parent nodes
        elementObs.forEach((elementOb) => {
            if (data2Node[elementOb[idKey] as string].type === 'group') {
                data2Node[elementOb[idKey] as string].loading = false
            }
            // If there's an element in data2Node whose key matches the 'parent' value in the array element
            // add the array element to the children array of the matched data2Node element
            if (
                elementOb[parentKey] &&
                data2Node[elementOb[parentKey] as string]
            ) {
                //bad data!
                data2Node[elementOb[parentKey] as string].children.push(
                    data2Node[elementOb[idKey] as string]
                )
            } else {
                // If theres not an element in data2Node whose key matches the 'parent' value in the array element
                // it's a "root node" and so it should be pushed to the root nodes array along with its children

                rootNodes.push(data2Node[elementOb[idKey] as string])
            }
        })

        //apply level2 function if available
        if (level2_Func) {
            elementObs.forEach((elementOb) => {
                const level1_parentNode = data2Node[elementOb[idKey] as string]
                level2_Func(elementOb, level1_parentNode)
            })
        }

        const sortFunction = (a: TreeBranch, b: TreeBranch): number => {
            if (a.children.length > 1) {
                a.children.sort(sortFunction)
            }
            if (b.children.length > 1) {
                b.children.sort(sortFunction)
            }
            if (a.label.toLowerCase() < b.label.toLowerCase()) {
                return -1
            }
            if (a.label.toLowerCase() > b.label.toLowerCase()) {
                return 1
            }
            return 0
        }
        rootNodes.sort(sortFunction)
        return rootNodes
    }

    public getTreeTypes = (): { [key: string]: string } => {
        const treeTypes = {}

        TreeService.MetaTypes.forEach((type) => {
            treeTypes[type] = this.getTypeIcon(type) + ' fa-fw'
        })

        return treeTypes
    }

    private getTypeIcon = (type: string): string => {
        let t = type
        if (!t) t = 'unknown'
        t = t.toLowerCase()
        switch (t) {
            case 'tag':
                return 'fa-solid fa-tag'
            case 'connector':
                return 'fa-solid fa-expand'
            case 'dependency':
                return 'fa-solid fa-long-arrow-right'
            case 'directedrelationship':
                return 'fa-solid fa-arrow-right-long'
            case 'element':
                return 'fa-solid fa-border-top-left'
            case 'property':
                return 'fa-solid fa-circle'
            case 'generalization':
                return 'fa-solid fa-arrow-up-long'
            case 'package':
                return 'fa-regular fa-folder'
            case 'section':
                return 'section-icon' //"fa-file-o";
            case 'group':
                return 'fa-solid fa-folder'
            case 'snapshot':
                return 'fa-solid fa-camera'
            case 'view':
                return 'fa-solid fa-file'
            case 'view-composite':
                return 'fa-solid fa-file'
            case 'view-shared':
                return 'fa-regular fa-file'
            case 'view-none':
                return 'fa-regular fa-file'
            case 'branch':
                return 'fa-solid fa-code-branch'
            case 'table':
                return 'fa-solid fa-table'
            case 'figure':
                return 'fa-regular fa-image'
            case 'diagram':
                return 'fa-solid fa-diagram-project'
            case 'equation':
                return 'fa-solid fa-superscript'
            default:
                return 'fa-solid fa-file-circle-question'
        }
    }

    static treeError(reason: VePromiseReason<unknown>): string {
        return 'Error refreshing tree: ' + reason.message
    }
}

veCore.service('TreeService', TreeService)
