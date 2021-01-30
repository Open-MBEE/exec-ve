import * as angular from "angular";
import { tree } from "d3";
import {ToolbarApi} from "./Toolbar.service";
var mmsDirectives = angular.module('mmsDirectives');

class TreeApi {
  private $timeout;
  private options;
  private expandPathToSelectedBranch;

  private selected_branch;

  public treeData;
  public treeRows;
  public initialSelection;
  public treeOptions;
  public treeIcons;
  
  
  constructor($timeout) {
    this.$timeout = $timeout;
    this.treeData = {};
    this.treeRows = [];
    //this.treeRows = this.treeRows;
    this.options = {};
  }

  for_each_branch = (func, excludeBranch?) => {
    var run = function(branch, level) {
        func(branch, level);
        if (branch.children) {
            for (var i = 0; i < branch.children.length; i++) {
                run(branch.children[i], level + 1);
            }
        }
    };
    var rootLevelBranches = excludeBranch ? this.treeData.filter((branch) => { return branch !== excludeBranch; }) : this.treeData;
    rootLevelBranches.forEach(function (branch) { run(branch, 1); });
  };

  on_initialSelection_change = () => {
    if (this.initialSelection) {
        this.for_each_branch((b) => {
            if (b.data.id === this.initialSelection) {
                this.select_branch(b, true);
            }
        });
        this.on_treeData_change();
    }
};

  on_treeData_change = () => {
    this.for_each_branch((b, level) => {
        if (!b.uid)
            b.uid = '' + Math.random();
    });
    this.for_each_branch((b) => {
        if (angular.isArray(b.children)) {
            for (var i = 0; i < b.children.length; i++) {
                var child = b.children[i];
                child.parent_uid = b.uid;
            }
        }
    });
    this.treeRows = [];
    var add_branch_to_list = (level, section, branch, visible, peNums) => {
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
                    expand_icon = this.treeIcons.iconCollapse;
                } else {
                    expand_icon = this.treeIcons.iconExpand;
                }
            } else
                expand_icon = "fa fa-lg fa-fw";
        } else
            expand_icon = "fa fa-lg fa-fw";

        if (branch.loading) {
            type_icon = "fa fa-spinner fa-spin";
        } else if (this.options && this.options.types && this.options.types[branch.type.toLowerCase() + aggr]) {
            type_icon = this.options.types[branch.type.toLowerCase() + aggr];
        } else {
            type_icon = this.treeIcons.iconDefault;
        }

        var number = section.join('.');
        if (branch.type === 'figure' || branch.type === 'table' || branch.type === 'equation') {
            peNums[branch.type]++;
            if (this.options.numberingDepth == 0) {
                number = peNums[branch.type];
            } else if (section.length >= this.options.numberingDepth) {
                number = section.slice(0, this.options.numberingDepth).join('.') + this.options.numberingSeparator + peNums[branch.type];
            } else {
                var sectionCopy = section.slice();
                while (sectionCopy.length < this.options.numberingDepth) {
                    sectionCopy.push(0);
                }
                number = sectionCopy.join('.') + this.options.numberingSeparator + peNums[branch.type]; 
            }
        } else if (branch.type !== 'view' && branch.type !== 'section') {
            number = '';
        }
        if (branch.data && branch.data.id && this.options.sectionNumbering) {
            branch.data._veNumber = number;
        }
        if (branch.hide)
            visible = false;
        this.treeRows.push({
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
            if (this.options.sort) {
                branch.children.sort(this.options.sort);
            }
            var j = this.options.startChapter;
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
                    if (this.options.sectionNumbering) {
                        if (branch.children[i].data._isAppendix) {
                            alpha = true;
                            j = 0;
                        }
                        var nextSection = section.slice(); 
                        nextSection.push(alpha ? String.fromCharCode(j + 65) : j);
                        if (nextSection.length <= this.options.numberingDepth) {
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

    if (this.options.sort) {
      this.treeData.sort(this.options.sort);
    }

    for (var i = 0; i < this.treeData.length; i++) {
        add_branch_to_list(1, [], this.treeData[i], true, {figure: 0, table: 0, equation: 0});
    }

};

expandCallback = (obj, e?) => {
  if(!obj.branch.expanded && this.options.expandCallback) {
    this.options.expandCallback(obj.branch.data.id, obj.branch, false);
  }
  obj.branch.expanded = !obj.branch.expanded;
  if (e) {
      e.stopPropagation();
      this.on_treeData_change();
  }
};

get_parent = (child) => {
  var parent = null;
  if (child.parent_uid) {
      this.for_each_branch((b) => {
          if (b.uid === child.parent_uid) {
              parent = b;
          }
      });
  }
  return parent;
};

/**
         * @ngdoc function
         * @name mmsDirectives.directive:mmsTree#select_branch
         * @methodOf mmsDirectives.directive:mmsTree
         * 
         * @description 
         * self explanatory
         *
         * @param {Object} branch branch to select
         */
        select_branch = (branch, noClick?) => {
          if (!branch) {
              if (this.selected_branch) {
                  this.selected_branch.selected = false;
              }
              this.selected_branch = null;
              return;
          }
          if (branch !== this.selected_branch) {
              if (this.selected_branch) {
                  this.selected_branch.selected = false;
              }
              branch.selected = true;
              this.selected_branch = branch;
              /*if(branch.expandable === true)
              {
                  scope.expandCallback({ branch: branch });
              }*/
              this.expand_all_parents(branch);
              if (!noClick) {
                  if (branch.onSelect) {
                      this.$timeout(() => {
                          branch.onSelect(branch);
                      });
                  } else if (this.options.onSelect) {
                      this.$timeout(() => {
                          this.options.onSelect(branch);
                      });
                  }
              }
              if (branch.data.id) {
                  this.$timeout(() => {
                      var el = angular.element('#tree-branch-' + branch.data.id);
                      if (!el.isOnScreen()) {
                          el.get(0).scrollIntoView();
                      }
                  }, 500, false);
              }
          // fix for when user presses browser back button
          } else {
              this.expand_all_parents(branch);
          }
      };

      expand_all_parents = (child) => {
        this.for_all_ancestors(child, (b) => {
            if(b.expandable === true)
            {
                this.expandCallback({ branch: b });
            }
            b.expanded = true;
        });
    };

    for_all_ancestors = (child, fn) => {
      var parent = this.get_parent(child);
      if (parent) {
          fn(parent);
          this.for_all_ancestors(parent, fn);
      }
  };

  /**
   * @ngdoc function
   * @name mmsDirectives.directive:mmsTree#expand_all
   * @methodOf mmsDirectives.directive:mmsTree
   *
   * @description
   * self explanatory
   */
  expand_all = () => {
    this.for_each_branch(function(b, level) {
      this.expandCallback({ branch: b });
      b.expanded = true;
    });
    this.on_treeData_change();
  };
  /**
   * @ngdoc function
   * @name mmsDirectives.directive:mmsTree#collapse_all
   * @methodOf mmsDirectives.directive:mmsTree
   *
   * @description
   * self explanatory
   */
  collapse_all = (excludeBranch) => {
    this.for_each_branch(function(b, level) {
      b.expanded = false;
    }, excludeBranch);
    this.on_treeData_change();
  };

  get_first_branch = () => {
    if (this.treeData.length > 0)
      return this.treeData[0];
  };
  select_first_branch = () => {
    var b = this.get_first_branch();
    this.select_branch(b);
  };
  /**
   * @ngdoc function
   * @name mmsDirectives.directive:mmsTree#get_selected_branch
   * @methodOf mmsDirectives.directive:mmsTree
   *
   * @description
   * self explanatory
   *
   * @return {Object} current selected branch
   */
  get_selected_branch = () => {
    return this.selected_branch;
  };

  clear_selected_branch = () => {
    this.selected_branch = null;
  };

  get_parent_object = this.get_parent;
  //select_branch = this.select_branch;

  get_children = (b) => {
    return b.children;
  };
  select_parent_branch = (b) => {
    var p = this.get_parent_object(b);
    if (p)
      this.select_branch(p);
  };
  /**
   * @ngdoc function
   * @name mmsDirectives.directive:mmsTree#add_branch
   * @methodOf mmsDirectives.directive:mmsTree
   *
   * @description
   * self explanatory
   *
   * @param {Object} parent parent branch or null
   * @param {Object} new_branch branch to add to parent or root
   */
  add_branch = function(parent, new_branch, top) {
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
    this.on_treeData_change();
  };

  remove_branch = (branch) => {
    this.remove_branch(branch);
    this.on_treeData_change();
  };

  remove_single_branch = (branch) => {
    this.remove_single_branch(branch);
    this.on_treeData_change();
  };

  add_root_branch = function(new_branch) {
    this.add_branch(null, new_branch);
  };
  /**
   * @ngdoc function
   * @name mmsDirectives.directive:mmsTree#expand_branch
   * @methodOf mmsDirectives.directive:mmsTree
   *
   * @description
   * self explanatory
   *
   * @param {Object} branch branch to expand
   */
  expand_branch = (b) => {
    if (!b)
      b = this.get_selected_branch();
    if (b) {
      this.expandCallback({ branch: b });
      b.expanded = true;
    }
    this.on_treeData_change();
  };

  /**
   * @ngdoc function
   * @name mmsDirectives.directive:mmsTree#collapse_branch
   * @methodOf mmsDirectives.directive:mmsTree
   *
   * @description
   * self explanatory
   *
   * @param {Object} branch branch to collapse
   */
  collapse_branch = (b) => {
    if (!b)
      b = this.selected_branch;
    if (b)
      b.expanded = false;
    this.on_treeData_change();
  };

  get_siblings = (b) => {
    var siblings;
    var p = this.get_parent_object(b);
    if (p)
      siblings = p.children;
    else
      siblings = this.treeData;
    return siblings;
  };

  get_next_sibling = (b) => {
    var siblings = this.get_siblings(b);
    if (angular.isArray(siblings)) {
      var i = siblings.indexOf(b);
      if (i < siblings.length - 1)
        return siblings[i + 1];
    }
  };

  get_prev_sibling = (b) => {
    var siblings = this.get_siblings(b);
    if (angular.isArray(siblings)) {
      var i = siblings.indexOf(b);
      if (i > 0)
        return siblings[i - 1];
    }
  };
  select_next_sibling = (b) => {
    var next = this.get_next_sibling(b);
    if (next)
      this.select_branch(next);
  };

  select_prev_sibling = (b) => {
    var prev = this.get_prev_sibling(b);
    if (prev)
      this.select_branch(prev);
  };

  get_first_child = (b) => {
    if (!b)
      b = this.selected_branch;
    if (b && b.children && b.children.length > 0)
      return b.children[0];
  };
  get_closest_ancestor_next_sibling = (b) => {
    var next = this.get_next_sibling(b);
    if (next)
      return next;
    else {
      next = this.get_parent_object(b);
      return this.get_closest_ancestor_next_sibling(next);
    }
  };
  /**
   * @ngdoc function
   * @name mmsDirectives.directive:mmsTree#get_next_branch
   * @methodOf mmsDirectives.directive:mmsTree
   *
   * @description
   * self explanatory
   *
   * @param {Object} branch current branch
   * @return {Object} next branch
   */
  get_next_branch = (b) => {
    if (!b)
      b = this.selected_branch;
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
   * @name mmsDirectives.directive:mmsTree#select_next_branch
   * @methodOf mmsDirectives.directive:mmsTree
   *
   * @description
   * self explanatory
   *
   * @param {Object} branch current branch
   */
  select_next_branch = (b) => {
    var next = this.get_next_branch(b);
    if (next)
      this.select_branch(next);
  };
  last_descendant = (b) => {
    if (b) {
      if (b.children.length === 0)
        return b;
      var last = b.children[b.children.length - 1];
      return this.last_descendant(last);
    }
  };
  /**
   * @ngdoc function
   * @name mmsDirectives.directive:mmsTree#get_prev_branch
   * @methodOf mmsDirectives.directive:mmsTree
   *
   * @description
   * self explanatory
   *
   * @param {Object} branch current branch
   * @return {Object} previous branch
   */
  get_prev_branch = (b) => {
    var prev_sibling = this.get_prev_sibling(b);
    if (prev_sibling)
      return this.last_descendant(prev_sibling);
    return this.get_parent_object(b);
  };
  /**
   * @ngdoc function
   * @name mmsDirectives.directive:mmsTree#select_prev_branch
   * @methodOf mmsDirectives.directive:mmsTree
   *
   * @description
   * self explanatory
   *
   * @param {Object} branch current branch
   */
  select_prev_branch = (b) => {
    var prev = this.get_prev_branch(b);
    if (prev)
      this.select_branch(prev);
  };

  /**
   * @ngdoc function
   * @name mmsDirectives.directive:mmsTree#refresh
   * @methodOf mmsDirectives.directive:mmsTree
   *
   * @description
   * rerender the tree when data or options change
   */
  refresh = () => {
    this.on_treeData_change();
  };

  initialSelect = () => {
    this.on_initialSelection_change();
  };

  sort_branch = (b, sortFunction) => {
    b.children.sort(sortFunction);
  };

  /**
   * @ngdoc function
   * @name mmsDirectives.directive:mmsTree#get_branch
   * @methodOf mmsDirectives.directive:mmsTree
   *
   * @description
   * Returns the branch with the specified data
   */
  get_branch = (data) => {
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

  get_rows = () => {
    return this.treeRows;
  };

  user_clicks_branch = (branch) => {
    return this.user_clicks_branch(branch);
  };

}
function treeService($timeout) {
  return new TreeApi($timeout);
}
treeService.$inject = ['$timeout'];

mmsDirectives
  .service("TreeService", treeService);