import { Presentation, ViewHtmlService, PresentationService } from '@ve-components/presentations'
import { ComponentService, ExtensionService } from '@ve-components/services'
import { ButtonBarApi, ButtonBarService } from '@ve-core/button-bar'
import { EditorService, editor_buttons } from '@ve-core/editor'
import { ImageService } from '@ve-utils/application'
import { EditObject, EventService } from '@ve-utils/core'
import { ElementService, ViewService } from '@ve-utils/mms-api-client'
import { SchemaService } from '@ve-utils/model-schema'

import { veComponents } from '@ve-components'

import { VePromise, VePromiseReason, VeQService } from '@ve-types/angular'
import { IPresentationComponentOptions } from '@ve-types/components/presentation'
import { EditingToolbar } from '@ve-types/core/editor'
import {
    ElementObject,
    ElementsResponse,
    InstanceSpecObject,
    InstanceValueObject,
    ViewInstanceSpec,
} from '@ve-types/mms'

class PresentSectionController extends Presentation implements angular.IComponentController, EditingToolbar {
    //Local
    section: ViewInstanceSpec
    public bbApi: ButtonBarApi
    public bbId: string

    edit: EditObject<InstanceSpecObject>
    editLoading: boolean
    skipBroadcast: boolean
    elementSaving: boolean
    isEditing: boolean

    defaultTemplate = `
 <div ng-if="$ctrl.section.specification">
    <div ng-show="!$ctrl.isEditing">
        <h1 class="section-title h{{$ctrl.level}}">
            <span class="ve-view-number" ng-show="$ctrl.showNumbering">{{$ctrl.number}}</span> {{$ctrl.section.name}}
        </h1>
    </div>
    <div ng-class="{'panel panel-default' : $ctrl.isEditing}">
        <div ng-show="$ctrl.isEditing" class="panel-heading clearfix no-print">
            <h3 class="panel-title pull-left">
                <div ng-class="{prop: $ctrl.isEditing}"><input class="form-control" type="text" ng-model="$ctrl.edit.name"/></div>
            </h3>
            <div class="btn-group pull-right" ng-hide="$ctrl.editLoading">
                <button-bar class="transclude-panel-toolbar" button-id="$ctrl.bbId"></button-bar>
            </div>
        </div>
        <div ng-class="{'panel-body' : $ctrl.isEditing}">
            <add-pe-menu mms-view="$ctrl.section" index="-1" class="add-pe-button-container no-print"></add-pe-menu>
            <div ng-repeat="instanceVal in $ctrl.section.specification.operand track by instanceVal.instanceId">
                <view-pe mms-instance-val="instanceVal" mms-parent-section="$ctrl.section"></view-pe>
                <add-pe-menu mms-view="$ctrl.section" index="$index" class="add-pe-button-container no-print"></add-pe-menu>
            </div>
        </div>
    </div>
</div>
`

    static $inject = [...Presentation.$inject, 'ViewService', 'ElementService', 'EditorService']
    constructor(
        $q: VeQService,
        $element: JQuery<HTMLElement>,
        $scope: angular.IScope,
        $compile: angular.ICompileService,
        growl: angular.growl.IGrowlService,
        schemaSvc: SchemaService,
        viewHtmlSvc: ViewHtmlService,
        presentationSvc: PresentationService,
        componentSvc: ComponentService,
        eventSvc: EventService,
        imageSvc: ImageService,
        buttonBarSvc: ButtonBarService,
        extensionSvc: ExtensionService,
        private viewSvc: ViewService,
        private elementSvc: ElementService,
        private editorSvc: EditorService
    ) {
        super(
            $q,
            $element,
            $scope,
            $compile,
            growl,
            schemaSvc,
            viewHtmlSvc,
            presentationSvc,
            componentSvc,
            eventSvc,
            imageSvc,
            buttonBarSvc,
            extensionSvc
        )
    }

    $onInit(): void {
        super.$onInit()
        this.section = this.instanceSpec

        this.bbId = this.buttonBarSvc.generateBarId(`${this.section.id}_section`)
        this.bbApi = this.buttonBarSvc.initApi(this.bbId, this.bbInit, editor_buttons)

        this.$element.on('click', (e) => {
            //should not do anything if section is not an instancespec
            if (this.startEdit) this.startEdit()
            if (this.view && this.mmsViewPresentationElemCtrl) this.mmsViewCtrl.transcludeClicked(this.section) //show instance spec if clicked
            e.stopPropagation()
        })

        if (this.section.specification && this.section.specification.operand) {
            const dups = this.presentationSvc.checkForDuplicateInstances(
                this.section.specification.operand as InstanceValueObject[]
            )
            if (dups.length > 0) {
                this.growl.warning('There are duplicates in this section, duplicates ignored!')
            }
        }
    }

    save = (e: JQuery.ClickEvent): void => {
        if (e) e.stopPropagation()
        this.saveAction(false)
    }

    saveC = (e: JQuery.ClickEvent): void => {
        if (e) e.stopPropagation()
        this.saveAction(true)
    }

    cancel = (e?: JQuery.ClickEvent): void => {
        if (e) e.stopPropagation()
        this.cancelAction()
    }
    delete = (): void => {
        this.deleteAction()
    }

    preview(e?: JQuery.ClickEvent): void {
        //Stuff
    }

    protected startEdit(): void {
        if (!this.isEditing) {
            this.editLoading = true
            const reqOb = {
                elementId: this.instanceSpec.id,
                projectId: this.instanceSpec._projectId,
                refId: this.instanceSpec._refId,
            }
            this.elementSvc
                .getElementForEdit(reqOb)
                .then(
                    (data) => {
                        this.isEditing = true
                        this.edit = data

                        if (!this.skipBroadcast) {
                            // Broadcast message for the toolCtrl:
                            this.eventSvc.$broadcast('editor.edit', this.edit)
                        } else {
                            this.skipBroadcast = false
                        }
                        this.editorSvc.scrollToElement(this.$element)
                    },
                    (reason: VePromiseReason<ElementsResponse<ElementObject>>) => {
                        this.growl.error(reason.message)
                    }
                )
                .finally(() => {
                    this.editLoading = false
                })

            this.elementSvc.isCacheOutdated(this.instanceSpec).then(
                (data) => {
                    if (data.status && data.server._modified > data.cache._modified) {
                        this.growl.warning('This element has been updated on the server')
                    }
                },
                (reason) => {
                    this.growl.error(reason.message)
                }
            )
        }
    }

    protected bbInit = (api: ButtonBarApi): void => {
        api.addButton(this.buttonBarSvc.getButtonBarButton('editor-save'))
        api.addButton(this.buttonBarSvc.getButtonBarButton('editor-save-continue'))
        api.addButton(this.buttonBarSvc.getButtonBarButton('editor-cancel'))
        api.addButton(this.buttonBarSvc.getButtonBarButton('editor-delete'))
        api.setPermission('editor-delete', this.isDirectChildOfPresentationElement)
    }

    protected getContent = (): VePromise<string, string> => {
        return this.$q.resolve(this.defaultTemplate)
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
                const viewOrSec = section ? section : this.view
                const reqOb = {
                    elementId: viewOrSec.id,
                    projectId: viewOrSec._projectId,
                    refId: viewOrSec._refId,
                    commitId: 'latest',
                }
                this.viewSvc.removeElementFromViewOrSection(reqOb, this.instanceVal).then(
                    (data) => {
                        if (
                            this.viewSvc.isSection(this.instanceSpec) ||
                            this.viewSvc.isTable(this.instanceSpec) ||
                            this.viewSvc.isFigure(this.instanceSpec) ||
                            this.viewSvc.isEquation(this.instanceSpec)
                        ) {
                            // Broadcast message to TreeCtrl:
                            this.eventSvc.$broadcast('viewctrl.delete.element', this.instanceSpec)
                        }

                        this.eventSvc.$broadcast('content-reorder.refresh')

                        // Broadcast message for the ToolCtrl:
                        this.eventSvc.$broadcast('editor.cancel', this.edit)

                        this.growl.success('Remove Successful')
                    },
                    (reason) => this.editorSvc.handleError(reason)
                )
            })
            .finally(() => {
                this.bbApi.toggleButtonSpinner('editor-delete')
            })
    }

    protected saveAction(continueEdit?: boolean): void {
        if (this.elementSaving) {
            this.growl.info('Please Wait...')
            return
        }
        // this.editSvc.clearAutosave(ctrl.element._projectId + ctrl.element._refId + ctrl.element.id, ctrl.edit.type)
        if (this.bbApi) {
            if (!continueEdit) {
                this.bbApi.toggleButtonSpinner('editor-save')
            } else {
                this.bbApi.toggleButtonSpinner('editor-save-continue')
            }
        }

        this.elementSaving = true

        this.editorSvc
            .save(this.edit.key, continueEdit)
            .then(
                (data) => {
                    this.elementSaving = false
                    if (!continueEdit) {
                        this.isEditing = false
                        this.eventSvc.$broadcast('editor.save', this.edit)
                    }
                    //scrollToElement(domElement);
                },
                (reason) => {
                    this.elementSaving = false
                    this.editorSvc.handleError(reason)
                }
            )
            .finally(() => {
                if (this.bbApi) {
                    if (!continueEdit) {
                        this.bbApi.toggleButtonSpinner('editor-save')
                    } else {
                        this.bbApi.toggleButtonSpinner('editor-save-continue')
                    }
                }
            })
    }

    protected cancelAction(): void {
        if (this.elementSaving) {
            this.growl.info('Please Wait...')
            return
        }
        const cancelCleanUp = (): void => {
            this.isEditing = false
            this.editorSvc.removeEdit(this.edit)
            this.eventSvc.$broadcast<EditObject>('editor.cancel', this.edit)
        }
        if (this.bbApi) {
            this.bbApi.toggleButtonSpinner('editor-cancel')
        }
        // const cancelFn: () => VePromise<boolean> = (): VePromise<boolean> => {
        //     if (ctrl.editorApi && ctrl.editorApi.cancel) {
        //         return ctrl.editorApi.cancel()
        //     }
        //     return this.$q.resolve<boolean>(true)
        // }

        this.editorSvc
            .hasEdits(this.edit)
            .then(
                (data) => {
                    if (!data) {
                        this.editorSvc.deleteEditModal(this.edit).result.then(
                            () => {
                                cancelCleanUp()
                            },
                            () => {
                                this.growl.error('Error deleting Section')
                            }
                        )
                    } else {
                        cancelCleanUp()
                    }
                },
                () => {
                    this.growl.error('Error deleting Section')
                }
            )
            .finally(() => {
                if (this.bbApi) {
                    this.bbApi.toggleButtonSpinner('editor-cancel')
                }
            })
    }
}

const PresentSectionComponent: IPresentationComponentOptions = {
    selector: 'presentSection',
    bindings: {
        peObject: '<',
        instanceSpec: '<',
        peNumber: '<',
        mmsProjectId: '@',
        mmsRefId: '@',
        mmsCommitId: '@',
    },
    template: `<div></div>`,
    controller: PresentSectionController,
    require: {
        mmsViewCtrl: '?^^view',
        mmsViewPresentationElemCtrl: '?^^viewPe',
    },
}

veComponents.component(PresentSectionComponent.selector, PresentSectionComponent)
