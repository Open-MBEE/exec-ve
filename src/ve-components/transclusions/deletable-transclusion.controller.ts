import {VeQService} from "@ve-types/angular";
import {ComponentService, ExtensionService} from "@ve-components/services";
import {EditorService} from "@ve-core/editor";
import {EditService, EventService} from "@ve-utils/core";
import {ElementService, ViewService} from "@ve-utils/mms-api-client";
import {ImageService, MathService, UtilsService} from "@ve-utils/application";
import {SchemaService} from "@ve-utils/model-schema";
import {ButtonBarService} from "@ve-core/button-bar";
import { Transclusion } from '@ve-components/transclusions'
import {PresentTextObject} from "@ve-types/mms";

export class DeletableTransclusion extends Transclusion {
    static $inject = [...Transclusion.$inject, 'ViewService']
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
        private viewSvc: ViewService
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
        )
    }

    $onInit(): void {
        super.$onInit()
        if (this.mmsViewPresentationElemCtrl) { // delete is used for transclude doc, com, or section
            this.delete = (): void => {
                this.deleteAction()
            }
            const instanceSpec = this.mmsViewPresentationElemCtrl.getInstanceSpec()
            const presentationElem = this.mmsViewPresentationElemCtrl.getPresentationElement()
            const isOpaque = instanceSpec.classifierIds &&
                instanceSpec.classifierIds.length > 0 &&
                this.schemaSvc
                    .getMap<string[]>('OPAQUE_CLASSIFIERS', this.schema)
                    .indexOf(instanceSpec.classifierIds[0]) >= 0
            if (!isOpaque && this.mmsElementId === (presentationElem as PresentTextObject).source && this.mmsElementId === instanceSpec.id) {
                this.isDeletable = true
            }
            if (!isOpaque && this.viewSvc.isSection(instanceSpec) && this.mmsElementId === instanceSpec.id) {
                this.isDeletable = true
            }
        }
    }

    protected deleteAction = (): void => {
        if (this.elementSaving) {
            this.growl.info('Please Wait...')
            return
        }

        this.bbApi.toggleButtonSpinner('editor-delete')

        this.editorSvc
            .deleteConfirmModal(this.edit)
            .result.then(() => {
            const section = this.mmsViewPresentationElemCtrl.getParentSection()
            const instanceVal = this.mmsViewPresentationElemCtrl.getInstanceVal()
            const instanceSpec = this.mmsViewPresentationElemCtrl.getInstanceSpec()
            const viewOrSec = section ? section : this.view
            const reqOb = {
                elementId: viewOrSec.id,
                projectId: viewOrSec._projectId,
                refId: viewOrSec._refId,
                commitId: 'latest',
            }
            this.viewSvc.removeElementFromViewOrSection(reqOb, instanceVal).then(
                (data) => {
                    if (
                        this.viewSvc.isSection(instanceSpec) ||
                        this.viewSvc.isTable(instanceSpec) ||
                        this.viewSvc.isFigure(instanceSpec) ||
                        this.viewSvc.isEquation(instanceSpec)
                    ) {
                        // Broadcast message to TreeCtrl:
                        this.eventSvc.$broadcast('viewctrl.delete.element', instanceSpec)
                    }

                    this.eventSvc.$broadcast('content-reorder.refresh')

                    // Broadcast message for the ToolCtrl:
                    this.eventSvc.$broadcast('editor.cancel', this.edit)

                    this.growl.success('Remove Successful')
                },
                (reason) => this.editorSvc.handleError(reason)
            )})
            .finally(() => {
                this.bbApi.toggleButtonSpinner('editor-delete')
            })
    }
}
