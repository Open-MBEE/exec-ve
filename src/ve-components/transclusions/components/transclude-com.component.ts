import { ExtensionService, ComponentService } from '@ve-components/services'
import {
    ITransclusion,
    ITransclusionComponentOptions,
    Transclusion,
} from '@ve-components/transclusions'
import { ButtonBarService } from '@ve-core/button-bar'
import { ImageService, MathService, UtilsService } from '@ve-utils/application'
import { EventService } from '@ve-utils/core'
import { ElementService } from '@ve-utils/mms-api-client'
import { SchemaService } from '@ve-utils/model-schema'

import { veComponents } from '@ve-components'

import { VePromise, VeQService } from '@ve-types/angular'

/**
 * @ngdoc directive
 * @name veComponents.component:mmsTranscludeCom
 *
 * @requires veUtils/ElementService
 * @requires veUtils/UtilsService
 * @requires veUtils/ViewService
 * @requires veComponents/ButtonBarService
 * @requires veComponents/ComponentService
 * @requires $compile
 * @requires $templateCache
 * @requires growl
 * @requires MathJax
 *
 * * Given an element id, puts in the element's documentation binding, if there's a parent
 * mmsView directive, will notify parent view of transclusion on init and doc change,
 * and on click. Nested transclusions inside the documentation will also be registered.
 * (This is different from mmsTranscludeDoc because of special styles applied to comments)
 *
 * @param {string} mmsElementId The id of the view
 * @param {string} mmsProjectId The project id for the view
 * @param {string=master} mmsRefId Reference to use, defaults to master
 * @param {string=latest} mmsCommitId Commit ID, default is latest
 */
export class TranscludeComController
    extends Transclusion
    implements ITransclusion
{
    protected editTemplate: string = `
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
            <button-bar class="transclude-panel-toolbar" button-id="$ctrl.bbId"></button-bar>
        </div>
    </div>
    <div class="panel-body no-padding-panel">
        <editor ng-model="$ctrl.edit.documentation" mms-editor-type="{{$ctrl.editorType}}" mms-editor-api="$ctrl.editorApi" mms-project-id="{{$ctrl.element._projectId}}" mms-ref-id="{{$ctrl.element._refId}}" autosave-key="{{$ctrl.element._projectId + $ctrl.element._refId + $ctrl.element.id}}"></editor>
    </div>
</div>
`

    static $inject = Transclusion.$inject

    constructor(
        $q: VeQService,
        $scope: angular.IScope,
        $compile: angular.ICompileService,
        $element: JQuery<HTMLElement>,
        growl: angular.growl.IGrowlService,
        componentSvc: ComponentService,
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
            elementSvc,
            utilsSvc,
            schemaSvc,
            eventSvc,
            mathSvc,
            extensionSvc,
            buttonBarSvc,
            imageSvc
        )
        this.cfType = 'doc'
        this.cfTitle = 'comment'
        this.cfKind = 'Comment'
        this.checkCircular = true
    }

    $onInit(): void {
        super.$onInit()
        this.$element.on('click', (e) => {
            if (this.startEdit && !this.nonEditable) this.startEdit()

            if (this.mmsViewCtrl)
                this.mmsViewCtrl.transcludeClicked(this.element)
            if (
                this.nonEditable &&
                this.mmsViewCtrl &&
                this.mmsViewCtrl.isEditable()
            ) {
                this.growl.warning('Comment is not editable.')
            }
            e.stopPropagation()
        })

        if (this.mmsViewCtrl) {
            this.isEditing = false
            this.elementSaving = false
            this.view = this.mmsViewCtrl.getView()
            this.isDirectChildOfPresentationElement =
                this.componentSvc.isDirectChildOfPresentationElementFunc(
                    this.$element,
                    this.mmsViewCtrl
                )

            this.save = (): void => {
                this.componentSvc.saveAction(this, this.$element, false)
            }

            this.saveC = (): void => {
                this.componentSvc.saveAction(this, this.$element, true)
            }

            this.cancel = (): void => {
                this.componentSvc.cancelAction(
                    this,
                    this.recompile,
                    this.$element
                )
            }

            this.startEdit = (): void => {
                this.componentSvc.startEdit(
                    this,
                    this.mmsViewCtrl.isEditable(),
                    this.$element,
                    this.editTemplate,
                    false
                )
            }

            this.preview = (): void => {
                this.componentSvc.previewAction(
                    this,
                    this.recompile,
                    this.$element
                )
            }
        }

        if (this.mmsViewPresentationElemCtrl) {
            this.delete = (): void => {
                this.componentSvc.deleteAction(
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
            const auto = [
                this.schemaSvc.getValue(
                    'TYPE_TO_CLASSIFIER_ID',
                    'Image',
                    this.schema
                ),
                this.schemaSvc.getValue(
                    'TYPE_TO_CLASSIFIER_ID',
                    'Paragraph',
                    this.schema
                ),
                this.schemaSvc.getValue(
                    'TYPE_TO_CLASSIFIER_ID',
                    'List',
                    this.schema
                ),
                this.schemaSvc.getValue(
                    'TYPE_TO_CLASSIFIER_ID',
                    'Table',
                    this.schema
                ),
            ]

            if (auto.indexOf(this.instanceSpec.classifierIds[0]) >= 0)
                //do not allow model generated to be deleted
                this.isDirectChildOfPresentationElement = false
            if (this.isDirectChildOfPresentationElement)
                this.panelTitle = this.instanceSpec.name
            this.panelType = 'Comment'
        }
    }

    public getContent = (
        preview?: boolean
    ): VePromise<string | HTMLElement[], string> => {
        const deferred = this.$q.defer<string | HTMLElement[]>()

        let doc =
            (preview ? this.edit.documentation : this.element.documentation) ||
            '(No comment)'
        doc +=
            ' - <span class="mms-commenter"> Comment by <b>' +
            this.element._creator +
            '</b></span>'

        let result = ''
        if (preview) {
            result = '<div class="panel panel-info">' + doc + '</div>'
        } else {
            this.isEditing = false
            result = doc
        }
        if (!this.mmsGenerateForDiff) {
            const resultHtml = $('<p></p>').html(result).toArray()
            this.mathSvc.typeset(resultHtml).then(
                () => deferred.resolve(resultHtml),
                (reason) => {
                    deferred.reject(reason)
                }
            )
        } else {
            deferred.resolve(result)
        }
        return deferred.promise
    }
}

export const TranscludeComComponent: ITransclusionComponentOptions = {
    selector: 'transcludeCom',
    template: `<div></div>`,
    bindings: {
        mmsElementId: '@',
        mmsProjectId: '@',
        mmsRefId: '@',
        mmsCommitId: '@',
        mmsWatchId: '<',
        nonEditable: '<',
        mmsCfLabel: '@',
        mmsGenerateForDiff: '<',
        mmsCallback: '&',
    },
    require: {
        mmsViewCtrl: '?^view',
        mmsViewPresentationElemCtrl: '?^viewPe',
    },
    controller: TranscludeComController,
}

veComponents.component(TranscludeComComponent.selector, TranscludeComComponent)
