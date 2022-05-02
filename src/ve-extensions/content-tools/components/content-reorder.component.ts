import * as angular from "angular";
import * as _ from "lodash";
import {SpecService} from "../services/Spec.service";
import {ElementReferences, ContentReorderService} from "../services/ContentReorder.service";
import {ElementService} from "../../../ve-utils/services/Element.service";
import {ViewService} from "../../../ve-utils/services/View.service";
import {PermissionsService} from "../../../ve-utils/services/Permissions.service";
import {handleChange} from "../../../ve-utils/utils/change.util";
import {VeComponentOptions} from "../../../ve-utils/types/view-editor";
import {ElementObject} from "../../../ve-utils/types/mms";
import {veCore} from "../../../ve-core/ve-core.module";
import {ContentToolControllerImpl} from "../content-tool.controller";
import {ContentToolController} from "../content-tool";
import {TransclusionService} from "../../transclusions/Transclusion.service";
import {URLService} from "../../../ve-utils/services/URL.provider";
import {AuthService} from "../../../ve-utils/services/Authorization.service";
import {UtilsService} from "../../../ve-utils/services/Utils.service";
import {EventService} from "../../../ve-utils/services/Event.service";
import {ToolbarService} from "../services/Toolbar.service";

//veCore.directive('mmsContentReorder', ['ElementService', 'ViewService', 'PermissionsService', '$templateCache', 'growl', '$q', mmsContentReorder]);

/**
 * @ngdoc directive
 * @name veCore.directive:mmsContentReorder
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
class ContentReorderController extends ContentToolControllerImpl implements ContentToolController {

        private treeOptions: object;

        private elementReferenceTree: ElementReferences[];
        private originalElementReferenceTree: ElementReferences[];
        private view: ElementObject;

    static $inject = [...ContentToolControllerImpl.$inject, 'ContentReorderService'];

    constructor($scope: angular.IScope, $element: JQuery<HTMLElement>,
                growl: angular.growl.IGrowlService, transclusionSvc: TransclusionService, uRLSvc: URLService,
                authSvc: AuthService, elementSvc: ElementService, utilsSvc: UtilsService,
                viewSvc: ViewService, permissionsSvc: PermissionsService,
                eventSvc: EventService, specSvc: SpecService, toolbarSvc: ToolbarService, private contentReorderSvc: ContentReorderService) {
        super($scope, $element, growl, transclusionSvc, uRLSvc, authSvc, elementSvc, utilsSvc, viewSvc, permissionsSvc, eventSvc, specSvc, toolbarSvc)
        this.contentType = _.kebabCase(ContentReorderComponent.selector)
        this.contentTitle = "Reorder Content";
    }

    config = () => {
        this.view = this.contentReorderSvc.view;
        this.elementReferenceTree = this.contentReorderSvc.elementReferenceTree;
        this.originalElementReferenceTree = this.contentReorderSvc.originalElementReferenceTree;
        this.treeOptions = {
            accept: (sourceNodeScope, destNodeScope, destIndex) => {
                if (sourceNodeScope.element.isOpaque)
                    return false;
                if (destNodeScope.$element.hasClass('root'))
                    return true;
                return !!this.viewSvc.isSection(destNodeScope.element.presentationElement);

            }
        };

        this.subs.push(this.eventSvc.$on('content-reorder', () => {
            this.contentReorderSvc.setEditing(true);
        }));

        let viewSaving = false;
        this.subs.push(this.eventSvc.$on('content-reorder.refresh', () => {
            this.contentReorderSvc.refresh();
        }));
        this.subs.push(this.eventSvc.$on('content-reorder-save', () => {
            if (viewSaving) {
                this.growl.info('Please Wait...');
                return;
            }
            viewSaving = true;
            this.eventSvc.$broadcast(this.toolbarSvc.constants.TOGGLEICONSPINNER, {id: 'content-reorder-save'});
            this.contentReorderSvc.save().then((data) => {
                viewSaving = false;
                this.contentReorderSvc.refresh();
                this.growl.success('Save Successful');
                this.eventSvc.$broadcast(this.toolbarSvc.constants.TOGGLEICONSPINNER, {id: 'content-reorder-save'});
                this.eventSvc.$broadcast('content-reorder-saved', {id: this.specInfo.id});
            }, (response) => {
                this.contentReorderSvc.refresh();
                viewSaving = false;
                var reason = response.failedRequests[0];
                this.growl.error(reason.message);
                this.eventSvc.$broadcast(this.toolbarSvc.constants.TOGGLEICONSPINNER, {id: 'content-reorder-save'});
            });
            this.eventSvc.$broadcast(this.toolbarSvc.constants.SELECT, {id: 'content-reorder'});
        }));
        this.subs.push(this.eventSvc.$on('content-reorder-cancel', () => {
            this.specSvc.setEditing(false);
            this.contentReorderSvc.refresh();
            this.eventSvc.$broadcast(this.toolbarSvc.constants.SELECT, {id: 'content-viewer'});
            //this.('element');
        }));
    }

    $onChanges(onChangesObj: angular.IOnChangesObject) {
        handleChange(onChangesObj, 'mmsElementId', (newVal, oldVal) => {
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
                        this.contentReorderSvc.view = this.view = data;
                        this.contentReorderSvc.editable = commitId === 'latest' && this.permissionsSvc.hasProjectIdBranchIdEditPermission(this.mmsProjectId, this.mmsRefId);

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
        // handleChange(onChangesObj,"mmsProjectId", (newVal) => {
        //     this.s.mmsProjectId = newVal;
        // })
        // handleChange(onChangesObj,"mmsCommitId", (newVal) => {
        //     this.contentReorderApi.mmsCommitId = newVal;
        // })
        // handleChange(onChangesObj,"mmsRefId", (newVal) => {
        //     this.contentReorderApi.mmsRefId = newVal;
        // })

    }

    public getEditing() {
        return this.contentReorderSvc.editing;
    }

}

let ContentReorderComponent: VeComponentOptions = {
    selector: 'contentReorder',
    template: `
    <!-- Nested node template -->
<script type="text/ng-template" id="nodes_renderer2.html">
    <div ui-tree-handle data-nodrag="{{$ctrl.contentReorderApi.view.isOpaque ? 'true' : 'false'}}"
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
    controller: ContentReorderController
}

        veCore.component(ContentReorderComponent.selector,ContentReorderComponent);