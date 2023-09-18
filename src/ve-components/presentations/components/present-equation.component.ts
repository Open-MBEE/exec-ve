import { PresentationLite } from '@ve-components/presentations';

import { veComponents } from '@ve-components';

import { IPresentationComponentOptions } from '@ve-types/components/presentation';

const PresentEquationComponent: IPresentationComponentOptions = {
    selector: 'presentEquation',
    template: `<mms-cf mms-cf-type="doc" mms-element-id="{{$ctrl.peObject.source}}"></mms-cf>
`,
    bindings: {
        peObject: '<',
        instanceSpec: '<',
        peNumber: '<',
    },
    controller: PresentationLite,
};

veComponents.component(PresentEquationComponent.selector, PresentEquationComponent);
