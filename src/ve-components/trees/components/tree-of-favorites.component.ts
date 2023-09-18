import { TreeService, TreeController } from '@ve-components/trees';
import { ApplicationService, RootScopeService, UtilsService } from '@ve-utils/application';
import { EventService } from '@ve-utils/core';

import { veComponents } from '@ve-components';

import { VeComponentOptions, VeQService } from '@ve-types/angular';

class TreeOfFavoritesController extends TreeController {
    public icons = {
        iconExpand: 'fa-solid fa-caret-down fa-lg fa-fw',
        iconCollapse: 'fa-solid fa-caret-right fa-lg fa-fw',
        iconDefault: 'fa-solid fa-star fa-fw',
    };

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
        this.id = 'table-of-favorites';
        this.types = ['favorite'];
        this.title = 'Table of Favorites';
    }
}

const TreeOfFavoritesComponent: VeComponentOptions = {
    selector: 'treeOfFavorites',
    transclude: true,
    template: `
<div>
    <ul class="nav nav-list nav-pills nav-stacked abn-tree">
        <li ng-repeat="row in $ctrl.treeRows track by row.branch.uid" ng-show="$ctrl.treeFilter(row, $ctrl.filter)"
            ng-class="" class="abn-tree-row level-1">
            <div class="arrow" ng-click="$ctrl.userClicksBranch(row.branch)" ng-dblclick="$ctrl.userDblClicksBranch(row.branch)" ng-class="{'active-text': row.branch.selected}" id="tree-branch-{{row.branch.data.id}}">
                <div class="shaft" ng-class="{'shaft-selected': row.branch.selected, 'shaft-hidden': !row.branch.selected}">
                    <div class="tree-item">
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
    controller: TreeOfFavoritesController,
};

veComponents.component(TreeOfFavoritesComponent.selector, TreeOfFavoritesComponent);
