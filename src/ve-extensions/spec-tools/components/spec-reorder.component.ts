import * as angular from "angular";
import * as _ from "lodash";
import {SpecService} from "@ve-ext/spec-tools";
import {ReorderService, ElementReferences} from "../services/Reorder.service";import {
    AuthService,
    PermissionsService,
    URLService,
    ElementService,
    ViewService
} from "@ve-utils/mms-api-client"
import {
    EventService,
    UtilsService
} from "@ve-utils/core-services";
import {VeComponentOptions} from "@ve-types/view-editor";
import {ElementObject} from "@ve-types/mms";
import {SpecTool, ISpecTool} from "@ve-ext/spec-tools";
import {veExt, ExtUtilService} from "@ve-ext";
import {ToolbarService} from "@ve-ext/spec-tools";

//veExt.directive('mmsSpecReorder', ['ElementService', 'ViewService', 'PermissionsService', '$templateCache', 'growl', '$q', mmsSpecReorder]);

/**
 * @ngdoc directive
 * @name veExt.directive:mmsSpecReorder
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
class SpecReorderController extends SpecTool implements ISpecTool {

        private treeOptions: object;

        private elementReferenceTree: ElementReferences[];
        private originalElementReferenceTree: ElementReferences[];
        public view: ElementObject;

    static $inject = [...SpecTool.$inject, 'ReorderService'];

    constructor($scope: angular.IScope, $element: JQuery<HTMLElement>,
                growl: angular.growl.IGrowlService, extUtilSvc: ExtUtilService, uRLSvc: URLService,
                authSvc: AuthService, elementSvc: ElementService, utilsSvc: UtilsService,
                viewSvc: ViewService, permissionsSvc: PermissionsService,
                eventSvc: EventService, specSvc: SpecService, toolbarSvc: ToolbarService, private specReorderSvc: ReorderService) {
        super($scope, $element, growl, extUtilSvc, uRLSvc, authSvc, elementSvc, utilsSvc, viewSvc, permissionsSvc, eventSvc, specSvc, toolbarSvc)
        this.specType = _.kebabCase(SpecReorderComponent.selector)
        this.specTitle = "Reorder Spec";
    }

    config = () => {
        this.view = this.specReorderSvc.view;
        this.elementReferenceTree = this.specReorderSvc.elementReferenceTree;
        this.originalElementReferenceTree = this.specReorderSvc.originalElementReferenceTree;
        this.treeOptions = {
            accept: (sourceNodeScope, destNodeScope, destIndex) => {
                if (sourceNodeScope.element.isOpaque)
                    return false;
                if (destNodeScope.$element.hasClass('root'))
                    return true;
                return !!this.viewSvc.isSection(destNodeScope.element.presentationElement);

            }
        };

        this.subs.push(this.eventSvc.$on('spec-reorder', () => {
            this.specReorderSvc.setEditing(true);
        }));

        let viewSaving = false;
        this.subs.push(this.eventSvc.$on('spec-reorder.refresh', () => {
            this.specReorderSvc.refresh();
        }));
        this.subs.push(this.eventSvc.$on('spec-reorder-save', () => {
            if (viewSaving) {
                this.growl.info('Please Wait...');
                return;
            }
            viewSaving = true;
            this.eventSvc.$broadcast(this.toolbarSvc.constants.TOGGLEICONSPINNER, {id: 'spec-reorder-save'});
            this.specReorderSvc.save().then((data) => {
                viewSaving = false;
                this.specReorderSvc.refresh();
                this.growl.success('Save Successful');
                this.eventSvc.$broadcast(this.toolbarSvc.constants.TOGGLEICONSPINNER, {id: 'spec-reorder-save'});
                this.eventSvc.$broadcast('spec-reorder-saved', {id: this.specApi.elementId});
            }, (response) => {
                this.specReorderSvc.refresh();
                viewSaving = false;
                var reason = response.failedRequests[0];
                this.growl.error(reason.message);
                this.eventSvc.$broadcast(this.toolbarSvc.constants.TOGGLEICONSPINNER, {id: 'spec-reorder-save'});
            });
            this.eventSvc.$broadcast(this.toolbarSvc.constants.SELECT, {id: 'spec-reorder'});
        }));
        this.subs.push(this.eventSvc.$on('spec-reorder-cancel', () => {
            this.specSvc.setEditing(false);
            this.specReorderSvc.refresh();
            this.eventSvc.$broadcast(this.toolbarSvc.constants.SELECT, {id: 'spec-inspector'});
            //this.('element');
        }));
    }

    // $onChanges(onChangesObj: angular.IOnChangesObject) {
    //     handleChange(onChangesObj, 'mmsElementId', (newVal, oldVal) => {
    //         if (!(!newVal || newVal == oldVal && this.ran)) {
    //             this.ran = true;
    //             this.lastid = newVal;
    //             var commitId = this.mmsCommitId;
    //             commitId = commitId ? commitId : 'latest';
    //             var reqOb = {elementId: this.mmsElementId, projectId: this.mmsProjectId, refId: this.mmsRefId, commitId: commitId};
    //             this.elementReferenceTree.length = 0;
    //             this.originalElementReferenceTree.length = 0;
    //             this.elementSvc.getElement(reqOb)
    //                 .then((data) => {
    //                     if (newVal !== this.lastid)
    //                         return;
    //                     this.specReorderSvc.view = this.view = data;
    //                     this.specReorderSvc.editable = commitId === 'latest' && this.permissionsSvc.hasProjectIdBranchIdEditPermission(this.mmsProjectId, this.mmsRefId);
    //
    //                     var specs = data._specs || data.specification;
    //                     if (specs) {
    //                         this.viewSvc.getElementReferenceTree(reqOb, specs)
    //                             .then((elementReferenceTree) => {
    //                                 if (newVal !== this.lastid)
    //                                     return;
    //                                 this.elementReferenceTree.push(...elementReferenceTree);
    //                                 this.originalElementReferenceTree.push(..._.cloneDeepWith(elementReferenceTree, (value, key) => {
    //                                     if (key === 'instanceId' || key === 'instanceSpecification' || key === 'presentationElement' || key === 'instanceVal')
    //                                         return value;
    //                                     return undefined;
    //                                 }));
    //                             },(reason) => {
    //                                 if (newVal !== this.lastid)
    //                                     return;
    //                             });
    //                     }
    //
    //                 }, (reason) => {
    //                     if (newVal !== this.lastid)
    //                         return;
    //                     this.growl.error('View Error: ' + reason.message);
    //                 });
    //             }
    //         });
    //     // handleChange(onChangesObj,"mmsProjectId", (newVal) => {
    //     //     this.s.mmsProjectId = newVal;
    //     // })
    //     // handleChange(onChangesObj,"mmsCommitId", (newVal) => {
    //     //     this.specReorderApi.mmsCommitId = newVal;
    //     // })
    //     // handleChange(onChangesObj,"mmsRefId", (newVal) => {
    //     //     this.specReorderApi.mmsRefId = newVal;
    //     // })
    //
    // }

    public getEditing() {
        return this.specReorderSvc.editing;
    }

}

let SpecReorderComponent: VeComponentOptions = {
    selector: 'specReorder',
    template: `
    <!-- Nested node template -->
<script type="text/ng-template" id="nodes_renderer2.html">
    <div ui-tree-handle data-nodrag="{{$ctrl.specReorderApi.view.isOpaque ? 'true' : 'false'}}"
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
    <h4 class="right-pane-title">Reorder specs</h4>
    <hr class="spec-title-divider">
    <div ng-show="!$ctrl.elementReferenceTree || $ctrl.elementReferenceTree.length == 0">View specs loading or unavailable
    </div>
    <div ng-show="elementReferenceTree && elementReferenceTree.length > 0"><b>Bold</b> view specs are reorderable</div>
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
    controller: SpecReorderController
}

        veExt.component(SpecReorderComponent.selector,SpecReorderComponent);