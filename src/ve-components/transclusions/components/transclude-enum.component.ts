/** TODO: Add a value type transclude that gets rendered as a editable dropdown of prespecified objects.
 * @name veComponents/TranscludeEnumComponent
 *
 * @description For Example You could have a dropdown which includes all the people in the project and allows you to specify who is the
 * responsible person for that particular item which gets saved as the Type/Value? of the property You could additionally add a
 * binding which specifies the template for the creation of new objects as types to be placed in the holding bin.
 */
import { ComponentService, ExtensionService } from '@ve-components/services';
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
 * @name veComponents/TranscludeEnumController
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
 * @restrict E
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
export class TranscludeEnumController extends Transclusion implements ITransclusion {
    //Locals
    noClick: boolean | undefined;
    clickHandler: () => void;

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
        // Need a way to put in a query for allowed options.
        // Value to save the resulting pointer
        // Transclusion for new options
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

    public getContent = (preview?: boolean): VePromise<string | HTMLElement[], string> => {
        const deferred = this.$q.defer<string | HTMLElement[]>();
        const defaultTemplate =
            '<span ng-if="$ctrl.element.name">{{$ctrl.element.name}}</span><span ng-if="!$ctrl.element.name" class="no-print placeholder">(no name)</span>';
        const editTemplate =
            '<span ng-if="$ctrl.edit.name">{{$ctrl.edit.name}}</span><span ng-if="!$ctrl.edit.name" class="no-print placeholder">(no name)</span>';
        if (preview) {
            deferred.resolve('<div class="panel panel-info">' + editTemplate + '</div>');
        } else {
            deferred.resolve(defaultTemplate);
        }
        return deferred.promise;
    };

    // private _startEdit(
    //     ctrl: ComponentController,
    //     isEditable: boolean,
    //     domElement: JQuery<HTMLElement>,
    //     template: string | Injectable<(...args: any[]) => string>,
    //     doNotScroll
    // ): void {
    //     if (
    //         isEditable &&
    //         !ctrl.isEditing &&
    //         ctrl.element &&
    //         ctrl.commitId === 'latest' &&
    //         this.permissionsSvc.hasBranchEditPermission(
    //             ctrl.element._projectId,
    //             ctrl.element._refId
    //         )
    //     ) {
    //         var elementOb = ctrl.element
    //         var reqOb = {
    //             elementId: elementOb.id,
    //             projectId: elementOb._projectId,
    //             refId: elementOb._refId,
    //         }
    //         this.elementSvc.getElementForEdit(reqOb).then((data) => {
    //             ctrl.isEditing = true
    //             ctrl.inPreviewMode = false
    //             ctrl.edit = data
    //
    //             if (data.type === 'Property' || data.type === 'Port') {
    //                 if (ctrl.edit.defaultValue) {
    //                     ctrl.editValues = [ctrl.edit.defaultValue]
    //                 }
    //             } else if (data.type === 'Slot') {
    //                 if (Array.isArray(data.value)) {
    //                     ctrl.editValues = data.value
    //                 }
    //             } else if (data.type === 'Constraint' && data.specification) {
    //                 ctrl.editValues = [data.specification]
    //             }
    //             if (!ctrl.editValues) {
    //                 ctrl.editValues = []
    //             }
    //             /*
    //             if (ctrl.isEnumeration && ctrl.editValues.length === 0) {
    //                 ctrl.editValues.push({type: 'InstanceValue', instanceId: null});
    //             }
    //             */
    //             if (template) {
    //                 domElement.empty()
    //                 let transcludeEl: JQuery<HTMLElement>
    //                 if (typeof template === 'string') {
    //                     transcludeEl = $(template)
    //                 } else {
    //                     this.growl.error(
    //                         'Editing is not supported for Injected Templates!'
    //                     )
    //                     return
    //                 }
    //                 domElement.append(transcludeEl)
    //                 this.$compile(transcludeEl)(ctrl.$scope)
    //             }
    //             if (!ctrl.skipBroadcast) {
    //                 // Broadcast message for the toolCtrl:
    //                 this.eventSvc.$broadcast('editor.edit', ctrl.edit)
    //             } else {
    //                 ctrl.skipBroadcast = false
    //             }
    //             if (!doNotScroll) {
    //                 this._scrollToElement(domElement)
    //             }
    //         }, this.handleError)
    //
    //         this.elementSvc.isCacheOutdated(ctrl.element).then((data) => {
    //             if (
    //                 data.status &&
    //                 data.server._modified > data.cache._modified
    //             ) {
    //                 this.growl.warning(
    //                     'This element has been updated on the server'
    //                 )
    //             }
    //         })
    //     }
    // }
}

export const TranscludeEnumComponent: VeComponentOptions = {
    selector: 'transcludeEnum',
    template: `
    <div>
    <form class="input-group" ng-submit="$ctrl.save($event)">
        <div class="dropdown">
          <button class="btn btn-secondary dropdown-toggle" type="button" id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
            Dropdown button
          </button>
          <div class="dropdown-menu" aria-labelledby="dropdownMenuButton">
            <a class="dropdown-item" href="#">Action</a>
            <a class="dropdown-item" href="#">Another action</a>
            <a class="dropdown-item" href="#">Something else here</a>
          </div>
        </div>
        <span class="input-group-addon transclude-name-label">Name</span>
        <span class="input-group-addon" ng-click="$ctrl.save($event)" title="Save">
            <i ng-if="!$ctrl.elementSaving" class="fa fa-save"></i>
            <i ng-if="$ctrl.elementSaving" class="fa fa-spinner fa-spin"></i>
        </span>
        <span class="input-group-addon" ng-click="$ctrl.cancel($event)"><i class="fa fa-times" title="Cancel"></i></span>
    </form>
</div>
`,
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
    controller: TranscludeEnumController,
};

veComponents.component(TranscludeEnumComponent.selector, TranscludeEnumComponent);
