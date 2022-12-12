import { PresentationLite } from '@ve-components/presentations'

import { veComponents } from '@ve-components'

import { PresentationComponentOptions } from '@ve-types/components'

const PresentFigureComponent: PresentationComponentOptions = {
    selector: 'presentFigure',
    template: `<mms-cf mms-cf-type="doc" mms-element-id="{{$ctrl.peObject.source}}"></mms-cf>
`,
    bindings: {
        peObject: '<',
        element: '<',
        peNumber: '<',
    },
    controller: PresentationLite,
}

veComponents.component(PresentFigureComponent.selector, PresentFigureComponent)
