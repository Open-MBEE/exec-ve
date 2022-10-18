import angular from 'angular'

import { TreeApi } from '@ve-core/tree'
import {
    ApplicationService,
    EventService,
    RootScopeService,
} from '@ve-utils/services'

import { veCore } from '@ve-core'

import { ElementObject } from '@ve-types/mms'
import { TreeBranch, TreeConfig } from '@ve-types/tree'

export class TreeService {
    private treeApi: TreeApi
    private peTreeApis: { [key: string]: TreeApi } = {}

    static events = {
        UPDATED: 'tree.updated',
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

    static $inject = ['$timeout', 'ApplicationService', 'EventService']

    constructor(
        private $timeout: angular.ITimeoutService,
        private applicationSvc: ApplicationService,
        private eventSvc: EventService
    ) {}

    getApi(config?: TreeConfig): TreeApi {
        if (config && !this.treeApi)
            this.treeApi = new TreeApi(
                this.$timeout,
                this.eventSvc,
                config,
                false
            )
        return this.treeApi
    }

    getPeApi(config: TreeConfig): TreeApi {
        if (!this.peTreeApis[config.id])
            this.peTreeApis[config.id] = new TreeApi(
                this.$timeout,
                this.eventSvc,
                config,
                true
            )
        return this.peTreeApis[config.id]
    }

    getAllPeApi() {
        return this.peTreeApis
    }

    destroyPeApi(id: string) {
        delete this.peTreeApis[id]
    }

    // Function to refresh pe tree when new item added, deleted or reordered
    refreshPeTrees(cb?: () => void) {
        Object.keys(this.peTreeApis).forEach((id) => {
            this.refreshPeTree(id, cb)
        })
    }

    refreshPeTree(treeId: string, cb?: () => void) {
        if (this.peTreeApis[treeId]) {
            const api = this.peTreeApis[treeId]
            api.treeData.length = 0
            this.getPeTreeData(
                this.treeApi.getRows()[0].branch,
                api.treeConfig.types,
                api.treeData
            )
            api.refresh().then(() => {
                if (cb) cb()
            })
        }
    }

    // Get a list of specific PE type from branch
    getPeTreeData(
        branch: TreeBranch,
        types: string[],
        peTreeData: TreeBranch[]
    ) {
        if (types.includes(branch.type)) {
            peTreeData.push(branch)
        }
        for (let i = 0; i < branch.children.length; i++) {
            this.getPeTreeData(branch.children[i], types, peTreeData)
        }
    }

    /**
     * @ngdoc method
     * @name veUtils/TreeService#buildTreeHierarchy
     * @methodOf veUtils/TreeService
     *
     * @description
     * builds hierarchy of tree branch objects
     *
     * @param {array} array array of objects
     * @param {string} id key of id field
     * @param {string} type type of object
     * @param {object} parent key of parent field
     * @param {angular.IComponentController} ctrl
     * @param {callback} level2_Func function to get child objects
     * @returns {void} root node
     */
    public buildTreeHierarchy = (
        array: ElementObject[],
        id: string,
        type: string,
        parent: string,
        ctrl: angular.IComponentController,
        level2_Func
    ): TreeBranch[] => {
        const rootNodes: TreeBranch[] = []
        const data2Node: { [key: string]: TreeBranch } = {}
        let data = null
        // make first pass to create all nodes
        for (let i = 0; i < array.length; i++) {
            data = array[i]
            data2Node[data[id]] = {
                label: data.name,
                type: type,
                data: data,
                children: [],
                loading: true,
            }
        }
        // make second pass to associate data to parent nodes
        for (let i = 0; i < array.length; i++) {
            data = array[i]
            if (data2Node[data[id]].type === 'group') {
                data2Node[data[id]].loading = false
            }
            // If theres an element in data2Node whose key matches the 'parent' value in the array element
            // add the array element to the children array of the matched data2Node element
            if (data[parent] && data2Node[data[parent]]) {
                //bad data!
                data2Node[data[parent]].children.push(data2Node[data[id]])
            } else {
                // If theres not an element in data2Node whose key matches the 'parent' value in the array element
                // it's a "root node" and so it should be pushed to the root nodes array along with its children

                rootNodes.push(data2Node[data[id]])
            }
        }

        //apply level2 function if available
        if (level2_Func) {
            for (let i = 0; i < array.length; i++) {
                data = array[i]
                const level1_parentNode = data2Node[data[id]]
                level2_Func(ctrl, data, level1_parentNode)
            }
        }

        const sortFunction = (a, b) => {
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
                return 'fa fa-tag'
            case 'connector':
                return 'fa fa-expand'
            case 'dependency':
                return 'fa fa-long-arrow-right'
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
                return 'fa-solid fa-file-circle-quesiton'
        }
    }

    // public refreshNumbering(tree, centerElement) {
    //     this.utilsSvc.makeTablesAndFiguresTOC(tree, centerElement, true, false);
    // };

    // getChangeTypeName = (type: string): string => {
    //     type = type.toLowerCase()
    //     switch (type) {
    //         case 'added':
    //             return 'Addition'
    //         case 'updated':
    //             return 'Modification'
    //         case 'removed':
    //             return 'Removal'
    //     }
    // }
}

veCore.service('TreeService', TreeService)
