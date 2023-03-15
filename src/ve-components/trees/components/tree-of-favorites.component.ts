import _ from 'lodash'

import {
    TreeService,
    TreeController,
    TreeOfAnyComponent,
} from '@ve-components/trees'
import { RootScopeService, UtilsService } from '@ve-utils/application'
import { EventService } from '@ve-utils/core'

import { veComponents } from '@ve-components'

import { VeQService } from '@ve-types/angular'

class TreeOfFavoritesController extends TreeController {
    public icons = {
        iconExpand: 'fa-solid fa-caret-down fa-lg fa-fw',
        iconCollapse: 'fa-solid fa-caret-right fa-lg fa-fw',
        iconDefault: 'fa-solid fa-star fa-fw',
    }
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
        super(
            $q,
            $scope,
            $timeout,
            $filter,
            growl,
            utilsSvc,
            treeSvc,
            rootScopeSvc,
            eventSvc
        )
        this.id = 'table-of-favorites'
        this.types = ['favorite']
        this.title = 'Table of Favorites'
    }
}

const TreeOfFavoritesComponent = _.cloneDeep(TreeOfAnyComponent)
TreeOfFavoritesComponent.selector = 'treeOfFavorites'
TreeOfFavoritesComponent.controller = TreeOfFavoritesController

veComponents.component(
    TreeOfFavoritesComponent.selector,
    TreeOfFavoritesComponent
)
