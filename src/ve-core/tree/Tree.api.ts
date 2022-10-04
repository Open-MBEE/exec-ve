import * as angular from "angular";

import {TreeBranch, TreeConfig, TreeOptions, TreeRow} from "@ve-types/tree";
import {EventService} from "@ve-utils/core-services";
import {ElementObject} from "@ve-types/mms";
import {TreeService} from "@ve-core/tree/Tree.service";

export class TreeApi {

    public treeData: TreeBranch[] = []
    private treeRows: TreeRow[] = []
    public treeOptions: TreeOptions = null;
    public initialSelection: string;
    public selectedBranch: TreeBranch = null;
    public branch2viewNumber: {[key: string]: string} = {};
    public defaultIcon: string = 'fa-solid fa-file fa-fw';
    public peTree: boolean;
    public treeConfig: TreeConfig

    public loading: boolean;

    private inProgress: Promise<boolean>

    constructor(private $timeout: angular.ITimeoutService,
                private eventSvc: EventService, config: TreeConfig, peTree: boolean) {
        this.treeConfig = config;
        this.peTree = peTree;
    }

    /**
     * @ngdoc function
     * @name TreeApi#expandAll
     * @methodOf TreeApi
     *
     * @description
     * self explanatory
     */
    public expandAll = () => {
        this.forEachBranch( (b, level) => {
            //scope.expandCallback({ branch: b });
            b.expanded = true;
        },null);
        return this.refresh();
    };
    /**
     * @ngdoc function
     * @name TreeApi#collapseAll
     * @methodOf TreeApi
     *
     * @description
     * self explanatory
     */
    public collapseAll = (excludeBranch?: TreeBranch): Promise<boolean> => {
        this.forEachBranch((b, level) => {
            b.expanded = false;
        }, excludeBranch);
        return this.refresh();
    };

    /**
     * Gets the first branch in the tree
     * @returns {TreeBranch}
     */
    public getFirstBranch = () => {
        if (this.treeData.length > 0)
            return this.treeData[0];
    };

    /**
     * Selects the first branch in the tree
     */
    public selectFirstBranch = () => {
        var b = this.getFirstBranch();
        this.selectBranch(b);
    };

    /**
     * @ngdoc function
     * @name TreeApi#getSelectedBranch
     * @methodOf TreeApi
     *
     * @description
     * self explanatory
     *
     * @return {Object} current selected branch
     */
    public getSelectedBranch = () => {
        return this.selectedBranch;
    };

    public clearSelectedBranch = () => {
        this.selectedBranch = null;
    };


    public getChildren = (b: TreeBranch) => {
        return b.children;
    };

    public selectParentBranch = (branch: TreeBranch) => {
        var p = this.getParent(branch);
        if (p)
            this.selectBranch(p);
    };

    /**
     *  @ngdoc function
     * @name TreeApi#addBranch
     * @methodOf TreeApi
     *
     * @description
     * self explanatory
     *
     * @param {TreeBranch} parent the intended parent of the new branch
     * @param {TreeBranch} new_branch new branch to be added to the tree
     * @param {boolean} top boolean determining if this item should be at the top
     */
    public addBranch(parent: TreeBranch, new_branch: TreeBranch, top: boolean): Promise<boolean> {
        if (parent) {
            if (top)
                parent.children.unshift(new_branch);
            else
                parent.children.push(new_branch);
            parent.expanded = true;
        } else {
            if (top)
                this.treeData.unshift(new_branch);
            else
                this.treeData.push(new_branch);
        }
        return this.refresh();
    };

    public removeBranch = (branch) => {
        this._removeBranch(branch, false);
        return this.refresh();
    };

    public removeSingleBranch = (branch) => {
        this._removeBranch(branch, true);
        return this.refresh();
    };


    /**
     * @ngdoc function
     * @name TreeApi#expandBranch
     * @methodOf TreeApi
     *
     * @description
     * self explanatory
     *
     * @param {TreeBranch} branch branch to expand
     */
    public expandBranch(branch: TreeBranch): Promise<boolean> {
        if (!branch)
            branch = this.getSelectedBranch();
        if (branch) {
            //scope.expandCallback({ branch: b });
            branch.expanded = true;
        }
        return this.refresh();
    };

    /**
     * @ngdoc function
     * @name TreeApi#closeBranch
     * @methodOf TreeApi
     *
     * @description
     * self explanatory
     *
     * @param {TreeBranch} branch branch to close
     */
    public closeBranch(branch: TreeBranch): Promise<boolean> {
        if (!branch)
            branch = this.getSelectedBranch();
        if (branch) {
            //scope.expandCallback({ branch: b });
            branch.expanded = false;
        }
        return this.refresh();
    };

    /**
     * Gets siblings of specified branch
     * @param {TreeBranch} branch
     * @returns {TreeBranch[]}
     */
    getSiblings(branch: TreeBranch): TreeBranch[] {
        var siblings;
        var p = this.getParent(branch);
        if (p)
            siblings = p.children;
        else
            siblings = this.treeData;
        return siblings;
    };

    /**
     * Gets numerically next sibling (if exists) of specified branch
     * @param {TreeBranch} branch
     * @returns {TreeBranch}
     */
    public getNextSibling = (branch: TreeBranch): TreeBranch => {
        var siblings = this.getSiblings(branch);
        if (Array.isArray(siblings)) {
            var i = siblings.indexOf(branch);
            if (i < siblings.length - 1)
                return siblings[i + 1];
        }
    };

    /**
     * Gets numerically previous sibling (if exists) of specified branch
     * @param {TreeBranch} branch
     * @returns {TreeBranch}
     */
    public getPrevSibling = (branch: TreeBranch): TreeBranch => {
        var siblings = this.getSiblings(branch);
        if (Array.isArray(siblings)) {
            var i = siblings.indexOf(branch);
            if (i > 0)
                return siblings[i - 1];
        }
    };

    /**
     * Gets the first child of the specified branch (if exists)
     * @param {TreeBranch} branch
     * @returns {TreeBranch}
     */
    public getFirstChild = (branch: TreeBranch): TreeBranch => {
        if (!branch)
            branch =  this.selectedBranch;
        if (branch && branch.children && branch.children.length > 0)
            return branch.children[0];
    };

    /**
     * Traverse up/down the tree to find the next closest sibling to the specified branch
     * @param {TreeBranch} branch
     * @returns {TreeBranch}
     */
    public getClosestAncestorNextSibling = (branch: TreeBranch): TreeBranch => {
        var next = this.getNextSibling(branch);
        if (next)
            return next;
        else {
            next = this.getParent(branch);
            return this.getClosestAncestorNextSibling(next);
        }
    };

    /**
     * Gets the next branch in the tree
     * @param {TreeBranch} branch
     * @returns {TreeBranch}
     */
    public getNextBranch = (branch: TreeBranch): TreeBranch => {
        if (!branch)
            branch =  this.selectedBranch;
        if (branch) {
            var next = this.getFirstChild(branch);
            if (next)
                return next;
            else {
                next = this.getClosestAncestorNextSibling(branch);
                return next;
            }
        }
    };

    /**
     * Returns the last descendant branch of the specified branch
     * @param {TreeBranch} branch
     * @returns {TreeBranch}
     */
    public lastDescendant = (branch: TreeBranch): TreeBranch => {
        if (branch) {
            if (branch.children.length === 0)
                return branch;
            var last = branch.children[branch.children.length - 1];
            return this.lastDescendant(last);
        }
    };

    /**
     * Get's the branch previous to the branch specified
     * @param {TreeBranch} branch
     * @returns {TreeBranch}
     */
    public getPrevBranch = (branch: TreeBranch): TreeBranch => {
        var prev_sibling = this.getPrevSibling(branch);
        if (prev_sibling)
            return this.lastDescendant(prev_sibling);
        return this.getParent(branch);
    };


    /**
     * @ngdoc function
     * @name TreeApi#refresh
     * @methodOf TreeApi
     *
     * @description
     * rerender the tree when data or options change
     */
    public refresh = (): Promise<boolean> => {
        if (!this.inProgress) {
            this.loading = true;
            return this.inProgress = this._onTreeDataChange().then(() => {
                this.loading = false;
                return true;
            });
        }
        return this.inProgress.then(() => {
            this.loading = true;
            return this.inProgress = this._onTreeDataChange().then(() => {
                this.loading = false;
                return true;
            });
        })
    };

    public initialSelect = (): Promise<boolean> => {
        let initialSelection = this.initialSelection;
        if (initialSelection) {
            this.forEachBranch((b) => {
                if (b.data.id === initialSelection) {
                    this.selectBranch(b, true);
                }
            });
        }
        this.initialSelection = null;
        return this.refresh();
    };



    /**
     * @ngdoc function
     * @name TreeApi#getBranch
     * @methodOf TreeApi
     *
     * @description
     * Returns the branch with the specified data
     */
    getBranch(data: ElementObject): TreeBranch {
        var branch = null;
        this.forEachBranch((b) => {
            // if (angular.equals(b.data,data)) {
            //     branch = b;
            // }
            if (b.data.id === data.id) {
                branch = b;
            }
        });
        return branch;
    };

    getRows(): TreeRow[] {
        return this.treeRows;
    };

    /**
     * Runs the specified callback function on each branch in the tree as specified by treeData
     * @param {(branch: TreeBranch, level: number) => void} func
     * @param {TreeBranch} excludeBranch
     */
    public forEachBranch = (func: (branch: TreeBranch, level: number) => void, excludeBranch?: TreeBranch) => {
        let run = (branch, level) => {
            func(branch, level);
            if (branch.children) {
                for (let i = 0; i < branch.children.length; i++) {
                    run(branch.children[i], level + 1);
                }
            }
        };
        let rootLevelBranches = excludeBranch ? this.treeData.filter((branch) => { return branch !== excludeBranch; }) : this.treeData;
        rootLevelBranches.forEach((branch) => { run(branch, 1); });
    };

    private _removeBranch(branch, singleBranch) {
        var parent_branch = this.getParent(branch);
        if (!parent_branch) {
            for (let j = 0; j < this.treeData.length; j++) {
                if (this.treeData[j].uid === branch.uid) {
                    this.treeData.splice(j,1);
                    break;
                }
            }
            return;
        }
        for (let i = 0; i < parent_branch.children.length; i++) {
            if (parent_branch.children[i].uid === branch.uid) {
                parent_branch.children.splice(i,1);
                if (singleBranch) {
                    break;
                }
            }
        }
    };

    /**
     * Gets branch parent
     * @param {TreeBranch} child
     * @returns {TreeBranch}
     */
    public getParent = (child: TreeBranch): TreeBranch => {
        var parent = null;
        if (child !== null && child.parent_uid) {
            this.forEachBranch((b) => {
                if (b.uid === child.parent_uid) {
                    parent = b;
                }
            });
        }
        return parent;
    };

    public expandPathToSelectedBranch = () => {
        if (this.selectedBranch) {
            return this.expandAllParents(this.selectedBranch);
        }
        return Promise.resolve(true)
    };

    public forAllAncestors = (child: TreeBranch, fn: (parent: TreeBranch) => Promise<boolean>): Promise<boolean> => {
        var parent = this.getParent(child);
        if (parent) {
            return fn(parent).then(() => {
                    return this.forAllAncestors(parent, fn);
                })
        }
        return Promise.resolve(true);
    };

    public expandAllParents = (child: TreeBranch): Promise<boolean> => {
        return this.forAllAncestors(child, (b) => {
            if(b.expandable && !b.expanded)
            {
                return this.expandBranch(b)
            }
            return Promise.resolve(true);
        });
    };

    /**
     * Select a branch
     * @param branch
     * @param noClick
     */
    public selectBranch = (branch?: TreeBranch, noClick?) => {
        if (!branch) {
            if (this.selectedBranch)
                this.selectedBranch.selected = false;
            this.selectedBranch = null;
            return;
        }
        if (branch !== this.selectedBranch) {
            if (this.selectedBranch)
                this.selectedBranch.selected = false;
            branch.selected = true;
            this.selectedBranch = branch;
            this.expandAllParents(branch).then(() => {
                if (!noClick) {
                    if (branch.onSelect != null) {
                        branch.onSelect(branch);
                    } else if (this.treeOptions.onSelect) {
                        this.treeOptions.onSelect(branch);
                    }
                }
                if (branch.data.id) {
                    this.eventSvc.$broadcast('tree-get-branch-element', { id: branch.data.id, treeId: this.treeConfig.id });
                }
            })
        } else {
            this.expandAllParents(branch);
        }
    };

    private _onTreeDataChange = (): Promise<boolean> => {
        return new Promise<boolean>((resolve, reject) => {
        if (!Array.isArray(this.treeData)) {
            reject('[warn] treeData is not an array!');
        }
        this.forEachBranch((b, level) => {
            if (!b.uid)
                b.uid = '' + Math.random();
        });
        this.forEachBranch((b) => {
            if (Array.isArray(b.children)) {
                for (let i = 0; i < b.children.length; i++) {
                    var child = b.children[i];
                    child.parent_uid = b.uid;
                }
            }
        });
        this.treeRows.length = 0;
        const tree_rows: TreeRow[] = [];

        if (this.treeOptions.sort) {
            this.treeData.sort(this._treeSortFunction);
        }
        const addBranchToList = (level: number, section: string[], branch: TreeBranch, visible: boolean, peNums: {[type: string]: number}) => {
            let type_icon = this.defaultIcon;
            let haveVisibleChild = false;
            let aggr = branch.aggr;
            if (!aggr)
                aggr = "";
            else
                aggr = '-' + aggr.toLowerCase();
            if (!branch.expanded)
                branch.expanded = false;

            if ((branch.children && branch.children.length > 0) || (branch.expandable === true)) {
                if (this.treeConfig.types && !this.treeConfig.types.includes(branch.type))
                    haveVisibleChild = false;
                for (let i = 0; i < branch.children.length; i++) {
                    if (!branch.children[i].hide) {
                        haveVisibleChild = true;
                        break;
                    }
                }
            }
            if (this.treeOptions && this.treeOptions.typeIcons) {
                if (this.treeOptions.typeIcons[branch.type.toLowerCase() + aggr]) {
                    type_icon = this.treeOptions.typeIcons[branch.type.toLowerCase() + aggr];
                } else if (this.treeOptions.typeIcons['default']) {
                    type_icon = this.treeOptions.typeIcons['default']
                }
            }
            let number = ''
            if (!this.peTree) {
                if (section)
                    number = section.join('.');
                if (this.treeConfig.types && !this.treeConfig.types.includes(branch.type)) {
                    peNums[branch.type]++;
                    if (this.treeOptions.numberingDepth === 0) {
                        number = peNums[branch.type].toString(10);
                    } else if (section.length >= this.treeOptions.numberingDepth) {
                        number = section.slice(0, this.treeOptions.numberingDepth).join('.') + this.treeOptions.numberingSeparator + peNums[branch.type];
                    } else {
                        var sectionCopy = [...section];
                        while (sectionCopy.length < this.treeOptions.numberingDepth) {
                            sectionCopy.push('0');
                        }
                        number = sectionCopy.join('.') + this.treeOptions.numberingSeparator + peNums[branch.type];
                    }
                }
                if (branch.data && branch.data.id && this.treeOptions.sectionNumbering) {
                    this.branch2viewNumber[branch.data.id] = number;
                    branch.data._veNumber = number;
                }
            } else if (branch.data._veNumber) {
                number = branch.data._veNumber;
            }
            if (!this.peTree && branch.hide)
                visible = false;
            else if (this.peTree && level === 1)
                visible = true;

            tree_rows.push({
                level: level,
                section: number,
                branch: branch,
                label: branch.label,
                visibleChild: haveVisibleChild,
                visible: visible,
                type_icon: type_icon,
                children: branch.children
            });

            if (branch.children) {
                var alpha = false;
                if (this.treeOptions.sort) {
                    branch.children.sort(this._treeSortFunction);
                }
                var j = this.treeOptions.startChapter;
                if (j === null || j === undefined || level != 1) {
                    j = 1;
                }
                for (let i = 0; i < branch.children.length; i++) {
                    var child_visible = visible && branch.expanded;
                    //if (branch.children[i].type === 'section')
                    //    addBranchToList(level + 1, '§ ', branch.children[i], child_visible);
                    if (branch.children[i].type === 'figure' || branch.children[i].type === 'table' || branch.children[i].type === 'equation') {
                        addBranchToList(level + 1, section, branch.children[i], child_visible, peNums);
                    } else {
                        if (this.treeOptions.sectionNumbering) {
                            if (branch.children[i].data._isAppendix) {
                                alpha = true;
                                j = 0;
                            }
                            let nextSection = [...section, alpha ? String.fromCharCode(j + 65) : j.toString(10)];
                            if (nextSection.length <= this.treeOptions.numberingDepth) {
                                peNums.table = 0; peNums.figure = 0; peNums.equaton = 0;
                            }
                            addBranchToList(level + 1, nextSection, branch.children[i], child_visible, peNums);
                        } else {
                            addBranchToList(level + 1, [], branch.children[i], child_visible, peNums);
                        }
                        j++;
                    }
                }
            }
        };

        this.branch2viewNumber = {};
        for (let i = 0; i < this.treeData.length; i++) {
            addBranchToList(1, [], this.treeData[i], true, {figure: 0, table: 0, equation: 0});
        }
        this.treeRows.push(...tree_rows);
        if (!this.peTree)
            this.eventSvc.$broadcast(TreeService.events.UPDATED);

        resolve(true);
    })
    };

    // TODO: Update sort function to handle all cases
    private _treeSortFunction = (a, b) => {

        a.priority = 100;
        if (a.type === 'tag') {
            a.priority = 0;
        } else if (a.type === 'group') {
            a.priority = 1;
        } else if (a.type === 'view') {
            a.priority = 2;
        }
        b.priority = 100;
        if (b.type === 'tag') {
            b.priority = 0;
        } else if (b.type === 'group') {
            b.priority = 1;
        } else if (b.type === 'view') {
            b.priority = 2;
        }

        if (a.priority < b.priority)
            return -1;
        if (a.priority > b.priority)
            return 1;
        if (!a.label) {
            a.label = '';
        }
        if (!b.label) {
            b.label = '';
        }
        if (a.label.toLowerCase() < b.label.toLowerCase())
            return -1;
        if (a.label.toLowerCase() > b.label.toLowerCase())
            return 1;
        return 0;
    };
}
