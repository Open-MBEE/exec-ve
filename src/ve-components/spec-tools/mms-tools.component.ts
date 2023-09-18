import _ from 'lodash';

import { ComponentService, ExtensionService } from '@ve-components/services';
import { EditorService } from '@ve-core/editor';
import { EditDialogService } from '@ve-core/editor/services/EditDialog.service';
import { veCoreEvents } from '@ve-core/events';
import { IToolBarButton, ToolbarService } from '@ve-core/toolbar';
import { RootScopeService } from '@ve-utils/application';
import { EditObject, EditService, EventService } from '@ve-utils/core';
import { ElementService, ProjectService, PermissionsService } from '@ve-utils/mms-api-client';

import { veComponents } from '@ve-components';

import { SpecApi, SpecService } from './services/Spec.service';

import { VeComponentOptions, VeQService } from '@ve-types/angular';
import { ElementObject } from '@ve-types/mms';
import { VeModalService } from '@ve-types/view-editor';

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

class ToolsController {
    //Bindings
    toolsCategory: string;

    //Local
    elementId: string;
    projectId: string;
    refId: string;
    commitId: string;
    edit: EditObject;
    element: ElementObject;
    inPreviewMode: boolean;
    isEditing: boolean;
    skipBroadcast: boolean;

    subs: Rx.IDisposable[];
    currentTool: string;
    currentTitle: string;
    specApi: SpecApi;
    show: {
        [key: string]: boolean;
    } = {};

    editable: boolean;
    viewId: string;
    elementSaving: boolean;
    elementLoading: boolean;

    protected errorType: string;

    toolbarId: string;

    protected $tools: JQuery;
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
        'EditService',
        'EditorService',
        'EditDialogService',
        'ToolbarService',
        'SpecService',
        'ExtensionService',
    ];

    constructor(
        private $q: VeQService,
        private $timeout: angular.ITimeoutService,
        private $compile: angular.ICompileService,
        public $scope: angular.IScope,
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
        private autosaveSvc: EditService,
        private editorSvc: EditorService,
        private editdialogSvc: EditDialogService,
        private toolbarSvc: ToolbarService,
        private specSvc: SpecService,
        private extensionSvc: ExtensionService
    ) {}

    $onInit(): void {
        this.eventSvc.$init(this);

        this.$tools = $('#tools');

        this.specApi = this.specSvc.specApi;
        this.elementSaving = false;

        //Listen for Toolbar Clicked Subject
        this.subs.push(this.eventSvc.binding<veCoreEvents.toolbarClicked>(this.toolbarId, this.changeTool));

        this.subs.push(
            this.eventSvc.$on('editor.open', (editOb: ElementObject) => {
                this.openEdit();
            })
        );

        this.subs.push(
            this.eventSvc.$on('editor.close', (editOb: ElementObject) => {
                this.closeEdit();
            })
        );

        this.subs.push(
            this.eventSvc.$on('spec-editor.save', () => {
                this.save(false);
            })
        );
        this.subs.push(
            this.eventSvc.$on('spec-editor.save-continue', () => {
                this.save(true);
            })
        );

        this.subs.push(
            this.eventSvc.$on('element-saving', (data: boolean) => {
                this.elementSaving = data;
            })
        );

        this.subs.push(
            this.eventSvc.binding<boolean>('spec.ready', (data) => {
                this.elementLoading = !data;
            })
        );

        this.hotkeys.bindTo(this.$scope).add({
            combo: 'alt+a',
            description: 'save all',
            callback: () => {
                this.eventSvc.$broadcast('spec-editor.saveall');
            },
        });
        const savingAll = false;
        this.subs.push(
            this.eventSvc.$on('spec-editor.saveall', () => {
                this.toolbarSvc.waitForApi(this.toolbarId).then(
                    (api) => {
                        api.toggleButtonSpinner('spec-editor.saveall');
                        this.editorSvc
                            .saveAll()
                            .catch(() => {
                                // reset the last edit elementOb to one of the existing element
                                const firstEdit = Object.values(this.autosaveSvc.getAll())[0];
                                this.specSvc.tracker.etrackerSelected = firstEdit.key;
                                this.specSvc.keepMode();
                                this.specApi.elementId = firstEdit.element.id;
                                this.specApi.projectId = firstEdit.element._projectId;
                                this.specApi.refId = firstEdit.element._refId;
                                this.specApi.commitId = 'latest';
                                this.growl.error('Some elements failed to save, resolve individually in edit pane');
                            })
                            .finally(() => {
                                this.toolbarSvc.waitForApi(this.toolbarId).then(
                                    (api) => {
                                        api.toggleButtonSpinner('spec-editor.saveall');
                                        this.specSvc.toggleSave(this.toolbarId);
                                    },
                                    (reason) => {
                                        this.growl.error(ToolbarService.error(reason));
                                    }
                                );
                            });

                        this.specSvc.setEditing(false);
                    },
                    (reason) => {
                        this.growl.error(ToolbarService.error(reason));
                    }
                );
            })
        );
        this.subs.push(
            this.eventSvc.$on('spec-editor.cancel', () => {
                const go = (): void => {
                    this.editorSvc.cleanUpEdit(this.specSvc.getEdits().key);
                    if (this.autosaveSvc.openEdits() > 0) {
                        const id = Object.keys(this.autosaveSvc.getAll())[0];
                        const info = id.split('|');
                        const data: veCoreEvents.elementSelectedData = {
                            elementId: info[2],
                            projectId: info[0],
                            refId: info[1],
                            commitId: 'latest',
                        };
                        this.eventSvc.$broadcast<veCoreEvents.elementSelectedData>('element.selected', data);
                    } else {
                        this.specSvc.setEditing(false);
                        this.eventSvc.resolve<veCoreEvents.toolbarClicked>(this.toolbarId, {
                            id: 'spec-inspector',
                        });
                        this.toolbarSvc.waitForApi(this.toolbarId).then(
                            (api) => api.setIcon('spec-editor', 'fa-edit'),
                            (reason) => {
                                this.growl.error(ToolbarService.error(reason));
                            }
                        );
                        this.specSvc.toggleSave(this.toolbarId);
                    }
                };
                this.editorSvc.hasEdits(this.specSvc.getEdits()).then(
                    (hasEdits) => {
                        if (hasEdits) {
                            this.editorSvc.deleteEditModal(this.specSvc.getEdits()).result.then(
                                () => {
                                    go();
                                },
                                () => {
                                    /* Do Nothing */
                                }
                            );
                        } else go();
                    },
                    () => {
                        go();
                    }
                );
            })
        );
    }

    private changeTool = (data: veCoreEvents.toolbarClicked): void => {
        if (!this.currentTool) {
            this.currentTool = '';
        }
        if (this.currentTool !== data.id) {
            if (this.currentTool !== '') this.show[_.camelCase(this.currentTool)] = false;

            this.currentTool = data.id;

            const inspect: IToolBarButton = this.toolbarSvc.getToolbarButton(data.id);
            if (!data.title) {
                data.title = inspect.tooltip;
            }
            if (!data.category) {
                data.category = inspect.category;
            }

            this.currentTitle = data.title ? data.title : inspect.tooltip;

            if (!this.show.hasOwnProperty(_.camelCase(data.id))) {
                this.startTool(data.id);
                this.show[_.camelCase(data.id)] = true;
            } else {
                this.show[_.camelCase(data.id)] = true;
            }
        }
    };

    private startTool = (id: string): void => {
        const tag = this.extensionSvc.getTagByType('spec', id);
        const toolId: string = _.camelCase(id);
        const newTool: JQuery = $(
            '<div id="' +
                toolId +
                '" class="container-fluid" ng-if="!$ctrl.elementLoading && $ctrl.show.' +
                toolId +
                '"></div>'
        );
        if (tag === 'extensionError') {
            this.errorType = this.currentTool.replace('spec-', '');
            newTool.append(
                '<extension-error type="$ctrl.errorType" mms-element-id="$ctrl.mmsElementId" kind="Spec"></extension-error>'
            );
        } else {
            newTool.append('<' + tag + ' toolbar-id="{{$ctrl.toolbarId}}"></' + tag + '>');
        }

        this.$tools.append(newTool);

        this.$compile(newTool)(this.$scope);
    };

    // private changeElement= (newVal, oldVal) => {
    //     if (newVal === oldVal) {
    //         return;
    //     }
    //     this.specApi.elementId = this.mmsElementId;
    //     this.specApi.projectId = this.mmsProjectId;
    //     this.specApi.refId = this.mmsCommitId;
    //     this.specApi.commitId = this.mmsRefId;
    // }

    public closeEdit = (): void => {
        this.specSvc.toggleSave(this.toolbarId);
    };

    public openEdit = (): void => {
        this.specSvc.toggleSave(this.toolbarId);
    };

    public save = (continueEdit: boolean): void => {
        if (this.elementSaving) {
            this.growl.info('Please Wait...');
            return;
        }
        this.toolbarSvc.waitForApi(this.toolbarId).then(
            (api) => {
                if (!continueEdit) {
                    api.toggleButtonSpinner('spec-editor.save');
                } else {
                    api.toggleButtonSpinner('spec-editor.save-continue');
                }
                this.editorSvc
                    .save(this.specSvc.getEdits().key, continueEdit)
                    .then(
                        () => {
                            if (this.autosaveSvc.openEdits() > 0) {
                                const next = Object.keys(this.autosaveSvc.getAll())[0];
                                const info = next.split('|');
                                const data: veCoreEvents.elementSelectedData = {
                                    elementId: info[2],
                                    projectId: info[0],
                                    refId: info[1],
                                    commitId: 'latest',
                                };
                                this.eventSvc.$broadcast<veCoreEvents.elementSelectedData>('element.selected', data);
                            } else {
                                this.specSvc.setEditing(false);
                                this.specSvc.toggleSave(this.toolbarId);
                                this.eventSvc.resolve<veCoreEvents.toolbarClicked>(this.toolbarId, {
                                    id: 'spec-inspector',
                                });
                            }
                        },
                        (reason) => {
                            if (reason.type === 'info') this.growl.info(reason.message);
                            else if (reason.type === 'warning') this.growl.warning(reason.message);
                            else if (reason.type === 'error') this.growl.error(reason.message);
                        }
                    )
                    .finally(() => {
                        if (!continueEdit) {
                            api.toggleButtonSpinner('spec-editor.save');
                        } else {
                            api.toggleButtonSpinner('spec-editor.save-continue');
                        }
                    });
            },
            (reason) => {
                this.growl.error(ToolbarService.error(reason));
            }
        );
    };
}

const MmsToolsComponent: VeComponentOptions = {
    selector: 'mmsTools',
    template: `
    <div class="container-fluid">
    <h4 class="right-pane-title">{{$ctrl.currentTitle}}</h4>
    <hr class="right-title-divider">
    <div ng-if="$ctrl.elementLoading" class="tool-spinner" >
        <i class="fa fa-spin fa-spinner"></i>
    </div>
    <div ng-hide="$ctrl.elementLoading" id="tools"></div>
</div>
    `,
    bindings: {
        toolbarId: '@',
        toolsCategory: '<',
    },
    controller: ToolsController,
};

veComponents.component(MmsToolsComponent.selector, MmsToolsComponent);
