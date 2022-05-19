import * as angular from "angular";
import _ from "lodash";
import Rx from 'rx-lite';


import {veExt, ExtUtilService} from "@ve-ext";
import {
    AuthService,
    EditService,
    ElementService,
    EventService,
    ProjectService,
    RootScopeService
} from "@ve-utils/services";
import {ViewService} from "@ve-utils/services";
import {PermissionsService} from "@ve-utils/services";
import {VeComponentOptions} from "@ve-types/view-editor";
import {ExtensionService} from "@ve-ext";
import {SpecApi, SpecService} from "./services/Spec.service";
import {ISpecToolButton, ToolbarService} from "./services/Toolbar.service";
import {ElementObject} from "@ve-types/mms";
import {ReorderService} from "./services/Reorder.service";

/**
 * @ngdoc directive
 * @name veExt.directive:mmsSpec
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
 * @restrict E
 *
 * @description
 * Outputs a "spec window" of the element whose id is specified. Spec includes name,
 * documentation, and value if the element is a property. Also last modified time,
 * last user, element id. Editability is determined by a param and also element
 * editability. Documentation and string values can have html and can transclude other
 * element properties. Conflict can occur during save based on last server read time
 * and offers choice of force save, discard edit or simple merge. To control saving
 * or editing pass in an api object that will be populated with methods (see methods seciton):
 *
 * ## Example spec with full edit (given permission)
 * ### controller (js)
 *  <pre>
    angular.module('app', ['veExt'])
    .controller('SpecCtrl', ['$scope', function($scope) {
        $this.api = {}; //empty object to be populated by the spec api
       public edit() {
            $this.api.setEditing(true);
        };
       public save() {
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


class ToolsPaneController implements angular.IComponentController {
    //Bindings
    toolsCategory: string;

    //Local
    elementId: string
    projectId: string
    refId: string
    commitId: string

    subs: Rx.IDisposable[]

    private tools: string[]
    currentTool: string
    defaultTool: string = 'spec-inspector';
    currentTitle: string;
    private specApi: SpecApi
    show: {
        [key: string]: boolean
    } = {}

    editable: any;
    viewId: any;
    elementSaving: boolean;
    openEdits: number;
    edits: {};
    protected errorType: string
    
    private templateElementHtml: any;

    //protected $toolEl: JQuery;

    protected $globalTool: JQuery;
    protected $documentTool: JQuery;
    static $inject = ['$compile', '$scope', '$element', '$uibModal', '$q', '$timeout', 'hotkeys', 'growl',
        'ElementService', 'ProjectService', 'ExtUtilService', 'PermissionsService', 'RootScopeService', 'EventService',
        'EditService', 'ToolbarService', 'SpecService', 'ReorderService', 'ExtensionService']



    constructor(private $compile: angular.ICompileService, private $scope, private $element: JQuery,
                private $uibModal: angular.ui.bootstrap.IModalService,
                private $q: angular.IQService, private $timeout: angular.ITimeoutService,
                private hotkeys: angular.hotkeys.HotkeysProvider, private growl: angular.growl.IGrowlService,
                private elementSvc: ElementService, private projectSvc: ProjectService, private extUtilSvc: ExtUtilService,
                private permissionsSvc: PermissionsService, private rootScopeSvc: RootScopeService,
                private eventSvc: EventService, private editSvc: EditService, private toolbarSvc: ToolbarService,
                private specSvc: SpecService, private specReorderSvc: ReorderService, private extensionSvc: ExtensionService)
                {}

    $onInit() {
        this.eventSvc.$init(this);

        this.$documentTool = $('#document-tools');
        this.$globalTool  = $('#global-tools');


        this.specApi = this.specSvc.specApi;
        this.elementSaving = false;
        
        this.tools = this.extensionSvc.getExtensions('spec');
        this.tools.forEach((tool:string) =>{
            this.subs.push(this.eventSvc.$on(tool,this.changeTool))
        })

        this.subs.push(this.eventSvc.$on(this.editSvc.EVENT, () => {
            this.openEdits = this.editSvc.openEdits();
        }));
        this.edits = this.editSvc.getAll();

        this.subs.push(this.eventSvc.$on(this.editSvc.EVENT, () => {
            this.openEdits = this.editSvc.openEdits();
        }));
        this.edits = this.editSvc.getAll();

        this.subs.push(this.eventSvc.$on('presentationElem.edit', (editOb) => {
            var key = editOb.id + '|' + editOb._projectId + '|' + editOb._refId;
            this.editSvc.addOrUpdate(key, editOb);
            this.specSvc.cleanUpSaveAll();
        }));

        this.subs.push(this.eventSvc.$on('presentationElem.save', (editOb) => {
            this.cleanUpEdit(editOb, true);
        }));

        this.subs.push(this.eventSvc.$on('presentationElem.cancel', (editOb) => {
            this.cleanUpEdit(editOb);
        }));

        this.subs.push(this.eventSvc.$on('spec-editor-save', () => {
            this.save(false);
        }));
        this.subs.push(this.eventSvc.$on('spec-editor-saveC', () => {
            this.save(true);
        }));

        this.subs.push(this.eventSvc.$on('element-saving', (data) =>{
            this.elementSaving = data;
        }));

        this.hotkeys.bindTo(this.$scope)
            .add({
                combo: 'alt+a',
                description: 'save all',
                callback: () => {
                    this.eventSvc.$broadcast('spec-editor-saveall');
                }
            });
        var savingAll = false;
        this.subs.push(this.eventSvc.$on('spec-editor-saveall', () => {
            if (savingAll) {
                this.growl.info('Please wait...');
                return;
            }
            if (this.editSvc.openEdits() === 0) {
                this.growl.info('Nothing to save');
                return;
            }

            Object.values(this.editSvc.getAll()).forEach((ve_edit: ElementObject) => {
                this.extUtilSvc.clearAutosave(ve_edit._projectId + ve_edit._refId + ve_edit.id, ve_edit.type);
            });

            if (this.specSvc && this.specSvc.editorSave)
                this.specSvc.editorSave();
            savingAll = true;
            this.eventSvc.$broadcast(this.toolbarSvc.constants.TOGGLEICONSPINNER, {id: 'spec-editor-saveall'});
            this.elementSvc.updateElements(Object.values(this.editSvc.getAll()))
                .then((responses) => {
                    responses.forEach((elementOb) => {
                        this.editSvc.remove(elementOb.id + '|' + elementOb._projectId + '|' + elementOb._refId);
                        let data = {
                            element: elementOb,
                            continueEdit: false
                        };
                        this.eventSvc.$broadcast('element.updated', data);
                        this.eventSvc.$broadcast(this.toolbarSvc.constants.SELECT, {id: 'spec-inspector'});
                        this.specSvc.setEditing(false);
                    });
                    this.growl.success("Save All Successful");

                }, (responses) => {
                    // reset the last edit elementOb to one of the existing element
                    var elementToSelect = (<ElementObject>Object.values(this.editSvc.getAll())[0]);
                    this.specSvc.tracker.etrackerSelected = elementToSelect.id + '|' + elementToSelect._projectId + '|' + elementToSelect._refId;
                    this.specSvc.keepMode();
                    this.specApi.elementId = elementToSelect.id;
                    this.specApi.projectId = elementToSelect._projectId;
                    this.specApi.refId = elementToSelect._refId;
                    this.specApi.commitId = 'latest';
                    this.growl.error("Some elements failed to save, resolve individually in edit pane");

                }).finally(() => {
                this.eventSvc.$broadcast(this.toolbarSvc.constants.TOGGLEICONSPINNER, {id: 'spec-editor-saveall'});
                savingAll = false;
                this.specSvc.cleanUpSaveAll();
                if (this.editSvc.openEdits() === 0) {
                    this.eventSvc.$broadcast(this.toolbarSvc.constants.SETICON, {
                        id: 'spec-editor',
                        value: 'fa-edit'
                    });
                }
            });
        }));
        this.subs.push(this.eventSvc.$on('spec-editor-cancel', () => {
            let go = () => {
                var rmEdit = this.specSvc.getEdits();
                this.editSvc.remove(rmEdit.id + '|' + rmEdit._projectId + '|' + rmEdit._refId);
                this.specSvc.revertEdits();
                if (this.editSvc.openEdits() > 0) {
                    var next = Object.keys(this.editSvc.getAll())[0];
                    var id = next.split('|');
                    this.specSvc.tracker.etrackerSelected = next;
                    this.specSvc.keepMode();
                    this.specApi.elementId = id[0];
                    this.specApi.projectId = id[1];
                    this.specApi.refId = id[2];
                    this.specApi.commitId = 'latest';
                } else {
                    this.specSvc.setEditing(false);
                    this.eventSvc.$broadcast(this.toolbarSvc.constants.SELECT, {id: 'spec-inspector'});
                    this.eventSvc.$broadcast(this.toolbarSvc.constants.SETICON, {
                        id: 'spec-editor',
                        value: 'fa-edit'
                    });
                    this.specSvc.cleanUpSaveAll();
                }
            };
            if (this.specSvc.hasEdits()) {
                var ve_edit = this.specSvc.getEdits();
                let deleteOb = {
                    type: ve_edit.type,
                    element: ve_edit.element,
                }

                this.extUtilSvc.deleteEditModal(deleteOb).result.then(() => {
                    go();
                });
            } else
                go();
        }));
    }

    $postLink() {
        if (!this.currentTool) {
            this.currentTool = '';
            const inspect: ISpecToolButton = this.toolbarSvc.getToolbarButton(this.defaultTool)
            this.eventSvc.$broadcast(inspect.id, {id: inspect.id, category: inspect.category, title: inspect.tooltip});
        }
    }

    private changeTool = (data: {id: string, category: string, title?: string}) => {
        if (!this.currentTool) {
            this.currentTool = ''
        }
        if (this.currentTool !== data.id) {
            this.eventSvc.$broadcast(this.toolbarSvc.constants.SELECT, {id: data.id});
            if (this.currentTool !== "") {
                this.show[_.camelCase(this.currentTool)] = false
            }
            this.currentTool = data.id
            this.currentTitle = (data.title) ? data.title : data.id;
            if (!this.show.hasOwnProperty(_.camelCase(data.id))) {
                this.startTool(data.id, data.category)
                this.show[_.camelCase(data.id)] = true
            }else {
                this.show[_.camelCase(data.id)] = true;
            }
        }
    }

    private startTool = (id: string, category: string) => {
            const tag = this.extensionSvc.getTagByType("spec", id)
            const toolId: string = _.camelCase(id);
            let newTool: JQuery = $('<div id="' + toolId + '" class="container-fluid" ng-show="$ctrl.show.' + toolId + '"></div>')
            if (tag === 'extensionError') {
                this.errorType = this.currentTool.replace("spec-", "")
                newTool.append('<extension-error type="$ctrl.errorType" mms-element-id="$ctrl.mmsElementId" kind="Spec"></extension-error>');
            }else {
                newTool.append('<' + tag + ' ></' + tag + '>');
            }

            if (category === 'document') {
                this.$documentTool.append(newTool);
            }else {
                this.$globalTool.append(newTool);
            }

            this.$compile(newTool)(this.$scope);
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

    public cleanUpEdit(editOb, cleanAll?) {
        if (!this.extUtilSvc.hasEdits(editOb) || cleanAll) {
            var key = editOb.id + '|' + editOb._projectId + '|' + editOb._refId;
            this.editSvc.remove(key);
            this.specSvc.cleanUpSaveAll();
        }
    };

    public save(continueEdit) {
        if (this.elementSaving) {
            this.growl.info('Please Wait...');
            return;
        }
        this.specSvc.save(continueEdit);

    }

    public showPane(pane) {
        for (const [key, value] of Object.entries(this.show)) {
            this.show[key] = key === _.camelCase(pane);
        }
    };

    public etrackerChange() {
        this.specSvc.keepMode();
        var id = this.specSvc.tracker.etrackerSelected;
        if (!id)
            return;
        var info = id.split('|');
        this.specApi.elementId = info[0];
        this.specApi.projectId = info[1];
        this.specApi.refId = info[2];
        this.specApi.commitId = 'latest';
        this.eventSvc.$broadcast(this.toolbarSvc.constants.SETPERMISSION, {id: 'spec-editor', value: true});
    };

}

    let ToolsPaneComponent: VeComponentOptions = {
    selector: 'toolsPane',
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
    <hr class="spec-title-divider">
    <div id="document-tools" ng-show="$ctrl.toolsCategory === 'document'"></div>
    <div id="global-tools"></div>
</div>
    `,
    bindings: {
        toolsCategory: "@"
    },
    controller: ToolsPaneController
}

veExt.component(ToolsPaneComponent.selector,ToolsPaneComponent);
