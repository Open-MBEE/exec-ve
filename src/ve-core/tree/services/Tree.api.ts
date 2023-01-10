import angular from 'angular'

import { TreeService } from '@ve-core/tree'
import { EventService } from '@ve-utils/services'

import { VePromise, VeQService } from '@ve-types/angular'
import { ElementObject } from '@ve-types/mms'
import { TreeBranch, TreeConfig, TreeOptions, TreeRow } from '@ve-types/tree'

export class TreeApi {
    public treeData: TreeBranch[] = []
    private treeRows: TreeRow[] = []
    public treeOptions: TreeOptions = null
    public initialSelection: string
    public selectedBranch: TreeBranch = null
    public branch2viewNumber: { [key: string]: string } = {}
    public defaultIcon: string = 'fa-solid fa-file fa-fw'
    public peTree: boolean
    public treeConfig: TreeConfig

    public loading: boolean

    private inProgress: VePromise<void, void>

    constructor(
        private $q: VeQService,
        private $timeout: angular.ITimeoutService,
        private eventSvc: EventService,
        config: TreeConfig,
        peTree: boolean
    ) {
        this.treeConfig = config
        this.peTree = peTree
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
        return this.refresh()
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
        return this.refresh()
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
        return this.refresh()
    }

    public removeBranch = (branch: TreeBranch): VePromise<void, void> => {
        this._removeBranch(branch, false)
        return this.refresh()
    }

    public removeSingleBranch = (branch: TreeBranch): VePromise<void, void> => {
        this._removeBranch(branch, true)
        return this.refresh()
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
        return this.refresh()
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
        return this.refresh()
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
    public refresh = (): VePromise<void, void> => {
        if (!this.loading) {
            this.loading = true
            return (this.inProgress = this._onTreeDataChange().then(() => {
                this.loading = false
                return
            }))
        }
        return this.inProgress.then(() => {
            this.loading = true
            return (this.inProgress = this._onTreeDataChange().then(() => {
                this.loading = false
                return
            }))
        })
    }

    public initialSelect = (): VePromise<void, void> => {
        const deferred = this.$q.defer<void>()
        const initialSelection = this.initialSelection
        if (initialSelection) {
            this.forEachBranch((b): void => {
                if (b.data.id === initialSelection) {
                    this.selectBranch(b, true).then(
                        () => deferred.resolve(),
                        (reason) => deferred.reject(reason)
                    )
                }
            })
        } else {
            this.refresh().then(
                () => {
                    deferred.resolve()
                },
                (reason) => {
                    deferred.reject(reason)
                }
            )
        }
        this.initialSelection = null
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

    public getRows = (): TreeRow[] => {
        return this.treeRows
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
                    } else if (this.treeOptions.onSelect) {
                        this.treeOptions.onSelect(branch)
                    }
                }
                if (branch.data.id) {
                    this.eventSvc.$broadcast('tree-get-branch-element', {
                        id: branch.data.id,
                        treeId: this.treeConfig.id,
                    })
                }
                deferred.resolve()
            },
            (reason) => deferred.reject(reason)
        )
        return deferred.promise
    }

    private _onTreeDataChange = (): VePromise<void, void> => {
        return this.$q<void, void>((resolve, reject) => {
            if (!Array.isArray(this.treeData)) {
                reject({
                    message: '[warn] treeData is not an array!',
                    status: 500,
                })
            }
            this.forEachBranch((b, level) => {
                if (!b.uid) b.uid = `${Math.random()}`
            })
            this.forEachBranch((b) => {
                if (Array.isArray(b.children)) {
                    for (let i = 0; i < b.children.length; i++) {
                        const child = b.children[i]
                        child.parent_uid = b.uid
                    }
                }
            })
            this.treeRows.length = 0
            const tree_rows: TreeRow[] = []

            if (this.treeOptions.sort) {
                this.treeData.sort(this._treeSortFunction)
            }
            const addBranchToList = (
                level: number,
                section: string[],
                branch: TreeBranch,
                visible: boolean,
                peNums: { [type: string]: number }
            ): void => {
                let type_icon = this.defaultIcon
                let haveVisibleChild = false
                let aggr = branch.aggr
                if (!aggr) aggr = ''
                else aggr = '-' + aggr.toLowerCase()
                if (!branch.expanded) branch.expanded = false

                if (
                    (branch.children && branch.children.length > 0) ||
                    branch.expandable === true
                ) {
                    if (
                        this.treeConfig.types &&
                        !this.treeConfig.types.includes(branch.type)
                    )
                        haveVisibleChild = false
                    for (let i = 0; i < branch.children.length; i++) {
                        if (!branch.children[i].hide) {
                            haveVisibleChild = true
                            break
                        }
                    }
                }
                if (this.treeOptions && this.treeOptions.typeIcons) {
                    if (
                        this.treeOptions.typeIcons[
                            branch.type.toLowerCase() + aggr
                        ]
                    ) {
                        type_icon =
                            this.treeOptions.typeIcons[
                                branch.type.toLowerCase() + aggr
                            ]
                    } else if (this.treeOptions.typeIcons['default']) {
                        type_icon = this.treeOptions.typeIcons['default']
                    }
                }
                let number = ''
                if (!this.peTree) {
                    if (section) number = section.join('.')
                    if (
                        this.treeConfig.types &&
                        !this.treeConfig.types.includes(branch.type)
                    ) {
                        peNums[branch.type]++
                        if (this.treeOptions.numberingDepth === 0) {
                            number = peNums[branch.type].toString(10)
                        } else if (
                            section.length >= this.treeOptions.numberingDepth
                        ) {
                            number = `${section
                                .slice(0, this.treeOptions.numberingDepth)
                                .join('.')}${
                                this.treeOptions.numberingSeparator
                            }${peNums[branch.type]}`
                        } else {
                            const sectionCopy = [...section]
                            while (
                                sectionCopy.length <
                                this.treeOptions.numberingDepth
                            ) {
                                sectionCopy.push('0')
                            }
                            number = `${sectionCopy.join('.')}${
                                this.treeOptions.numberingSeparator
                            }${peNums[branch.type]}`
                        }
                    }
                    if (
                        branch.data &&
                        branch.data.id &&
                        this.treeOptions.sectionNumbering
                    ) {
                        this.branch2viewNumber[branch.data.id] = number
                        branch.data._veNumber = number
                    }
                } else if (branch.data._veNumber) {
                    number = branch.data._veNumber
                }
                if (!this.peTree && branch.hide) visible = false
                else if (this.peTree && level === 1) visible = true

                tree_rows.push({
                    level: level,
                    section: number,
                    branch: branch,
                    label: branch.label,
                    visibleChild: haveVisibleChild,
                    visible: visible,
                    type_icon: type_icon,
                    children: branch.children,
                })

                if (branch.children) {
                    let alpha = false
                    if (this.treeOptions.sort) {
                        branch.children.sort(this._treeSortFunction)
                    }
                    let j = this.treeOptions.startChapter
                    if (j === null || j === undefined || level != 1) {
                        j = 1
                    }
                    for (let i = 0; i < branch.children.length; i++) {
                        const child_visible = visible && branch.expanded
                        //if (branch.children[i].type === 'section')
                        //    addBranchToList(level + 1, '§ ', branch.children[i], child_visible);
                        if (
                            branch.children[i].type === 'figure' ||
                            branch.children[i].type === 'table' ||
                            branch.children[i].type === 'equation'
                        ) {
                            addBranchToList(
                                level + 1,
                                section,
                                branch.children[i],
                                child_visible,
                                peNums
                            )
                        } else {
                            if (this.treeOptions.sectionNumbering) {
                                if (branch.children[i].data._isAppendix) {
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
                                    this.treeOptions.numberingDepth
                                ) {
                                    peNums.table = 0
                                    peNums.figure = 0
                                    peNums.equaton = 0
                                }
                                addBranchToList(
                                    level + 1,
                                    nextSection,
                                    branch.children[i],
                                    child_visible,
                                    peNums
                                )
                            } else {
                                addBranchToList(
                                    level + 1,
                                    [],
                                    branch.children[i],
                                    child_visible,
                                    peNums
                                )
                            }
                            j++
                        }
                    }
                }
            }

            this.branch2viewNumber = {}
            for (let i = 0; i < this.treeData.length; i++) {
                addBranchToList(1, [], this.treeData[i], true, {
                    figure: 0,
                    table: 0,
                    equation: 0,
                })
            }
            this.treeRows.push(...tree_rows)
            if (!this.peTree)
                this.eventSvc.$broadcast(TreeService.events.UPDATED)

            resolve()
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
}
