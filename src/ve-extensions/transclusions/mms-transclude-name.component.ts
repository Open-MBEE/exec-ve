import * as angular from 'angular'
import Rx from 'rx'

import { Utils } from '../../ve-core/utilities/Utils.service'
import { ElementService } from '../../ve-utils/services/Element.service'
import { UtilsService } from '../../ve-utils/services/Utils.service'
import { ViewService } from '../../ve-utils/services/View.service'
import { UxService } from '../../ve-utils/services/Ux.service'
import { AuthService } from '../../ve-utils/services/Authorization.service'
import { EventService } from '../../ve-utils/services/Event.service'
import { ViewController } from '../../ve-core/view/view.component'
import { ViewPresentationElemController } from '../views/view-pe.component'
import { VeComponentOptions } from '../../ve-utils/types/view-editor'
import { ElementObject, ViewObject } from '../../ve-utils/types/mms'
import { VeEditorApi } from '../../ve-core/editor/CKEditor.service'
import {
    handleChange,
    onChangesCallback,
} from '../../ve-utils/utils/change.util'
import {TranscludeController, TranscludeScope} from './transclusion'
import { veExt } from '../ve-extensions.module'
import { veUtils } from '../../ve-utils/ve-utils.module'
import {TranscludeControllerImpl} from "./transclude.controller";
import {MathJaxService} from "../../ve-core/editor/MathJax.service";
import {ButtonBarService} from "../../ve-core/button-bar/ButtonBar.service";

/**
 * @ngdoc component
 * @name veExt/TranscludeNameController
 *
 * @requires veUtils/ElementService
 * @requires veUtils/UxService
 * @requires veUtils/Utils
 * @requires $compile
 * @requires $templateCache
 * @requires growl
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
export class TranscludeNameController extends TranscludeControllerImpl implements TranscludeController{

    //Locals
    noClick: any | undefined
    clickHandler: any | undefined


    static $inject = TranscludeControllerImpl.$inject;

    constructor(
        $q: angular.IQService,
        $scope: angular.IScope,
        $compile: angular.ICompileService,
        $element: angular.IRootElementService,
        growl: angular.growl.IGrowlService,
        utils: Utils,
        elementSvc: ElementService,
        utilsSvc: UtilsService,
        viewSvc: ViewService,
        uxSvc: UxService,
        authSvc: AuthService,
        eventSvc: EventService,
        mathJaxSvc: MathJaxService,
    ) {
        super($q,$scope,$compile,$element,growl,utils,elementSvc,utilsSvc,viewSvc,uxSvc,authSvc,eventSvc,
            mathJaxSvc)
        this.cfType = 'name'
        this.cfTitle = ''
        this.cfKind = 'Text'
        this.checkCircular = false;
    }

    $onInit() {
        this.eventSvc.$init(this)


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
                this.utils.saveAction(this, this.$element, false);
            };

            this.cancel = (e) => {
                e.stopPropagation();
                this.utils.cancelAction(this, this.recompile, this.$element);
            };

            this.startEdit = function() {
                this.utils.startEdit(this, this.mmsViewCtrl, this.$transcludeEl, TranscludeNameComponent.template, false);
            };

        }
    }

    public getContent = (preview?) => {
            var defaultTemplate = '<span ng-if="$ctrl.element.name">{{$ctrl.element.name}}</span><span ng-if="!$ctrl.element.name" class="no-print placeholder">(no name)</span>';
            var editTemplate = '<span ng-if="$ctrl.edit.name">{{$ctrl.edit.name}}</span><span ng-if="!$ctrl.edit.name" class="no-print placeholder">(no name)</span>';
             if (this.recompileScope) {
                 this.recompileScope.$destroy();
            }

            this.$transcludeEl.empty();
            if (preview) {
                this.$transcludeEl.html('<div class="panel panel-info">'+ editTemplate +'</div>');
            } else {
                this.isEditing = false;
                this.$transcludeEl.html(defaultTemplate);
            }
            return this.$q.resolve();
    };

}

let TranscludeNameComponent: VeComponentOptions = {
    selector: 'mmsTranscludeName',
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