import { PresentationLite } from '@ve-components/presentations';

import { veComponents } from '@ve-components';

import { IPresentationComponentOptions } from '@ve-types/components/presentation';

const PresentFigureComponent: IPresentationComponentOptions = {
    selector: 'presentFigure',
    template: `<mms-cf mms-cf-type="doc" mms-element-id="{{$ctrl.peObject.source}}"></mms-cf>
`,
    bindings: {
        peObject: '<',
        instanceSpec: '<',
        peNumber: '<',
    },
    controller: PresentationLite,
};

veComponents.component(PresentFigureComponent.selector, PresentFigureComponent);
