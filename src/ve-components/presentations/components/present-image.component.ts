import { PresentationLite } from '@ve-components/presentations';

import { veComponents } from '@ve-components';

import { IPresentationComponentOptions } from '@ve-types/components/presentation';

const PresentImageComponent: IPresentationComponentOptions = {
    selector: 'presentImage',
    template: `
    <figure>
    <mms-cf mms-cf-type="img" mms-element-id="{{$ctrl.peObject.id}}"></mms-cf>
    <figcaption>
        <span ng-if="!$ctrl.peObject.excludeFromList">Figure {{$ctrl.instanceSpec._veNumber}}. 
        </span>{{$ctrl.peObject.title || $ctrl.instanceSpec.name}}
    </figcaption>
</figure>
`,
    bindings: {
        peObject: '<',
        instanceSpec: '<',
        peNumber: '<',
    },
    controller: PresentationLite,
};

veComponents.component(PresentImageComponent.selector, PresentImageComponent);
