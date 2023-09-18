// <div ng-if="$ctrl.element.type === 'Generalization' || $ctrl.element.type === 'Dependency'">
// <h2 class="prop-title">Source</h2>
//     <span class="prop"><transclude-name mms-watch-id="true" mms-element-id="{{$ctrl.element._sourceIds[0]}}" mms-project-id="{{$ctrl.mmsProjectId}}" mms-ref-id="{{$ctrl.mmsRefId}}"></transclude-name></span>
// <h2 class="prop-title">Target</h2>
//     <span class="prop"><transclude-name mms-watch-id="true" mms-element-id="{{$ctrl.element._targetIds[0]}}" mms-project-id="{{$ctrl.mmsProjectId}}" mms-ref-id="{{$ctrl.mmsRefId}}"></transclude-name></span>
// </div>
import { ExtensionService, ComponentService } from '@ve-components/services';
import { ITransclusion, Transclusion } from '@ve-components/transclusions';
import { ButtonBarService } from '@ve-core/button-bar';
import { EditorService } from '@ve-core/editor';
import { veCoreEvents } from '@ve-core/events';
import { MathService, UtilsService, ImageService } from '@ve-utils/application';
import { EditService, EventService } from '@ve-utils/core';
import { ElementService } from '@ve-utils/mms-api-client';
import { SchemaService } from '@ve-utils/model-schema';

import { veComponents } from '@ve-components';

import { VeComponentOptions, VePromise, VeQService } from '@ve-types/angular';

export class TranscludeAttrController extends Transclusion implements ITransclusion {
    protected template: string = `

`;
    //Custom Binding
    mmsAttr: string;

    //Locals
    attrValues: string[] = [];

    static $inject = Transclusion.$inject;

    constructor(
        $q: VeQService,
        $scope: angular.IScope,
        $compile: angular.ICompileService,
        $element: JQuery<HTMLElement>,
        growl: angular.growl.IGrowlService,
        componentSvc: ComponentService,
        editorSvc: EditorService,
        editSvc: EditService,
        elementSvc: ElementService,
        utilsSvc: UtilsService,
        schemaSvc: SchemaService,
        eventSvc: EventService,
        mathSvc: MathService,
        extensionSvc: ExtensionService,
        buttonBarSvc: ButtonBarService,
        imageSvc: ImageService
    ) {
        super(
            $q,
            $scope,
            $compile,
            $element,
            growl,
            componentSvc,
            editorSvc,
            editSvc,
            elementSvc,
            utilsSvc,
            schemaSvc,
            eventSvc,
            mathSvc,
            extensionSvc,
            buttonBarSvc,
            imageSvc
        );
        this.cfType = 'name';
        this.cfTitle = '';
        this.cfKind = 'Text';
        this.checkCircular = false;
    }

    $onInit(): void {
        super.$onInit();

        this.$element.on('click', (e) => {
            e.stopPropagation();
            if (this.noClick) return;
            const data = {
                elementId: this.element.id,
                projectId: this.element._projectId,
                refId: this.element._refId,
                commitId: 'latest',
            };
            this.eventSvc.$broadcast<veCoreEvents.elementSelectedData>('element.selected', data);
        });
    }

    public getContent = (preview?): VePromise<string | HTMLElement[], string> => {
        const deferred = this.$q.defer<string>();
        let contentTemplate: string;
        const ids: string[] = [];
        if (
            this.element[this.mmsAttr] ||
            (Array.isArray(this.element[this.mmsAttr]) && (this.element[this.mmsAttr] as Array<unknown>).length > 0)
        ) {
            //Grab id reference to an array for CF
            if (this.mmsAttr.endsWith('Id')) {
                ids.push(this.element[this.mmsAttr] as string);
            }
            // Grab id array for a CF list
            else if (this.mmsAttr.endsWith('Ids')) {
                ids.push(...(this.element[this.mmsAttr] as Array<string>));
            }
            // Convert List of elements to strings
            else if (Array.isArray(this.element[this.mmsAttr])) {
                (this.element[this.mmsAttr] as Array<unknown>).forEach((value) => {
                    if (typeof this.element[this.mmsAttr] === 'object') {
                        value = JSON.stringify(value);
                    }
                    this.attrValues.push(`<span>${value.toString()}</span>`);
                });
            } else {
                let value: string;
                if (typeof this.element[this.mmsAttr] === 'object') {
                    value = JSON.stringify(this.element[this.mmsAttr]);
                } else {
                    value = (this.element[this.mmsAttr] as unknown).toString();
                }
                this.attrValues.push(`<span>${value}</span>`);
            }
            // Convert referenced ids array to CF list
            if (ids.length > 0) {
                ids.forEach((id) => {
                    this.attrValues.push(
                        `<transclude-name mms-element-id="${id}" mms-project-id="{{$ctrl.projectId}}" mms-ref-id="{{$ctrl.refId}}" mms-commit-id="{{$ctrl.commitId}}" ${
                            this.noClick ? 'no-click="true"' : ''
                        }}></transclude-name>`
                    );
                });
            }
        } else {
            this.attrValues.push(`<span class="no-print placeholder">(empty)</span>`);
        }
        if (this.mmsCfLabel) {
            contentTemplate = `<h2 class="prop-title">{{$ctrl.mmsAttr}}</h2>`;
        }

        this.attrValues.forEach((value, index) => {
            const sep = index == this.attrValues.length - 1 ? '' : ', ';
            contentTemplate += `${value}${this.mmsCfLabel ? '</br>' : sep}`;
        });
        deferred.resolve(contentTemplate);

        return deferred.promise;
    };
}

export const TranscludeNameComponent: VeComponentOptions = {
    selector: 'transcludeAttr',
    template: `<div></div>`,
    bindings: {
        mmsAttr: '@',
        mmsElementId: '@',
        mmsProjectId: '@',
        mmsRefId: '@',
        mmsCommitId: '@',
        mmsWatchId: '@',
        mmsCfLabel: '@',
        noClick: '<',
    },
    transclude: true,
    require: {
        mmsViewCtrl: '?^^view',
        mmsSpecEditor: '?^^specEditor',
    },
    controller: TranscludeAttrController,
};

veComponents.component(TranscludeNameComponent.selector, TranscludeNameComponent);
