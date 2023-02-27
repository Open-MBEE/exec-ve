import { ApplicationService, RootScopeService } from '@ve-utils/application'
import { EventService } from '@ve-utils/core'
import {
    ElementService,
    ProjectService,
    ViewService,
} from '@ve-utils/mms-api-client'

import { veCore } from '@ve-core'

import { VePromise, VePromiseReason, VeQService } from '@ve-types/angular'
import {
    ElementObject,
    ExpressionObject,
    InstanceValueObject,
    ValueObject,
    ViewInstanceSpec,
    ViewObject,
} from '@ve-types/mms'
import { TreeApi, TreeBranch, TreeRow } from '@ve-types/tree'

export class TreeService {
    public initialSelection: string
    public selectedBranch: TreeBranch = null
    public branch2viewNumber: { [key: string]: string } = {}
    public defaultIcon: string = 'fa-solid fa-file fa-fw'
    public defaultIcons = {
        iconExpand: 'fa-solid fa-caret-down fa-lg fa-fw',
        iconCollapse: 'fa-solid fa-caret-right fa-lg fa-fw',
        iconDefault: 'fa-solid fa-file fa-fw',
    }

    public loading: boolean

    private inProgress: VePromise<void, void> = null
    private treeData: TreeBranch[]

    private rootOb: ElementObject[]

    public viewId2node: { [key: string]: TreeBranch } = {}
    public seenViewIds: { [key: string]: TreeBranch } = {}

    public processedRoot: string = ''
    public processedFocus: string = ''

    public treeApi: TreeApi
    private rows: { [id: string]: TreeRow[] }

    treeEditable: boolean

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
        'ElementService',
        'ApplicationService',
        'RootScopeService',
        'EventService',
    ]

    constructor(
        private $q: VeQService,
        private $timeout: angular.ITimeoutService,
        private growl: angular.growl.IGrowlService,
        private projectSvc: ProjectService,
        private elementSvc: ElementService,
        private viewSvc: ViewService,
        private applicationSvc: ApplicationService,
        private rootScopeSvc: RootScopeService,
        private eventSvc: EventService
    ) {}

    public isTreeReady = (): boolean => {
        return this.treeData.length > 0
    }

    public getTreeRows = (id: string): TreeRow[] => {
        return this.rows[id]
    }
    //
    // public setTreeApi = (treeOptions: TreeOptions): void => {
    //     this.treeOptions = treeOptions
    // }

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

    /**
     * @name TreeApi#expandAll
     * self explanatory
     */
    public expandAll = (): VePromise<void, void> => {
        this.forEachBranch((b, level) => {
            //scope.expandCallback({ branch: b });
            b.expanded = true
        }, null)
        return this.$q.resolve()
    }
    /**
     * @name TreeApi#collapseAll
     * self explanatory
     */
    public collapseAll = (
        excludeBranch?: TreeBranch
    ): VePromise<void, void> => {
        this.forEachBranch((b, level) => {
            b.expanded = false
        }, excludeBranch)
        return this.$q.resolve()
    }

    /**
     * Gets the first branch in the tree
     * @returns {TreeBranch}
     */
    public getFirstBranch = (): TreeBranch => {
        if (this.treeData.length > 0) return this.treeData[0]
    }

    /**
     * Selects the first branch in the tree
     */
    public selectFirstBranch = (): VePromise<void, void> => {
        const b = this.getFirstBranch()
        return this.selectBranch(b)
    }

    /**
     * @name TreeApi#getSelectedBranch
     * self explanatory
     *
     * @return {Object} current selected branch
     */
    public getSelectedBranch = (): TreeBranch => {
        return this.selectedBranch
    }

    public clearSelectedBranch = (): void => {
        if (this.selectedBranch) this.selectedBranch.selected = false
        this.selectedBranch = null
    }

    public getChildren = (b: TreeBranch): TreeBranch[] => {
        return b.children
    }

    public selectParentBranch = (branch: TreeBranch): VePromise<void, void> => {
        const p = this.getParent(branch)
        if (p) return this.selectBranch(p)
    }

    /**
     *  @ngdoc function
     * @name TreeApi#addBranch
     * self explanatory
     *
     * @param {TreeBranch} parent the intended parent of the new branch
     * @param {TreeBranch} new_branch new branch to be added to the tree
     * @param {boolean} top boolean determining if this item should be at the top
     */
    public addBranch = (
        parent: TreeBranch,
        new_branch: TreeBranch,
        top: boolean
    ): VePromise<void, void> => {
        if (parent) {
            if (top) parent.children.unshift(new_branch)
            else parent.children.push(new_branch)
            parent.expanded = true
        } else {
            if (top) this.treeData.unshift(new_branch)
            else this.treeData.push(new_branch)
        }
        return this.$q.resolve()
    }

    public removeBranch = (branch: TreeBranch): VePromise<void, void> => {
        this._removeBranch(branch, false)
        return this.$q.resolve()
    }

    public removeSingleBranch = (branch: TreeBranch): VePromise<void, void> => {
        this._removeBranch(branch, true)
        return this.$q.resolve()
    }

    /**
     * @name TreeApi#expandBranch
     * self explanatory
     *
     * @param {TreeBranch} branch branch to expand
     */
    public expandBranch = (branch: TreeBranch): VePromise<void, void> => {
        if (!branch) branch = this.getSelectedBranch()
        if (branch) {
            //scope.expandCallback({ branch: b });
            branch.expanded = true
        }
        return this.$q.resolve()
    }

    /**
     * @name TreeApi#closeBranch
     * self explanatory
     *
     * @param {TreeBranch} branch branch to close
     */
    public closeBranch = (branch: TreeBranch): VePromise<void, void> => {
        if (!branch) branch = this.getSelectedBranch()
        if (branch) {
            //scope.expandCallback({ branch: b });
            branch.expanded = false
        }
        return this.$q.resolve()
    }

    /**
     * Gets siblings of specified branch
     * @param {TreeBranch} branch
     * @returns {TreeBranch[]}
     */
    public getSiblings = (branch: TreeBranch): TreeBranch[] => {
        let siblings: TreeBranch[]
        const p = this.getParent(branch)
        if (p) siblings = p.children
        else siblings = this.treeData
        return siblings
    }

    /**
     * Gets numerically next sibling (if exists) of specified branch
     * @param {TreeBranch} branch
     * @returns {TreeBranch}
     */
    public getNextSibling = (branch: TreeBranch): TreeBranch => {
        const siblings = this.getSiblings(branch)
        if (Array.isArray(siblings)) {
            const i = siblings.indexOf(branch)
            if (i < siblings.length - 1) return siblings[i + 1]
        }
    }

    /**
     * Gets numerically previous sibling (if exists) of specified branch
     * @param {TreeBranch} branch
     * @returns {TreeBranch}
     */
    public getPrevSibling = (branch: TreeBranch): TreeBranch => {
        const siblings = this.getSiblings(branch)
        if (Array.isArray(siblings)) {
            const i = siblings.indexOf(branch)
            if (i > 0) return siblings[i - 1]
        }
    }

    /**
     * Gets the first child of the specified branch (if exists)
     * @param {TreeBranch} branch
     * @returns {TreeBranch}
     */
    public getFirstChild = (branch: TreeBranch): TreeBranch => {
        if (!branch) branch = this.selectedBranch
        if (branch && branch.children && branch.children.length > 0)
            return branch.children[0]
    }

    /**
     * Traverse up/down the tree to find the next closest sibling to the specified branch
     * @param {TreeBranch} branch
     * @returns {TreeBranch}
     */
    public getClosestAncestorNextSibling = (branch: TreeBranch): TreeBranch => {
        let next = this.getNextSibling(branch)
        if (next) return next
        else {
            next = this.getParent(branch)
            return this.getClosestAncestorNextSibling(next)
        }
    }

    /**
     * Gets the next branch in the tree
     * @param {TreeBranch} branch
     * @returns {TreeBranch}
     */
    public getNextBranch = (branch: TreeBranch): TreeBranch => {
        if (!branch) branch = this.selectedBranch
        if (branch) {
            let next = this.getFirstChild(branch)
            if (next) return next
            else {
                next = this.getClosestAncestorNextSibling(branch)
                return next
            }
        }
    }

    /**
     * Returns the last descendant branch of the specified branch
     * @param {TreeBranch} branch
     * @returns {TreeBranch}
     */
    public lastDescendant = (branch: TreeBranch): TreeBranch => {
        if (branch) {
            if (branch.children.length === 0) return branch
            const last = branch.children[branch.children.length - 1]
            return this.lastDescendant(last)
        }
    }

    /**
     * Get's the branch previous to the branch specified
     * @param {TreeBranch} branch
     * @returns {TreeBranch}
     */
    public getPrevBranch = (branch: TreeBranch): TreeBranch => {
        const prev_sibling = this.getPrevSibling(branch)
        if (prev_sibling) return this.lastDescendant(prev_sibling)
        return this.getParent(branch)
    }

    /**
     * @name TreeApi#refresh
     * rerender the tree when data or options change
     */
    public refresh = (treeData: TreeBranch[]): VePromise<void, void> => {
        if (this.inProgress == null) {
            this.inProgress = this.$q.resolve()
        }
        this.treeData.length = 0
        this.treeData.push(...treeData)
        return this._onTreeDataChange()
    }

    public initialSelect = (treeData?: TreeBranch[]): VePromise<void, void> => {
        const deferred = this.$q.defer<void>()
        if (treeData) {
            this.treeData.length = 0
            this.treeData.push(...treeData)
        }
        const initialSelection = this.rootScopeSvc.treeInitialSelection()
        if (initialSelection) {
            this.forEachBranch((b): void => {
                if (b.data.id === initialSelection) {
                    this.selectBranch(b, true).then(
                        () => {
                            this._onTreeDataChange().then(
                                () => deferred.resolve(),
                                (reason) => deferred.reject(reason)
                            )
                        },
                        (reason) => deferred.reject(reason)
                    )
                }
            })
        } else {
            this._onTreeDataChange().then(
                () => deferred.resolve(),
                (reason) => deferred.reject(reason)
            )
        }
        this.rootScopeSvc.treeInitialSelection(null)
        return deferred.promise
    }

    /**
     * @name TreeApi#getBranch
     * Returns the branch with the specified data
     */
    public getBranch = (data: ElementObject): TreeBranch => {
        let branch: TreeBranch = null
        this.forEachBranch((b) => {
            // if (_.isEqual(b.data,data)) {
            //     branch = b;
            // }
            if (b.data.id === data.id) {
                branch = b
            }
        })
        return branch
    }

    /**
     * Runs the specified callback function on each branch in the tree as specified by treeData
     * @param {(branch: TreeBranch, level: number) => void} func
     * @param {TreeBranch} excludeBranch
     */
    public forEachBranch = (
        func: (branch: TreeBranch, level: number) => void,
        excludeBranch?: TreeBranch
    ): void => {
        const run = (branch: TreeBranch, level: number): void => {
            func(branch, level)
            if (branch.children) {
                for (let i = 0; i < branch.children.length; i++) {
                    run(branch.children[i], level + 1)
                }
            }
        }
        const rootLevelBranches = excludeBranch
            ? this.treeData.filter((branch) => {
                  return branch !== excludeBranch
              })
            : this.treeData
        rootLevelBranches.forEach((branch) => {
            run(branch, 1)
        })
    }

    private _removeBranch = (
        branch: TreeBranch,
        singleBranch: boolean
    ): void => {
        const parent_branch = this.getParent(branch)
        if (!parent_branch) {
            for (let j = 0; j < this.treeData.length; j++) {
                if (this.treeData[j].uid === branch.uid) {
                    this.treeData.splice(j, 1)
                    break
                }
            }
            return
        }
        for (let i = 0; i < parent_branch.children.length; i++) {
            if (parent_branch.children[i].uid === branch.uid) {
                parent_branch.children.splice(i, 1)
                if (singleBranch) {
                    break
                }
            }
        }
    }

    /**
     * Gets branch parent
     * @param {TreeBranch} child
     * @returns {TreeBranch}
     */
    public getParent = (child: TreeBranch): TreeBranch => {
        let parent: TreeBranch = null
        if (child !== null && child.parent_uid) {
            this.forEachBranch((b) => {
                if (b.uid === child.parent_uid) {
                    parent = b
                }
            })
        }
        return parent
    }

    public expandPathToSelectedBranch = (): VePromise<void, void> => {
        if (this.selectedBranch) {
            return this.expandAllParents(this.selectedBranch)
        }
        return this.$q.resolve()
    }

    public forAllAncestors = (
        child: TreeBranch,
        fn: (parent: TreeBranch) => VePromise<void, void>
    ): VePromise<void, void> => {
        const parent = this.getParent(child)
        if (parent) {
            return fn(parent).then(() => {
                return this.forAllAncestors(parent, fn)
            })
        }
        return this.$q.resolve()
    }

    public expandAllParents = (child: TreeBranch): VePromise<void, void> => {
        return this.forAllAncestors(child, (b) => {
            if (b.expandable && !b.expanded) {
                return this.expandBranch(b)
            }
            return this.$q.resolve()
        })
    }

    /**
     * Select a branch
     * @param branch
     * @param noClick
     */
    public selectBranch = (
        branch?: TreeBranch,
        noClick?
    ): VePromise<void, void> => {
        const deferred = this.$q.defer<void>()
        if (!branch) {
            if (this.selectedBranch) this.selectedBranch.selected = false
            this.clearSelectedBranch()
            return
        }
        if (branch !== this.selectedBranch) {
            if (this.selectedBranch) this.selectedBranch.selected = false
            branch.selected = true
            this.selectedBranch = branch
        }
        this.expandAllParents(branch).then(
            () => {
                if (!noClick) {
                    if (branch.onSelect != null) {
                        branch.onSelect(branch)
                    } else if (this.treeApi.onSelect) {
                        this.treeApi.onSelect(branch)
                    }
                }
                if (branch.data.id) {
                    this.eventSvc.$broadcast('tree-get-branch-element', {
                        id: branch.data.id,
                    })
                }
                deferred.resolve()
            },
            (reason) => deferred.reject(reason)
        )
        return deferred.promise
    }

    private _onTreeDataChange = (): VePromise<void, void> => {
        return new this.$q<void, void>((resolve, reject) => {
            if (!Array.isArray(this.treeData)) {
                reject({
                    message: '[warn] treeData is not an array!',
                    status: 500,
                })
            }

            const addBranchData = (
                level: number,
                section: string[],
                branch: TreeBranch,
                visible: boolean,
                peNums: { [type: string]: number }
            ): void => {
                if (!branch.uid) branch.uid = `${Math.random()}`
                if (typeof branch.expanded === 'undefined')
                    branch.expanded = level <= this.treeApi.expandLevel
                branch.expandable =
                    branch.children && branch.children.length > 0

                let number = ''
                if (section) number = section.join('.')

                if (!this.treeApi.sectionTypes.includes(branch.type)) {
                    if (!peNums[branch.type]) peNums[branch.type] = 0
                    peNums[branch.type]++
                    if (this.treeApi.numberingDepth === 0) {
                        number = peNums[branch.type].toString(10)
                    } else if (section.length >= this.treeApi.numberingDepth) {
                        number = `${section
                            .slice(0, this.treeApi.numberingDepth)
                            .join('.')}${this.treeApi.numberingSeparator}${
                            peNums[branch.type]
                        }`
                    } else {
                        const sectionCopy = [...section]
                        while (
                            sectionCopy.length < this.treeApi.numberingDepth
                        ) {
                            sectionCopy.push('0')
                        }
                        number = `${sectionCopy.join('.')}${
                            this.treeApi.numberingSeparator
                        }${peNums[branch.type]}`
                    }
                }
                if (
                    branch.data &&
                    branch.data.id &&
                    this.treeApi.sectionNumbering
                ) {
                    this.branch2viewNumber[branch.data.id] = number
                    branch.data._veNumber = number
                }
                if (branch.children) {
                    let alpha = false
                    if (this.treeApi.sort) {
                        branch.children.sort(this._treeSortFunction)
                    }
                    let j = this.treeApi.startChapter
                    if (j === null || j === undefined || level != 1) {
                        j = 1
                    }
                    branch.children.forEach((child) => {
                        child.parent_uid = branch.uid
                        const child_visible = visible && branch.expanded
                        //if (branch.children[i].type === 'section')
                        //    addBranchToList(level + 1, '§ ', branch.children[i], child_visible);
                        if (this.treeApi.sectionNumbering) {
                            if (child.data._isAppendix) {
                                alpha = true
                                j = 0
                            }
                            const nextSection = [
                                ...section,
                                alpha
                                    ? String.fromCharCode(j + 65)
                                    : j.toString(10),
                            ]
                            if (
                                nextSection.length <=
                                this.treeApi.numberingDepth
                            ) {
                                peNums = {}
                            }
                            addBranchData(
                                level + 1,
                                nextSection,
                                child,
                                child_visible,
                                peNums
                            )
                        } else {
                            addBranchData(
                                level + 1,
                                [],
                                child,
                                child_visible,
                                peNums
                            )
                        }
                    })

                    if (this.treeApi.sort) {
                        this.treeData.sort(this._treeSortFunction)
                    }

                    if (
                        !this.treeApi.expandLevel &&
                        this.treeApi.expandLevel !== 0
                    )
                        this.treeApi.expandLevel = 1
                }
            }
            this.treeData.forEach((branch) => {
                addBranchData(1, [], branch, true, {})
            })
            this.eventSvc.resolve(TreeService.events.UPDATED, true)
            resolve()
        })
    }

    public updateRows = (
        id: string,
        types: string[]
    ): VePromise<TreeRow[], void> => {
        return new this.$q<TreeRow[], void>((resolve, reject) => {
            const treeRows: TreeRow[] = []

            const addBranchToList = (
                level: number,
                branch: TreeBranch,
                visible: boolean
            ): void => {
                let typeIcon = this.defaultIcon
                let visibleChild = false
                let aggr = branch.aggr
                if (!aggr) aggr = ''
                else aggr = '-' + aggr.toLowerCase()

                for (let i = 0; i < branch.children.length; i++) {
                    if (
                        types.includes('all') ||
                        types.includes(branch.children[i].type)
                    ) {
                        visibleChild = true
                        break
                    }
                }
                if (this.getTypeIcon(branch.type.toLowerCase() + aggr)) {
                    typeIcon = this.getTypeIcon(
                        branch.type.toLowerCase() + aggr
                    )
                } else if (this.getTypeIcon('default')) {
                    typeIcon = this.getTypeIcon('default')
                }
                let number = ''
                if (this.treeApi.sectionNumbering) {
                    if (branch.data && branch.data._veNumber) {
                        number = branch.data._veNumber
                    }
                }

                if (!types.includes('all') && !types.includes(branch.type))
                    visible = false

                treeRows.push({
                    level,
                    section:
                        number &&
                        !number.includes('undefined') &&
                        !number.includes('NaN')
                            ? number
                            : '',
                    branch,
                    label: branch.label,
                    visibleChild,
                    visible,
                    typeIcon,
                    children: branch.children,
                })

                //This branch is done, stop loading
                branch.loading = false

                //Work on children
                if (branch.children) {
                    branch.children.forEach((child) => {
                        const child_visible = visible && branch.expanded
                        addBranchToList(level + 1, child, child_visible)
                    })
                }
            }
            if (types && types.length > 0) {
                this.branch2viewNumber = {}
                this.treeData.forEach((branch) => {
                    addBranchToList(1, branch, true)
                })
            } else {
                reject({
                    status: 500,
                    message: 'Tree component has no types',
                })
            }
            this.rows[id] = treeRows
            resolve(treeRows)
        })
    }

    // TODO: Update sort function to handle all cases
    private _treeSortFunction = (a: TreeBranch, b: TreeBranch): number => {
        a.priority = 100
        if (a.type === 'tag') {
            a.priority = 0
        } else if (a.type === 'group') {
            a.priority = 1
        } else if (a.type === 'view') {
            a.priority = 2
        }
        b.priority = 100
        if (b.type === 'tag') {
            b.priority = 0
        } else if (b.type === 'group') {
            b.priority = 1
        } else if (b.type === 'view') {
            b.priority = 2
        }

        if (a.priority < b.priority) return -1
        if (a.priority > b.priority) return 1
        if (!a.label) {
            a.label = ''
        }
        if (!b.label) {
            b.label = ''
        }
        if (a.label.toLowerCase() < b.label.toLowerCase()) return -1
        if (a.label.toLowerCase() > b.label.toLowerCase()) return 1
        return 0
    }

    changeRoots = (rootType: string): VePromise<void> => {
        this.processedRoot = this.treeApi.rootOb.id

        const deferred = this.$q.defer<void>()

        if (this.rootScopeSvc.treeShowPe() === null) {
            this.rootScopeSvc.treeShowPe(false)
        }

        // this.tbApi = this.buttonBarSvc.initApi(
        //     'tree-tool-bar',
        //     this.tbInit,
        //     this
        // )
        const treeData: TreeBranch[] = []

        if (rootType === 'portal') {
            // if (this.mmsRef.type === 'Branch') {
            //     treeOptions.sectionTypes.push('view')
            // } else {
            //     treeOptions.sectionTypes.push('snapshot')
            // }
            this.projectSvc
                .getGroups(this.treeApi.projectId, this.treeApi.refId)
                .then(
                    (groups) => {
                        this.viewSvc
                            .getProjectDocuments({
                                projectId: this.treeApi.projectId,
                                refId: this.treeApi.refId,
                            })
                            .then(
                                (documents) => {
                                    treeData.push(
                                        ...this.buildTreeHierarchy(
                                            groups,
                                            'id',
                                            'group',
                                            '_parentId',
                                            this.groupLevel2Func
                                        )
                                    )
                                    documents.forEach((document) => {
                                        if (
                                            !document._groupId ||
                                            document._groupId ==
                                                this.treeApi.projectId
                                        ) {
                                            treeData.push({
                                                label: document.name,
                                                type: 'view',
                                                data: document,
                                                children: [],
                                            })
                                        }
                                    })
                                    this.initialSelect(treeData).then(
                                        () => {
                                            deferred.resolve()
                                        },
                                        (reason) => {
                                            this.growl.error(
                                                TreeService.treeError(reason)
                                            )
                                        }
                                    )
                                },
                                (reason) => {
                                    reason.message =
                                        'Error getting Documents: ' +
                                        reason.message
                                    deferred.reject(reason)
                                }
                            )
                    },
                    (reason) => {
                        reason.message =
                            'Error getting Groups: ' + reason.message
                        deferred.reject(reason)
                    }
                )
        } else {
            this.seenViewIds = {}
            this.viewSvc
                .handleChildViews(
                    this.treeApi.rootOb,
                    'composite',
                    undefined,
                    this.treeApi.projectId,
                    this.treeApi.refId,
                    this.viewId2node,
                    this.handleSingleView,
                    this.handleChildren
                )
                .then(
                    () => {
                        const bulkGet: string[] = []
                        for (const i in this.viewId2node) {
                            const view: ViewObject = this.viewId2node[i].data
                            if (view._contents && view._contents.operand) {
                                for (
                                    let j = 0;
                                    j < view._contents.operand.length;
                                    j++
                                ) {
                                    bulkGet.push(
                                        view._contents.operand[j].instanceId
                                    )
                                }
                            }
                        }
                        this.elementSvc
                            .getElements(
                                {
                                    elementId: bulkGet,
                                    projectId: this.treeApi.projectId,
                                    refId: this.treeApi.refId,
                                },
                                0
                            )
                            .finally(() => {
                                for (const i in this.viewId2node) {
                                    this.addSectionElements(
                                        this.viewId2node[i].data,
                                        this.viewId2node[i],
                                        this.viewId2node[i],
                                        true
                                    )
                                }
                                treeData.push(
                                    this.viewId2node[this.treeApi.rootOb.id]
                                )
                                this.processedFocus = ''
                                this.changeFocus(
                                    this.treeApi.focusId,
                                    treeData
                                ).then(
                                    () => {
                                        deferred.resolve()
                                    },
                                    (reason) => {
                                        deferred.reject(reason)
                                    }
                                )
                            })
                    },
                    (reason) => {
                        deferred.reject(reason)
                    }
                )
        }
        return deferred.promise
    }

    changeFocus = (
        focusId: string,
        treeData?: TreeBranch[]
    ): VePromise<void, void> => {
        if (focusId === this.processedFocus) return

        this.processedFocus = focusId
        this.rootScopeSvc.treeInitialSelection(focusId)

        return this.initialSelect(treeData)
    }

    groupLevel2Func = (groupOb: ElementObject, groupNode: TreeBranch): void => {
        groupNode.loading = true
        this.viewSvc
            .getProjectDocuments(
                {
                    projectId: this.treeApi.projectId,
                    refId: this.treeApi.refId,
                },
                2
            )
            .then(
                (documentObs: ViewObject[]) => {
                    const docs: ViewObject[] = []
                    let docOb: ViewObject, i
                    for (let i = 0; i < documentObs.length; i++) {
                        docOb = documentObs[i]
                        if (docOb._groupId === groupOb.id) {
                            docs.push(docOb)
                        }
                    }
                    for (let i = 0; i < docs.length; i++) {
                        docOb = docs[i]
                        groupNode.children.unshift({
                            label: docOb.name,
                            type:
                                this.treeApi.refType === 'Branch'
                                    ? 'view'
                                    : 'snapshot',
                            data: docOb,
                            group: groupOb,
                            children: [],
                        })
                    }
                    groupNode.loading = false
                },
                (reason) => {
                    this.growl.error(
                        'Error getting project Documents: ' + reason.message
                    )
                }
            )
    }

    handleSingleView = (v: ViewObject, aggr: string): TreeBranch => {
        let curNode = this.viewId2node[v.id]
        if (!curNode) {
            curNode = {
                label: v.name,
                type: 'view',
                data: v,
                children: [],
                loading: true,
                aggr: aggr,
            }
            this.viewId2node[v.id] = curNode
        }
        return curNode
    }

    public handleChildren = (
        curNode: TreeBranch,
        childNodes: TreeBranch[]
    ): void => {
        const newChildNodes: TreeBranch[] = []
        let node: TreeBranch
        for (let i = 0; i < childNodes.length; i++) {
            node = childNodes[i]
            if (this.seenViewIds[node.data.id]) {
                this.growl.error(
                    'Warning: View ' +
                        node.data.name +
                        ' have multiple parents! Duplicates not shown.'
                )
                continue
            }
            this.seenViewIds[node.data.id] = node
            newChildNodes.push(node)
        }
        curNode.children.push(...newChildNodes)
        curNode.loading = false
        //this.eventSvc.$broadcast(TreeService.events.RELOAD)
    }

    processDeletedViewBranch = (branch: TreeBranch): void => {
        const id = branch.data.id
        if (this.seenViewIds[id]) {
            delete this.seenViewIds[id]
        }
        if (this.viewId2node[id]) {
            delete this.viewId2node[id]
        }
        for (let i = 0; i < branch.children.length; i++) {
            this.processDeletedViewBranch(branch.children[i])
        }
    }

    addSectionElements = (
        element: ElementObject,
        viewNode: TreeBranch,
        parentNode: TreeBranch,
        initial?: boolean
    ): void => {
        let contents: ValueObject | null = null

        const addContentsSectionTreeNode = (
            operand: InstanceValueObject[]
        ): void => {
            const bulkGet: string[] = []
            const i = 0
            operand.forEach((operator) => {
                bulkGet.push(operator.instanceId)
            })
            this.elementSvc
                .getElements<ViewInstanceSpec>(
                    {
                        elementId: bulkGet,
                        projectId: this.treeApi.projectId,
                        refId: this.treeApi.refId,
                    },
                    0
                )
                .then(
                    (ignore) => {
                        const instances: VePromise<ViewInstanceSpec>[] = []
                        for (let i = 0; i < operand.length; i++) {
                            instances.push(
                                this.elementSvc.getElement(
                                    {
                                        projectId: this.treeApi.projectId,
                                        refId: this.treeApi.refId,
                                        elementId: operand[i].instanceId,
                                    },
                                    0
                                )
                            )
                        }
                        this.$q.allSettled(instances).then(
                            (results) => {
                                let k = results.length - 1
                                for (; k >= 0; k--) {
                                    const instance: ViewInstanceSpec =
                                        results[k].value
                                    if (this.viewSvc.isSection(instance)) {
                                        const sectionTreeNode = {
                                            label: instance.name
                                                ? instance.name
                                                : viewNode.data.id,
                                            type: 'section',
                                            viewId: viewNode.data.id,
                                            data: instance,
                                            children: [],
                                        }
                                        this.viewId2node[instance.id] =
                                            sectionTreeNode
                                        parentNode.children.unshift(
                                            sectionTreeNode
                                        )
                                        this.addSectionElements(
                                            instance,
                                            viewNode,
                                            sectionTreeNode,
                                            initial
                                        )
                                    } else if (
                                        this.viewSvc.getTreeType(instance) !==
                                        'none'
                                    ) {
                                        const otherTreeNode = {
                                            label: instance.name,
                                            type: this.viewSvc.getTreeType(
                                                instance
                                            ),
                                            viewId: viewNode.data.id,
                                            data: instance,
                                            children: [],
                                        }
                                        parentNode.children.unshift(
                                            otherTreeNode
                                        )
                                    }
                                }
                                if (initial) {
                                    this.initialSelect().catch((reason) => {
                                        this.growl.error(
                                            TreeService.treeError(reason)
                                        )
                                    })
                                } else {
                                    this.eventSvc.$broadcast(
                                        TreeService.events.RELOAD
                                    )
                                }
                            },
                            (reason) => {
                                this.growl.error(TreeService.treeError(reason))
                            }
                        )
                    },
                    (reason) => {
                        this.growl.error(
                            'Error retrieving contained elements: ' +
                                reason.message
                        )
                    }
                )
        }

        if (element._contents) {
            contents = (element as ViewObject)._contents
        } else if (this.viewSvc.isSection(element) && element.specification) {
            contents = (element as ViewInstanceSpec).specification // For Sections, the contents expression is the specification
        } else {
            //bad?
        }
        if (contents && contents.operand) {
            addContentsSectionTreeNode((contents as ExpressionObject).operand)
        }
    }
}

veCore.service('TreeService', TreeService)
