import * as angular from 'angular'

import {
    ElementService,
    ViewService,
    AuthService
} from "@ve-utils/mms-api-client"
import {
    UtilsService,
    EventService
} from "@ve-utils/core-services"
import {VeComponentOptions} from '@ve-types/view-editor'
import {veExt, ExtUtilService, ExtensionService} from '@ve-ext'
import {ITransclusion, Transclusion} from "@ve-ext/transclusions";
import {MathJaxService} from "@ve-utils/core-services";
import {ButtonBarService} from "@ve-utils/button-bar";
import {SchemaService} from "@ve-utils/model-schema";

/**
 * @ngdoc component
 * @name veExt/TranscludeNameController
 *
 * @requires {angular.IQService} $q
 * @requires {angular.IScope} $scope
 * @requires {angular.ICompileService} $compile
 * @requires {JQuery<HTMLElement>} $element
 * @requires {angular.growl.IGrowlService} growl
 * @requires {ExtUtilService} extUtilSvc
 * @requires {ElementService} elementSvc
 * @requires {UtilsService} utilsSvc
 * @requires {ViewService} viewSvc

 * @requires {AuthService} authSvc
 * @requires {EventService} eventSvc
 * @requires {MathJaxService} mathJaxSvc
 *
 * @restrict E
 *
 * @description
 * Given an element id, puts in the element's name binding, if there's a parent
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
export class TranscludeNameController extends Transclusion implements ITransclusion{

    //Locals
    noClick: any | undefined
    clickHandler: any | undefined


    static $inject = Transclusion.$inject;

    constructor(
        $q: angular.IQService,
        $scope: angular.IScope,
        $compile: angular.ICompileService,
        $element: JQuery<HTMLElement>,
        growl: angular.growl.IGrowlService,
        extUtilSvc: ExtUtilService,
        elementSvc: ElementService,
        utilsSvc: UtilsService,
        schemaSvc: SchemaService,
        authSvc: AuthService,
        eventSvc: EventService,
        mathJaxSvc: MathJaxService,
        extensionSvc: ExtensionService,
        buttonBarSvc: ButtonBarService
    ) {
        super($q,$scope,$compile,$element,growl,extUtilSvc,elementSvc,utilsSvc,schemaSvc,authSvc,eventSvc,
            mathJaxSvc, extensionSvc, buttonBarSvc)
        this.cfType = 'name'
        this.cfTitle = ''
        this.cfKind = 'Text'
        this.checkCircular = false;
    }

    protected config = () => {
        this.$element.on('click', (e) => {
            if (this.noClick)
                return;

            if (this.clickHandler) {
                this.clickHandler();
                return;
            }
            if (this.startEdit && !this.nonEditable)
                this.startEdit();

            if (!this.mmsViewCtrl)
                return false;

            if (this.nonEditable && this.mmsViewCtrl && this.mmsViewCtrl.isEditable()) {
                this.growl.warning("Cross Reference is not editable.");
            }
            this.mmsViewCtrl.transcludeClicked(this.element);
            e.stopPropagation();
        });

        if (this.mmsViewCtrl) {

            this.isEditing = false;
            this.elementSaving = false;
            this.view = this.mmsViewCtrl.getView();

            this.save = (e) => {
                e.stopPropagation();
                this.extUtilSvc.saveAction(this, this.$element, false);
            };

            this.cancel = (e) => {
                e.stopPropagation();
                this.extUtilSvc.cancelAction(this, this.recompile, this.$element);
            };

            this.startEdit = () => {
                this.extUtilSvc.startEdit(this, this.mmsViewCtrl.isEditable(), this.$element, TranscludeNameComponent.template, false);
            };

        }
    }

    public getContent = (preview?) => {
            let deferred = this.$q.defer<string>();
            var defaultTemplate = '<span ng-if="$ctrl.element.name">{{$ctrl.element.name}}</span><span ng-if="!$ctrl.element.name" class="no-print placeholder">(no name)</span>';
            var editTemplate = '<span ng-if="$ctrl.edit.name">{{$ctrl.edit.name}}</span><span ng-if="!$ctrl.edit.name" class="no-print placeholder">(no name)</span>';
            if (preview) {
                deferred.resolve('<div class="panel panel-info">'+ editTemplate +'</div>');
            } else {
                this.isEditing = false;
                deferred.resolve(defaultTemplate);
            }
            return deferred.promise;
    };

}

export let TranscludeNameComponent: VeComponentOptions = {
    selector: 'transcludeName',
    template: `
    <div>
    <form class="input-group" ng-submit="$ctrl.save($event)">
        <input type="text" class="form-control" ng-model="$ctrl.edit.name" aria-describedby="basic-addon2">
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
        mmsCfLabel: '@'
    },
        transclude: true,
        require: {
            mmsViewCtrl: '?^^view'
    },
        controller: TranscludeNameController
    };

veExt.component(TranscludeNameComponent.selector, TranscludeNameComponent);
