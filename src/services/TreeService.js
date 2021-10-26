'use strict';

angular.module('mms')
    .factory('TreeService', ['$rootScope', '$timeout', 'SessionService', TreeService]);

function TreeService($rootScope, $timeout, SessionService) {
    this.tree = null;

    var getTree = () => {
        if (this.tree !== null) {
            return this.tree;
        }
        this.tree = new Tree($rootScope, $timeout, SessionService);
        return this.tree;
    };

    return {
        getTree: getTree
    };
}

function Tree($rootScope, $timeout, SessionService) {
    let ve_tree_pane = null;

    let ve_treeApi = {};

    const setPane = (pane) => {
        ve_tree_pane = pane;
    };

    const getPane = () => {
        return ve_tree_pane;
    };

    const getApi = () => {
        if (!(ve_treeApi instanceof TreeApi)) {
            ve_treeApi = new TreeApi($rootScope, $timeout, SessionService);
        }
        return ve_treeApi;
    };

    return {
        getPane: getPane,
        setPane: setPane,
        getApi: getApi
    };


}
function TreeApi($rootScope, $timeout, SessionService) {
    const tree = this;
    let selected_branch = null;
    const session = SessionService;

    //var get_parent = get_parent;

    /**
     * @ngdoc function
     * @name mms.directives.directive:mmsTree#expand_all
     * @methodOf mms.directives.directive:mmsTree
     *
     * @description
     * self explanatory
     */
    tree.expand_all = function() {
        for_each_branch(function(b, level) {
            //scope.expandCallback({ branch: b });
            b.expanded = true;
        });
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
    tree.collapse_all = function(excludeBranch) {
        for_each_branch(function(b, level) {
            b.expanded = false;
        }, excludeBranch);
        on_treeData_change();
    };

    tree.get_first_branch = function() {
        if (session.treeData().length > 0)
            return session.treeData()[0];
    };
    tree.select_first_branch = function() {
        var b = tree.get_first_branch();
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
    tree.get_selected_branch = function() {
        return selected_branch;
    };

    tree.clear_selected_branch = function() {
        selected_branch = null;
    };


    tree.get_children = function(b) {
        return b.children;
    };
    tree.select_parent_branch = function(b) {
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
    tree.add_branch = function(parent, new_branch, top) {
        if (parent) {
            if (top)
                parent.children.unshift(new_branch);
            else
                parent.children.push(new_branch);
            parent.expanded = true;
        } else {
            var td = session.treeData();
            if (top)
                td.unshift(new_branch);
            else
                td.push(new_branch);
            session.treeData(td);
        }
        on_treeData_change();
    };

    tree.remove_branch = function(branch) {
        remove_branch(branch);
        on_treeData_change();
    };

    tree.remove_single_branch = function(branch) {
        remove_single_branch(branch);
        on_treeData_change();
    };

    tree.add_root_branch = function(new_branch) {
        tree.add_branch(null, new_branch);
    };
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
    tree.expand_branch = function(b) {
        if (!b)
            b = tree.get_selected_branch();
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
    tree.collapse_branch = function(b) {
        if (!b)
            b = selected_branch;
        if (b)
            b.expanded = false;
        on_treeData_change();
    };
    tree.get_siblings = function(b) {
        var siblings;
        var p = get_parent(b);
        if (p)
            siblings = p.children;
        else
            siblings = session.treeData();
        return siblings;
    };
    tree.get_next_sibling = function(b) {
        var siblings = tree.get_siblings(b);
        if (angular.isArray(siblings)) {
            var i = siblings.indexOf(b);
            if (i < siblings.length - 1)
                return siblings[i + 1];
        }
    };
    tree.get_prev_sibling = function(b) {
        var siblings = tree.get_siblings(b);
        if (angular.isArray(siblings)) {
            var i = siblings.indexOf(b);
            if (i > 0)
                return siblings[i - 1];
        }
    };
    tree.select_next_sibling = function(b) {
        var next = tree.get_next_silbing(b);
        if (next)
            select_branch(next);
    };
    tree.select_prev_sibling = function(b) {
        var prev = tree.get_prev_sibling(b);
        if (prev)
            select_branch(prev);
    };
    tree.get_first_child = function(b) {
        if (!b)
            b =  selected_branch;
        if (b && b.children && b.children.length > 0)
            return b.children[0];
    };
    tree.get_closest_ancestor_next_sibling = function(b) {
        var next = tree.get_next_sibling(b);
        if (next)
            return next;
        else {
            next = get_parent(b);
            return tree.get_closest_ancestor_next_sibling(next);
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
    tree.get_next_branch = function(b) {
        if (!b)
            b =  selected_branch;
        if (b) {
            var next = tree.get_first_child(b);
            if (next)
                return next;
            else {
                next = tree.get_closest_ancestor_next_sibling(b);
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
    tree.select_next_branch = function(b) {
        var next = tree.get_next_branch(b);
        if (next)
            select_branch(next);
    };
    tree.last_descendant = function(b) {
        if (b) {
            if (b.children.length === 0)
                return b;
            var last = b.children[b.children.length - 1];
            return tree.last_descendant(last);
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
    tree.get_prev_branch = function(b) {
        var prev_sibling = tree.get_prev_sibling(b);
        if (prev_sibling)
            return tree.last_descendant(prev_sibling);
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
    tree.select_prev_branch = function(b) {
        var prev = tree.get_prev_branch(b);
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
    tree.refresh = function() {
        on_treeData_change();
    };

    tree.initialSelect = function() {
        on_initialSelection_change();
    };

    tree.sort_branch = function(b, sortFunction) {
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
    tree.get_branch = function(data) {
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

    tree.get_rows = function() {
        return session.treeRows();
    };

    tree.user_clicks_branch = function(branch) {
        if (branch !== selected_branch)
            tree.select_branch(branch);
        //return scope.user_clicks_branch(branch);
    };

    var for_each_branch = function(func, excludeBranch) {
        var treeData = session.treeData();
        var run = function(branch, level) {
            func(branch, level);
            if (branch.children) {
                for (var i = 0; i < branch.children.length; i++) {
                    run(branch.children[i], level + 1);
                }
            }
        };
        var rootLevelBranches = excludeBranch ? treeData.filter(function(branch) { return branch !== excludeBranch; }) : treeData;
        rootLevelBranches.forEach(function (branch) { run(branch, 1); });
    };

    var remove_branch_impl = function (branch, singleBranch) {
        var parent_branch = get_parent(branch);
        if (!parent_branch) {
            var td = session.treeData();
            for (var j = 0; j < td.length; j++) {
                if (td[j].uid === branch.uid) {
                    td.splice(j,1);
                    break;
                }
            }
            session.treeData(td);
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
        if (child.parent_uid) {
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
                var options = session.treeOptions();
                if (branch.onSelect) {
                    $rootScope.$broadcast(branch.onSelect,{ branch: branch });
                } else if (options.onSelect) {
                    $rootScope.$broadcast(options.onSelect,{ branch: branch });
                }
            }
            if (branch.data.id) {
                $rootScope.$broadcast('tree-get-branch-element', { id: branch.data.id });
                // $timeout(function() {
                //     var el = angular.element('#tree-branch-' + branch.data.id);
                //     if (!el.isOnScreen()) {
                //         el.get(0).scrollIntoView();
                //     }
                // }, 500, false);
            }
            // fix for when user presses browser back button
        } else {
            expand_all_parents(branch);
        }
    };

    var on_initialSelection_change = function() {
        let initialSelection = session.treeInitialSelection();
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
        let td = session.treeData();
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
        session.treeRows([]);
        let tree_rows = session.treeRows();
        var options = session.treeOptions();
        var icons = session.treeIcons();
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
                    branch.children.sort(options.sort);
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

        if (options.sort) {
            td.sort(options.sort);
            session.treeData(td);
        }

        for (var i = 0; i < td.length; i++) {
            add_branch_to_list(1, [], td[i], true, {figure: 0, table: 0, equation: 0});
        }
        session.treeRows(tree_rows);
    };

    tree.select_branch = select_branch;
    tree.for_each_branch = for_each_branch;
    tree.on_treeData_change = on_treeData_change;
    tree.on_initialSelection_change = on_initialSelection_change;

}