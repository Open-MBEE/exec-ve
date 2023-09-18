import { TreeService, TreeController } from '@ve-components/trees';
import { ApplicationService, RootScopeService, UserSettingsObject, UtilsService } from '@ve-utils/application';
import { EventService } from '@ve-utils/core';

import { veComponents } from '@ve-components';

import { VeComponentOptions, VePromise, VeQService } from '@ve-types/angular';
import { TreeBranch } from '@ve-types/tree';

class TreeOfDocumentsController extends TreeController {
    static $inject = [...TreeController.$inject, 'ApplicationService'];
    constructor(
        $q: VeQService,
        $scope: angular.IScope,
        $timeout: angular.ITimeoutService,
        $filter: angular.IFilterService,
        growl: angular.growl.IGrowlService,
        utilsSvc: UtilsService,
        treeSvc: TreeService,
        rootScopeSvc: RootScopeService,
        eventSvc: EventService,
        private applicationSvc: ApplicationService
    ) {
        super($q, $scope, $timeout, $filter, growl, utilsSvc, treeSvc, rootScopeSvc, eventSvc);
        this.id = 'tree-of-documents';
        this.types = ['group'];
    }

    protected preConfig = (): void => {
        this.types = ['group'];
        if (this.treeSvc.treeApi.refType === 'Branch') {
            this.types.push('view');
        } else {
            this.types.push('snapshot');
        }
    };

    toggleFavorite($event: JQuery.ClickEvent, branch: TreeBranch): void {
        $event.stopPropagation();
        let promise: VePromise<UserSettingsObject>;
        if (!branch.favorite) {
            promise = this.applicationSvc.addPins(
                this.applicationSvc.getState().user,
                this.treeSvc.treeApi.projectId,
                this.treeSvc.treeApi.refId,
                [branch.data.id]
            );
        } else {
            promise = this.applicationSvc.removePins(
                this.applicationSvc.getState().user,
                this.treeSvc.treeApi.projectId,
                this.treeSvc.treeApi.refId,
                [branch.data.id]
            );
        }

        promise.then(
            () => {
                branch.favorite = !branch.favorite;
                this.eventSvc.$broadcast(TreeService.events.RELOAD, 'table-of-favorites');
            },
            (reason) => {
                this.growl.error(reason.message);
            }
        );
    }
}

const TreeOfDocumentsComponent: VeComponentOptions = {
    selector: 'treeOfDocuments',
    transclude: true,
    template: `
<div ng-show="$ctrl.title">
    <h4 style="margin: 3px 0px 3px 10px;">{{$ctrl.title}}</h4>
</div>
<div>
    <ul class="nav nav-list nav-pills nav-stacked abn-tree">
        <li ng-repeat="row in $ctrl.treeRows | filter:{visible:true} track by row.branch.uid" ng-hide="!$ctrl.treeFilter(row, $ctrl.filter)"
            ng-class="" class="abn-tree-row {{ 'level-' + row.level }}">
            <div class="arrow" ng-click="$ctrl.userClicksBranch(row.branch)" ng-dblclick="$ctrl.userDblClicksBranch(row.branch)" ng-class="{'active-text': row.branch.selected}" id="tree-branch-{{row.branch.data.id}}">
                <div class="shaft" ng-class="{'shaft-selected': row.branch.selected, 'shaft-hidden': !row.branch.selected}" ng-mouseenter="showFavs=true" ng-mouseleave="showFavs=false">
                    <div class="tree-item">
                        <i ng-show="!row.branch.loading && row.visibleChild" ng-class="{'active-text': row.branch.selected}" ng-click="$ctrl.expandCallback(row.branch, $event)" class="indented tree-icon {{row.branch.expanded ? $ctrl.icons.iconExpand : $ctrl.icons.iconCollapse}}" ></i>
                        <i ng-hide="row.branch.loading || row.visibleChild" class="fa fa-lg fa-fw"></i>
                        <i ng-hide="row.branch.loading" class="indented tree-icon {{row.typeIcon}}" ></i>
                        <i ng-show="row.branch.loading" class="indented tree-icon fa-solid fa-spinner fa-spin"></i>
                        <span class="indented tree-label" ng-class="{'active-text': row.branch.selected}">{{row.section}} {{row.branch.data.name}}</span>
                        <!-- favs don't survive reload
                        <i ng-show="showFavs && row.branch.favorite" class="fa-solid fa-star" ng-click="$ctrl.toggleFavorite($event, row.branch)"></i>
                        <i ng-show="showFavs && !row.branch.favorite" class="fa-regular fa-star" ng-click="$ctrl.toggleFavorite($event, row.branch)"></i>
                        -->
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
    },
    controller: TreeOfDocumentsController,
};

veComponents.component(TreeOfDocumentsComponent.selector, TreeOfDocumentsComponent);
