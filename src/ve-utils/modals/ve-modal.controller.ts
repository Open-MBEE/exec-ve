import * as angular from "angular";
import {VeModalResolve, VeModalService, VeModalSettings, VeModalController} from "@ve-types/view-editor";

export class VeModalControllerImpl implements VeModalController {

    // public close($value?: any): void {};
    //
    // public dismiss($value?: any): void {};

    modalInstance: angular.ui.bootstrap.IModalInstanceService;
    protected resolve: VeModalResolve;

}

export class VeModalServiceImpl implements VeModalService {
    constructor(protected $uibModal: VeModalService) {
    }

    getPromiseChain(): angular.IPromise<any> {
        return this.$uibModal.getPromiseChain();
    }

    open(settings: VeModalSettings) {
        return this.$uibModal.open(settings);
    }

}