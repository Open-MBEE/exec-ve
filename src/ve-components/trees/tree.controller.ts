import { TreeService } from '@ve-components/trees';
import { RootScopeService, UtilsService } from '@ve-utils/application';
import { EventService } from '@ve-utils/core';
import { handleChange } from '@ve-utils/utils';

import { VeComponentOptions, VePromise, VeQService } from '@ve-types/angular';
import { TreeBranch, TreeIcons, TreeRow } from '@ve-types/tree';

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
export class TreeController implements angular.IComponentController {
    //Bindings
    toolbarId: string;
    buttonId: string;
    showPe: boolean;

    public init: boolean = false;

    public treeRows: TreeRow[] = [];
    public title;
    private selectedBranch: any;
    public treeSpin: boolean = true;

    public subs: Rx.IDisposable[];
    private treeFilter: angular.uiTreeFilter.IFilterUiTree<TreeRow>;

    //Locals

    public icons: TreeIcons;
    types: string[];
    id: string;
    filter: string;

    static $inject = [
        '$q',
        '$scope',
        '$timeout',
        '$filter',
        'growl',
        'UtilsService',
        'TreeService',
        'RootScopeService',
        'EventService',
    ];

    constructor(
        protected $q: VeQService,
        protected $scope: angular.IScope,
        protected $timeout: angular.ITimeoutService,
        protected $filter: angular.IFilterService,
        protected growl: angular.growl.IGrowlService,
        protected utilsSvc: UtilsService,
        protected treeSvc: TreeService,
        protected rootScopeSvc: RootScopeService,
        protected eventSvc: EventService
    ) {
        this.types = [''];
    }

    $onInit(): void {
        this.treeFilter = this.$filter('uiTreeFilter');

        this.eventSvc.$init(this);
        this.subs.push(
            this.eventSvc.binding<boolean>(TreeService.events.UPDATED, (data) => {
                if (data) {
                    this.update().catch((reason) => {
                        this.growl.error(TreeService.treeError(reason));
                    });
                }
            }),
            this.eventSvc.$on<string>(TreeService.events.RELOAD, (data) => {
                if ((data && this.id === data) || !data) {
                    this.treeSpin = true;
                    this.update().catch((reason) => {
                        this.growl.error(TreeService.treeError(reason));
                    });
                }
            }),
            this.eventSvc.$on<string>(TreeService.events.FILTER, (data) => {
                if (data === '') {
                    this.treeSvc.collapseAll().then(
                        () => {
                            this.treeSvc.expandPathToSelectedBranch().then(
                                () => {
                                    this.eventSvc.$broadcast(TreeService.events.RELOAD, this.id);
                                    this.filter = data;
                                },
                                (reason) => {
                                    this.growl.error(TreeService.treeError(reason));
                                }
                            );
                        },
                        (reason) => {
                            this.growl.error(TreeService.treeError(reason));
                        }
                    );
                } else {
                    // expand all branches so that the filter works correctly
                    this.treeSvc.expandAll().then(
                        () => {
                            this.eventSvc.$broadcast(TreeService.events.RELOAD, this.id);
                            this.filter = data;
                        },
                        (reason) => {
                            this.growl.error(TreeService.treeError(reason));
                        }
                    );
                }
            })
        );

        if (this.treeSvc.isTreeReady()) {
            this.update().catch((reason) => {
                this.growl.error(TreeService.treeError(reason));
            });
        }

        // this.subs.push(
        //     this.eventSvc.$on(
        //         'tree-get-branch-element',
        //         (data: { id: string }) => {
        //             void this.$timeout(
        //                 () => {
        //                     const el = $('#tree-branch-' + data.id)
        //                     if (!el.isOnScreen() && el.get(0) !== undefined) {
        //                         el.get(0).scrollIntoView()
        //                     }
        //                 },
        //                 500,
        //                 false
        //             )
        //         }
        //     )
        // )
    }

    $onChanges(onChangesObj: angular.IOnChangesObject): void {
        handleChange(
            onChangesObj,
            'showPe',
            () => {
                this.update().catch((reason) => {
                    this.growl.error(TreeService.treeError(reason));
                });
            },
            true
        );
    }

    $onDestroy(): void {
        this.eventSvc.destroy(this.subs);
    }

    update(): VePromise<void, unknown> {
        this.treeRows = [];
        this.setPeVisibility();
        this.preConfig();
        this.selectedBranch = this.treeSvc.getSelectedBranch();

        this.icons = this.icons ? this.icons : this.treeSvc.defaultIcons;

        this.treeSvc.defaultIcon = this.icons.iconDefault;
        return new this.$q<void>((resolve, reject) => {
            this.treeSvc.updateRows(this.id, this.types, this.treeRows).then(() => {
                this.treeSpin = false;
                resolve();
            }, reject);
        });
    }

    public expandCallback = (branch: TreeBranch, e: JQuery.ClickEvent): void => {
        branch.loading = true;
        if (!branch.expanded && this.treeSvc.treeApi.expandCallback) {
            this.treeSvc.treeApi.expandCallback(branch.data.id, branch, false);
        }
        if (e) {
            e.stopPropagation();
        }
        const promise = branch.expanded ? this.treeSvc.closeBranch(branch) : this.treeSvc.expandBranch(branch);
        promise.then(
            () => {
                this.update()
                    .catch((reason) => {
                        this.growl.error(TreeService.treeError(reason));
                    })
                    .finally(() => {
                        branch.loading = false;
                    });
            },
            (reason) => {
                this.growl.error(TreeService.treeError(reason));
            }
        );
    };

    public userClicksBranch = (branch: TreeBranch): void => {
        branch.loading = true;
        this.treeSvc
            .selectBranch(branch, true)
            .then(
                () => {
                    if (branch.onSelect) {
                        branch.onSelect(branch);
                    } else if (this.treeSvc.treeApi.onSelect) {
                        this.treeSvc.treeApi.onSelect(branch);
                    }
                },
                (reason) => {
                    this.growl.error(TreeService.treeError(reason));
                }
            )
            .finally(() => {
                branch.loading = false;
            });
    };

    public userDblClicksBranch = (branch: TreeBranch): void => {
        branch.loading = true;
        this.treeSvc
            .selectBranch(branch, true)
            .then(
                () => {
                    if (branch.onDblClick) {
                        branch.onDblClick(branch);
                    } else if (this.treeSvc.treeApi.onDblClick) {
                        this.treeSvc.treeApi.onDblClick(branch);
                    }
                },
                (reason) => {
                    this.growl.error(TreeService.treeError(reason));
                }
            )
            .finally(() => {
                branch.loading = false;
            });
    };

    protected setPeVisibility = (): void => {
        //Implement any custom logic for showing PE's here
    };

    protected preConfig = (): void => {
        //Implement any custom logic that should happen before row generation
    };

    // public getHref = (row: TreeRow): string => {
    //     //var data = row.branch.data;
    //     /*if (row.branch.type !== 'group' && UtilsService.isDocument(data) && !ApplicationService.getState().fullDoc) {
    //         var ref = data._refId ? data._refId : 'master';
    //         return UtilsService.PROJECT_URL_PREFIX + data._projectId + '/' + ref+ '/documents/' + data.id + '/views/' + data.id;
    //     }*/
    //     return ''
    // }
}

export const TreeOfAnyComponent: VeComponentOptions = {
    selector: 'treeOfAny',
    transclude: true,
    template: `
<div>
    <ul class="nav nav-list nav-pills nav-stacked abn-tree">
        <li ng-repeat="row in $ctrl.treeRows track by row.branch.uid" ng-show="$ctrl.types.includes(row.branch.type) && $ctrl.treeFilter(row, $ctrl.filter)"
            ng-class="" class="abn-tree-row level-1">
            <div class="arrow" ng-click="$ctrl.userClicksBranch(row.branch)" ng-dblclick="$ctrl.userDblClicksBranch(row.branch)" ng-class="{'active-text': row.branch.selected}" id="tree-branch-{{row.branch.data.id}}">
                <div class="shaft" ng-class="{'shaft-selected': row.branch.selected, 'shaft-hidden': !row.branch.selected}">
                    <div class="tree-item">
                        <i ng-show="!row.branch.loading && row.visibleChild" ng-class="{'active-text': row.branch.selected}" ng-click="$ctrl.expandCallback(row, $event)" class="indented tree-icon {{row.branch.expanded ? $ctrl.icons.iconExpand : $ctrl.icons.iconCollapse}}" ></i>
                        <i ng-hide="row.loading || row.visibleChild" class="fa fa-lg fa-fw"></i>
                        <i ng-hide="row.loading" ng-class="{'active-text': row.branch.selected}" class="indented tree-icon {{row.typeIcon}}" ></i>
                        <i ng-show="row.loading" class="indented tree-icon fa-solid fa-spinner fa-spin"></i>
                        <span class="indented tree-label" ng-class="{'active-text': row.branch.selected}">{{row.section}} {{row.branch.data.name}}</span>
                    </div>
                </div>
            </div>
        </li>
    </ul>
</div>
<i ng-show="$ctrl.treeSpin" class="tree-spinner fa fa-spin fa-spinner"></i>
    
`,
    bindings: {
        toolbarId: '@',
        buttonId: '@',
        showPe: '<',
    },
};
