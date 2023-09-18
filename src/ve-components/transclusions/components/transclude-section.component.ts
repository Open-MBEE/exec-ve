import { PresentationService } from '@ve-components/presentations';
import { ExtensionService, ComponentService } from '@ve-components/services';
import { DeletableTransclusion, ITransclusion } from '@ve-components/transclusions';
import { ButtonBarService } from '@ve-core/button-bar';
import { editor_buttons, EditorService } from '@ve-core/editor';
import { MathService, UtilsService, ImageService, RootScopeService } from '@ve-utils/application';
import { EditService, EventService } from '@ve-utils/core';
import { ElementService, ViewService } from '@ve-utils/mms-api-client';
import { SchemaService } from '@ve-utils/model-schema';

import { veComponents } from '@ve-components';

import { VeComponentOptions, VePromise, VeQService } from '@ve-types/angular';
import { InstanceValueObject } from '@ve-types/mms';

/**
 * @ngdoc component
 * @name veComponents/TranscludeSectionController
 *
 * @requires {VeQService} $q
 * @requires {angular.IScope} $scope
 * @requires {angular.ICompileService} $compile
 * @requires {JQuery<HTMLElement>} $element
 * @requires {angular.growl.IGrowlService} growl
 * @requires {ComponentService} componentSvc
 * @requires {ElementService} elementSvc
 * @requires {UtilsService} utilsSvc
 * @requires {ViewService} viewSvc

 * @requires {AuthService} authSvc
 * @requires {EventService} eventSvc
 * @requires {MathService} mathSvc
 *
 * * Given an element id, puts in the element's name binding, if there's a parent
 * mmsView directive, will notify parent view of transclusion on init and name change,
 * and on click
 *
 * @param {string} mmsElementId The id of the view
 * @param {string} mmsProjectId The project id for the view
 * @param {string=master} mmsRefId Reference to use, defaults to master
 * @param {string=latest} mmsCommitId Commit ID, default is latest
 * @param {bool} mmsWatchId set to true to not destroy element ID watcher
 * @param {boolean=false} nonEditable can edit inline or not
 */
export class TranscludeSectionController extends DeletableTransclusion implements ITransclusion {
    showNumbering: boolean;
    noCompile: boolean = true;
    //Locals
    level: number = 0;
    static $inject = [...DeletableTransclusion.$inject, 'PresentationService', 'RootScopeService'];

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
        imageSvc: ImageService,
        viewSvc: ViewService,
        private presentationSvc: PresentationService,
        private rootScopeSvc: RootScopeService
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
            imageSvc,
            viewSvc
        );
        this.cfType = 'name';
        this.cfTitle = '';
        this.cfKind = 'Text';
        this.checkCircular = false;
    }

    $onInit(): void {
        super.$onInit();
        this.showNumbering = this.rootScopeSvc.veNumberingOn();
        this.bbId = this.buttonBarSvc.generateBarId(`${this.mmsElementId}_section`);
        this.bbApi = this.buttonBarSvc.initApi(this.bbId, this.bbInit, editor_buttons);
        this.bbApi.setPermission('editor-preview', false);
        this.bbApi.setPermission('editor-save-continue', false);
        this.bbApi.setPermission('editor-reset', false);
        this.$element.on('click', (e) => {
            if (this.startEdit) this.startEdit();
            if (this.mmsViewCtrl) this.mmsViewCtrl.transcludeClicked(this.element);
            e.stopPropagation();
        });
        this.subs.push(
            this.eventSvc.binding<boolean>(this.rootScopeSvc.constants.VENUMBERINGON, (data) => {
                this.showNumbering = data;
            })
        );
    }

    $onDestroy(): void {
        super.$onDestroy();
        this.buttonBarSvc.destroy(this.bbId);
    }

    public getContent = (preview?): VePromise<string | HTMLElement[], string> => {
        if (this.element.specification && this.element.specification.operand) {
            const dups = this.presentationSvc.checkForDuplicateInstances(
                this.element.specification.operand as InstanceValueObject[]
            );
            if (dups.length > 0) {
                this.growl.warning('There are duplicates in this section, duplicates ignored!');
            }
        }
        if (this.element._veNumber) {
            this.level = this.element._veNumber.split('.').length;
        }
        const deferred = this.$q.defer<string>();
        deferred.reject({ status: 200 }); //don't recompile
        return deferred.promise;
    };
}

export const TranscludeSectionComponent: VeComponentOptions = {
    selector: 'transcludeSection',
    template: `
 <div ng-if="$ctrl.element.specification">
    <div ng-show="!$ctrl.isEditing">
        <h1 class="section-title bm-level-{{$ctrl.level}}">
            <span class="ve-view-number" ng-show="$ctrl.showNumbering">{{$ctrl.element._veNumber}}</span> {{$ctrl.element.name}}
        </h1>
    </div>
    <div ng-class="{'panel panel-default' : $ctrl.isEditing}">
        <div ng-show="$ctrl.isEditing" class="panel-heading clearfix no-print">
            <h3 class="panel-title pull-left">
                <div ng-class="{prop: $ctrl.isEditing}"><input class="form-control" type="text" ng-model="$ctrl.edit.element.name"/></div>
            </h3>
            <div class="btn-group pull-right" ng-hide="$ctrl.editLoading">
                <button-bar class="transclude-panel-toolbar" button-id="$ctrl.bbId"></button-bar>
            </div>
        </div>
        <div ng-class="{'panel-body' : $ctrl.isEditing}">
            <add-pe-menu mms-view="$ctrl.element" index="-1" class="add-pe-button-container no-print"></add-pe-menu>
            <div ng-repeat="instanceVal in $ctrl.element.specification.operand track by instanceVal.instanceId">
                <view-pe mms-instance-val="instanceVal" mms-parent-section="$ctrl.element"></view-pe>
                <add-pe-menu mms-view="$ctrl.element" index="$index" class="add-pe-button-container no-print"></add-pe-menu>
            </div>
        </div>
    </div>
</div>`,
    bindings: {
        mmsElementId: '@',
        mmsProjectId: '@',
        mmsRefId: '@',
        mmsCommitId: '@',
    },
    transclude: true,
    require: {
        mmsViewCtrl: '?^^view',
        mmsViewPresentationElemCtrl: '?^viewPe',
    },
    controller: TranscludeSectionController,
};

veComponents.component(TranscludeSectionComponent.selector, TranscludeSectionComponent);
