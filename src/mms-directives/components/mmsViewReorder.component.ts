import * as angular from "angular";
import * as _ from "lodash";
import {SpecService} from "../services/Spec.service";
import {ViewReorderApi, ViewReorderService} from "../services/ViewReorder.service";
import {ElementService} from "../../mms/services/ElementService.service";
import {ViewService} from "../../mms/services/ViewService.service";
import {PermissionsService} from "../../mms/services/PermissionsService.service";
import {handleChange} from "../../lib/changeUtils";
var mmsDirectives = angular.module('mmsDirectives');

//mmsDirectives.directive('mmsViewReorder', ['ElementService', 'ViewService', 'PermissionsService', '$templateCache', 'growl', '$q', mmsViewReorder]);

/**
 * @ngdoc directive
 * @name mmsDirectives.directive:mmsViewReorder
 *
 * @requires mms.ViewService
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
let ViewReorderComponent: angular.ve.ComponentOptions = {
    selector: 'viewReorder',
    template: `
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

        constructor(private growl: angular.growl.IGrowlService, private $q: angular.IQService, private viewReorderSvc: ViewReorderService, private specSvc: SpecService,
                    private elementSvc: ElementService, private viewSvc: ViewService,
                    private permissionsSvc: PermissionsService) {}



        $onInit() {
            this.viewReorderApi = this.viewReorderSvc.getApi();
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
                this.viewReorderApi.mmsElementId = newVal;
                if (!(!newVal || newVal == oldVal && this.ran)) {
                    this.ran = true;
                    this.lastid = newVal;
                    var commitId = this.mmsCommitId;
                    commitId = commitId ? commitId : 'latest';
                    var reqOb = {elementId: this.mmsElementId, projectId: this.mmsProjectId, refId: this.mmsRefId, commitId: commitId};
                    this.elementSvc.getElement(reqOb)
                        .then((data) => {
                            if (newVal !== this.lastid)
                                return;
                            this.viewReorderApi.view = data;
                            this.viewReorderApi.editable = commitId === 'latest' && this.permissionsSvc.hasProjectIdBranchIdEditPermission(this.mmsProjectId, this.mmsRefId);

                            var contents = data._contents || data.specification;
                            if (contents) {
                                this.viewSvc.getElementReferenceTree(reqOb, contents)
                                    .then((elementReferenceTree) => {
                                        if (newVal !== this.lastid)
                                            return;
                                        this.viewReorderApi.elementReferenceTree = elementReferenceTree;
                                        this.viewReorderApi.originalElementReferenceTree = _.cloneDeep(elementReferenceTree,(value, key) => {
                                            if (key === 'instanceId' || key === 'instanceSpecification' || key === 'presentationElement' || key === 'instanceVal')
                                                return value;
                                            return undefined;
                                        });
                                    },(reason) => {
                                        if (newVal !== this.lastid)
                                            return;
                                        this.viewReorderApi.elementReferenceTree = [];
                                        this.viewReorderApi.originalElementReferenceTree = [];
                                    });
                            } else {
                                this.viewReorderApi.elementReferenceTree = [];
                                this.viewReorderApi.originalElementReferenceTree = [];
                            }

                        }, (reason) => {
                            if (newVal !== this.lastid)
                                return;
                            this.growl.error('View Error: ' + reason.message);
                            this.viewReorderApi.elementReferenceTree = [];
                            this.viewReorderApi.originalElementReferenceTree = [];
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

        public getEditing() {
            return this.viewReorderApi.editing;
        }

    }
}

mmsDirectives.component(ViewReorderComponent.selector,ViewReorderComponent);