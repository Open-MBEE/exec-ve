import * as angular from "angular";
var mmsDirectives = angular.module('mmsDirectives');

let TreeComponent = {
    selector: "tree",
    template: `
<ul class="nav nav-list nav-pills nav-stacked abn-tree">
    <li ng-repeat="row in $ctrl.treeRows | filter:{visible:true} track by row.branch.uid" ng-hide="!$ctrl.treeFilter(row, $ctrl.options.search)"
        ng-class="'level-' + {{row.level}}" class="abn-tree-row">
        <div class="arrow" ng-click="user_clicks_branch(row.branch)" ng-dblclick="user_dblclicks_branch(row.branch)" ng-class="{'active-text': row.branch.selected}" id="tree-branch-{{row.branch.data.id}}">
            <div class="shaft" ng-class="{'shaft-selected': row.branch.selected, 'shaft-hidden': !row.branch.selected}">
                <a ng-href="{{getHref(row);}}" class="tree-item">
                    <i ng-class="{'active-text': row.branch.selected}" ng-click="expandCallback(row, $event)" class="indented tree-icon {{row.expand_icon}}" ></i>
                    <i ng-class="{'active-text': row.branch.selected}" class="indented tree-icon {{row.type_icon}}" ></i>
                    <span class="indented tree-label" ng-class="{'active-text': row.branch.selected}">{{row.section}} {{row.branch.data.name}}</span>
                </a>
            </div>
        </div>
    </li>
</ul>
`,
    bindings: {
        treeData: '<',
        initialSelection: '@',
        treeControl: '<',
        options: '<'
    },
    controller: class TreeController {
        static $inject = ['ApplicationService', '$timeout', '$log', '$filter', '$scope', '$attrs', 'UtilsService']

        private ApplicationService
        private $timeout
        private $log
        private $filter
        private $scope
        private $attrs
        private UtilsService

        //bindings
        public treeData;
        public initialSelection;
        public treeControl;
        public options;

        //public data
        public treeRows;
        public treeFilter;

        //local Variables
        private expand_level
        private selected_branch

        constructor(ApplicationService, $timeout, $log, $filter, $scope, $attrs, UtilsService) {
            this.ApplicationService = ApplicationService;
            this.$timeout = $timeout;
            this.$log = $log;
            this.$filter = $filter;
            this.$scope = $scope
            this.$attrs = $attrs;
            this.UtilsService = UtilsService;

            if (!this.options) {
                this.options = {
                    expandLevel: 1,
                    search: ''
                };
            }

            if (!this.$attrs.iconExpand)
                this.$attrs.iconExpand = 'fa fa-caret-right fa-lg fa-fw';
            if (!this.$attrs.iconCollapse)
                this.$attrs.iconCollapse = 'fa fa-caret-down fa-lg fa-fw';
            if (!this.$attrs.iconDefault)
                $attrs.iconDefault = 'fa fa-file fa-fw';
            if (!this.options.expandLevel && this.options.expandLevel !== 0)
                this.options.expandLevel = 1;

            this.expand_level = this.options.expandLevel;
            this.selected_branch = this.treeControl.selected_branch;

            if (!angular.isArray(this.treeData)) {
                $log.warn('treeData is not an array!');
                return;
            }

            this.$scope.$watch('treeData', this.treeControl.on_treeData_change, false);
            this.$scope.$watch('initialSelection', this.treeControl.on_initialSelection_change);

            this.treeRows = this.treeControl.treeRows;
            this.treeControl.treeIcons = this.$attrs;
            this.treeFilter = $filter('uiTreeFilter');

            if (this.initialSelection) {
                this.for_each_branch((b) => {
                    if (b.data.id === this.initialSelection) {
                        this.$timeout(() => {
                            this.treeControl.select_branch(b);
                        });
                    }
                });
            }

            this.for_each_branch((b, level) => {
                b.level = level;
                b.expanded = b.level <= this.expand_level;
            });

        }

        for_each_branch = function(func, excludeBranch?) {
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

        remove_branch_impl = function (branch, singleBranch) {
            var parent_branch = this.get_parent(branch);
            if (!parent_branch) {
                for (var j = 0; j < this.treeData.length; j++) {
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

        remove_branch = (branch) => {
            this.remove_branch_impl(branch, false);
        };

        remove_single_branch = (branch) => {
            this.remove_branch_impl(branch, true);
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

        expandPathToSelectedBranch = () => {
            if (this.selected_branch) {
                this.treeControl.expand_all_parents(this.selected_branch);
                this.treeControl.on_treeData_change();
            }
        };


        // on_treeData_change();

        user_clicks_branch = (branch) => {
            if (branch !== this.selected_branch) 
                this.treeControl.select_branch(branch);
        };

        user_dblclicks_branch = (branch) => {
            if (branch.onDblclick) {
                this.$timeout(() => {
                    branch.onDblclick(branch);
                });
            } else if (this.options.onDblclick) {
                this.$timeout(() => {
                    this.options.onDblclick(branch);
                });
            }
        };

        getHref = (row) => {
            var data = row.branch.data;
            if (row.branch.type !== 'group' && this.UtilsService.isDocument(data) && !this.ApplicationService.getState().fullDoc) {
                var ref = data._refId ? data._refId : 'master';
                return this.UtilsService.PROJECT_URL_PREFIX + data._projectId + '/' + ref+ '/documents/' + data.id + '/views/' + data.id;
            }
        }

    }
}

mmsDirectives.component(TreeComponent.selector, TreeComponent);