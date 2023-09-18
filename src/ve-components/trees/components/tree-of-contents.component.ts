import angular from 'angular';

import { TreeService, TreeController } from '@ve-components/trees';
import { RootScopeService, UtilsService } from '@ve-utils/application';
import { EventService } from '@ve-utils/core';

import { veComponents } from '@ve-components';

import { VeComponentOptions, VeQService } from '@ve-types/angular';

export class TreeOfContentsController extends TreeController {
    constructor(
        $q: VeQService,
        $scope: angular.IScope,
        $timeout: angular.ITimeoutService,
        $filter: angular.IFilterService,
        growl: angular.growl.IGrowlService,
        utilsSvc: UtilsService,
        treeSvc: TreeService,
        rootScopeSvc: RootScopeService,
        eventSvc: EventService
    ) {
        super($q, $scope, $timeout, $filter, growl, utilsSvc, treeSvc, rootScopeSvc, eventSvc);

        this.types = ['view', 'section'];
        this.id = 'tree-of-contents';
    }

    protected setPeVisibility = (): void => {
        this.types.length = 0;
        if (this.showPe) {
            this.types.push('all');
        } else {
            this.types = ['view', 'section'];
        }
    };
}

const TreeOfContentsComponent: VeComponentOptions = {
    selector: 'treeOfContents',
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
                <div class="shaft" ng-class="{'shaft-selected': row.branch.selected, 'shaft-hidden': !row.branch.selected}">
                    <div class="tree-item">
                        <i ng-show="!row.branch.loading && row.visibleChild" ng-class="{'active-text': row.branch.selected}" ng-click="$ctrl.expandCallback(row.branch, $event)" class="indented tree-icon {{row.branch.expanded ? $ctrl.icons.iconExpand : $ctrl.icons.iconCollapse}}" ></i>
                        <i ng-hide="row.branch.loading || row.visibleChild" class="fa fa-lg fa-fw"></i>
                        <i ng-hide="row.branch.loading" class="indented tree-icon {{ row.typeIcon }}" ></i>
                        <i ng-show="row.branch.loading" class="indented tree-icon fa-solid fa-spinner fa-spin"></i>
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
    controller: TreeOfContentsController,
};

veComponents.component(TreeOfContentsComponent.selector, TreeOfContentsComponent);
