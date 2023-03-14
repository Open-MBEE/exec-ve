import _ from 'lodash'

import { ComponentService, ExtensionService } from '@ve-components/services'
import { veCoreEvents } from '@ve-core/events'
import { IToolBarButton, ToolbarService } from '@ve-core/toolbar'
import { RootScopeService } from '@ve-utils/application'
import { AutosaveService, EventService } from '@ve-utils/core'
import {
    ElementService,
    ProjectService,
    PermissionsService,
} from '@ve-utils/mms-api-client'

import { veComponents } from '@ve-components'

import { SpecApi, SpecService } from './services/Spec.service'

import { VeComponentOptions, VeQService } from '@ve-types/angular'
import { ElementObject } from '@ve-types/mms'
import { VeModalService } from '@ve-types/view-editor'

/**
 * @ngdoc directive
 * @name veComponents.component:mmsSpec
 *
 * @requires veUtils/Utils
 * @required veUtils/URLService
 * @requires veUtils/AuthService
 * @requires veUtils/ElementService
 * @requires veUtils/ViewService
 * @requires veUtils/PermissionsService
 * @requires $compile
 * @requires $templateCache
 * @requires growl
 * @requires _
 *
 * * Outputs a "spec window" of the element whose id is specified. Spec includes name,
 * documentation, and value if the element is a property. Also last modified time,
 * last user, element id. Editability is determined by a param and also element
 * editability. Documentation and string values can have html and can transclude other
 * element properties. Conflict can occur during save based on last server read time
 * and offers choice of force save, discard edit or simple merge. To control saving
 * or editor pass in an api object that will be populated with methods (see methods seciton):
 *
 * ## Example spec with full edit (given permission)
 * ### controller (js)
 *  <pre>
    angular.module('app', ['veComponents'])
    .controller('SpecCtrl', ['$scope', function($scope) {
        $this.api = {}; //empty object to be populated by the spec api
       public edit = () => {
            $this.api.setEditing(true);
        };
       public save = () => {
            $this.api.save()
            .then((e) => {
                //success
            }, (reason) => {
                //failed
            });
        };
    }]);
    </pre>
 * ### template (html)
 *  <pre>
    <div ng-controller="SpecCtrl">
        <button ng-click="edit()">Edit</button>
        <button ng-click="save()">Save</button>
        <spec mms-eid="element_id" mms-edit-field="all" spec-api="api"></spec>
    </div>
    </pre>
 * ## Example for showing an element spec at a certain time
 *  <pre>
    <spec mms-eid="element_id" mms-version="2014-07-01T08:57:36.915-0700"></spec>
    </pre>
 * ## Example for showing a current element with nothing editable
 *  <pre>
    <spec mms-eid="element_id" mms-edit-field="none"></spec>
    </pre>
 *
 * @param {string} mmsElementId The id of the view
 * @param {string} mmsProjectId The project id for the view
 * @param {string=master} mmsRefId Reference to use, defaults to master
 * @param {string=latest} mmsCommitId Commit ID, default is latest
 * @param {Object=} specSvc An empty object that'll be populated with api methods
 * @param {Object=} mmsElement An element object, if this is provided, a read only
 *      element spec for it would be shown, this will not use mms services to get the element
 */

class ToolsController implements angular.IComponentController {
    //Bindings
    toolsCategory: string

    //Local
    elementId: string
    projectId: string
    refId: string
    commitId: string

    subs: Rx.IDisposable[]
    currentTool: string
    currentTitle: string
    private specApi: SpecApi
    show: {
        [key: string]: boolean
    } = {}

    editable: boolean
    viewId: string
    elementSaving: boolean
    openEdits: number
    edits: { [id: string]: ElementObject }
    protected errorType: string

    toolbarId: string

    protected $tools: JQuery
    static $inject = [
        '$q',
        '$timeout',
        '$compile',
        '$scope',
        '$element',
        '$uibModal',
        'hotkeys',
        'growl',
        'ElementService',
        'ProjectService',
        'ComponentService',
        'PermissionsService',
        'RootScopeService',
        'EventService',
        'AutosaveService',
        'ToolbarService',
        'SpecService',
        'ExtensionService',
    ]

    constructor(
        private $q: VeQService,
        private $timeout: angular.ITimeoutService,
        private $compile: angular.ICompileService,
        private $scope: angular.IScope,
        private $element: JQuery,
        private $uibModal: VeModalService,
        private hotkeys: angular.hotkeys.HotkeysProvider,
        private growl: angular.growl.IGrowlService,
        private elementSvc: ElementService,
        private projectSvc: ProjectService,
        private componentSvc: ComponentService,
        private permissionsSvc: PermissionsService,
        private rootScopeSvc: RootScopeService,
        private eventSvc: EventService,
        private autosaveSvc: AutosaveService,
        private toolbarSvc: ToolbarService,
        private specSvc: SpecService,
        private extensionSvc: ExtensionService
    ) {}

    $onInit(): void {
        this.eventSvc.$init(this)

        this.$tools = $('#tools')

        this.specApi = this.specSvc.specApi
        this.elementSaving = false

        //Listen for Toolbar Clicked Subject
        this.subs.push(
            this.eventSvc.binding<veCoreEvents.toolbarClicked>(
                this.toolbarId,
                this.changeTool
            )
        )

        this.subs.push(
            this.eventSvc.$on(this.autosaveSvc.EVENT, () => {
                this.openEdits = this.autosaveSvc.openEdits()
            })
        )

        this.subs.push(
            this.eventSvc.$on(this.autosaveSvc.EVENT, () => {
                this.openEdits = this.autosaveSvc.openEdits()
            })
        )
        this.edits = this.autosaveSvc.getAll()

        this.subs.push(
            this.eventSvc.$on(
                'presentationElem.edit',
                (editOb: ElementObject) => {
                    const key = `${editOb.id}|${editOb._projectId}|${editOb._refId}`
                    this.autosaveSvc.addOrUpdate(key, editOb)
                    this.specSvc.cleanUpSaveAll(this.toolbarId)
                }
            )
        )

        this.subs.push(
            this.eventSvc.$on(
                'presentationElem.save',
                (editOb: ElementObject) => {
                    this.cleanUpEdit(editOb, true)
                }
            )
        )

        this.subs.push(
            this.eventSvc.$on(
                'presentationElem.cancel',
                (editOb: ElementObject) => {
                    this.cleanUpEdit(editOb)
                }
            )
        )

        this.subs.push(
            this.eventSvc.$on('spec-editor.save', () => {
                this.save(false)
            })
        )
        this.subs.push(
            this.eventSvc.$on('spec-editor.saveC', () => {
                this.save(true)
            })
        )

        this.subs.push(
            this.eventSvc.$on('element-saving', (data: boolean) => {
                this.elementSaving = data
            })
        )

        this.hotkeys.bindTo(this.$scope).add({
            combo: 'alt+a',
            description: 'save all',
            callback: () => {
                this.eventSvc.$broadcast('spec-editor.saveall')
            },
        })
        let savingAll = false
        this.subs.push(
            this.eventSvc.$on('spec-editor.saveall', () => {
                if (savingAll) {
                    this.growl.info('Please wait...')
                    return
                }
                if (this.autosaveSvc.openEdits() === 0) {
                    this.growl.info('Nothing to save')
                    return
                }

                Object.values(this.autosaveSvc.getAll()).forEach(
                    (ve_edit: ElementObject) => {
                        this.componentSvc.clearAutosave(
                            ve_edit._projectId + ve_edit._refId + ve_edit.id,
                            ve_edit.type
                        )
                    }
                )

                this.specSvc.editorSave().then(
                    () => {
                        savingAll = true
                        this.toolbarSvc.waitForApi(this.toolbarId).then(
                            (api) => {
                                api.toggleButtonSpinner('spec-editor.saveall')
                            },
                            (reason) => {
                                this.growl.error(ToolbarService.error(reason))
                            }
                        )
                        this.elementSvc
                            .updateElements(
                                Object.values(this.autosaveSvc.getAll())
                            )
                            .then(
                                (responses) => {
                                    responses.forEach((elementOb) => {
                                        this.autosaveSvc.remove(
                                            elementOb.id +
                                                '|' +
                                                elementOb._projectId +
                                                '|' +
                                                elementOb._refId
                                        )
                                        const data = {
                                            element: elementOb,
                                            continueEdit: false,
                                        }
                                        this.eventSvc.$broadcast(
                                            'element.updated',
                                            data
                                        )
                                        this.eventSvc.resolve('right-toolbar', {
                                            id: 'spec-inspector',
                                        })
                                        this.specSvc.setEditing(false)
                                    })
                                    this.growl.success('Save All Successful')
                                },
                                (responses) => {
                                    // reset the last edit elementOb to one of the existing element
                                    const elementToSelect = Object.values(
                                        this.autosaveSvc.getAll()
                                    )[0]
                                    this.specSvc.tracker.etrackerSelected =
                                        elementToSelect.id +
                                        '|' +
                                        elementToSelect._projectId +
                                        '|' +
                                        elementToSelect._refId
                                    this.specSvc.keepMode()
                                    this.specApi.elementId = elementToSelect.id
                                    this.specApi.projectId =
                                        elementToSelect._projectId
                                    this.specApi.refId = elementToSelect._refId
                                    this.specApi.commitId = 'latest'
                                    this.growl.error(
                                        'Some elements failed to save, resolve individually in edit pane'
                                    )
                                }
                            )
                            .finally(() => {
                                this.toolbarSvc.waitForApi(this.toolbarId).then(
                                    (api) => {
                                        api.toggleButtonSpinner(
                                            'spec-editor.saveall'
                                        )
                                    },
                                    (reason) => {
                                        this.growl.error(
                                            ToolbarService.error(reason)
                                        )
                                    }
                                )
                                savingAll = false
                                this.specSvc.cleanUpSaveAll(this.toolbarId)
                                if (this.autosaveSvc.openEdits() === 0) {
                                    this.toolbarSvc
                                        .waitForApi(this.toolbarId)
                                        .then(
                                            (api) => {
                                                api.setIcon(
                                                    'spec-editor',
                                                    'fa-edit'
                                                )
                                                api.setPermission(
                                                    'spec-editor.saveall',
                                                    false
                                                )
                                            },
                                            (reason) => {
                                                this.growl.error(
                                                    ToolbarService.error(reason)
                                                )
                                            }
                                        )
                                }
                            })
                    },
                    (reason) => {
                        this.growl.error(reason.message)
                    }
                )
            })
        )
        this.subs.push(
            this.eventSvc.$on('spec-editor.cancel', () => {
                const go = (): void => {
                    const rmEdit = this.specSvc.getEdits()
                    this.autosaveSvc.remove(
                        rmEdit.id +
                            '|' +
                            rmEdit._projectId +
                            '|' +
                            rmEdit._refId
                    )
                    this.specSvc.revertEdits()
                    if (this.autosaveSvc.openEdits() > 0) {
                        const next = Object.keys(this.autosaveSvc.getAll())[0]
                        const id = next.split('|')
                        this.specSvc.tracker.etrackerSelected = next
                        this.specSvc.keepMode()
                        this.specApi.elementId = id[0]
                        this.specApi.projectId = id[1]
                        this.specApi.refId = id[2]
                        this.specApi.commitId = 'latest'
                    } else {
                        this.specSvc.setEditing(false)
                        this.eventSvc.$broadcast('spec-inspector', {
                            id: 'spec-inspector',
                        })
                        this.toolbarSvc.waitForApi(this.toolbarId).then(
                            (api) => api.setIcon('spec-editor', 'fa-edit'),
                            (reason) => {
                                this.growl.error(ToolbarService.error(reason))
                            }
                        )
                        this.specSvc.cleanUpSaveAll(this.toolbarId)
                    }
                }
                if (this.specSvc.hasEdits()) {
                    const ve_edit: ElementObject = this.specSvc.getEdits()
                    const deleteOb = {
                        type: ve_edit.type,
                        element: ve_edit,
                    }

                    this.componentSvc.deleteEditModal(deleteOb).result.then(
                        () => {
                            go()
                        },
                        () => {
                            /* Do Nothing */
                        }
                    )
                } else go()
            })
        )
    }

    private changeTool = (data: veCoreEvents.toolbarClicked): void => {
        if (!this.currentTool) {
            this.currentTool = ''
        }
        if (this.currentTool !== data.id) {
            if (this.currentTool !== '')
                this.show[_.camelCase(this.currentTool)] = false

            this.currentTool = data.id

            const inspect: IToolBarButton = this.toolbarSvc.getToolbarButton(
                data.id
            )
            if (!data.title) {
                data.title = inspect.tooltip
            }
            if (!data.category) {
                data.category = inspect.category
            }

            this.currentTitle = data.title ? data.title : inspect.tooltip

            if (!this.show.hasOwnProperty(_.camelCase(data.id))) {
                this.startTool(data.id, data.category)
                this.show[_.camelCase(data.id)] = true
            } else {
                this.show[_.camelCase(data.id)] = true
            }
        }
    }

    private startTool = (id: string, category: string): void => {
        const tag = this.extensionSvc.getTagByType('spec', id)
        const toolId: string = _.camelCase(id)
        const newTool: JQuery = $(
            '<div id="' +
                toolId +
                '" class="container-fluid" ng-show="$ctrl.show.' +
                toolId +
                '"></div>'
        )
        if (tag === 'extensionError') {
            this.errorType = this.currentTool.replace('spec-', '')
            newTool.append(
                '<extension-error type="$ctrl.errorType" mms-element-id="$ctrl.mmsElementId" kind="Spec"></extension-error>'
            )
        } else {
            newTool.append(
                '<' + tag + ' toolbar-id="{{$ctrl.toolbarId}}"></' + tag + '>'
            )
        }

        this.$tools.append(newTool)

        this.$compile(newTool)(this.$scope)
    }

    // private changeElement= (newVal, oldVal) => {
    //     if (newVal === oldVal) {
    //         return;
    //     }
    //     this.specApi.elementId = this.mmsElementId;
    //     this.specApi.projectId = this.mmsProjectId;
    //     this.specApi.refId = this.mmsCommitId;
    //     this.specApi.commitId = this.mmsRefId;
    // }

    public cleanUpEdit = (editOb: ElementObject, cleanAll?: boolean): void => {
        if (!this.componentSvc.hasEdits(editOb) || cleanAll) {
            const key =
                editOb.id + '|' + editOb._projectId + '|' + editOb._refId
            this.autosaveSvc.remove(key)
            this.specSvc.cleanUpSaveAll(this.toolbarId)
        }
    }

    public save = (continueEdit: boolean): void => {
        if (this.elementSaving) {
            this.growl.info('Please Wait...')
            return
        }
        this.toolbarSvc.waitForApi(this.toolbarId).then(
            (api) => {
                if (!continueEdit) {
                    api.toggleButtonSpinner('spec-editor.save')
                } else {
                    api.toggleButtonSpinner('spec-editor.saveC')
                }
                this.specSvc
                    .save(this.toolbarId, continueEdit)
                    .then(
                        () => {
                            this.eventSvc.resolve<veCoreEvents.toolbarClicked>(
                                this.toolbarId,
                                {
                                    id: 'spec-inspector',
                                }
                            )
                        },
                        (reason) => {
                            if (reason.type === 'info')
                                this.growl.info(reason.message)
                            else if (reason.type === 'warning')
                                this.growl.warning(reason.message)
                            else if (reason.type === 'error')
                                this.growl.error(reason.message)
                        }
                    )
                    .finally(() => {
                        if (!continueEdit) {
                            api.toggleButtonSpinner('spec-editor.save')
                        } else {
                            api.toggleButtonSpinner('spec-editor.saveC')
                        }
                    })
            },
            (reason) => {
                this.growl.error(ToolbarService.error(reason))
            }
        )
    }

    public etrackerChange = (): void => {
        this.specSvc.keepMode()
        const id = this.specSvc.tracker.etrackerSelected
        if (!id) return
        const info = id.split('|')
        this.specApi.elementId = info[0]
        this.specApi.projectId = info[1]
        this.specApi.refId = info[2]
        this.specApi.commitId = 'latest'
        this.toolbarSvc.waitForApi(this.toolbarId).then(
            (api) => {
                api.setPermission('spec-editor', true)
            },
            (reason) => {
                this.growl.error(ToolbarService.error(reason))
            }
        )
    }
}

const ViewToolsComponent: VeComponentOptions = {
    selector: 'viewTools',
    template: `
    <div class="container-fluid">
    <h4 class="right-pane-title">{{$ctrl.currentTitle}}</h4>
    <div ng-if="$ctrl.specSvc.getEditing()" class="container-fluid" ng-if="$ctrl.toolsCategory">        
        <form class="form-horizontal">
            <div class="form-group">
                <label class="col-sm-3 control-label">Edits ({{$ctrl.openEdits}}):</label>
                <div class="col-sm-9">
                    <select class="form-control"
                        ng-options="eid as edit.type + ': ' + edit.name for (eid, edit) in $ctrl.edits"
                        ng-model="$ctrl.specSvc.tracker.etrackerSelected" ng-change="$ctrl.etrackerChange()">
                    </select>
                </div>
            </div>
        </form>
    </div>
    <hr class="right-title-divider">
    <div id="tools"></div>
</div>
    `,
    bindings: {
        toolbarId: '@',
        toolsCategory: '<',
    },
    controller: ToolsController,
}

veComponents.component(ViewToolsComponent.selector, ViewToolsComponent)
