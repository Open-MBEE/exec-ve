import _ from 'lodash';

import { TreeService, TreeController, TreeOfAnyComponent } from '@ve-components/trees';
import { RootScopeService, UtilsService } from '@ve-utils/application';
import { EventService } from '@ve-utils/core';

import { veComponents } from '@ve-components';

import { VeQService } from '@ve-types/angular';

class TreeOfEquationsController extends TreeController {
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
        this.id = 'table-of-equations';
        this.types = ['equation'];
        this.title = 'Table of Equations';
    }
}

const TreeOfEquationsComponent = _.cloneDeep(TreeOfAnyComponent);
TreeOfEquationsComponent.selector = 'treeOfEquations';
TreeOfEquationsComponent.controller = TreeOfEquationsController;

veComponents.component(TreeOfEquationsComponent.selector, TreeOfEquationsComponent);
