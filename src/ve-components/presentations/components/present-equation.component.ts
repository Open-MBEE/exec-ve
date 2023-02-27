import { PresentationLite } from '@ve-components/presentations'

import { veComponents } from '@ve-components'

import { IPresentationComponentOptions } from '@ve-types/components/presentation'

const PresentEquationComponent: IPresentationComponentOptions = {
    selector: 'presentEquation',
    template: `<view-cf mms-cf-type="doc" mms-element-id="{{$ctrl.peObject.source}}"></view-cf>
`,
    bindings: {
        peObject: '<',
        element: '<',
        peNumber: '<',
    },
    controller: PresentationLite,
}

veComponents.component(
    PresentEquationComponent.selector,
    PresentEquationComponent
)
