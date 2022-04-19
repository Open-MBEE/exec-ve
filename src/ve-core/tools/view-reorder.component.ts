import * as angular from "angular";
import * as _ from "lodash";
import {SpecService} from "./Spec.service";
import {ElementReferences, ViewReorderApi, ViewReorderService} from "./ViewReorder.service";
import {ElementService} from "../../ve-utils/services/Element.service";
import {ViewService} from "../../ve-utils/services/View.service";
import {PermissionsService} from "../../ve-utils/services/Permissions.service";
import {handleChange} from "../../ve-utils/utils/change.util";
import {VeComponentOptions} from "../../ve-utils/types/view-editor";
import {ElementObject} from "../../ve-utils/types/mms";
import {veCore} from "../ve-core.module";

//veCore.directive('mmsViewReorder', ['ElementService', 'ViewService', 'PermissionsService', '$templateCache', 'growl', '$q', mmsViewReorder]);

/**
 * @ngdoc directive
 * @name veCore.directive:mmsViewReorder
 *
 * @requires veUtils/ViewService
 * @requires $templateCache
 *
 * @restrict E
 *
 * @description
 * Visualize and edit the structure of a view 
 *
 * @param {string} mmsElementId The id of the view
 * @param {string} mmsProjectId The project id for the view
 * @param {string=master} mmsRefId Reference to use, defaults to master
 * @param {string=latest} mmsCommitId Commit ID, default is latest
 */
let ViewReorderComponent: VeComponentOptions = {
    selector: 'viewReorder',
    template: `
    <!-- Nested node template -->
<script type="text/ng-template" id="nodes_renderer2.html">
    <div ui-tree-handle data-nodrag="{{$ctrl.viewReorderApi.view.isOpaque ? 'true' : 'false'}}"
         ng-class="{ 'grab' : !element.isOpaque, 'no-grab': element.isOpaque }"
         title="{{element.isOpaque ? 'Docgen element is not reorderable' : ''}}">
        
         {{element.presentationElement.type === 'InstanceSpecification' ? 'Section' : element.presentationElement.type}} : {{element.instanceSpecification.name}}
    </div>
    <ol ui-tree-nodes ng-model="element.sectionElements">
        <li ng-repeat="element in element.sectionElements" ui-tree-node ng-include="'nodes_renderer2.html'">
        </li>
    </ol>
</script>
<div class="container-tree-reorder">
    <h4 class="right-pane-title">Reorder contents</h4>
    <hr class="spec-title-divider">
    <div ng-show="!$ctrl.elementReferenceTree || $ctrl.elementReferenceTree.length == 0">View contents loading or unavailable
    </div>
    <div ng-show="elementReferenceTree && elementReferenceTree.length > 0"><b>Bold</b> view contents are reorderable</div>
    <div class="well" ui-tree="treeOptions">
        <ol ui-tree-nodes class="root" ng-model="elementReferenceTree">
            <li ng-repeat="element in elementReferenceTree" ui-tree-node ng-include="'nodes_renderer2.html'"></li>
        </ol>
    </div>
</div>

`,
    bindings: {
        mmsElementId: '@',
        mmsProjectId: '@',
        mmsRefId: '@',
        mmsCommitId: '@',
    },
    controller: class ViewReorderController implements angular.IComponentController {

        //Bindings
        private mmsElementId;
        mmsProjectId
        mmsRefId
        mmsCommitId

        private viewReorderApi: ViewReorderApi;
        private treeOptions: object;
        private ran = false;
        private lastid = null;
        private elementReferenceTree: ElementReferences[];
        private originalElementReferenceTree: ElementReferences[];
        private view: ElementObject;

        static $inject = ['growl', '$q', 'ViewReorderService', 'SpecService', 'ElementService', 'ViewService',
            'PermissionsService'];

        constructor(private growl: angular.growl.IGrowlService, private $q: angular.IQService, private viewReorderSvc: ViewReorderService, private specSvc: SpecService,
                    private elementSvc: ElementService, private viewSvc: ViewService,
                    private permissionsSvc: PermissionsService) {}



        $onInit() {
            if (!this.viewReorderApi) {
                this._connectToReorderApi();
            }
            this.treeOptions = {
                accept: (sourceNodeScope, destNodeScope, destIndex) => {
                    if (sourceNodeScope.element.isOpaque)
                        return false;
                    if (destNodeScope.$element.hasClass('root'))
                        return true;
                    return !!this.viewSvc.isSection(destNodeScope.element.presentationElement);

                }
            };
        }

        $onChanges(onChangesObj: angular.IOnChangesObject) {
            handleChange(onChangesObj, 'mmsElementId', (newVal, oldVal) => {
                if (!this.viewReorderApi) {
                    this._connectToReorderApi();
                }
                this.viewReorderApi.mmsElementId = this.mmsElementId;
                if (!(!newVal || newVal == oldVal && this.ran)) {
                    this.ran = true;
                    this.lastid = newVal;
                    var commitId = this.mmsCommitId;
                    commitId = commitId ? commitId : 'latest';
                    var reqOb = {elementId: this.mmsElementId, projectId: this.mmsProjectId, refId: this.mmsRefId, commitId: commitId};
                    this.elementReferenceTree.length = 0;
                    this.originalElementReferenceTree.length = 0;
                    this.elementSvc.getElement(reqOb)
                        .then((data) => {
                            if (newVal !== this.lastid)
                                return;
                            this.viewReorderApi.view = this.view = data;
                            this.viewReorderApi.editable = commitId === 'latest' && this.permissionsSvc.hasProjectIdBranchIdEditPermission(this.mmsProjectId, this.mmsRefId);

                            var contents = data._contents || data.specification;
                            if (contents) {
                                this.viewSvc.getElementReferenceTree(reqOb, contents)
                                    .then((elementReferenceTree) => {
                                        if (newVal !== this.lastid)
                                            return;
                                        this.elementReferenceTree.push(...elementReferenceTree);
                                        this.originalElementReferenceTree.push(..._.cloneDeepWith(elementReferenceTree, (value, key) => {
                                            if (key === 'instanceId' || key === 'instanceSpecification' || key === 'presentationElement' || key === 'instanceVal')
                                                return value;
                                            return undefined;
                                        }));
                                    },(reason) => {
                                        if (newVal !== this.lastid)
                                            return;
                                    });
                            }

                        }, (reason) => {
                            if (newVal !== this.lastid)
                                return;
                            this.growl.error('View Error: ' + reason.message);
                        });
                    }
                });
            handleChange(onChangesObj,"mmsProjectId", (newVal) => {
                this.viewReorderApi.mmsProjectId = newVal;
            })
            handleChange(onChangesObj,"mmsCommitId", (newVal) => {
                this.viewReorderApi.mmsCommitId = newVal;
            })
            handleChange(onChangesObj,"mmsRefId", (newVal) => {
                this.viewReorderApi.mmsRefId = newVal;
            })

        }

        private _connectToReorderApi = () => {
            this.viewReorderApi = this.viewReorderSvc.getApi();
            this.view = this.viewReorderApi.view;
            this.elementReferenceTree = this.viewReorderApi.elementReferenceTree;
            this.originalElementReferenceTree = this.viewReorderApi.originalElementReferenceTree;
        }
        public getEditing() {
            return this.viewReorderApi.editing;
        }

    }
}

veCore.component(ViewReorderComponent.selector,ViewReorderComponent);