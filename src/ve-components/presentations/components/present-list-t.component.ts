import angular, { IComponentController } from 'angular'

import { veComponents } from '@ve-components'

import { PresentationComponentOptions } from '@ve-types/components'
import { InstanceSpecObject, PresentationInstanceObject } from '@ve-types/mms'

const PresentListTComponent: PresentationComponentOptions = {
    selector: 'presentListT',
    template: `<mms-cf mms-cf-type="doc" mms-element-id="{{$ctrl.peObject.source}}"></mms-cf>
`,
    bindings: {
        peObject: '<',
        element: '<',
        peNumber: '<',
    },
    controller: class PresentListTController implements IComponentController {
        public peObject: PresentationInstanceObject
        public element: InstanceSpecObject
        public peNumber: string

        constructor() {}
    },
}

veComponents.component(PresentListTComponent.selector, PresentListTComponent)
