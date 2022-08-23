import * as angular from 'angular'
import {RootScopeService} from "./RootScope.service";
import {EventService} from "./Event.service";
import {ElementObject} from "@ve-types/mms";
import {veUtils} from "@ve-utils";
import {TreeBranch, TreeRow} from "@ve-types/tree";


export class TreeService {

    private readonly treeApi

    static events = {
        UPDATED: 'tree.updated'
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

    static $inject = ['$timeout', 'RootScopeService', 'EventService'];

    constructor(private $timeout: angular.ITimeoutService, private rootScopeSvc: RootScopeService,
                private eventSvc: EventService) {

        this.treeApi = {};

        if (!(this.treeApi instanceof TreeApi)) {
            this.treeApi = new TreeApi(this.$timeout, this.rootScopeSvc, this.eventSvc);
        }
    }

    getApi () {
        return this.treeApi;
    };

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
     * @param {callback} level2_Func function to get childen objects
     * @returns {void} root node
     */
    public buildTreeHierarchy = (array: any[], id: string, type: string, parent: string, ctrl: angular.IComponentController, level2_Func) => {
        var rootNodes = [];
        var data2Node = {};
        var i = 0;
        var data = null;
        // make first pass to create all nodes
        for (i = 0; i < array.length; i++) {
            data = array[i];
            data2Node[data[id]] = {
                label: data.name,
                type: type,
                data: data,
                children: []
            };
        }
        // make second pass to associate data to parent nodes
        for (i = 0; i < array.length; i++) {
            data = array[i];
            // If theres an element in data2Node whose key matches the 'parent' value in the array element
            // add the array element to the children array of the matched data2Node element
            if (data[parent] && data2Node[data[parent]]) {//bad data!
                data2Node[data[parent]].children.push(data2Node[data[id]]);
            } else {
                // If theres not an element in data2Node whose key matches the 'parent' value in the array element
                // it's a "root node" and so it should be pushed to the root nodes array along with its children
                rootNodes.push(data2Node[data[id]]);
            }
        }

        //apply level2 function if available
        if (level2_Func) {
            for (i = 0; i < array.length; i++) {
                data = array[i];
                var level1_parentNode = data2Node[data[id]];
                level2_Func(ctrl, data, level1_parentNode);
            }
        }

        const sortFunction = (a, b) => {
            if (a.children.length > 1) {
                a.children.sort(sortFunction);
            }
            if (b.children.length > 1) {
                b.children.sort(sortFunction);
            }
            if (a.label.toLowerCase() < b.label.toLowerCase()) {
                return -1;
            }
            if (a.label.toLowerCase() > b.label.toLowerCase()) {
                return 1;
            }
            return 0;
        }
        rootNodes.sort(sortFunction);
        return rootNodes;
    };

    getTreeTypes = (): object => {
        var treeTypes = {}

        TreeService.MetaTypes.forEach((type) => {
            treeTypes[type] = this.getTypeIcon(type) + ' fa-fw'
        })

        return treeTypes
    }

    getTypeIcon = (type: string): string => {
        var t = type
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
                return 'fa fa-long-arrow-right'
            case 'element':
                return 'fa fa-square'
            case 'property':
                return 'fa fa-circle'
            case 'generalization':
                return 'fa fa-chevron-right'
            case 'package':
                return 'fa fa-folder'
            case 'section':
                return 'section-icon' //"fa-file-o";
            case 'group':
                return 'fa fa-folder'
            case 'snapshot':
                return 'fa fa-camera'
            case 'view':
                return 'fa fa-file'
            case 'view-composite':
                return 'fa fa-file'
            case 'view-shared':
                return 'fa-regular fa-file'
            case 'view-none':
                return 'fa-regular fa-file'
            case 'branch':
                return 'fa fa-tasks'
            case 'table':
                return 'fa fa-table'
            case 'figure':
                return 'fa fa-image'
            case 'equation':
                return 'fa fa-superscript'
            default:
                return 'fa fa-square'
        }
    }

    getChangeTypeName = (type: string): string => {
        type = type.toLowerCase()
        switch (type) {
            case 'added':
                return 'Addition'
            case 'updated':
                return 'Modification'
            case 'removed':
                return 'Removal'
        }
    }
}

export class TreeApi {

    public treeData: TreeBranch[] = []
    public treeRows: TreeRow[] = []
    public selectedBranch: TreeBranch = null;
    public branch2viewNumber: {[key: string]: string} = {};
    
    constructor(private $timeout: angular.ITimeoutService, private rootScopeSvc: RootScopeService,
                private eventSvc: EventService) {}

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
        this.onTreeDataChange();
    };
    /**
     * @ngdoc function
     * @name TreeApi#collapseAll
     * @methodOf TreeApi
     *
     * @description
     * self explanatory
     */
    public collapseAll = (excludeBranch?: TreeBranch) => {
        this.forEachBranch((b, level) => {
            b.expanded = false;
        }, excludeBranch);
        this.onTreeDataChange();
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
   addBranch(parent: TreeBranch, new_branch: TreeBranch, top: boolean) {
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
        this.onTreeDataChange();
    };

    public removeBranch = (branch) => {
       this._removeBranch(branch, false);
       this.onTreeDataChange();
    };

    public removeSingleBranch = (branch) => {
       this._removeBranch(branch, true);
       this.onTreeDataChange();
    };


    /**
     * @ngdoc function
     * @name TreeApi#expand_branch
     * @methodOf TreeApi
     *
     * @description
     * self explanatory
     *
     * @param {TreeBranch} branch branch to expand
     */
   expand_branch(branch: TreeBranch) {
        if (!branch)
            branch = this.getSelectedBranch();
        if (branch) {
            //scope.expandCallback({ branch: b });
            branch.expanded = true;
        }
        this.onTreeDataChange();
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
    public refresh = () => {
        this.onTreeDataChange();
    };

    public initialSelect = () => {
       this.onInitialSelectionChange();
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

    public userClicksBranch = (branch: TreeBranch) => {
        if (branch !== this.selectedBranch)
            this.selectBranch(branch);
        //return scope.userClicksBranch(branch);
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
                for (var i = 0; i < branch.children.length; i++) {
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
        for (var i = 0; i < parent_branch.children.length; i++) {
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
            this.expandAllParents(this.selectedBranch);
            this.onTreeDataChange();
        }
    };

    public forAllAncestors = (child: TreeBranch, fn: (parent: TreeBranch) => void) => {
        var parent = this.getParent(child);
        if (parent) {
            fn(parent);
            this.forAllAncestors(parent, fn);
        }
    };

    public expandAllParents = (child: TreeBranch) => {
       this.forAllAncestors(child, (b) => {
            if(b.expandable === true)
            {
                //scope.expandCallback({ branch: b });
            }
            b.expanded = true;
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
            this.expandAllParents(branch);
            if (!noClick) {
                var options = this.rootScopeSvc.treeOptions();
                if (branch.onSelect != null) {
                    this.eventSvc.$broadcast(branch.onSelect,{ branch: branch });
                } else if (options.onSelect) {
                    this.eventSvc.$broadcast(options.onSelect,{ branch: branch });
                }
            }
            if (branch.data.id) {
                this.eventSvc.$broadcast('tree-get-branch-element', { id: branch.data.id });
            }
        } else {
            this.expandAllParents(branch);
        }
    };

   public onInitialSelectionChange = () => {
        let initialSelection = this.rootScopeSvc.treeInitialSelection();
        if (initialSelection) {
            this.forEachBranch((b) => {
                if (b.data.id === initialSelection) {
                    this.selectBranch(b, true);
                }
            });
            this.onTreeDataChange();
        }
    };

   public onTreeDataChange = () => {
       this.forEachBranch((b, level) => {
            if (!b.uid)
                b.uid = '' + Math.random();
        });
       this.forEachBranch((b) => {
            if (Array.isArray(b.children)) {
                for (var i = 0; i < b.children.length; i++) {
                    var child = b.children[i];
                    child.parent_uid = b.uid;
                }
            }
        });
        //rootScopeSvc.treeRows(['bar']);
        this.treeRows.length = 0;
        const tree_rows = [];
        const options = this.rootScopeSvc.treeOptions();
        const icons = this.rootScopeSvc.treeIcons();

        if (options.sort) {
            this.treeData.sort(this.treeSortFunction);
        }
       const addBranchToList = (level, section, branch, visible, peNums) => {
            var expand_icon = "";
            var type_icon = "";
            var aggr = branch.aggr;
            if (!aggr)
                aggr = "";
            else
                aggr = '-' + aggr.toLowerCase();
            var i = 0;
            if (!branch.expanded)
                branch.expanded = false;
            if ((branch.children && branch.children.length > 0) || (branch.expandable === true)) {
                var haveVisibleChild = false;
                if (branch.type !== 'view' && branch.type !== 'section')
                    haveVisibleChild = true;
                for (i = 0; i < branch.children.length; i++) {
                    if (!branch.children[i].hide) {
                        haveVisibleChild = true;
                        break;
                    }
                }
                if (haveVisibleChild) {
                    if (branch.expanded) {
                        expand_icon = icons.iconCollapse;
                    } else {
                        expand_icon = icons.iconExpand;
                    }
                } else
                    expand_icon = "fa fa-lg fa-fw";
            } else
                expand_icon = "fa fa-lg fa-fw";

            if (branch.loading) {
                type_icon = "fa fa-spinner fa-spin";
            } else if (options && options.types && options.types[branch.type.toLowerCase() + aggr]) {
                type_icon = options.types[branch.type.toLowerCase() + aggr];
            } else {
                type_icon = icons.iconDefault;
            }

            var number = section.join('.');
            if (branch.type === 'figure' || branch.type === 'table' || branch.type === 'equation') {
                peNums[branch.type]++;
                if (options.numberingDepth == 0) {
                    number = peNums[branch.type];
                } else if (section.length >= options.numberingDepth) {
                    number = section.slice(0, options.numberingDepth).join('.') + options.numberingSeparator + peNums[branch.type];
                } else {
                    var sectionCopy = section.slice();
                    while (sectionCopy.length < options.numberingDepth) {
                        sectionCopy.push(0);
                    }
                    number = sectionCopy.join('.') + options.numberingSeparator + peNums[branch.type];
                }
            } else if (branch.type !== 'view' && branch.type !== 'section') {
                number = '';
            }
            if (branch.data && branch.data.id && options.sectionNumbering) {
                this.branch2viewNumber[branch.data.id] = number;
                branch.data._veNumber = number;
            }
            if (branch.hide)
                visible = false;
            tree_rows.push({
                level: level,
                section: number,
                branch: branch,
                label: branch.label,
                expand_icon: expand_icon,
                visible: visible,
                type_icon: type_icon,
                children: branch.children
            });

            if (branch.children) {
                var alpha = false;
                if (options.sort) {
                    branch.children.sort(this.treeSortFunction);
                }
                var j = options.startChapter;
                if (j === null || j === undefined || level != 1) {
                    j = 1;
                }
                for (i = 0; i < branch.children.length; i++) {
                    var child_visible = visible && branch.expanded;
                    //if (branch.children[i].type === 'section')
                    //    addBranchToList(level + 1, '§ ', branch.children[i], child_visible);
                    if (branch.children[i].type === 'figure' || branch.children[i].type === 'table' || branch.children[i].type === 'equation') {
                        addBranchToList(level + 1, section, branch.children[i], child_visible, peNums);
                    } else {
                        if (options.sectionNumbering) {
                            if (branch.children[i].data._isAppendix) {
                                alpha = true;
                                j = 0;
                            }
                            var nextSection = section.slice();
                            nextSection.push(alpha ? String.fromCharCode(j + 65) : j);
                            if (nextSection.length <= options.numberingDepth) {
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
        for (var i = 0; i < this.treeData.length; i++) {
            addBranchToList(1, [], this.treeData[i], true, {figure: 0, table: 0, equation: 0});
        }
        this.treeRows.push(...tree_rows);
        this.eventSvc.$broadcast(TreeService.events.UPDATED);
    };

    // TODO: Update sort function to handle all cases
    public treeSortFunction = (a, b) => {

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

    // this.selectBranch = selectBranch;
    // this.forEachBranch = forEachBranch;
    // this.onTreeDataChange = onTreeDataChange;
    // this.onInitialSelectionChange = onInitialSelectionChange;
    // this.expandPathToSelectedBranch = expandPathToSelectedBranch;

}

veUtils.service('TreeService', TreeService);
