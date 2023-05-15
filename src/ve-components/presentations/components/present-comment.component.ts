import { PresentationLite } from '@ve-components/presentations';

import { veComponents } from '@ve-components';

import { IPresentationComponentOptions } from '@ve-types/components/presentation';

const PresentCommentComponent: IPresentationComponentOptions = {
    selector: 'presentComment',
    template: `<mms-cf mms-cf-type="com" mms-element-id="{{$ctrl.peObject.source}}"></mms-cf>`,
    bindings: {
        peObject: '<',
        instanceSpec: '<',
        peNumber: '<',
    },
    controller: PresentationLite,
};

veComponents.component(PresentCommentComponent.selector, PresentCommentComponent);
