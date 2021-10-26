'use strict';

angular.module('mms.directives')
.directive('mmsTree', ['ApplicationService', '$timeout', '$log', '$templateCache', '$filter', 'UtilsService', 'TreeService', 'SessionService', mmsTree]);

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
        $scope.treeData = [
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
function mmsTree(ApplicationService, $timeout, $log, $templateCache, $filter, UtilsService, TreeService, SessionService) {

    var mmsTreeLink = function(scope, element, attrs) {

        //Initialize Tree API
        var tree = TreeService.getTree().getApi();
        var session = SessionService;

        scope.selected_branch = tree.selected_branch;

        scope.getHref = getHref;
        if (!scope.options) {
            scope.options = {
                expandLevel: 1,
                search: ''
            };
        }
        let icons = session.treeIcons();
        if (!icons)
            icons = {};
        if (!icons.iconExpand)
            icons.iconExpand = 'fa fa-caret-right fa-lg fa-fw';
        if (!icons.iconCollapse)
            icons.iconCollapse = 'fa fa-caret-down fa-lg fa-fw';
        if (!icons.iconDefault)
            icons.iconDefault = 'fa fa-file fa-fw';
        session.treeIcons(icons);
        if (!scope.options.expandLevel && scope.options.expandLevel !== 0)
            scope.options.expandLevel = 1;
        var expand_level = scope.options.expandLevel;
        if (!angular.isArray(scope.treeData)) {
            $log.warn('treeData is not an array!');
            return;
        }

        scope.$watch('treeData',session.treeData(scope.treeData));
        scope.$watch('treeOptions',session.treeOptions(scope.treeOptions));
        scope.$watch('initialSelection', session.treeInitialSelection(scope.initialSelection));


        scope.expandCallback = function(obj, e){
            if(!obj.branch.expanded && scope.options.expandCallback) {
                scope.options.expandCallback(obj.branch.data.id, obj.branch, false);
            }
            obj.branch.expanded = !obj.branch.expanded;
            if (e) {
                e.stopPropagation();
                tree.on_treeData_change();
            }
        };

        scope.$root.$on(session.constants.TREEDATA, tree.on_treeData_change, false);
        scope.$root.$on(session.constants.TREEINITIALSELECTION, tree.on_initialSelection_change);

        scope.tree_rows = [];
        session.treeRows([]);
        scope.$root.$on(session.constants.TREEROWS, () => {scope.tree_rows = session.treeRows();});

        scope.$root.$on('tree-get-branch-element', (event, args) => {
            $timeout(function() {
                var el = angular.element('#tree-branch-' + args.id);
                if (!el.isOnScreen() && el.get(0) !== undefined) {
                    el.get(0).scrollIntoView();
                }
            }, 500, false);
        });


        scope.treeFilter = $filter('uiTreeFilter');

        if (attrs.initialSelection) {
            //Triggers Event
            session.treeInitialSelection(attrs.initialSelection);
        }

        tree.for_each_branch(function(b, level) {
            b.level = level;
            b.expanded = b.level <= expand_level;
        });

        // on_treeData_change();

        scope.user_clicks_branch = function(branch) {
            tree.select_branch(branch);
        };

        scope.user_dblclicks_branch = function(branch) {
            if (branch.onDblclick) {
                scope.$root.$broadcast(branch.onDblclick,{ branch: branch });
            } else if (scope.options.onDblclick) {
                scope.$root.$broadcast(scope.options.onDblclick,{ branch: branch });
            }
        };

    };




    function getHref(row) {
        var data = row.branch.data;
        if (row.branch.type !== 'group' && UtilsService.isDocument(data) && !ApplicationService.getState().fullDoc) {
            var ref = data._refId ? data._refId : 'master';
            return UtilsService.PROJECT_URL_PREFIX + data._projectId + '/' + ref+ '/documents/' + data.id + '/views/' + data.id;
        }
    }

    return {
        restrict: 'E',
        template: $templateCache.get('mms/templates/mmsTree.html'),
        // replace: true,
        scope: {
            treeData: '<',
            initialSelection: '@',
            options: '<'
        },
        link: mmsTreeLink
    };
}
