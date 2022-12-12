import angular from 'angular'

import {
    VeModalResolve,
    VeModalController,
    VeModalInstanceService,
} from '@ve-types/view-editor'

export class VeModalControllerImpl<T> implements VeModalController {
    // public close($value?: any): void {};
    //
    // public dismiss($value?: any): void {};

    modalInstance: VeModalInstanceService<T>
    protected resolve: VeModalResolve
}

// export class VeModalServiceImpl implements VeModalService {
//     constructor(protected $uibModal: VeModalService) {}
//
//     getPromiseChain(): angular.IPromise<unknown> {
//         return this.$uibModal.getPromiseChain()
//     }
//
//     open(
//         settings: VeModalSettings<VeModalResolveFn>
//     ): VeModalInstanceService<unknown> {
//         return this.$uibModal.open(settings)
//     }
// }
