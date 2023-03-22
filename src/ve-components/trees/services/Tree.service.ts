import { IQResolveReject } from 'angular'

import { ApplicationService, RootScopeService } from '@ve-utils/application'
import { EventService } from '@ve-utils/core'
import { ApiService, ElementService, ProjectService, ViewService } from '@ve-utils/mms-api-client'

import { veCore } from '@ve-core'

import { VePromise, VePromiseReason, VeQService } from '@ve-types/angular'
import {
    ElementObject,
    ElementsRequest,
    ExpressionObject,
    InstanceValueObject,
    ValueObject,
    ViewInstanceSpec,
    ViewObject,
} from '@ve-types/mms'
import { TreeApi, TreeBranch, TreeRow } from '@ve-types/tree'

export class TreeService {
    public selectedBranch: TreeBranch = null
    public branch2viewNumber: { [key: string]: string } = {}
    public defaultIcon: string = 'fa-solid fa-file fa-fw'
    public defaultIcons = {
        iconExpand: 'fa-solid fa-caret-down fa-lg fa-fw',
        iconCollapse: 'fa-solid fa-caret-right fa-lg fa-fw',
        iconDefault: 'fa-solid fa-file fa-fw',
    }

    public defaultSectionTypes = ['group', 'view', 'section']

    public loading: boolean

    private inProgress: VePromise<void, unknown> = null
    private treeData: TreeBranch[] = []

    public viewId2node: { [key: string]: TreeBranch } = {}
    public seenViewIds: { [key: string]: TreeBranch } = {}

    public processedRoot: string = ''
    public processedFocus: string = ''

    public treeApi: TreeApi
    private rows: { [id: string]: TreeRow[] } = {}

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
        'ApiService',
        'ProjectService',
        'ElementService',
        'ViewService',
        'ApplicationService',
        'RootScopeService',
        'EventService',
    ]

    constructor(
        private $q: VeQService,
        private $timeout: angular.ITimeoutService,
        private growl: angular.growl.IGrowlService,
        private apiSvc: ApiService,
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
        level2_Func: (elementOb: ElementObject, node: TreeBranch) => VePromise<void, unknown>
    ): VePromise<TreeBranch[], unknown> => {
        return new this.$q<TreeBranch[], unknown>((resolve, reject) => {
            const rootNodes: TreeBranch[] = []
            const data2Node: { [key: string]: TreeBranch } = {}
            // create flat map for each element
            elementObs.forEach((elementOb) => {
                const elementId: string = elementOb[idKey] as string
                data2Node[elementId] = {
                    label: elementOb.name,
                    type: type,
                    data: elementOb,
                    children: [],
                    loading: true,
                }
            })

            // make second pass to associate data to parent nodes
            elementObs.forEach((elementOb) => {
                const parentId: string = elementOb[parentKey] as string
                const elementId: string = elementOb[idKey] as string

                // If there's an element in data2Node whose key matches the 'parent' value in the array element
                // add the array element to the children array of the matched data2Node element
                if (parentId && data2Node[parentId]) {
                    data2Node[parentId].children.push(data2Node[elementId])
                } else {
                    // If there's not an element in data2Node whose key matches the 'parent' value in the array element
                    // it's a "root node" and so it should be pushed to the root nodes array along with its children

                    rootNodes.push(data2Node[elementId])
                }
            })

            //apply level2 function if available
            if (level2_Func) {
                elementObs.forEach((elementOb) => {
                    const elementId: string = elementOb[idKey] as string
                    const level1_parentNode = data2Node[elementId]
                    level2_Func(elementOb, level1_parentNode).catch(reject)
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
            resolve(rootNodes)
        })
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
     * self-explanatory
     */
    public expandAll = (): VePromise<void, unknown> => {
        return this.forEachBranch((b) => {
            //scope.expandCallback({ branch: b });
            b.expanded = true
        }, false)
    }
    /**
     * @name TreeApi#collapseAll
     * self-explanatory
     */
    public collapseAll = (excludeBranch?: TreeBranch): VePromise<void, unknown> => {
        return this.forEachBranch(
            (b, level) => {
                b.expanded = false
            },
            false,
            excludeBranch
        )
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
    public selectFirstBranch = (): VePromise<void, unknown> => {
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

    public selectParentBranch = (branch: TreeBranch): VePromise<void, unknown> => {
        return this.$q<void, unknown>((resolve, reject) => {
            this.getParent(branch).then((p) => {
                this.selectBranch(p).then(resolve, reject)
            }, reject)
        })
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
    public addBranch = (parent: TreeBranch, new_branch: TreeBranch, top: boolean): VePromise<void, unknown> => {
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

    public removeBranch = (branch: TreeBranch): VePromise<void, unknown> => {
        this._removeBranch(branch, false)
        return this.$q.resolve()
    }

    public removeSingleBranch = (branch: TreeBranch): VePromise<void, unknown> => {
        this._removeBranch(branch, true)
        return this.$q.resolve()
    }

    /**
     * @name TreeApi#expandBranch
     * self explanatory
     *
     * @param {TreeBranch} branch branch to expand
     */
    public expandBranch = (branch: TreeBranch): VePromise<void, unknown> => {
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
    public closeBranch = (branch: TreeBranch): VePromise<void, unknown> => {
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
    public getSiblings = (branch: TreeBranch): VePromise<TreeBranch[], unknown> => {
        return this.$q<TreeBranch[], unknown>((resolve) => {
            this.getParent(branch).then(
                (p) => {
                    resolve(p.children)
                },
                () => {
                    resolve(this.treeData)
                }
            )
        })
    }

    /**
     * Gets numerically next sibling (if exists) of specified branch
     * @param {TreeBranch} branch
     * @returns {TreeBranch}
     */
    public getNextSibling = (branch: TreeBranch): VePromise<TreeBranch, unknown> => {
        return this.$q<TreeBranch, unknown>((resolve, reject) => {
            this.getSiblings(branch).then((siblings) => {
                if (Array.isArray(siblings)) {
                    const i = siblings.indexOf(branch)
                    if (i < siblings.length - 1) resolve(siblings[i + 1])
                }
            }, reject)
        })
    }

    /**
     * Gets numerically previous sibling (if exists) of specified branch
     * @param {TreeBranch} branch
     * @returns {TreeBranch}
     */
    public getPrevSibling = (branch: TreeBranch): VePromise<TreeBranch, unknown> => {
        return this.$q<TreeBranch, unknown>((resolve, reject) => {
            this.getSiblings(branch).then((siblings) => {
                if (Array.isArray(siblings)) {
                    const i = siblings.indexOf(branch)
                    if (i < siblings.length - 1) resolve(siblings[i - 1])
                    else reject()
                }
            }, reject)
        })
    }

    /**
     * Gets the first child of the specified branch (if exists)
     * @param {TreeBranch} branch
     * @returns {TreeBranch}
     */
    public getFirstChild = (branch: TreeBranch): TreeBranch => {
        if (!branch) branch = this.selectedBranch
        if (branch && branch.children && branch.children.length > 0) return branch.children[0]
    }

    /**
     * Traverse up/down the tree to find the next closest sibling to the specified branch
     * @param {TreeBranch} branch
     * @returns {TreeBranch}
     */
    public getClosestAncestorNextSibling = (branch: TreeBranch): VePromise<TreeBranch, unknown> => {
        return this.$q<TreeBranch, unknown>((resolve, reject) => {
            this.getNextSibling(branch).then(
                (b) => {
                    resolve(b)
                },
                () => {
                    this.getParent(branch).then((next) => {
                        this.getClosestAncestorNextSibling(next).then(resolve, reject)
                    }, reject)
                }
            )
        })
    }

    /**
     * Gets the next branch in the tree
     * @param {TreeBranch} branch
     * @param {string[]} types - If defined will continue on to the next branch if the results' type is not included in
     *                          this list
     * @returns {TreeBranch}
     */
    public getNextBranch = (branch: TreeBranch, types?: string[]): VePromise<TreeBranch, unknown> => {
        return this.$q<TreeBranch, unknown>((resolve, reject) => {
            if (!branch) branch = this.selectedBranch
            if (branch) {
                const next = this.getFirstChild(branch)
                if (next) resolve(next)
                else {
                    this.getClosestAncestorNextSibling(branch).then((nextSib) => {
                        if (types && !types.includes(nextSib.type)) {
                            this.getNextBranch(nextSib).then(resolve, reject)
                        } else {
                            resolve(nextSib)
                        }
                    }, reject)
                }
            } else reject({ message: 'No More branches!', status: 200 })
        })
    }

    /**
     * Returns the last descendant branch of the specified branch
     * @param {TreeBranch} branch
     * @returns {TreeBranch}
     */
    public lastDescendant = (branch: TreeBranch): VePromise<TreeBranch, unknown> => {
        return new this.$q<TreeBranch, unknown>((resolve, reject) => {
            if (branch) {
                if (branch.children.length === 0) resolve(branch)
                const last = branch.children[branch.children.length - 1]
                return this.lastDescendant(last).then(resolve, reject)
            } else {
                reject({ message: 'No branch Specified', status: 401 })
            }
        })
    }

    /**
     * Get's the branch previous to the branch specified
     * @param {TreeBranch} branch
     * @param {string[]} types - If defined will continue on to the next previous branch if the results' type is not included in
     *                          this list
     * @returns {TreeBranch}
     */
    public getPrevBranch = (branch: TreeBranch, types?: string[]): VePromise<TreeBranch, unknown> => {
        return new this.$q<TreeBranch, unknown>((resolve, reject) => {
            this.getPrevSibling(branch).then(
                (prevSibling) => {
                    this.lastDescendant(prevSibling).then((last) => {
                        if (types && !types.includes(last.type)) {
                            this.getPrevBranch(last, types).then(resolve, reject)
                        } else {
                            resolve(last)
                        }
                    }, reject)
                },
                () => {
                    this.getParent(branch).then(resolve, reject)
                }
            )
        })
    }

    /**
     * @name TreeApi#refresh
     * rerender the tree when data or options change
     */
    public refresh = (treeData: TreeBranch[]): VePromise<void, unknown> => {
        if (this.inProgress == null) {
            this.inProgress = this.$q.resolve()
        }
        this.treeData.length = 0
        this.treeData.push(...treeData)
        return this._onTreeDataChange()
    }

    /**
     * @name TreeApi#getBranch
     * Returns the branch with the specified data
     */
    public getBranch = (data: ElementObject): VePromise<TreeBranch, unknown> => {
        return new this.$q<TreeBranch, unknown>((resolve, reject) => {
            this.forEachBranch((b) => {
                if (b.data.id === data.id) {
                    resolve(b)
                }
            }).catch(reject)
        })
    }

    /**
     * Runs the specified callback function on each branch in the tree as specified by treeData
     * @param {(branch: TreeBranch, level: number) => void} func
     * @param {TreeBranch} excludeBranch
     */
    public forEachBranch = (
        func: (branch: TreeBranch, flag?: boolean) => void,
        useFlag?: boolean,
        excludeBranch?: TreeBranch
    ): VePromise<void, unknown> => {
        return new this.$q<void, unknown>((resolve, reject) => {
            const flag = false
            const run = (branch: TreeBranch, level: number, flag: boolean): void => {
                if (flag && !useFlag) resolve()
                func(branch, flag)
                if (branch.children) {
                    for (let i = 0; i < branch.children.length; i++) {
                        run(branch.children[i], level + 1, flag)
                    }
                }
            }
            const rootLevelBranches = excludeBranch
                ? this.treeData.filter((branch) => {
                      return branch !== excludeBranch
                  })
                : this.treeData
            rootLevelBranches.forEach((branch) => {
                run(branch, 1, flag)
            })
            if (!useFlag) resolve()
            else reject({ message: 'No valid Branches found', status: 401 })
        })
    }

    private _removeBranch = (branch: TreeBranch, singleBranch: boolean): void => {
        this.getParent(branch).then(
            (parentBranch) => {
                for (let i = 0; i < parentBranch.children.length; i++) {
                    if (parentBranch.children[i].uid === branch.uid) {
                        parentBranch.children.splice(i, 1)
                        if (singleBranch) {
                            break
                        }
                    }
                }
            },
            () => {
                for (let j = 0; j < this.treeData.length; j++) {
                    if (this.treeData[j].uid === branch.uid) {
                        this.treeData.splice(j, 1)
                        break
                    }
                }
            }
        )
    }

    /**
     * Gets branch parent
     * @param {TreeBranch} child
     * @returns {TreeBranch}
     */
    public getParent = (child: TreeBranch): VePromise<TreeBranch, unknown> => {
        return new this.$q<TreeBranch, unknown>((resolve, reject) => {
            if (child === null) reject({ message: 'No child specified!', status: 404 })

            if (child.parent_uid) {
                this.forEachBranch((b) => {
                    if (b.uid === child.parent_uid) {
                        resolve(b)
                    }
                }).catch(reject)
            } else {
                reject({ message: 'Already at root!', status: 200 })
            }
        })
    }

    public expandPathToSelectedBranch = (): VePromise<void, unknown> => {
        if (this.selectedBranch) {
            return this.expandAllParents(this.selectedBranch)
        }
        return this.$q.resolve()
    }

    public forAllAncestors = (
        child: TreeBranch,
        fn: (parent: TreeBranch) => VePromise<void, unknown>
    ): VePromise<void, unknown> => {
        return new this.$q<void, unknown>((resolve, reject) => {
            this.getParent(child).then(
                (parent) => {
                    fn(parent).then(() => {
                        this.forAllAncestors(parent, fn).then(resolve, reject)
                    }, reject)
                },
                () => {
                    resolve()
                }
            )
        })
    }

    public expandAllParents = (child: TreeBranch): VePromise<void, unknown> => {
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
    public selectBranch = (branch?: TreeBranch, noClick?): VePromise<void, unknown> => {
        const deferred = this.$q.defer<void>()
        if (!branch) {
            if (this.selectedBranch) this.selectedBranch.selected = false
            this.clearSelectedBranch()
            return this.$q.resolve()
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

    private _onTreeDataChange = (): VePromise<void, unknown> => {
        return new this.$q<void, void>((resolve, reject) => {
            if (!Array.isArray(this.treeData)) {
                reject({
                    message: '[warn] treeData is not an array!',
                    status: 401,
                })
            }

            this.treeData.forEach((branch) => {
                this._addBranchData(1, [], branch, true, {})
            })

            this.eventSvc.resolve<boolean>(TreeService.events.UPDATED, true)
            this.eventSvc.$broadcast('tree.ready')
            resolve()
        })
    }

    private _addBranchData = (
        level: number,
        section: string[],
        branch: TreeBranch,
        visible: boolean,
        peNums: { [type: string]: number }
    ): void => {
        if (!branch.uid) branch.uid = `${Math.random()}`
        if (typeof branch.expanded === 'undefined') branch.expanded = level <= this.treeApi.expandLevel
        branch.expandable = branch.children && branch.children.length > 0
        branch.favorite = false

        let number = ''
        if (section) number = section.join('.')

        // Handle numbering of non-section types
        if (!this.defaultSectionTypes.includes(branch.type)) {
            if (!peNums[branch.type]) peNums[branch.type] = 0
            peNums[branch.type]++
            if (this.treeApi.numberingDepth === 0 && !this.defaultSectionTypes.includes(branch.type)) {
                number = peNums[branch.type].toString(10)
            } else if (section.length >= this.treeApi.numberingDepth) {
                number = `${section.slice(0, this.treeApi.numberingDepth).join('.')}${this.treeApi.numberingSeparator}${
                    peNums[branch.type]
                }`
            } else {
                const sectionCopy = [...section]
                while (sectionCopy.length < this.treeApi.numberingDepth) {
                    sectionCopy.push('0')
                }
                number = `${sectionCopy.join('.')}${this.treeApi.numberingSeparator}${peNums[branch.type]}`
            }
        }
        if (branch.data && branch.data.id && this.treeApi.sectionNumbering) {
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
                if (!this.defaultSectionTypes.includes(child.type)) {
                    this._addBranchData(level + 1, section, child, child_visible, peNums)
                } else {
                    if (this.treeApi.sectionNumbering) {
                        if (child.data._isAppendix) {
                            alpha = true
                            j = 0
                        }
                        const nextSection = [...section, alpha ? String.fromCharCode(j + 65) : j.toString(10)]
                        if (nextSection.length <= this.treeApi.numberingDepth) {
                            peNums = {}
                        }
                        this._addBranchData(level + 1, nextSection, child, child_visible, peNums)
                    } else {
                        this._addBranchData(level + 1, [], child, child_visible, peNums)
                    }
                    j++
                }
            })

            if (this.treeApi.sort) {
                this.treeData.sort(this._treeSortFunction)
            }

            if (!this.treeApi.expandLevel && this.treeApi.expandLevel !== 0) this.treeApi.expandLevel = 1
        }
        branch.loading = false
        this.eventSvc.resolve<boolean>(TreeService.events.UPDATED, false)
    }

    public updateRows = (id: string, types: string[], treeRows: TreeRow[]): VePromise<TreeRow[], void> => {
        treeRows.length = 0
        return new this.$q<TreeRow[], void>((resolve, reject) => {
            const addBranchToList = (level: number, branch: TreeBranch, visible: boolean): void => {
                let typeIcon = this.defaultIcon
                let visibleChild = false
                let aggr = branch.aggr
                if (!aggr) aggr = ''
                else aggr = '-' + aggr.toLowerCase()

                for (let i = 0; i < branch.children.length; i++) {
                    if (
                        types.includes('all') ||
                        types.includes(branch.children[i].type) ||
                        (types.includes('favorite') && branch.favorite)
                    ) {
                        visibleChild = true
                        break
                    }
                }
                if (this.getTypeIcon(branch.type.toLowerCase() + aggr)) {
                    typeIcon = this.getTypeIcon(branch.type.toLowerCase() + aggr)
                } else if (this.getTypeIcon('default')) {
                    typeIcon = this.getTypeIcon('default')
                }
                let number = ''
                if (this.treeApi.sectionNumbering) {
                    if (branch.data && branch.data._veNumber) {
                        number = branch.data._veNumber
                    }
                }

                if (
                    types.includes('all') ||
                    types.includes(branch.type) ||
                    (types.includes('favorite') && branch.favorite)
                ) {
                    const treeRow = {
                        level,
                        section: number && !number.includes('undefined') && !number.includes('NaN') ? number : '',
                        branch,
                        label: branch.label,
                        visibleChild,
                        visible,
                        typeIcon,
                        children: branch.children,
                    }
                    treeRows.push(treeRow)
                }

                //Work on children
                if (branch.children) {
                    branch.children.forEach((child) => {
                        const child_visible = visible && branch.expanded
                        addBranchToList(level + 1, child, child_visible)
                    })
                    //This branch is done, stop loading
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

    changeRoots = (root?: ElementObject): VePromise<void, unknown> => {
        this.processedRoot = this.treeApi.rootId

        const treeData: TreeBranch[] = []
        return new this.$q<void, unknown>((resolve, reject) => {
            if (!root) {
                // if (this.mmsRef.type === 'Branch') {
                //     treeOptions.sectionTypes.push('view')
                // } else {
                //     treeOptions.sectionTypes.push('snapshot')
                // }
                this.projectSvc.getGroups(this.treeApi.projectId, this.treeApi.refId).then(
                    (groups) => {
                        this.viewSvc
                            .getProjectDocuments({
                                projectId: this.treeApi.projectId,
                                refId: this.treeApi.refId,
                            })
                            .then(
                                (documents) => {
                                    this.buildTreeHierarchy(
                                        groups,
                                        'id',
                                        'group',
                                        '_parentId',
                                        this.groupLevel2Func
                                    ).then((treeHierarchy) => {
                                        treeData.push(...treeHierarchy)
                                        documents.forEach((document) => {
                                            if (!document._groupId || document._groupId == this.treeApi.projectId) {
                                                treeData.push({
                                                    label: document.name,
                                                    type: 'view',
                                                    data: document,
                                                    children: [],
                                                })
                                            }
                                        })
                                        this.processedFocus = ''
                                        if (treeData.length > 0) {
                                            this.treeData.length = 0
                                            this.treeData.push(...treeData)
                                        }
                                        this.changeElement().then(resolve, reject)
                                    }, reject)
                                },
                                (reason) => {
                                    reason.message = 'Error getting Documents: ' + reason.message
                                    reject(reason)
                                }
                            )
                    },
                    (reason) => {
                        reason.message = 'Error getting Groups: ' + reason.message
                        reject(reason)
                    }
                )
            } else {
                this.seenViewIds = {}
                this.viewId2node = {}
                const reqOb: ElementsRequest<string> = {
                    elementId: this.treeApi.rootId,
                    refId: this.treeApi.refId,
                    projectId: this.treeApi.projectId,
                }
                this.elementSvc.getElement<ViewObject>(reqOb).then((root) => {
                    if (this.apiSvc.isView(root)) {
                        const rootBranch = this.handleSingleView(root, 'composite')
                        this.treeData.length = 0
                        this.treeData.push(rootBranch)
                        this._onTreeDataChange().catch(reject)
                        this.viewSvc
                            .handleChildViews(
                                root,
                                'composite',
                                undefined,
                                this.treeApi.projectId,
                                this.treeApi.refId,
                                this.viewId2node,
                                this.handleSingleView,
                                this.handleChildren
                            )
                            .then(() => {
                                const bulkGet: string[] = []
                                for (const i in this.viewId2node) {
                                    const view: ViewObject = this.viewId2node[i].data
                                    if (view._contents && view._contents.operand) {
                                        for (let j = 0; j < view._contents.operand.length; j++) {
                                            bulkGet.push(view._contents.operand[j].instanceId)
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
                                            ).catch(reject)
                                        }
                                        this.processedFocus = ''
                                        this.changeElement().then(resolve, reject)
                                    })
                            }, reject)
                    } else {
                        //TODO: Implement Collect Owned Elements Logic
                    }
                }, reject)
            }
        })
    }

    changeElement = (): VePromise<void, unknown> => {
        if (this.treeApi.elementId === this.processedFocus)
            return new this.$q<void, unknown>((resolve, reject) => {
                resolve()
            })

        this.processedFocus = this.treeApi.elementId
        return new this.$q<void, unknown>((resolve, reject) => {
            //As of right now the project portal page is 'hidden' so it won't appear in the tree
            if (this.treeApi.elementId === this.treeApi.projectId + '_cover')
                this._onTreeDataChange().then(resolve, reject)
            else {
                this.forEachBranch((b): void => {
                    if (b.data.id === this.treeApi.elementId) {
                        this.selectBranch(b, true).then(
                            () => {
                                this._onTreeDataChange().then(resolve, reject)
                            },
                            (reason) => {
                                reject(reason)
                            }
                        )
                    }
                }).catch((reason) => {
                    reject({
                        message: 'Invalid tree selection:' + reason.message,
                        status: 401,
                    })
                })
            }
        })
    }

    groupLevel2Func = (groupOb: ElementObject, groupNode: TreeBranch): VePromise<void, unknown> => {
        groupNode.loading = true
        return new this.$q<void, unknown>((resolve, reject) => {
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
                                type: this.treeApi.refType === 'Branch' ? 'view' : 'snapshot',
                                data: docOb,
                                group: groupOb,
                                children: [],
                            })
                        }
                        this._onTreeDataChange().catch(reject)
                        resolve()
                    },
                    (reason) => {
                        reason.message = 'Error getting project Documents: ' + reason.message
                        reject(reason)
                    }
                )
        })
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
        childNodes: TreeBranch[],
        reject: IQResolveReject<VePromiseReason<unknown>>
    ): void => {
        const newChildNodes: TreeBranch[] = []
        let node: TreeBranch
        for (let i = 0; i < childNodes.length; i++) {
            node = childNodes[i]
            if (this.seenViewIds[node.data.id]) {
                this.growl.error('Warning: View ' + node.data.name + ' have multiple parents! Duplicates not shown.')
                continue
            }
            this.seenViewIds[node.data.id] = node
            newChildNodes.push(node)
        }
        curNode.children.push(...newChildNodes)
        this._onTreeDataChange().catch(reject)
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
    ): VePromise<void, unknown> => {
        return new this.$q<void, unknown>((resolve, reject) => {
            let contents: ValueObject | null = null

            const addContentsSectionTreeNode = (operand: InstanceValueObject[]): void => {
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
                            this.$q.allSettled(instances).then((results) => {
                                let k = results.length - 1
                                for (; k >= 0; k--) {
                                    const instance: ViewInstanceSpec = results[k].value
                                    if (this.viewSvc.isSection(instance)) {
                                        const sectionTreeNode = {
                                            label: instance.name ? instance.name : viewNode.data.id,
                                            type: 'section',
                                            viewId: viewNode.data.id,
                                            data: instance,
                                            children: [],
                                        }
                                        this.viewId2node[instance.id] = sectionTreeNode
                                        parentNode.children.unshift(sectionTreeNode)
                                        this.addSectionElements(instance, viewNode, sectionTreeNode, initial).catch(
                                            reject
                                        )
                                    } else if (this.viewSvc.getTreeType(instance) !== 'none') {
                                        const otherTreeNode: TreeBranch = {
                                            label: instance.name,
                                            type: this.viewSvc.getTreeType(instance),
                                            data: instance,
                                            children: [],
                                        }
                                        if (otherTreeNode.type !== 'view') {
                                            otherTreeNode.viewId = viewNode.data.id
                                        }
                                        parentNode.children.unshift(otherTreeNode)
                                    }
                                    this._onTreeDataChange().catch(reject)
                                }
                                if (initial) {
                                    this.changeElement().catch(reject)
                                }
                            }, reject)
                        },
                        (reason) => {
                            reason.message = 'Error retrieving contained elements: ' + reason.message
                            reject(reason)
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
            resolve()
        })
    }
}

veCore.service('TreeService', TreeService)
