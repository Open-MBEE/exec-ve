import { PresentationLite } from '@ve-components/presentations'

import { veComponents } from '@ve-components'

import { IPresentationComponentOptions } from '@ve-types/components/presentation'

const PresentFigureComponent: IPresentationComponentOptions = {
    selector: 'presentFigure',
    template: `<cross-reference mms-cf-type="doc" mms-element-id="{{$ctrl.peObject.source}}"></cross-reference>
`,
    bindings: {
        peObject: '<',
        element: '<',
        peNumber: '<',
    },
    controller: PresentationLite,
}

veComponents.component(PresentFigureComponent.selector, PresentFigureComponent)
