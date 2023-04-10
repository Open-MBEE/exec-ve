import { presentations_buttons } from '@ve-components/presentations/presentations-buttons.config'
import { ExtensionService, ComponentService } from '@ve-components/services'
import { Transclusion, ITransclusion } from '@ve-components/transclusions'
import { ButtonBarService } from '@ve-core/button-bar'
import { UtilsService, MathService, ImageService } from '@ve-utils/application'
import { EventService } from '@ve-utils/core'
import { ElementService } from '@ve-utils/mms-api-client'
import { SchemaService } from '@ve-utils/model-schema'

import { veComponents } from '@ve-components'

import { VeComponentOptions, VePromise, VeQService } from '@ve-types/angular'

/**
 * @ngdoc component
 * @name veComponents/TranscludeDocController
 * @type {ITransclusion}
 *
 * @requires {angular.IScope} $scope
 * @requires {angular.ICompileService} $compile
 * @requires {angular.IRootElementService} $element
 * @requires {angular.growl.IGrowlService} growl
 * @requires {ComponentService} componentSvc
 * @requires {ElementService} elementSvc
 * @requires {UtilsService} utilsSvc
 * @requires {ViewService} viewSvc

 * @requires {AuthService} authSvc
 * @requires {EventService} eventSvc
 * @requires {ButtonBarService} buttonBarSvc
 * @requires {MathService} mathSvc
 * * Given an element id, puts in the element's documentation binding, if there's a parent
 * mmsView directive, will notify parent view of transclusion on init and doc change,
 * and on click. Nested transclusions inside the documentation will also be registered.
 *
 * ## Example
 *  <pre>
    <transclude-doc mms-element-id="element_id"></transclude-doc>
    </pre>
 *
 * @param {string} mmsElementId The id of the view
 * @param {string} mmsProjectId The project id for the view
 * @param {string=master} mmsRefId Reference to use, defaults to master
 * @param {string=latest} mmsCommitId Commit ID, default is latest
 * @param {bool} mmsWatchId set to true to not destroy element ID watcher
 * @param {boolean=false} nonEditable can edit inline or not
 */
export class TranscludeDocController extends Transclusion implements ITransclusion {
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
        <div class="btn-group pull-right" ng-hide="$ctrl.editLoading">
            <button-bar class="transclude-panel-toolbar" button-id="$ctrl.bbId"></button-bar>
        </div>
    </div>
    <div class="panel-body no-padding-panel">
        <editor ng-model="$ctrl.edit.documentation" mms-editor-type="{{$ctrl.editorType}}" editor-id="$ctrl.editorApi" mms-project-id="{{$ctrl.element._projectId}}" mms-ref-id="{{$ctrl.element._refId}}" autosave-key="{{$ctrl.element._projectId + $ctrl.element._refId + $ctrl.element.id}}"></editor>
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
        this.cfTitle = 'Documentation'
        this.cfKind = 'Text'
        this.checkCircular = true
    }

    $onInit(): void {
        super.$onInit()

        this.bbId = this.buttonBarSvc.generateBarId(`${this.mmsElementId}_${this.cfType}`)
        this.bbApi = this.buttonBarSvc.initApi(this.bbId, this.bbInit, presentations_buttons)

        this.$element.on('click', (e) => {
            if (this.startEdit && !this.nonEditable) this.startEdit()

            if (this.mmsViewCtrl) this.mmsViewCtrl.transcludeClicked(this.element)
            if (this.nonEditable && this.mmsViewCtrl && this.mmsViewCtrl.isEditable()) {
                this.growl.warning('Cross Reference is not editable.')
            }
            e.stopPropagation()
        })

        if (this.mmsViewPresentationElemCtrl) {
            this.delete = (): void => {
                this.componentSvc.deleteAction(this, this.bbApi, this.mmsViewPresentationElemCtrl.getParentSection())
            }

            this.instanceSpec = this.mmsViewPresentationElemCtrl.getInstanceSpec()
            this.instanceVal = this.mmsViewPresentationElemCtrl.getInstanceVal()
            this.presentationElem = this.mmsViewPresentationElemCtrl.getPresentationElement()
            const auto = [
                this.schemaSvc.getValue('TYPE_TO_CLASSIFIER_ID', 'Image', this.schema),
                this.schemaSvc.getValue('TYPE_TO_CLASSIFIER_ID', 'Paragraph', this.schema),
                this.schemaSvc.getValue('TYPE_TO_CLASSIFIER_ID', 'List', this.schema),
                this.schemaSvc.getValue('TYPE_TO_CLASSIFIER_ID', 'Table', this.schema),
            ]

            if (auto.indexOf(this.instanceSpec.classifierIds[0]) >= 0)
                //do not allow model generated to be deleted
                this.isDirectChildOfPresentationElement = false
            if (this.isDirectChildOfPresentationElement) {
                this.panelTitle = this.instanceSpec.name
                this.panelType = this.presentationElem.type //this is hack for fake table/list/equation until we get actual editors
                if (this.panelType.charAt(this.panelType.length - 1) === 'T')
                    this.panelType = this.panelType.substring(0, this.panelType.length - 1)
                if (this.panelType === 'Paragraph') this.panelType = 'Text'
                if (this.panelType === 'Figure' || this.panelType === 'ImageT') this.panelType = 'Image'
            }
            if (this.presentationElem) {
                this.editorType = this.presentationElem.type
            }
        }
    }

    $onDestroy(): void {
        super.$onDestroy()
        this.buttonBarSvc.destroy(this.bbId)
    }

    public getContent = (preview?: boolean): VePromise<string | HTMLElement[], string> => {
        const deferred = this.$q.defer<string | HTMLElement[]>()

        let doc = preview ? this.edit.documentation : this.element.documentation
        if (!doc || this.emptyRegex.test(doc)) {
            doc = '<p class="no-print placeholder">(no ' + this.panelType + ')</p>'
        }
        doc = doc.replace(this.fixPreSpanRegex, '<view-cf')
        doc = doc.replace(this.fixPostSpanRegex, '</view-cf>')
        doc = doc.replace(this.spacePeriod, '>.')
        doc = doc.replace(this.spaceSpace, '> ')
        doc = doc.replace(this.spaceComma, '>,')
        let result: string
        if (preview) {
            result = '<div class="panel panel-info">' + doc + '</div>'
        } else {
            this.isEditing = false
            result = doc
        }
        if (this.mmsViewPresentationElemCtrl) {
            const element = this.mmsViewPresentationElemCtrl.getPresentationElement()
            const pe = this.mmsViewPresentationElemCtrl.getInstanceSpec()
            if (
                pe &&
                pe._veNumber &&
                element &&
                (element.type === 'TableT' ||
                    element.type === 'Figure' ||
                    element.type === 'Equation' ||
                    element.type === 'ImageT')
            ) {
                this.type = element.type === 'TableT' ? 'table' : element.type.toLowerCase()
                if (this.type === 'imaget') {
                    this.type = 'figure'
                }
                this.utilsSvc.addLiveNumbering(pe, $('#' + pe.id), this.type)
            }
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

export const TranscludeDocComponent: VeComponentOptions = {
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
        mmsCallback: '&',
    },
    require: {
        mmsViewCtrl: '?^view',
        mmsViewPresentationElemCtrl: '?^viewPe',
    },
    controller: TranscludeDocController,
}

veComponents.component(TranscludeDocComponent.selector, TranscludeDocComponent)
