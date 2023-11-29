'use strict';

angular.module('mms.directives')
.directive('mmsTree', ['ApplicationService', '$timeout', '$log', '$templateCache', '$filter',
    'UtilsService', 'TreeService', 'RootScopeService', 'EventService', mmsTree]);

/**
 * @ngdoc directive
 * @name mms.directives.directive:mmsTree
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
    angular.module('app', ['mms.directives'])
    .controller('TreeCtrl', ['$scope', function($scope) {
        $scope.api = {}; //empty object to be populated by the spec api
        $scope.handler = function(branch) {
            //branch selected
        };
        $tree.treeData = [
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
function mmsTree(ApplicationService, $timeout, $log, $templateCache, $filter, UtilsService, TreeService, RootScopeService, EventService) {

    const eventSvc = EventService;
    const rootScopeSvc = RootScopeService;
    const tree = TreeService;

    var mmsTreeCtrl = function($scope) {

        eventSvc.$init($scope);
        $scope.treeApi = tree.getApi();
        $scope.treeData = tree.treeData;
        $scope.treeRows = tree.treeRows;


        $scope.selected_branch = $scope.treeApi.get_selected_branch();

        if (!$scope.options) {
            $scope.options = {
                expandLevel: 1,
                search: ''
            };
        }

        let icons = rootScopeSvc.treeIcons();
        if (!icons)
            icons = {};
        if (!icons.iconExpand)
            icons.iconExpand = 'fa fa-caret-right fa-lg fa-fw';
        if (!icons.iconCollapse)
            icons.iconCollapse = 'fa fa-caret-down fa-lg fa-fw';
        if (!icons.iconDefault)
            icons.iconDefault = 'fa fa-file fa-fw';
        rootScopeSvc.treeIcons(icons);

        if (!$scope.options.expandLevel && $scope.options.expandLevel !== 0)
            $scope.options.expandLevel = 1;
        var expand_level = $scope.options.expandLevel;
        if (!angular.isArray($scope.treeData)) {
            $log.warn('treeData is not an array!');
            return;
        }

        $scope.treeApi.on_treeData_change();

        $scope.$watch(() => { return $scope.treeOptions; },() => {
            rootScopeSvc.treeOptions($scope.treeOptions);
        });

        $scope.subs.push(eventSvc.$on('tree-get-branch-element', (args) => {
            $timeout(function() {
                var el = angular.element('#tree-branch-' + args.id);
                if (!el.isOnScreen() && el.get(0) !== undefined) {
                    el.get(0).scrollIntoView();
                }
            }, 500, false);
        }));



        $scope.treeFilter = $filter('uiTreeFilter');

        $scope.subs.push(eventSvc.$on(rootScopeSvc.constants.TREEINITIALSELECTION, () => {
            $scope.treeApi.on_initialSelection_change();
        }));

        $scope.treeApi.for_each_branch(function(b, level) {
            b.level = level;
            b.expanded = b.level <= expand_level;
        });

        $scope.$on('$destroy', (() => {
            //rootScopeSvc.treeRows([]);
            rootScopeSvc.treeInitialSelection(rootScopeSvc.constants.DELETEKEY);
            $scope.treeData.length = 0;
            $scope.treeRows.length = 0;
        }));

        if (rootScopeSvc.treeInitialSelection()) {
            //Triggers Event
            $scope.treeApi.on_initialSelection_change();
        }else {
            $scope.treeApi.on_treeData_change();
        }

    };

    var mmsTreeLink = function(scope, element, attrs) {

        scope.getHref = getHref;

        //scope.$watch('initialSelection', rootScopeSvc.treeInitialSelection(scope.initialSelection));

        scope.expandCallback = function(obj, e){
            if(!obj.branch.expanded && scope.options.expandCallback) {
                scope.options.expandCallback(obj.branch.data.id, obj.branch, false);
            }
            obj.branch.expanded = !obj.branch.expanded;
            if (e) {
                e.stopPropagation();
                scope.treeApi.on_treeData_change();
            }
        };

        scope.user_clicks_branch = function(branch) {
            scope.treeApi.select_branch(branch);
        };

        scope.user_dblclicks_branch = function(branch) {
            if (branch.onDblclick) {
                eventSvc.$broadcast(branch.onDblclick,{ branch: branch });
            } else if (scope.options.onDblclick) {
                eventSvc.$broadcast(scope.options.onDblclick,{ branch: branch });
            }
        };


    };




    function getHref(row) {
        //var data = row.branch.data;
        /*if (row.branch.type !== 'group' && UtilsService.isDocument(data) && !ApplicationService.getState().fullDoc) {
            var ref = data._refId ? data._refId : 'master';
            return UtilsService.PROJECT_URL_PREFIX + data._projectId + '/' + ref+ '/documents/' + data.id + '/views/' + data.id;
        }*/
    }

    return {
        restrict: 'E',
        template: `
            <ul class="nav nav-list nav-pills nav-stacked abn-tree">
                <li ng-repeat="row in treeRows | filter:{visible:true} track by row.branch.data.id" ng-hide="!treeFilter(row, options.search)"
                    ng-class="'level-' + {{ row.level }}" class="abn-tree-row">
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
        // replace: true,
        scope: {
            //treeData: '=',
            //initialSelection: '@',
            options: '<'
        },
        controller: ['$scope', mmsTreeCtrl],
        link: mmsTreeLink
    };
}
