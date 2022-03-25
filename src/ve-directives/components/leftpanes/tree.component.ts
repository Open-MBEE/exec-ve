import * as angular from "angular";
import {ApplicationService} from "../../../ve-utils/services/ApplicationService.service";
import {UtilsService} from "../../../ve-utils/services/UtilsService.service";
import {TreeApi, TreeService} from "../../../ve-utils/services/TreeService.service";
import {RootScopeService} from "../../../ve-utils/services/RootScopeService.service";
import {EventService} from "../../../ve-utils/services/EventService.service";
import {handleChange} from "../../../lib/changeUtils";
var veDirectives = angular.module('veDirectives');

/**
 * @ngdoc directive
 * @name veDirectives.directive:mmsTree
 *
 * @requires $timeout
 * @requires $templateCache
 *
 * @restrict E
 *
 * @description
 * Outputs a tree with customizable icons for different types of nodes and callback
 * for node branch clicked. Includes api, see methods section. (the name display is
 * angular data binded)
 * Object for tree model require (can have multiple roots):
 *  <pre>
 [
 {
            label: 'root node name',
            type: 'a type',
            data: {name: 'name will be shown', ...},
            children: [{...}]
        },
 {
            label: 'another root node',
            type: 'another type',
            data: {name: 'another name', ...},
            children: [{...}]
        }
 ]
 </pre>
 * Tree options:
 *  <pre>
 {
        types: {
            'a type': 'fa fa-file-o',
            'another type': 'fa fa-file'
        }
    }
 </pre>
 *
 * ## Example
 * ### controller (js)
 *  <pre>
 angular.module('app', ['veDirectives'])
 .controller('TreeCtrl', ['$scope', function($scope) {
        $scope.api = {}; //empty object to be populated by the spec api
        $public handler(branch) {
            //branch selected
        };
        this.treeData = [
            {
                label: 'Root',
                type: 'Package',
                data: {
                    name: 'Root',
                    sysmlId: 'id',
                    //any other stuff
                },
                children: [
                    {
                        label: 'Child',
                        type: 'Class',
                        data: {
                            name: 'Child',
                            sysmlId: 'blah',
                            //other stuff
                        },
                        children: []
                    }
                ]
            }
        ];
        $scope.options = {
            types: {
                'Package': 'fa fa-folder',
                'Class': 'fa fa-bomb'
            }
        };
    }]);
 </pre>
 * ### template (html)
 *  <pre>
 <div ng-controller="TreeCtrl">
 <mms-tree tree-data="treeData" on-select="handler(branch)" options="options" tree-control="api"></mms-tree>
 </div>
 </pre>
 *
 * @param {Array} treeData Array of root nodes
 * @param {Object=} treeControl Empty object to populate with api
 * @param {Object=} options Options object to customize icons for types and statuses
 * @param {string='fa fa-caret-right'} iconExpand icon to use when branch is collapsed
 * @param {string='fa fa-caret-down'} iconCollapse icon to use when branch is expanded
 * @param {string='fa fa-file'} iconDefault default icon to use for nodes
 */
let TreeComponent: angular.ve.ComponentOptions = {
    selector: 'tree',
    template: `
    <ul class="nav nav-list nav-pills nav-stacked abn-tree">
    <li ng-repeat="row in $ctrl.treeRows | filter:{visible:true} track by row.branch.uid" ng-hide="!$ctrl.treeFilter(row, options.search)"
        ng-class="'level-' + {{row.level}}" class="abn-tree-row">
        <div class="arrow" ng-click="$ctrl.userClicksBranch(row.branch)" ng-dblclick="$ctrl.user_dblclicks_branch(row.branch)" ng-class="{'active-text': row.branch.selected}" id="tree-branch-{{row.branch.data.id}}">
            <div class="shaft" ng-class="{'shaft-selected': row.branch.selected, 'shaft-hidden': !row.branch.selected}">
                <a ng-href="{{$ctrl.getHref(row);}}" class="tree-item">
                    <i ng-class="{'active-text': row.branch.selected}" ng-click="$ctrl.expandCallback(row, $event)" class="indented tree-icon {{row.expand_icon}}" ></i>
                    <i ng-class="{'active-text': row.branch.selected}" class="indented tree-icon {{row.type_icon}}" ></i>
                    <span class="indented tree-label" ng-class="{'active-text': row.branch.selected}">{{row.section}} {{row.branch.data.name}}</span>
                </a>
            </div>
        </div>
    </li>
</ul>
`,
    bindings: {
        options: "<"
    },
    controller: class TreeController implements angular.IComponentController {


        private treeApi: TreeApi;
        private treeData: any;
        private treeRows: any;
        private selectedBranch: any;

        //Bindings
        private options
        private subs: any;
        private treeFilter: any;

        static $inject = ['$timeout', '$log', '$filter', 'ApplicationService',
            'UtilsService', 'TreeService', 'RootScopeService', 'EventService'];

        constructor(private $timeout: angular.ITimeoutService, private $log: angular.ILogService,
                    private $filter: angular.IFilterService, private applicationSvc: ApplicationService,
                    private utilsSvc: UtilsService, private treeSvc: TreeService, private rootScopeSvc: RootScopeService,
                    private eventSvc: EventService) {}

        $onChanges(onChangesObj: angular.IOnChangesObject) {
            handleChange(onChangesObj,'options', () => {
                this.rootScopeSvc.treeOptions(this.options);
            })
        }

        $onInit() {
            this.eventSvc.$init(this);
            this.treeApi = this.treeSvc.getApi();
            this.treeData = this.treeApi.treeData;
            this.treeRows = this.treeApi.treeRows;
            this.selectedBranch = this.treeApi.getSelectedBranch();

            if (!this.options) {
                this.options = {
                    expandLevel: 1,
                    search: ''
                };
            }

            let icons = this.rootScopeSvc.treeIcons();
            if (!icons)
                icons = {};
            if (!icons.iconExpand)
                icons.iconExpand = 'fa fa-caret-right fa-lg fa-fw';
            if (!icons.iconCollapse)
                icons.iconCollapse = 'fa fa-caret-down fa-lg fa-fw';
            if (!icons.iconDefault)
                icons.iconDefault = 'fa fa-file fa-fw';
            this.rootScopeSvc.treeIcons(icons);

            if (!this.options.expandLevel && this.options.expandLevel !== 0)
                this.options.expandLevel = 1;
            let expand_level = this.options.expandLevel;
            if (!angular.isArray(this.treeData)) {
                this.$log.warn('treeData is not an array!');
                return;
            }

            this.treeApi.onTreeDataChange();

            this.subs.push(this.eventSvc.$on('tree-get-branch-element', (args) => {
                this.$timeout(function() {
                    var el = $('#tree-branch-' + args.id);
                    if (!el.isOnScreen() && el.get(0) !== undefined) {
                        el.get(0).scrollIntoView();
                    }
                }, 500, false);
            }));



            this.treeFilter = this.$filter('uiTreeFilter');

            this.subs.push(this.eventSvc.$on(this.rootScopeSvc.constants.TREEINITIALSELECTION, () => {
                this.treeApi.onInitialSelectionChange();
            }));

            this.treeApi.forEachBranch(function(b, level) {
                b.level = level;
                b.expanded = b.level <= expand_level;
            });



            if (this.rootScopeSvc.treeInitialSelection()) {
                //Triggers Event
                this.treeApi.onInitialSelectionChange();
            }else {
                this.treeApi.onTreeDataChange();
            }

        };

        $onDestroy() {
                //this.rootScopeSvc.treeRows([]);
                this.rootScopeSvc.treeInitialSelection(this.rootScopeSvc.constants.DELETEKEY);
                this.treeData.length = 0;
                this.treeRows.length = 0;
                this.eventSvc.destroy(this.subs);
        }

        public expandCallback(obj, e){
            if(!obj.branch.expanded && this.options.expandCallback) {
                this.options.expandCallback(obj.branch.data.id, obj.branch, false);
            }
            obj.branch.expanded = !obj.branch.expanded;
            if (e) {
                e.stopPropagation();
                this.treeApi.onTreeDataChange();
            }
        };

        public userClicksBranch(branch) {
            this.treeApi.selectBranch(branch);
        };

        public user_dblclicks_branch(branch) {
            if (branch.onDblclick) {
                this.eventSvc.$broadcast(branch.onDblclick,{ branch: branch });
            } else if (this.options.onDblclick) {
                this.eventSvc.$broadcast(this.options.onDblclick,{ branch: branch });
            }
        };

        public getHref(row) {
            //var data = row.branch.data;
            /*if (row.branch.type !== 'group' && UtilsService.isDocument(data) && !ApplicationService.getState().fullDoc) {
                var ref = data._refId ? data._refId : 'master';
                return UtilsService.PROJECT_URL_PREFIX + data._projectId + '/' + ref+ '/documents/' + data.id + '/views/' + data.id;
            }*/
        }
    }
}

veDirectives.component(TreeComponent.selector, TreeComponent);