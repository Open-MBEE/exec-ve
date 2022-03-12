import * as angular from 'angular'
var mms = angular.module('mms');


export class TreeService {

    private readonly $timeout
    private readonly rootScopeSvc
    private readonly eventSvc

    private readonly treeApi
    public treeData
    public treeRows

    constructor($timeout, RootScopeService, EventService) {
        this.$timeout = $timeout;
        this.rootScopeSvc = RootScopeService;
        this.eventSvc = EventService;

        this.treeApi = {};
        this.treeData = [];
        this.treeRows = [];

        if (!(this.treeApi instanceof TreeApi)) {
            this.treeApi = new TreeApi(this.$timeout, this.rootScopeSvc, this.eventSvc, this);
        }
    }

    getApi () {
        return this.treeApi;
    };
}

export class TreeApi {
    
    private $timeout
    private rootScopeSvc
    private eventSvc
    private treeSvc
    
    public selected_branch;
    
    constructor($timeout, RootScopeService, EventService, TreeService) {
        this.$timeout = $timeout;
        this.rootScopeSvc = RootScopeService;
        this.eventSvc = EventService;
        this.treeSvc = TreeService;
        
        this.selected_branch = null;
    }

    /**
     * @ngdoc function
     * @name mms.directives.directive:mmsTree#expand_all
     * @methodOf mms.directives.directive:mmsTree
     *
     * @description
     * self explanatory
     */
    expand_all() {
        this.for_each_branch( function(b, level) {
            //scope.expandCallback({ branch: b });
            b.expanded = true;
        },null);
        this.on_treeData_change();
    };
    /**
     * @ngdoc function
     * @name mms.directives.directive:mmsTree#collapse_all
     * @methodOf mms.directives.directive:mmsTree
     *
     * @description
     * self explanatory
     */
   collapse_all(excludeBranch) {
        this.for_each_branch(function(b, level) {
            b.expanded = false;
        }, excludeBranch);
        this.on_treeData_change();
    };

   get_first_branch() {
        if (this.treeSvc.treeData.length > 0)
            return this.treeSvc.treeData[0];
    };
   select_first_branch() {
        var b = this.get_first_branch();
        this.select_branch(b);
    };
    /**
     * @ngdoc function
     * @name mms.directives.directive:mmsTree#get_selected_branch
     * @methodOf mms.directives.directive:mmsTree
     *
     * @description
     * self explanatory
     *
     * @return {Object} current selected branch
     */
   get_selected_branch() {
        return this.selected_branch;
    };

   clear_selected_branch() {
       this.selected_branch = null;
    };


   get_children(b) {
        return b.children;
    };
   select_parent_branch(b) {
        var p = this.get_parent(b);
        if (p)
            this.select_branch(p);
    };
    /**
     * @ngdoc function
     * @name mms.directives.directive:mmsTree#add_branch
     * @methodOf mms.directives.directive:mmsTree
     *
     * @description
     * self explanatory
     *
     * @param {Object} parent parent branch or null
     * @param {Object} new_branch branch to add to parent or root
     */
   add_branch(parent, new_branch, top) {
        if (parent) {
            if (top)
                parent.children.unshift(new_branch);
            else
                parent.children.push(new_branch);
            parent.expanded = true;
        } else {
            if (top)
                this.treeSvc.treeData.unshift(new_branch);
            else
                this.treeSvc.treeData.push(new_branch);
        }
        this.on_treeData_change();
    };

   remove_branch(branch) {
       this.remove_branch_impl(branch, false);
       this.on_treeData_change();
    };

   remove_single_branch(branch) {
       this.remove_branch_impl(branch, true);
       this.on_treeData_change();
    };

    //add_root_branch(new_branch) {
    //     this.add_branch(null, new_branch);
    // };
    /**
     * @ngdoc function
     * @name mms.directives.directive:mmsTree#expand_branch
     * @methodOf mms.directives.directive:mmsTree
     *
     * @description
     * self explanatory
     *
     * @param {Object} branch branch to expand
     */
   expand_branch(b) {
        if (!b)
            b = this.get_selected_branch();
        if (b) {
            //scope.expandCallback({ branch: b });
            b.expanded = true;
        }
        this.on_treeData_change();
    };

    /**
     * @ngdoc function
     * @name mms.directives.directive:mmsTree#collapse_branch
     * @methodOf mms.directives.directive:mmsTree
     *
     * @description
     * self explanatory
     *
     * @param {Object} branch branch to collapse
     */
   collapse_branch(b) {
        if (!b)
            b = this.selected_branch;
        if (b)
            b.expanded = false;
        this.on_treeData_change();
    };
   get_siblings(b) {
        var siblings;
        var p = this.get_parent(b);
        if (p)
            siblings = p.children;
        else
            siblings = this.treeSvc.treeData;
        return siblings;
    };
   get_next_sibling(b) {
        var siblings = this.get_siblings(b);
        if (angular.isArray(siblings)) {
            var i = siblings.indexOf(b);
            if (i < siblings.length - 1)
                return siblings[i + 1];
        }
    };
   get_prev_sibling(b) {
        var siblings = this.get_siblings(b);
        if (angular.isArray(siblings)) {
            var i = siblings.indexOf(b);
            if (i > 0)
                return siblings[i - 1];
        }
    };
   select_next_sibling(b) {
        var next = this.get_next_sibling(b);
        if (next)
            this.select_branch(next);
    };
   select_prev_sibling(b) {
        var prev = this.get_prev_sibling(b);
        if (prev)
            this.select_branch(prev);
    };
   get_first_child(b) {
        if (!b)
            b =  this.selected_branch;
        if (b && b.children && b.children.length > 0)
            return b.children[0];
    };
   get_closest_ancestor_next_sibling(b) {
        var next = this.get_next_sibling(b);
        if (next)
            return next;
        else {
            next = this.get_parent(b);
            return this.get_closest_ancestor_next_sibling(next);
        }
    };
    /**
     * @ngdoc function
     * @name mms.directives.directive:mmsTree#get_next_branch
     * @methodOf mms.directives.directive:mmsTree
     *
     * @description
     * self explanatory
     *
     * @param {Object} branch current branch
     * @return {Object} next branch
     */
   get_next_branch(b) {
         if (!b)
            b =  this.selected_branch;
        if (b) {
            var next = this.get_first_child(b);
            if (next)
                return next;
            else {
                next = this.get_closest_ancestor_next_sibling(b);
                return next;
            }
        }
    };
    /**
     * @ngdoc function
     * @name mms.directives.directive:mmsTree#select_next_branch
     * @methodOf mms.directives.directive:mmsTree
     *
     * @description
     * self explanatory
     *
     * @param {Object} branch current branch
     */
   select_next_branch(b) {
        var next = this.get_next_branch(b);
        if (next)
            this.select_branch(next);
    };
   last_descendant(b) {
        if (b) {
            if (b.children.length === 0)
                return b;
            var last = b.children[b.children.length - 1];
            return this.last_descendant(last);
        }
    };
    /**
     * @ngdoc function
     * @name mms.directives.directive:mmsTree#get_prev_branch
     * @methodOf mms.directives.directive:mmsTree
     *
     * @description
     * self explanatory
     *
     * @param {Object} branch current branch
     * @return {Object} previous branch
     */
   get_prev_branch(b) {
        var prev_sibling = this.get_prev_sibling(b);
        if (prev_sibling)
            return this.last_descendant(prev_sibling);
        return this.get_parent(b);
    };
    /**
     * @ngdoc function
     * @name mms.directives.directive:mmsTree#select_prev_branch
     * @methodOf mms.directives.directive:mmsTree
     *
     * @description
     * self explanatory
     *
     * @param {Object} branch current branch
     */
   select_prev_branch(b) {
        var prev = this.get_prev_branch(b);
        if (prev)
            this.select_branch(prev);
    };

    /**
     * @ngdoc function
     * @name mms.directives.directive:mmsTree#refresh
     * @methodOf mms.directives.directive:mmsTree
     *
     * @description
     * rerender the tree when data or options change
     */
   refresh() {
        this.on_treeData_change();
    };

   initialSelect() {
       this.on_initialSelection_change();
    };

   sort_branch(b, sortFunction) {
        b.children.sort(sortFunction);
    };

    /**
     * @ngdoc function
     * @name mms.directives.directive:mmsTree#get_branch
     * @methodOf mms.directives.directive:mmsTree
     *
     * @description
     * Returns the branch with the specified data
     */
   get_branch(data) {
        var branch = null;
        this.for_each_branch(function(b) {
            // if (angular.equals(b.data,data)) {
            //     branch = b;
            // }
            if (b.data.id === data.id) {
                branch = b;
            }
        });
        return branch;
    };

   get_rows() {
        return this.treeSvc.treeRows;
    };

   user_clicks_branch(branch) {
        if (branch !== this.selected_branch)
            this.select_branch(branch);
        //return scope.user_clicks_branch(branch);
    };

   for_each_branch(func, excludeBranch?) {
       let run = (branch, level) => {
            func(branch, level);
            if (branch.children) {
                for (var i = 0; i < branch.children.length; i++) {
                    run(branch.children[i], level + 1);
                }
            }
        };
        let rootLevelBranches = excludeBranch ? this.treeSvc.treeData.filter(function(branch) { return branch !== excludeBranch; }) : this.treeSvc.treeData;
        rootLevelBranches.forEach(function (branch) { run(branch, 1); });
    };

   remove_branch_impl(branch, singleBranch) {
        var parent_branch = this.get_parent(branch);
        if (!parent_branch) {
            for (let j = 0; j < this.treeSvc.treeData.length; j++) {
                if (this.treeSvc.treeData[j].uid === branch.uid) {
                    this.treeSvc.treeData.splice(j,1);
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

   // remove_single_branch(branch) {
   //      remove_branch_impl(branch, true);
   //  };

   get_parent(child) {
        var parent = null;
        if (child !== null && child.parent_uid) {
            this.for_each_branch(function(b) {
                if (b.uid === child.parent_uid) {
                    parent = b;
                }
            });
        }
        return parent;
    };

   expandPathToSelectedBranch() {
        if (this.selected_branch) {
            this.expand_all_parents(this.selected_branch);
            this.on_treeData_change();
        }
    };

   for_all_ancestors(child, fn) {
        var parent = this.get_parent(child);
        if (parent) {
            fn(parent);
            this.for_all_ancestors(parent, fn);
        }
    };

   expand_all_parents(child) {
       this.for_all_ancestors(child, function(b) {
            if(b.expandable === true)
            {
                //scope.expandCallback({ branch: b });
            }
            b.expanded = true;
        });
    };
    /**
     * @ngdoc function
     * @name mms.directives.directive:mmsTree#select_branch
     * @methodOf mms.directives.directive:mmsTree
     *
     * @description
     * self explanatory
     *
     * @param {Object} branch branch to select
     */
   select_branch(branch, noClick?) {
        if (!branch) {
            if (this.selected_branch)
                this.selected_branch.selected = false;
            this.selected_branch = null;
            return;
        }
        if (branch !== this.selected_branch) {
            if (this.selected_branch)
                this.selected_branch.selected = false;
            branch.selected = true;
            this.selected_branch = branch;
            /*if(branch.expandable === true)
            {
                scope.expandCallback({ branch: branch });
            }*/
            this.expand_all_parents(branch);
            if (!noClick) {
                var options = this.rootScopeSvc.treeOptions();
                if (branch.onSelect) {
                    this.eventSvc.$broadcast(branch.onSelect,{ branch: branch });
                } else if (options.onSelect) {
                    this.eventSvc.$broadcast(options.onSelect,{ branch: branch });
                }
            }
            if (branch.data.id) {
                this.eventSvc.$broadcast('tree-get-branch-element', { id: branch.data.id });
            }
            // fix for when user presses browser back button
        } else {
            this.expand_all_parents(branch);
        }
    };

   on_initialSelection_change() {
        let initialSelection = this.rootScopeSvc.treeInitialSelection();
        if (initialSelection) {
            this.for_each_branch(function(b) {
                if (b.data.id === initialSelection) {
                    this.select_branch(b, true);
                }
            });
            this.on_treeData_change();
        }
    };

   on_treeData_change() {
       this.for_each_branch(function(b, level) {
            if (!b.uid)
                b.uid = '' + Math.random();
        });
       this.for_each_branch(function(b) {
            if (angular.isArray(b.children)) {
                for (var i = 0; i < b.children.length; i++) {
                    var child = b.children[i];
                    child.parent_uid = b.uid;
                }
            }
        });
        //rootScopeSvc.treeRows(['bar']);
        this.treeSvc.treeRows.length = 0;
        const tree_rows = [];
        const options = this.rootScopeSvc.treeOptions();
        const icons = this.rootScopeSvc.treeIcons();

        if (options.sort) {
            this.treeSvc.treeData.sort(this.treeSortFunction);
        }
       const add_branch_to_list = (level, section, branch, visible, peNums) => {
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
                    //    add_branch_to_list(level + 1, '§ ', branch.children[i], child_visible);
                    if (branch.children[i].type === 'figure' || branch.children[i].type === 'table' || branch.children[i].type === 'equation') {
                        add_branch_to_list(level + 1, section, branch.children[i], child_visible, peNums);
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
                            add_branch_to_list(level + 1, nextSection, branch.children[i], child_visible, peNums);
                        } else {
                            add_branch_to_list(level + 1, [], branch.children[i], child_visible, peNums);
                        }
                        j++;
                    }
                }
            }
        };


        for (var i = 0; i < this.treeSvc.treeData.length; i++) {
            add_branch_to_list(1, [], this.treeSvc.treeData[i], true, {figure: 0, table: 0, equation: 0});
        }
        this.treeSvc.treeRows.push(...tree_rows);
    };

    // TODO: Update sort function to handle all cases
   treeSortFunction(a, b) {

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

    // this.select_branch = select_branch;
    // this.for_each_branch = for_each_branch;
    // this.on_treeData_change = on_treeData_change;
    // this.on_initialSelection_change = on_initialSelection_change;
    // this.expandPathToSelectedBranch = expandPathToSelectedBranch;

}

TreeService.$inject = ['$timeout', 'RootScopeService', 'EventService'];

mms.service('TreeService', TreeService);
