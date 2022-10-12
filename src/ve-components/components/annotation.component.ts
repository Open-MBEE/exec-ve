import * as angular from 'angular'

import { ExtensionService } from '@ve-components/services'
import { SchemaService } from '@ve-utils/model-schema'
import { EventService, UtilsService } from '@ve-utils/services'

import { veUtils } from '@ve-utils'

import { ElementObject, RequestObject } from '@ve-types/mms'
import { VeComponentOptions } from '@ve-types/view-editor'

/** Used for annotating an element that doesn't have any commit history at all or for an element that is deleted but has commit history **/
const AnnotationComponent: VeComponentOptions = {
    selector: 'annotation',
    template: `
    <span class="ve-error" uib-popover-template="'annotationTemplate'" popover-popup-close-delay="500" ng-bind-html="displayContent.inlineContent" popover-placement="top-left" popover-title="{{$ctrl.displayContent.toolTipTitle}}"></span>
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
        mmsReqOb: '<',
        mmsRecentElement: '<',
        mmsType: '<',
        mmsCfLabel: '<',
    },
    controller: class AnnotationController
        implements angular.IComponentController
    {
        static $inject = [
            '$element',
            'ExtensionService',
            'SchemaService',
            'UtilsService',
            'EventService',
        ]

        //Bindings
        private mmsReqOb: RequestObject
        mmsRecentElement: ElementObject
        mmsType: string
        mmsCfLabel: string

        //Local
        public displayContent
        private schema: string = 'cameo'

        constructor(
            private $element: JQuery<HTMLElement>,
            private extensionSvc: ExtensionService,
            private schemaSvc: SchemaService,
            private utilsSvc: UtilsService,
            private eventSvc: EventService
        ) {}

        $onInit() {
            this.$element.on('click', () => {
                if (this.mmsRecentElement) {
                    const data = {
                        elementOb: this.mmsRecentElement,
                        commitId: this.mmsRecentElement._commitId,
                        displayOldSpec: true,
                    }
                    this.eventSvc.$broadcast('element.selected', data)
                }
            })

            let displayContent
            if (this.mmsRecentElement) {
                displayContent = this._getContentIfElementFound(
                    this.mmsType,
                    this.mmsRecentElement
                )
            } else {
                displayContent = this._getContentIfElementNotFound(
                    this.mmsType,
                    this.mmsReqOb,
                    this.mmsCfLabel
                )
            }
            this.displayContent = displayContent
        }

        public copyToClipboard($event) {
            this.utilsSvc.copyToClipboard($('#tooltipElementId'), $event)
        }

        private _getContentIfElementFound(type, element) {
            const AT = this.extensionSvc.AnnotationType
            let inlineContent = ''
            let toolTipTitle
            let toolTipContent
            let classifierType = this.schemaSvc.getKeyByValue(
                'TYPE_TO_CLASSIFIER_ID',
                element.classifierIds[0],
                this.schema
            )

            if (classifierType.endsWith('T')) {
                classifierType = classifierType.substring(
                    0,
                    classifierType.length - 1
                )
            }

            switch (type) {
                case AT.mmsTranscludeName:
                    inlineContent = element.name
                    toolTipTitle = 'Referenced element not found'
                    toolTipContent =
                        'Displaying last found name as placeholder.'
                    break
                case AT.mmsTranscludeDoc:
                    inlineContent = element.documentation
                    toolTipTitle = 'Referenced element not found'
                    toolTipContent =
                        'Displaying last found documentation as placeholder.'
                    break
                case AT.mmsTranscludeCom:
                    inlineContent = element.documentation
                    toolTipTitle = 'Referenced comment not found.'
                    toolTipContent =
                        'Displaying last found comment content as a placeholder.'
                    break
                case AT.mmsViewLink:
                    inlineContent = element.name
                    toolTipTitle = 'Referenced view link not found'
                    toolTipContent =
                        'Displaying last found view link as placeholder.'
                    break
                case AT.mmsTranscludeVal:
                    inlineContent = this._getValueForTranscludeVal(element)
                    toolTipTitle = 'Referenced element not found'
                    toolTipContent =
                        'Displaying last found value as placeholder.'
                    break
                case AT.mmsPresentationElement:
                    inlineContent =
                        element.documentation || '<span>(no text)</span>'
                    toolTipTitle =
                        'Referenced ' + classifierType + ' not found.'
                    toolTipContent =
                        'Displaying last found content as placeholder.'
                    break
            }

            return {
                inlineContent: inlineContent,
                toolTipTitle: toolTipTitle,
                toolTipContent: toolTipContent,
                id: element.id,
            }
        }

        private _getContentIfElementNotFound(type, reqOb, cfLabel) {
            const AT = this.extensionSvc.AnnotationType
            let inlineContent = ''
            const label = cfLabel ? '(' + cfLabel + ')' : ''
            switch (type) {
                case AT.mmsTranscludeName:
                    inlineContent = 'cf name' + label + ' does not exist'
                    break
                case AT.mmsTranscludeDoc:
                    inlineContent =
                        'cf documentation' + label + ' does not exist'
                    break
                case AT.mmsTranscludeCom:
                    inlineContent = 'cf com' + label + ' does not exist'
                    break
                case AT.mmsTranscludeVal:
                    inlineContent = 'cf value' + label + ' does not exist'
                    break
                case AT.mmsViewLink:
                    inlineContent = 'view link does not exist'
                    break
                case AT.mmsPresentationElement:
                    inlineContent = 'presentation element does not exist'
                    break
            }

            return {
                inlineContent: inlineContent,
                toolTipTitle: 'Element not found',
                toolTipContent: '',
                id: reqOb.elementId,
            }
        }

        private _getValueForTranscludeVal(element) {
            let value = ''
            if (
                element.type === 'Property' ||
                element.type === 'Port' ||
                element.type === 'Slot'
            ) {
                if (element.defaultValue) {
                    value = element.defaultValue.value
                } else if (element.value) {
                    value = element.value[0].value
                }
            }
            if (element.type === 'Constraint' && element.specification) {
                value = element.specification.value
            }
            return value
        }
    },
}
veUtils.component(AnnotationComponent.selector, AnnotationComponent)
