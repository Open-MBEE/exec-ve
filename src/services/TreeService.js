'use strict';

angular.module('mms')
    .factory('TreeService', ['$timeout', 'RootScopeService', 'EventService', TreeService]);

function TreeService($timeout, RootScopeService, EventService) {

    this.treeApi = {};
    this.treeData = [];
    this.treeRows = [];

    const getApi = () => {
        if (!(this.treeApi instanceof TreeApi)) {
            this.treeApi = new TreeApi($timeout, RootScopeService, EventService, this);
        }
        return this.treeApi;
    };

    return {
        getApi: getApi,
        treeData: this.treeData,
        treeRows: this.treeRows
    };
}

function TreeApi($timeout, RootScopeService, EventService, TreeService) {
    const eventSvc = EventService;
    const tree = TreeService;
    let selected_branch = null;
    const rootScopeSvc = RootScopeService;

    /**
     * @ngdoc function
     * @name mms.directives.directive:mmsTree#expand_all
     * @methodOf mms.directives.directive:mmsTree
     *
     * @description
     * self explanatory
     */
    this.expand_all = function() {
        for_each_branch( function(b, level) {
            //scope.expandCallback({ branch: b });
            b.expanded = true;
        },null,true);
        on_treeData_change();
    };
    /**
     * @ngdoc function
     * @name mms.directives.directive:mmsTree#collapse_all
     * @methodOf mms.directives.directive:mmsTree
     *
     * @description
     * self explanatory
     */
    this.collapse_all = function(excludeBranch) {
        for_each_branch(function(b, level) {
            b.expanded = false;
        }, excludeBranch, true);
        on_treeData_change();
    };

    this.get_first_branch = function() {
        if (tree.treeData.length > 0)
            return tree.treeData[0];
    };
    this.select_first_branch = function() {
        var b = this.get_first_branch();
        select_branch(b);
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
    this.get_selected_branch = function() {
        return selected_branch;
    };

    this.clear_selected_branch = function() {
        selected_branch = null;
    };


    this.get_children = function(b) {
        return b.children;
    };
    this.select_parent_branch = function(b) {
        var p = get_parent(b);
        if (p)
            select_branch(p);
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
    this.add_branch = function(parent, new_branch, top) {
        if (parent) {
            if (top)
                parent.children.unshift(new_branch);
            else
                parent.children.push(new_branch);
            parent.expanded = true;
        } else {
            if (top)
                tree.treeData.unshift(new_branch);
            else
                tree.treeData.push(new_branch);
        }
        on_treeData_change();
    };

    this.remove_branch = function(branch) {
        remove_branch(branch);
        on_treeData_change();
    };

    this.remove_single_branch = function(branch) {
        remove_single_branch(branch);
        on_treeData_change();
    };

    // this.add_root_branch = function(new_branch) {
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
    this.expand_branch = function(b) {
        if (!b)
            b = this.get_selected_branch();
        if (b) {
            //scope.expandCallback({ branch: b });
            b.expanded = true;
        }
        on_treeData_change();
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
    this.collapse_branch = function(b) {
        if (!b)
            b = selected_branch;
        if (b)
            b.expanded = false;
        on_treeData_change();
    };
    this.get_siblings = function(b) {
        var siblings;
        var p = get_parent(b);
        if (p)
            siblings = p.children;
        else
            siblings = tree.treeData;
        return siblings;
    };
    this.get_next_sibling = function(b) {
        var siblings = this.get_siblings(b);
        if (angular.isArray(siblings)) {
            var i = siblings.indexOf(b);
            if (i < siblings.length - 1)
                return siblings[i + 1];
        }
    };
    this.get_prev_sibling = function(b) {
        var siblings = this.get_siblings(b);
        if (angular.isArray(siblings)) {
            var i = siblings.indexOf(b);
            if (i > 0)
                return siblings[i - 1];
        }
    };
    this.select_next_sibling = function(b) {
        var next = this.get_next_silbing(b);
        if (next)
            select_branch(next);
    };
    this.select_prev_sibling = function(b) {
        var prev = this.get_prev_sibling(b);
        if (prev)
            select_branch(prev);
    };
    this.get_first_child = function(b) {
        if (!b)
            b =  selected_branch;
        if (b && b.children && b.children.length > 0)
            return b.children[0];
    };
    this.get_closest_ancestor_next_sibling = function(b) {
        var next = this.get_next_sibling(b);
        if (next)
            return next;
        else {
            next = get_parent(b);
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
    this.get_next_branch = function(b) {
         if (!b)
            b =  selected_branch;
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
    this.select_next_branch = function(b) {
        var next = this.get_next_branch(b);
        if (next)
            select_branch(next);
    };
    this.last_descendant = function(b) {
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
    this.get_prev_branch = function(b) {
        var prev_sibling = this.get_prev_sibling(b);
        if (prev_sibling)
            return this.last_descendant(prev_sibling);
        return get_parent(b);
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
    this.select_prev_branch = function(b) {
        var prev = this.get_prev_branch(b);
        if (prev)
            select_branch(prev);
    };

    /**
     * @ngdoc function
     * @name mms.directives.directive:mmsTree#refresh
     * @methodOf mms.directives.directive:mmsTree
     *
     * @description
     * rerender the tree when data or options change
     */
    this.refresh = function() {
        on_treeData_change();
    };

    this.initialSelect = function() {
        on_initialSelection_change();
    };

    this.sort_branch = function(b, sortFunction) {
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
    this.get_branch = function(data) {
        var branch = null;
        for_each_branch(function(b) {
            // if (angular.equals(b.data,data)) {
            //     branch = b;
            // }
            if (b.data.id === data.id) {
                branch = b;
            }
        });
        return branch;
    };

    this.get_rows = function() {
        return tree.treeRows;
    };

    this.user_clicks_branch = function(branch) {
        if (branch !== selected_branch)
            select_branch(branch);
        //return scope.user_clicks_branch(branch);
    };

    var for_each_branch = function(func, excludeBranch, modify) {
        var run = function(branch, level) {
            func(branch, level);
            if (branch.children) {
                for (var i = 0; i < branch.children.length; i++) {
                    run(branch.children[i], level + 1);
                }
            }
        };
        var rootLevelBranches = excludeBranch ? tree.treeData.filter(function(branch) { return branch !== excludeBranch; }) : tree.treeData;
        rootLevelBranches.forEach(function (branch) { run(branch, 1); });
    };

    var remove_branch_impl = function (branch, singleBranch) {
        var parent_branch = get_parent(branch);
        if (!parent_branch) {
            for (var j = 0; j < tree.treeData.length; j++) {
                if (tree.treeData[j].uid === branch.uid) {
                    tree.treeData.splice(j,1);
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

    var remove_branch = function (branch) {
        remove_branch_impl(branch, false);
    };

    var remove_single_branch = function (branch) {
        remove_branch_impl(branch, true);
    };

    var get_parent = function(child) {
        var parent = null;
        if (child !== null && child.parent_uid) {
            for_each_branch(function(b) {
                if (b.uid === child.parent_uid) {
                    parent = b;
                }
            });
        }
        return parent;
    };

    var expandPathToSelectedBranch = function() {
        if (selected_branch) {
            expand_all_parents(selected_branch);
            on_treeData_change();
        }
    };

    var for_all_ancestors = function(child, fn) {
        var parent = get_parent(child);
        if (parent) {
            fn(parent);
            for_all_ancestors(parent, fn);
        }
    };

    var expand_all_parents = function(child) {
        for_all_ancestors(child, function(b) {
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
    var select_branch = function(branch, noClick) {
        if (!branch) {
            if (selected_branch)
                selected_branch.selected = false;
            selected_branch = null;
            return;
        }
        if (branch !== selected_branch) {
            if (selected_branch)
                selected_branch.selected = false;
            branch.selected = true;
            selected_branch = branch;
            /*if(branch.expandable === true)
            {
                scope.expandCallback({ branch: branch });
            }*/
            expand_all_parents(branch);
            if (!noClick) {
                var options = rootScopeSvc.treeOptions();
                if (branch.onSelect) {
                    eventSvc.$broadcast(branch.onSelect,{ branch: branch });
                } else if (options.onSelect) {
                    eventSvc.$broadcast(options.onSelect,{ branch: branch });
                }
            }
            if (branch.data.id) {
                eventSvc.$broadcast('tree-get-branch-element', { id: branch.data.id });
            }
            // fix for when user presses browser back button
        } else {
            expand_all_parents(branch);
        }
    };

    var on_initialSelection_change = function() {
        let initialSelection = rootScopeSvc.treeInitialSelection();
        if (initialSelection) {
            for_each_branch(function(b) {
                if (b.data.id === initialSelection) {
                    select_branch(b, true);
                }
            });
            on_treeData_change();
        }
    };

    var on_treeData_change = function() {
        for_each_branch(function(b, level) {
            if (!b.uid)
                b.uid = '' + Math.random();
        });
        for_each_branch(function(b) {
            if (angular.isArray(b.children)) {
                for (var i = 0; i < b.children.length; i++) {
                    var child = b.children[i];
                    child.parent_uid = b.uid;
                }
            }
        });
        //rootScopeSvc.treeRows(['bar']);
        tree.treeRows.length = 0;
        const tree_rows = [];
        const options = rootScopeSvc.treeOptions();
        const icons = rootScopeSvc.treeIcons();

        if (options.sort) {
            tree.treeData.sort(treeSortFunction);
        }
        var add_branch_to_list = function(level, section, branch, visible, peNums) {
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
                    branch.children.sort(treeSortFunction);
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


        for (var i = 0; i < tree.treeData.length; i++) {
            add_branch_to_list(1, [], tree.treeData[i], true, {figure: 0, table: 0, equation: 0});
        }
        tree.treeRows.push(...tree_rows);
    };

    // TODO: Update sort function to handle all cases
    var treeSortFunction = function (a, b) {

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

    this.select_branch = select_branch;
    this.for_each_branch = for_each_branch;
    this.on_treeData_change = on_treeData_change;
    this.on_initialSelection_change = on_initialSelection_change;
    this.expandPathToSelectedBranch = expandPathToSelectedBranch;

}