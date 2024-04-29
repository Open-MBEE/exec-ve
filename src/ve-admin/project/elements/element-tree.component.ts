import { veCoreEvents } from '@ve-core/events';
import { ElementService } from '@ve-utils/mms-api-client';

import { VeQService } from '@ve-types/angular';
import { ElementObject, ParamsObject } from '@ve-types/mms';

class ElementTreeController implements angular.IComponentController {
    params: ParamsObject;
    element: ElementObject;

    treeRoot: ElementObject;

    static $inject = ['$q', 'ElementService'];

    constructor(private $q: VeQService, private elementSvc: ElementService) {}

    $onInit(): void {}

    getElement = (data: veCoreEvents.elementSelectedData): void => {
        this.elementSvc
            .getElement({
                projectId: this.params.projectId,
                refId: this.params.refId,
                elementId: this.params.projectId + '_pm',
            })
            .then(
                (value) => {
                    this.treeRoot = value;
                },
                () => {
                    //Do nothing
                }
            );
    };
}
