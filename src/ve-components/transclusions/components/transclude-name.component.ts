import { ExtensionService, ComponentService } from '@ve-components/services';
import { SpecTool } from '@ve-components/spec-tools';
import { ITransclusion, Transclusion } from '@ve-components/transclusions';
import { ButtonBarService } from '@ve-core/button-bar';
import { EditorService } from '@ve-core/editor';
import { MathService, UtilsService, ImageService } from '@ve-utils/application';
import { EditService, EventService } from '@ve-utils/core';
import { ElementService } from '@ve-utils/mms-api-client';
import { SchemaService } from '@ve-utils/model-schema';

import { veComponents } from '@ve-components';

import { VeComponentOptions, VePromise, VeQService } from '@ve-types/angular';

/**
 * @ngdoc component
 * @name veComponents/TranscludeNameController
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
export class TranscludeNameController extends Transclusion implements ITransclusion {
    protected editTemplate: string = `
    <div>
    <form class="input-group" ng-submit="$ctrl.save($event)">
        <input type="text" class="form-control" ng-model="$ctrl.edit.element.name" aria-describedby="basic-addon2">
        <span class="input-group-addon transclude-name-label">Name</span>
        <span class="input-group-addon" ng-click="$ctrl.save($event)" title="Save">
            <i ng-if="!$ctrl.elementSaving" class="fa fa-save"></i>
            <i ng-if="$ctrl.elementSaving" class="fa fa-spinner fa-spin"></i>
        </span>
        <span class="input-group-addon" ng-click="$ctrl.cancel($event)"><i class="fa fa-times" title="Cancel"></i></span>
    </form>
</div>
`;

    //Locals
    clickHandler: () => void;
    mmsSpecEditorCtrl: SpecTool;

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
            if (this.noClick) return;

            if (this.clickHandler) {
                this.clickHandler();
                return;
            }
            if (this.startEdit && !this.nonEditable) this.startEdit();

            if (!this.mmsViewCtrl) return false;

            if (this.nonEditable && this.mmsViewCtrl && this.mmsViewCtrl.isEditable()) {
                this.growl.warning('Cross Reference is not editable.');
            }
            this.mmsViewCtrl.transcludeClicked(this.element);
            e.stopPropagation();
        });
    }

    public getContent = (preview?): VePromise<string | HTMLElement[], string> => {
        const deferred = this.$q.defer<string>();
        const defaultTemplate =
            '<span ng-if="$ctrl.element.name">{{$ctrl.element.name}}</span><span ng-if="!$ctrl.element.name" class="no-print placeholder">({{ $ctrl.element.type }})</span>';
        const editTemplate =
            '<span ng-if="$ctrl.edit.element.name">{{$ctrl.edit.element.name}}</span><span ng-if="!$ctrl.edit.element.name" class="no-print placeholder">({{ $ctrl.element.type }})</span>';
        if (preview) {
            deferred.resolve('<div class="panel panel-info">' + editTemplate + '</div>');
        } else {
            deferred.resolve(defaultTemplate);
        }
        return deferred.promise;
    };
}

export const TranscludeNameComponent: VeComponentOptions = {
    selector: 'transcludeName',
    template: `<div></div>`,
    bindings: {
        mmsElementId: '@',
        mmsProjectId: '@',
        mmsRefId: '@',
        mmsCommitId: '@',
        mmsWatchId: '@',
        noClick: '@',
        nonEditable: '<',
        clickHandler: '&?',
        mmsCfLabel: '@',
    },
    transclude: true,
    require: {
        mmsViewCtrl: '?^^view',
        mmsSpecEditor: '?^^specEditor',
    },
    controller: TranscludeNameController,
};

veComponents.component(TranscludeNameComponent.selector, TranscludeNameComponent);
