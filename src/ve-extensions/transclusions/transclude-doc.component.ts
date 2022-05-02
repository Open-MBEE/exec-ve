import * as angular from 'angular'
import Rx from 'rx'

import { TransclusionService } from './Transclusion.service'
import { ElementService } from '../../ve-utils/services/Element.service'
import { UtilsService } from '../../ve-utils/services/Utils.service'
import { ViewService } from '../../ve-utils/services/View.service'
import { UxService } from '../../ve-utils/services/Ux.service'
import { AuthService } from '../../ve-utils/services/Authorization.service'
import { EventService } from '../../ve-utils/services/Event.service'
import { MathJaxService } from '../../ve-utils/services/MathJax.service'
import {
    BButton,
    ButtonBarApi,
    ButtonBarService,
} from '../../ve-core/button-bar/ButtonBar.service'
import { ViewController } from '../../ve-core/view/view.component'
import { ViewPresentationElemController } from '../views/view-pe.component'
import { VeComponentOptions } from '../../ve-utils/types/view-editor'
import { ElementObject, ViewObject } from '../../ve-utils/types/mms'
import { VeEditorApi } from '../../ve-core/editor/CKEditor.service'
import {
    handleChange,
    onChangesCallback,
} from '../../ve-utils/utils/change.util'
import {TransclusionController, TranscludeScope} from './transclusion'
import { veExt } from '../ve-extensions.module'
import { veUtils } from '../../ve-utils/ve-utils.module'
import {TransclusionControllerImpl} from "./transclusion.controller";

/**
 * @ngdoc component
 * @name veExt/TranscludeDocController
 * @type {TransclusionController}
 *
 * @requires {angular.IScope} $scope
 * @requires {angular.ICompileService} $compile
 * @requires {angular.IRootElementService} $element
 * @requires {angular.growl.IGrowlService} growl
 * @requires {Utils} utils
 * @requires {ElementService} elementSvc
 * @requires {UtilsService} utilsSvc
 * @requires {ViewService} viewSvc
 * @requires {UxService} uxSvc
 * @requires {AuthService} authSvc
 * @requires {EventService} eventSvc
 * @requires {ButtonBarService} buttonBarSvc
 * @requires {MathJaxService} mathJaxSvc
 *
 * @description
 * Given an element id, puts in the element's documentation binding, if there's a parent 
 * mmsView directive, will notify parent view of transclusion on init and doc change,
 * and on click. Nested transclusions inside the documentation will also be registered.
 * 
 * ## Example
 *  <pre>
    <mms-transclude-doc mms-element-id="element_id"></mms-transclude-doc>
    </pre>
 *
 * @param {string} mmsElementId The id of the view
 * @param {string} mmsProjectId The project id for the view
 * @param {string=master} mmsRefId Reference to use, defaults to master
 * @param {string=latest} mmsCommitId Commit ID, default is latest
 * @param {bool} mmsWatchId set to true to not destroy element ID watcher
 * @param {boolean=false} nonEditable can edit inline or not
 */
export class TranscludeDocController extends TransclusionControllerImpl implements TransclusionController {

    //Locals
    private fixPreSpanRegex: RegExp = /<\/span>\s*<mms-cf/g
    private fixPostSpanRegex: RegExp = /<\/mms-cf>\s*<span[^>]*>/g
    private emptyRegex: RegExp = /^\s*$/
    private spacePeriod: RegExp = />(?:\s|&nbsp;)\./g
    private spaceSpace: RegExp = />(?:\s|&nbsp;)(?:\s|&nbsp;)/g
    private spaceComma: RegExp = />(?:\s|&nbsp;),/g


    public bbApi: ButtonBarApi
    public bars: string[]
    protected buttons: BButton[] = []
    protected editorTemplate: string = `
    <div class="panel panel-default no-print">
    <div class="panel-heading clearfix">
        <h3 class="panel-title pull-left">
            <form class="form-inline">
            <div class="form-group">
                <span class="pe-type-{{$ctrl.panelType}}">{{$ctrl.panelType}} :</span>
                <span ng-if="!$ctrl.isDirectChildOfPresentationElement">{{$ctrl.panelTitle}}</span>
                <span ng-if="$ctrl.isDirectChildOfPresentationElement"><input type="text" class="form-control" ng-model="$ctrl.edit.name"/></span>
            </div></form>
        </h3>
        <div class="btn-group pull-right">
            <button-bar class="transclude-panel-toolbar" button-api="$ctrl.bbApi"></button-bar>
        </div>
    </div>
    <div class="panel-body no-padding-panel">
        <ve-editor edit-value="$ctrl.edit.documentation" mms-editor-type="{{$ctrl.editorType}}" mms-editor-api="$ctrl.editorApi" mms-project-id="{{$ctrl.element._projectId}}" mms-ref-id="{{$ctrl.element._refId}}" autosave-key="{{$ctrl.element._projectId + $ctrl.element._refId + $ctrl.element.id}}"></ve-editor>
    </div>
</div>
`

    static $inject: string[] = [...TransclusionControllerImpl.$inject, 'ButtonBarService'];

    constructor(
        $q: angular.IQService,
        $scope: angular.IScope,
        $compile: angular.ICompileService,
        $element: JQuery<HTMLElement>,
        growl: angular.growl.IGrowlService,
        transclusionSvc: TransclusionService,
        elementSvc: ElementService,
        utilsSvc: UtilsService,
        viewSvc: ViewService,
        uxSvc: UxService,
        authSvc: AuthService,
        eventSvc: EventService,
        mathJaxSvc: MathJaxService,
        private buttonBarSvc: ButtonBarService,
    ) {
        super($q, $scope,$compile,$element,growl,transclusionSvc,elementSvc,utilsSvc,viewSvc,uxSvc,authSvc,eventSvc,
            mathJaxSvc)
        this.cfType = 'doc'
        this.cfTitle = 'Documentation'
        this.cfKind = 'Text'
        this.checkCircular = true;
    }

    $onInit() {
        this.eventSvc.$init(this)
        this.bbApi = this.buttonBarSvc.initApi('', this.bbInit, this)
        this.buttons = this.bbApi.buttons



        this.$element.on('click', (e) => {
            if (this.editorApi.startEdit && !this.nonEditable) this.editorApi.startEdit()

            if (this.mmsViewCtrl)
                this.mmsViewCtrl.transcludeClicked(this.element)
            if (
                this.nonEditable &&
                this.mmsViewCtrl &&
                this.mmsViewCtrl.isEditable()
            ) {
                this.growl.warning('Cross Reference is not editable.')
            }
            e.stopPropagation()
        })

        if (this.mmsViewCtrl) {
            this.isEditing = false
            this.elementSaving = false
            this.view = this.mmsViewCtrl.getView()
            //TODO remove this when deleting in parent PE directive
            this.isDirectChildOfPresentationElement =
                this.transclusionSvc.isDirectChildOfPresentationElementFunc(
                    this.$element,
                    this.mmsViewCtrl
                )

            this.editorApi.save = () => {
                this.transclusionSvc.saveAction(this, this.$element, false)
            }

            this.editorApi.saveC = () => {
                this.transclusionSvc.saveAction(this, this.$element, true)
            }

            this.editorApi.cancel = () => {
                this.transclusionSvc.cancelAction(this, this.recompile, this.$element)
            }

            this.editorApi.startEdit = () => {
                this.transclusionSvc.startEdit(
                    this,
                    this.mmsViewCtrl,
                    this.$element,
                    this.editorTemplate,
                    false
                )
            }

            this.editorApi.preview = () => {
                this.transclusionSvc.previewAction(this, this.recompile, this.$element)
            }
        }

        if (this.mmsViewPresentationElemCtrl) {
            this.editorApi.delete = () => {
                this.transclusionSvc.deleteAction(
                    this,
                    this.bbApi,
                    this.mmsViewPresentationElemCtrl.getParentSection()
                )
            }

            this.instanceSpec =
                this.mmsViewPresentationElemCtrl.getInstanceSpec()
            this.instanceVal = this.mmsViewPresentationElemCtrl.getInstanceVal()
            this.presentationElem =
                this.mmsViewPresentationElemCtrl.getPresentationElement()
            var auto = [
                this.viewSvc.TYPE_TO_CLASSIFIER_ID.Image,
                this.viewSvc.TYPE_TO_CLASSIFIER_ID.Paragraph,
                this.viewSvc.TYPE_TO_CLASSIFIER_ID.List,
                this.viewSvc.TYPE_TO_CLASSIFIER_ID.Table,
            ]

            if (auto.indexOf(this.instanceSpec.classifierIds[0]) >= 0)
                //do not allow model generated to be deleted
                this.isDirectChildOfPresentationElement = false
            if (this.isDirectChildOfPresentationElement) {
                this.panelTitle = this.instanceSpec.name
                this.panelType = this.presentationElem.type //this is hack for fake table/list/equation until we get actual editors
                if (this.panelType.charAt(this.panelType.length - 1) === 'T')
                    this.panelType = this.panelType.substring(
                        0,
                        this.panelType.length - 1
                    )
                if (this.panelType === 'Paragraph') this.panelType = 'Text'
                if (this.panelType === 'Figure' || this.panelType === 'ImageT')
                    this.panelType = 'Image'
            }
            if (this.presentationElem) {
                this.editorType = this.presentationElem.type
            }
        }
    }


    private bbInit = (api: ButtonBarApi) => {
        api.addButton(
            this.uxSvc.getButtonBarButton('presentation-element-preview', this.editorApi)
        )
        api.addButton(
            this.uxSvc.getButtonBarButton('presentation-element-save', this.editorApi)
        )
        api.addButton(
            this.uxSvc.getButtonBarButton('presentation-element-saveC', this.editorApi)
        )
        api.addButton(
            this.uxSvc.getButtonBarButton('presentation-element-cancel', this.editorApi)
        )
        api.addButton(
            this.uxSvc.getButtonBarButton('presentation-element-delete', this.editorApi)
        )
        api.setPermission(
            'presentation-element-delete',
            this.isDirectChildOfPresentationElement
        )
    }

    public getContent = (preview?) => {
        let deferred = this.$q.defer<string | HTMLElement[]>();

        var doc = preview ? this.edit.documentation : this.element.documentation
        if (!doc || this.emptyRegex.test(doc)) {
            doc =
                '<p class="no-print placeholder">(no ' +
                this.panelType +
                ')</p>'
        }
        doc = doc.replace(this.fixPreSpanRegex, '<mms-cf')
        doc = doc.replace(this.fixPostSpanRegex, '</mms-cf>')
        doc = doc.replace(this.spacePeriod, '>.')
        doc = doc.replace(this.spaceSpace, '> ')
        doc = doc.replace(this.spaceComma, '>,')
        let result: string = '';
        if (preview) {
            result = '<div class="panel panel-info">' + doc + '</div>';
        } else {
            this.isEditing = false
            result = doc;
        }
        if (this.mmsViewPresentationElemCtrl) {
            var peSpec =
                this.mmsViewPresentationElemCtrl.getPresentationElement()
            var pe = this.mmsViewPresentationElemCtrl.getInstanceSpec()
            if (
                pe &&
                pe._veNumber &&
                peSpec &&
                (peSpec.type === 'TableT' ||
                    peSpec.type === 'Figure' ||
                    peSpec.type === 'Equation' ||
                    peSpec.type === 'ImageT')
            ) {
                this.type =
                    peSpec.type === 'TableT'
                        ? 'table'
                        : peSpec.type.toLowerCase()
                if (this.type === 'imaget') {
                    this.type = 'figure'
                }
                this.utilsSvc.addLiveNumbering(pe, $('#' + pe.id), this.type)
            }
        }
        if (!this.mmsGenerateForDiff) {
            let resultHtml = $('<p></p>').html(result).toArray()
            this.mathJaxSvc
                .typeset(resultHtml)
                .then(() => deferred.resolve(resultHtml), (reason) => {
                    deferred.reject(reason);
                })
        } else {
            deferred.resolve(result);
        }
        return deferred.promise;
    }

}

export let TranscludeDocComponent: VeComponentOptions = {
    selector: 'transcludeDoc',
    template: `<div></div>`,
    bindings: {
        mmsElementId: '@',
        mmsProjectId: '@',
        mmsRefId: '@',
        mmsCommitId: '@',
        mmsWatchId: '@',
        nonEditable: '<',
        mmsCfLabel: '@',
        mmsGenerateForDiff: '<',
    },
    require: {
        mmsViewCtrl: '?^view',
        mmsViewPresentationElemCtrl: '?^viewPe',
    },
    controller: TranscludeDocController,
}

veExt.component(TranscludeDocComponent.selector, TranscludeDocComponent)

