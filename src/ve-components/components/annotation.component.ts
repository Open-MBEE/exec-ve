import { ExtensionService } from '@ve-components/services';
import { veCoreEvents } from '@ve-core/events';
import { ApplicationService } from '@ve-utils/application';
import { EventService } from '@ve-utils/core';
import { ValueService } from '@ve-utils/mms-api-client';
import { SchemaService } from '@ve-utils/model-schema';

import { veUtils } from '@ve-utils';

import { VeComponentOptions } from '@ve-types/angular';
import { ElementObject, InstanceSpecObject, LiteralObject } from '@ve-types/mms';

export interface AnnotationObject {
    toolTipTitle: string;
    toolTipContent: string;
    inlineContent: string;
    id: string;
}

class AnnotationController implements angular.IComponentController {
    static $inject = [
        '$element',
        'growl',
        'ExtensionService',
        'SchemaService',
        'ApplicationService',
        'EventService',
        'ValueService',
    ];

    //Bindings
    private mmsElementId: string;
    mmsRecentElement: ElementObject;
    mmsType: 'presentation' | 'transclusion' | 'link';
    mmsField: 'name' | 'documentation' | 'value';

    //Local
    public displayContent;
    private schema: string = 'cameo';

    constructor(
        private $element: JQuery<HTMLElement>,
        private growl: angular.growl.IGrowlService,
        private extensionSvc: ExtensionService,
        private schemaSvc: SchemaService,
        private applicationSvc: ApplicationService,
        private eventSvc: EventService,
        private valueSvc: ValueService
    ) {}

    $onInit(): void {
        this.$element.on('click', () => {
            if (this.mmsRecentElement) {
                const data = {
                    elementId: this.mmsRecentElement.id,
                    projectId: this.mmsRecentElement._projectId,
                    refId: this.mmsRecentElement._refId,
                    commitId: this.mmsRecentElement._commitId,
                    displayOldSpec: true,
                };
                this.eventSvc.$broadcast<veCoreEvents.elementSelectedData>('element.selected', data);
            }
        });

        let displayContent: AnnotationObject;
        if (this.mmsRecentElement) {
            displayContent = this._getContentIfElementFound();
        } else {
            displayContent = this._getContentIfElementNotFound();
        }
        this.displayContent = displayContent;
    }

    public copyToClipboard($event: JQuery.ClickEvent): void {
        this.applicationSvc.copyToClipboard($('#tooltipElementId'), $event).then(
            () => {
                this.growl.info('Copied to clipboard!', { ttl: 2000 });
            },
            (err) => {
                this.growl.error('Unable to copy: ' + err.message);
            }
        );
    }

    private _getContentIfElementFound(): AnnotationObject {
        let inlineContent = '';
        let toolTipTitle: string;
        let toolTipContent: string;

        if (this.mmsType === 'transclusion') {
            if (this.mmsField !== 'value') {
                inlineContent = this.mmsRecentElement[this.mmsField] || '<span>(no text)</span>';
                toolTipTitle = 'Referenced element not found';
                toolTipContent = `Displaying last found ${this.mmsField} as placeholder.`;
            } else {
                if (!this.valueSvc.isValue(this.mmsRecentElement)) {
                    inlineContent = '<span>(no text)</span>';
                    toolTipTitle = 'Referenced element is not a value';
                    toolTipContent = `Cannot display value of non-value type element`;
                } else {
                    inlineContent = this._getValueForTranscludeVal(this.mmsRecentElement);
                    toolTipTitle = 'Referenced element not found';
                    toolTipContent = `Displaying last found ${this.mmsField} as placeholder.`;
                }
            }
        } else if (this.mmsType === 'presentation') {
            let classifierType = this.schemaSvc.getKeyByValue(
                'TYPE_TO_CLASSIFIER_ID',
                (this.mmsRecentElement as InstanceSpecObject).classifierIds[0],
                this.schema
            );

            if (classifierType.endsWith('T')) {
                classifierType = classifierType.substring(0, classifierType.length - 1);
            }
            inlineContent = this.mmsRecentElement.documentation || '<span>(no text)</span>';
            toolTipTitle = 'Referenced ' + classifierType + ' not found.';
            toolTipContent = 'Displaying last found content as placeholder.';
        } else if (this.mmsType === 'link') {
            inlineContent = this.mmsRecentElement.name;
            toolTipTitle = 'Referenced view link not found';
            toolTipContent = 'Displaying last found view link as placeholder.';
        }

        return {
            inlineContent: inlineContent,
            toolTipTitle: toolTipTitle,
            toolTipContent: toolTipContent,
            id: this.mmsElementId,
        };
    }

    private _getContentIfElementNotFound(): AnnotationObject {
        const AT = this.extensionSvc.AnnotationType;
        let inlineContent = '';
        const label = this.mmsElementId ? `(${this.mmsElementId})` : '';
        if (this.mmsType === 'transclusion') {
            inlineContent = 'cf element ' + label + ' does not exist';
        } else if (this.mmsType === 'link') {
            inlineContent = 'view link does not exist';
        } else if (this.mmsType === 'presentation') {
            inlineContent = 'presentation element does not exist';
        }

        return {
            inlineContent: inlineContent,
            toolTipTitle: 'Element not found',
            toolTipContent: '',
            id: this.mmsElementId,
        };
    }

    private _getValueForTranscludeVal = (element: ElementObject): string => {
        let value: unknown;

        if (element.type === 'Property' || element.type === 'Port' || element.type === 'Slot') {
            if (element.defaultValue) {
                value = (element.defaultValue as LiteralObject<string>).value;
            } else if ((element as LiteralObject<string>).value) {
                value = (element as LiteralObject<LiteralObject<string>[]>).value[0].value;
            }
        }
        if (element.type === 'Constraint' && element.specification) {
            value = ((element as InstanceSpecObject).specification as LiteralObject<string>).value;
        }
        return value.toString();
    };
}

/** Used for annotating an element that doesn't have any commit history at all or for an element that is deleted but has commit history **/
const AnnotationComponent: VeComponentOptions = {
    selector: 'annotation',
    template: `
    <span class="ve-error" uib-popover-template="'annotationTemplate'" popover-popup-close-delay="500" ng-bind-html="displayContent.inlineContent" popover-placement="bottom-right" popover-title="{{$ctrl.displayContent.toolTipTitle}}"></span>
<script type="text/ng-template" id="annotationTemplate">
    <p>
        {{$ctrl.displayContent.toolTipContent}}
    </p>
    <p id="tooltipElementId" style="position: absolute; left: -1000px; top: -1000px; ">
        {{$ctrl.displayContent.id}}
    </p>
    <button ng-click="$ctrl.copyToClipboard($event)" class="btn btn-sm btn-default"><i class="fa fa-copy"></i>Copy Element ID</button>
</script>
`,
    bindings: {
        mmsElementId: '<',
        mmsRecentElement: '<',
        mmsType: '<',
        mmsField: '<',
    },
    controller: AnnotationController,
};
veUtils.component(AnnotationComponent.selector, AnnotationComponent);
