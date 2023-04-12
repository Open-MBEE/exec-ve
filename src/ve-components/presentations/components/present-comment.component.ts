import { PresentationLite } from '@ve-components/presentations'

import { veComponents } from '@ve-components'

import { IPresentationComponentOptions } from '@ve-types/components/presentation'

const PresentCommentComponent: IPresentationComponentOptions = {
    selector: 'presentComment',
    template: `<view-cf mms-cf-type="com" mms-element-id="{{$ctrl.peObject.source}}"></view-cf>`,
    bindings: {
        peObject: '<',
        element: '<',
        peNumber: '<',
    },
    controller: PresentationLite,
}

veComponents.component(PresentCommentComponent.selector, PresentCommentComponent)
