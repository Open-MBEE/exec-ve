import { IComponentController } from 'angular';

import { VeModalControllerImpl } from '@ve-utils/modals/ve-modal.controller';

import { veUtils } from '@ve-utils';

import { VeModalComponent, VeModalResolve, VeModalResolveFn } from '@ve-types/view-editor';

export interface ImageZoomResolve extends VeModalResolve {
    imgSrc: string;
    title: string;
}

export interface ImageZoomResolveFn extends VeModalResolveFn {
    imgSrc: () => string;
    title: () => string;
}

class ImageZoomModalController extends VeModalControllerImpl<void, ImageZoomResolve> implements IComponentController {
    private src: string;
    private title: string;
    constructor() {
        super();
    }

    $onInit(): void {
        this.src = this.resolve.imgSrc;
        this.title = this.resolve.title;
    }
}

const ImageZoomModal: VeModalComponent = {
    selector: 'imageZoomModal',
    bindings: {
        resolve: '<',
        modalInstance: '<',
    },
    template: `
    <div>
    <div class="modal-header">
      {{$ctrl.title}}
      <span class="close-button-container">
        <a class="close-button"  ng-click="$ctrl.modalInstance.close()">
          <i tooltip-placement="left" uib-tooltip="Close Zoom Window"  class="fa fa-times"></i>
        </a>
      </span>
    </div>
    <div class="modal-body">
      <img src="{{$ctrl.src}}" alt="{{$ctrl.title}}"/>
    </div>
</div>
`,
    controller: ImageZoomModalController,
};

veUtils.component(ImageZoomModal.selector, ImageZoomModal);
