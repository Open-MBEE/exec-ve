import { PresentationLite } from '@ve-components/presentations'

import { veComponents } from '@ve-components'

import { IPresentationComponentOptions } from '@ve-types/components/presentation'

const PresentListTComponent: IPresentationComponentOptions = {
    selector: 'presentListT',
    template: `<view-cf mms-cf-type="doc" mms-element-id="{{$ctrl.peObject.source}}"></view-cf>
`,
    bindings: {
        peObject: '<',
        element: '<',
        peNumber: '<',
    },
    controller: PresentationLite,
}

veComponents.component(PresentListTComponent.selector, PresentListTComponent)
