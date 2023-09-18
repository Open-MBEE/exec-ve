import { VeModalResolve, VeModalController, VeModalInstanceService } from '@ve-types/view-editor';

export class VeModalControllerImpl<T, U extends VeModalResolve = VeModalResolve> implements VeModalController {
    // public close($value?: any): void {};
    //
    // public dismiss($value?: any): void {};

    modalInstance: VeModalInstanceService<T>;
    protected resolve: U;
}
