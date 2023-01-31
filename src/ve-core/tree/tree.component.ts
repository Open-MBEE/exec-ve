import angular from 'angular'
import Rx from 'rx-lite'

import { TreeService } from '@ve-core/tree'
import {
    ApplicationService,
    EventService,
    RootScopeService,
    UtilsService,
} from '@ve-utils/services'

import { veCore } from '@ve-core'

import { VeComponentOptions } from '@ve-types/angular'
import {
    TreeBranch,
    TreeConfig,
    TreeIcons,
    TreeOptions,
    TreeRow,
} from '@ve-types/tree'

/**
 * @ngdoc directive
 * @name veCore.directive:mmsTree
 *
 * @requires $timeout
 * @requires $templateCache
 *
 * * Outputs a tree with customizable icons for different types of nodes and callback
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
            'a type': 'fa-regular fa-file',
            'another type': 'fa fa-file'
        }
    }
 </pre>
 *
 * ## Example
 * ### controller (js)
 *  <pre>
 angular.module('app', ['ve-core'])
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
 <tree tree-data="treeData" on-select="handler(branch)" options="options" tree-control="api"></tree>
 </div>
 </pre>
 *
 * @param {Array} treeData Array of root nodes
 * @param {Object=} treeControl Empty object to populate with api
 * @param {Object=} options Options object to customize icons for types and statuses
 */
class TreeController implements angular.IComponentController {
    //Bindings
    private treeOptions: TreeOptions
    private treeIcons: TreeIcons
    private treeConfig: TreeConfig

    public init: boolean = false
    public treeRows: TreeRow[]
    public title
    private selectedBranch: any
    public treeSpin: boolean = true

    public subs: Rx.IDisposable[]
    private treeFilter: angular.uiTreeFilter.IFilterUiTree<TreeRow>

    //Locals
    public icons: TreeIcons
    public options: TreeOptions

    static $inject = [
        '$scope',
        '$timeout',
        '$filter',
        'growl',
        'ApplicationService',
        'UtilsService',
        'TreeService',
        'RootScopeService',
        'EventService',
    ]

    constructor(
        private $scope: angular.IScope,
        private $timeout: angular.ITimeoutService,
        private $filter: angular.IFilterService,
        private growl: angular.growl.IGrowlService,
        private applicationSvc: ApplicationService,
        private utilsSvc: UtilsService,
        private treeSvc: TreeService,
        private rootScopeSvc: RootScopeService,
        private eventSvc: EventService
    ) {}

    $onInit(): void {
        this.treeSpin = true
        this.eventSvc.$init(this)
        this.treeSvc.waitForApi(this.treeConfig.id).then(
            (api) => {
                this.subs.push(
                    this.eventSvc.$on(TreeService.events.UPDATED, () => {
                        this.configure()
                    })
                )
                this.configure()
            },
            (reason) => {
                TreeService.treeError(reason)
            }
        )
    }

    $onDestroy(): void {
        this.eventSvc.destroy(this.subs)
        this.treeSpin = true
    }

    configure(): void {
        this.treeRows = this.treeSvc.getApi(this.treeConfig.id).getRows()
        if (this.treeRows.length > 0) {
            this.treeSpin = false
        }

        this.title = this.treeConfig.title ? this.treeConfig.title : ''
        this.selectedBranch = this.treeSvc
            .getApi(this.treeConfig.id)
            .getSelectedBranch()

        this.options = this.treeOptions
        const iconsDefault: TreeIcons = {
            iconExpand: 'fa-solid fa-caret-down fa-lg fa-fw',
            iconCollapse: 'fa-solid fa-caret-right fa-lg fa-fw',
            iconDefault: 'fa-solid fa-file fa-fw',
        }
        this.icons = this.treeIcons ? this.treeIcons : iconsDefault

        this.treeSvc.getApi(this.treeConfig.id).defaultIcon =
            this.icons.iconDefault

        if (!this.options.expandLevel && this.options.expandLevel !== 0)
            this.options.expandLevel = 1
        const expand_level = this.options.expandLevel

        this.subs.push(
            this.eventSvc.$on(
                'tree-get-branch-element',
                (data: { id: string; treeId: string }) => {
                    if (data.treeId === this.treeConfig.id) {
                        void this.$timeout(
                            () => {
                                const el = $('#tree-branch-' + data.id)
                                if (
                                    !el.isOnScreen() &&
                                    el.get(0) !== undefined
                                ) {
                                    el.get(0).scrollIntoView()
                                }
                            },
                            500,
                            false
                        )
                    }
                }
            )
        )

        this.treeFilter = this.$filter('uiTreeFilter')

        this.treeSvc.getApi(this.treeConfig.id).forEachBranch((b, level) => {
            b.level = level
            b.expanded = b.level <= expand_level
        })
    }

    public expandCallback = (
        branch: TreeBranch,
        e: JQuery.ClickEvent
    ): void => {
        branch.loading = true
        if (!branch.expanded && this.options.expandCallback) {
            this.options.expandCallback(branch.data.id, branch, false)
        }
        if (e) {
            e.stopPropagation()
        }
        const promise = branch.expanded
            ? this.treeSvc.getApi(this.treeConfig.id).closeBranch(branch)
            : this.treeSvc.getApi(this.treeConfig.id).expandBranch(branch)
        promise.then(
            () => {
                branch.loading = false
            },
            (reason) => {
                this.growl.error(reason.message)
            }
        )
    }

    public userClicksBranch = (branch: TreeBranch): void => {
        branch.loading = true
        this.treeSvc
            .getApi(this.treeConfig.id)
            .selectBranch(branch, true)
            .then(
                () => {
                    if (branch.onSelect) {
                        branch.onSelect(branch)
                    } else if (this.options.onSelect) {
                        this.options.onSelect(branch)
                    }
                },
                (reason) => {
                    this.growl.error(TreeService.treeError(reason))
                }
            )
            .finally(() => {
                branch.loading = false
            })
    }

    public userDblClicksBranch = (branch: TreeBranch): void => {
        branch.loading = true
        this.treeSvc
            .getApi(this.treeConfig.id)
            .selectBranch(branch, true)
            .then(
                () => {
                    if (branch.onDblClick) {
                        branch.onDblClick(branch)
                    } else if (this.options.onDblClick) {
                        this.options.onDblClick(branch)
                    }
                },
                (reason) => {
                    this.growl.error(TreeService.treeError(reason))
                }
            )
            .finally(() => {
                branch.loading = false
            })
    }

    // public getHref = (row: TreeRow): string => {
    //     //var data = row.branch.data;
    //     /*if (row.branch.type !== 'group' && UtilsService.isDocument(data) && !ApplicationService.getState().fullDoc) {
    //         var ref = data._refId ? data._refId : 'master';
    //         return UtilsService.PROJECT_URL_PREFIX + data._projectId + '/' + ref+ '/documents/' + data.id + '/views/' + data.id;
    //     }*/
    //     return ''
    // }
}

const TreeComponent: VeComponentOptions = {
    selector: 'tree',
    transclude: true,
    template: `
<div ng-show="$ctrl.title">
    <h4 style="margin: 3px 0px 3px 10px;">{{$ctrl.title}}</h4>
</div>
<div ng-hide="$ctrl.treeSpin">
    <ul class="nav nav-list nav-pills nav-stacked abn-tree">
        <li ng-repeat="row in $ctrl.treeRows | filter:{visible:true} track by row.branch.uid" ng-hide="!$ctrl.treeFilter(row, $ctrl.options.search)"
            ng-class="" class="abn-tree-row {{ 'level-' + row.level }}">
            <div class="arrow" ng-click="$ctrl.userClicksBranch(row.branch)" ng-dblclick="$ctrl.userDblClicksBranch(row.branch)" ng-class="{'active-text': row.branch.selected}" id="tree-branch-{{row.branch.data.id}}">
                <div class="shaft" ng-class="{'shaft-selected': row.branch.selected, 'shaft-hidden': !row.branch.selected}">
                    <div class="tree-item">
                        <i ng-show="!row.branch.loading && row.visibleChild" ng-class="{'active-text': row.branch.selected}" ng-click="$ctrl.expandCallback(row.branch, $event)" class="indented tree-icon {{row.branch.expanded ? $ctrl.icons.iconExpand : $ctrl.icons.iconCollapse}}" ></i>
                        <i ng-hide="row.branch.loading || row.visibleChild" class="fa fa-lg fa-fw"></i>
                        <i ng-hide="row.branch.loading" ng-class="{'active-text': row.branch.selected}" class="indented tree-icon {{row.type_icon}}" ></i>
                        <i ng-show="row.branch.loading" class="indented tree-icon fa-solid fa-spinner fa-spin"></i>
                        <span class="indented tree-label" ng-class="{'active-text': row.branch.selected}">{{row.section}} {{row.branch.data.name}}</span>
                    </div>
                </div>
            </div>
        </li>
    </ul>
</div>
<i ng-show="$ctrl.treeSpin" class="fa fa-spin fa-spinner"></i>
    
`,
    bindings: {
        treeConfig: '<',
        treeIcons: '<',
        treeOptions: '<',
    },
    controller: TreeController,
}

veCore.component(TreeComponent.selector, TreeComponent)
