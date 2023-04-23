import {PresentationLite} from '@ve-components/presentations'

import { veComponents } from '@ve-components'

import { IPresentationComponentOptions } from '@ve-types/components/presentation'

const PresentSectionComponent: IPresentationComponentOptions = {
    selector: 'presentSection',
    bindings: {
        peObject: '<',
        instanceSpec: '<',
        peNumber: '<',
        mmsProjectId: '@',
        mmsRefId: '@',
        mmsCommitId: '@',
    },
    template: `<view-cf mms-cf-type="section" mms-element-id="{{$ctrl.instanceSpec.id}}"></view-cf>`,
    controller: PresentationLite,
    require: {
        mmsViewCtrl: '?^^view',
        mmsViewPresentationElemCtrl: '?^^viewPe',
    },
}

veComponents.component(PresentSectionComponent.selector, PresentSectionComponent)
