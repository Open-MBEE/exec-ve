import _ from 'lodash';

import { TreeService, TreeController, TreeOfAnyComponent } from '@ve-components/trees';
import { RootScopeService, UtilsService } from '@ve-utils/application';
import { EventService } from '@ve-utils/core';

import { veComponents } from '@ve-components';

import { VeQService } from '@ve-types/angular';

class TreeOfTablesController extends TreeController {
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
        this.id = 'table-of-tables';
        this.types = ['table'];
        this.title = 'Table of Tables';
    }
}

const TreeOfTablesComponent = _.cloneDeep(TreeOfAnyComponent);
TreeOfTablesComponent.selector = 'treeOfTables';
TreeOfTablesComponent.controller = TreeOfTablesController;

veComponents.component(TreeOfTablesComponent.selector, TreeOfTablesComponent);
