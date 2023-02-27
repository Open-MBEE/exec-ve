import { RootScopeService } from '@ve-utils/application'
import { EventService } from '@ve-utils/core'

import { veComponents } from '@ve-components'

export class InsertionService {
    static $inject = ['$timeout', 'growl', 'RootScopeService', 'EventService']

    constructor(
        private $timeout: angular.ITimeoutService,
        private growl: angular.growl.IGrowlService,
        private rootScopeSvc: RootScopeService,
        private eventSvc: EventService
    ) {}

    public successUpdates = (elemType: string, id: string): void => {
        this.eventSvc.$broadcast('content-reorder.refresh')
        this.eventSvc.$broadcast('content-reorder-saved', { id: id })
        this.growl.success('Adding ' + elemType + ' Successful')
        // Show comments when creating a comment PE
        if (elemType === 'Comment' && !this.rootScopeSvc.veCommentsOn()) {
            void this.$timeout(
                () => {
                    $('.show-comments').click()
                },
                0,
                false
            )
        }
    }
}

veComponents.service('InsertService', InsertionService)
