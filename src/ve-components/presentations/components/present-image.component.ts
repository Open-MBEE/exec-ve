import { PresentationLite } from '@ve-components/presentations'

import { veComponents } from '@ve-components'

import { PresentationComponentOptions } from '@ve-types/components'

const PresentImageComponent: PresentationComponentOptions = {
    selector: 'presentImage',
    template: `
    <figure>
    <mms-cf mms-cf-type="img" mms-element-id="{{$ctrl.peObject.id}}"></mms-cf>
    <figcaption>
        <span ng-if="!$ctrl.peObject.excludeFromList">Figure {{$ctrl.peNumber}}. 
        </span>{{$ctrl.peObject.title || $ctrl.element.name}}
    </figcaption>
</figure>
`,
    bindings: {
        peObject: '<',
        element: '<',
        peNumber: '<',
    },
    controller: PresentationLite,
}

veComponents.component(PresentImageComponent.selector, PresentImageComponent)
