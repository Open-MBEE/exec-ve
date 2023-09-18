import _ from 'lodash';

import { ComponentService } from '@ve-components/services';
import { SpecService, SpecTool, ISpecTool } from '@ve-components/spec-tools';
import { veCoreEvents } from '@ve-core/events';
import { ToolbarService } from '@ve-core/toolbar';
import { ApplicationService } from '@ve-utils/application';
import { EventService } from '@ve-utils/core';
import {
    PermissionsService,
    URLService,
    ElementService,
    ViewService,
    ProjectService,
    ApiService,
} from '@ve-utils/mms-api-client';

import { veComponents } from '@ve-components';

import { VeComponentOptions, VePromise, VePromisesResponse, VeQService } from '@ve-types/angular';
import {
    ElementObject,
    ElementsRequest,
    ExpressionObject,
    InstanceValueObject,
    PresentationReference,
    ViewInstanceSpec,
    ViewObject,
} from '@ve-types/mms';

/**
 * @ngdoc directive
 * @name veComponents.component:mmsSpecReorder
 *
 * @requires veUtils/ViewService
 * @requires $templateCache
 *
 * * Visualize and edit the structure of a view
 *
 * @param {string} mmsElementId The id of the view
 * @param {string} mmsProjectId The project id for the view
 * @param {string=master} mmsRefId Reference to use, defaults to master
 * @param {string=latest} mmsCommitId Commit ID, default is latest
 */
class SpecReorderController extends SpecTool implements ISpecTool {
    private treeOptions: object;

    private elementReferenceTree: PresentationReference[] = [];
    private originalElementReferenceTree: PresentationReference[] = [];
    public view: ViewObject | ViewInstanceSpec;
    reorderable: boolean;

    viewSaving: boolean;

    constructor(
        $q: VeQService,
        $scope: angular.IScope,
        $element: JQuery<HTMLElement>,
        growl: angular.growl.IGrowlService,
        componentSvc: ComponentService,
        uRLSvc: URLService,
        elementSvc: ElementService,
        projectSvc: ProjectService,
        applicationSvc: ApplicationService,
        apiSvc: ApiService,
        viewSvc: ViewService,
        permissionsSvc: PermissionsService,
        eventSvc: EventService,
        specSvc: SpecService,
        toolbarSvc: ToolbarService
    ) {
        super(
            $q,
            $scope,
            $element,
            growl,
            componentSvc,
            uRLSvc,
            elementSvc,
            projectSvc,
            applicationSvc,
            apiSvc,
            viewSvc,
            permissionsSvc,
            eventSvc,
            specSvc,
            toolbarSvc
        );
        this.specType = _.kebabCase(SpecReorderComponent.selector);
        this.specTitle = 'Reorder Spec';
    }

    $onInit(): void {
        super.$onInit();
        this.treeOptions = {
            accept: (sourceNodeScope: SpecTool, destNodeScope: SpecTool, destIndex: number): boolean => {
                if (sourceNodeScope.element.isOpaque) return false;
                if (destNodeScope.$element.hasClass('root')) return true;
                return !!this.viewSvc.isSection(destNodeScope.element as ViewInstanceSpec);
            },
        };
        this.subs.push(
            this.eventSvc.$on('spec-reorder.save', () => {
                if (this.viewSaving) {
                    this.growl.info('Please Wait...');
                    return;
                }
                this.viewSaving = true;
                this.toolbarSvc.waitForApi(this.toolbarId).then(
                    (api) => {
                        api.toggleButtonSpinner('spec-reorder.save');
                    },
                    (reason) => {
                        this.growl.error(ToolbarService.error(reason));
                    }
                );
                this.treeSave().then(
                    (elements) => {
                        this.viewSaving = false;
                        //this.refresh()
                        //TODO reset orig
                        this.growl.success('Save Successful');
                        this.toolbarSvc.waitForApi(this.toolbarId).then(
                            (api) => {
                                api.toggleButtonSpinner('spec-reorder.save');
                            },
                            (reason) => {
                                this.growl.error(ToolbarService.error(reason));
                            }
                        );
                        const saved = elements.filter((val) => val.id === this.view.id);
                        if (saved.length > 0) {
                            this.eventSvc.$broadcast('element.updated', { element: saved[0] });
                            this.eventSvc.$broadcast('view.reordered', saved[0]);
                        }
                        this.eventSvc.$broadcast('spec-reorder.saved', this.view.id);
                        this.eventSvc.resolve<veCoreEvents.toolbarClicked>(this.toolbarId, {
                            id: 'spec-inspector',
                        });
                    },
                    (response) => {
                        this.refresh();
                        this.viewSaving = false;
                        const reason = response.data.failedRequests[0];
                        this.growl.error(reason.message);
                        this.toolbarSvc.waitForApi(this.toolbarId).then(
                            (api) => {
                                api.toggleButtonSpinner('spec-reorder.save');
                            },
                            (reason) => {
                                this.growl.error(ToolbarService.error(reason));
                            }
                        );
                    }
                );
            })
        );
        this.subs.push(
            this.eventSvc.$on('spec-reorder.cancel', () => {
                this.revert();
            })
        );
    }

    initCallback = (): void => {
        if (this.apiSvc.isView(this.specSvc.getView()) || this.viewSvc.isSection(this.specSvc.getView())) {
            this.view = this.specSvc.getView();
            this.reorderable = true;
            this.refresh();
        }
    };

    treeSave(): VePromise<ElementObject[], VePromisesResponse<ElementObject>> {
        const elementObsToUpdate: ElementObject[] = [];
        const updateSectionElementOrder = (elementReference: PresentationReference): void => {
            const sectionEdit: ViewInstanceSpec = {
                id: elementReference.instanceId,
                //_modified: elementReference.instanceSpecification._modified,
                _projectId: elementReference.instanceSpecification._projectId,
                _refId: elementReference.instanceSpecification._refId,
                type: elementReference.instanceSpecification.type,
                specification: _.cloneDeep(elementReference.instanceSpecification.specification),
            };
            //sectionEdit.specialization = _.cloneDeep(elementReference.instanceSpecification.specialization);
            const operand: InstanceValueObject[] = (sectionEdit.specification.operand = []);

            if (!elementReference.instanceSpecification.specification) {
                this.growl.error('Malformed Reference Tree; Aborting');
            }
            const origOperand = (
                elementReference.instanceSpecification.specification as ExpressionObject<InstanceValueObject>
            ).operand;
            elementReference.sectionElements.forEach((sectionElement, index) => {
                operand.push(sectionElement.instanceVal);
                if (sectionElement.sectionElements.length > 0) updateSectionElementOrder(sectionElement);
            });

            if (!_.isEqual(operand, origOperand)) {
                elementObsToUpdate.push(sectionEdit);
            }
        };

        const deferred = this.$q.defer<ElementObject[]>();
        if (this.elementReferenceTree.length === 0) {
            deferred.reject({
                type: 'error',
                message: 'View specs were not initialized properly or is empty.',
            });
            return deferred.promise;
        }
        const viewEdit: ViewInstanceSpec | ViewObject = {
            id: this.view.id,
            //_modified: this.view._modified,
            _projectId: this.view._projectId,
            _refId: this.view._refId,
            type: this.view.type,
        };
        if (this.view._contents) {
            viewEdit._contents = _.cloneDeep(this.view._contents);
        }
        if (this.view.specification) {
            viewEdit.specification = _.cloneDeep((this.view as ViewInstanceSpec).specification);
        }
        const specs: ExpressionObject = viewEdit._contents || viewEdit.specification;
        const origSpecs: ExpressionObject = this.view._contents || this.view.specification;
        // Update the View edit object on Save
        if (specs.operand) {
            specs.operand = [];
            this.elementReferenceTree.forEach((elementRef) => {
                specs.operand.push(elementRef.instanceVal);
            });
            if (specs && !_.isEqual(specs.operand, origSpecs.operand)) {
                elementObsToUpdate.push(viewEdit);
            }
        }
        // Recurse
        this.elementReferenceTree.forEach((elementReference) => {
            if (elementReference.sectionElements && elementReference.sectionElements.length > 0) {
                updateSectionElementOrder(elementReference);
            }
        });

        return this.elementSvc.updateElements(elementObsToUpdate, false);
    }

    revert = (): void => {
        this.elementReferenceTree = _.cloneDeepWith(this.originalElementReferenceTree, (value: unknown, key) => {
            if (
                key === 'instanceId' ||
                key === 'instanceSpecification' ||
                key === 'presentationElement' ||
                key === 'instanceVal'
            )
                return value;
            return undefined;
        }) as PresentationReference[];
    };

    refresh = () => {
        let contents: ExpressionObject<InstanceValueObject> = null;
        if (this.view._contents) {
            contents = (this.view as ViewObject)._contents;
        }
        if (this.view.specification) {
            contents = (this.view as ViewInstanceSpec).specification;
        }
        const reqOb: ElementsRequest<string> = {
            elementId: this.specSvc.specApi.elementId,
            projectId: this.specSvc.specApi.projectId,
            refId: this.specSvc.specApi.refId,
            commitId: this.specSvc.specApi.commitId,
        };
        if (contents) {
            this.viewSvc.getElementReferenceTree(reqOb, contents).then(
                (elementReferenceTree) => {
                    this.elementReferenceTree = elementReferenceTree;
                    this.originalElementReferenceTree = _.cloneDeepWith(elementReferenceTree, (value: unknown, key) => {
                        if (
                            key === 'instanceId' ||
                            key === 'instanceSpecification' ||
                            key === 'presentationElement' ||
                            key === 'instanceVal'
                        )
                            return value;
                        return undefined;
                    }) as PresentationReference[];
                },
                (reason) => {
                    this.elementReferenceTree = [];
                    this.originalElementReferenceTree = [];
                }
            );
        } else {
            this.elementReferenceTree = [];
            this.originalElementReferenceTree = [];
        }
    };
}

const SpecReorderComponent: VeComponentOptions = {
    selector: 'specReorder',
    template: `
    <!-- Nested node template -->
<script type="text/ng-template" id="nodes_renderer2.html">
    <div ui-tree-handle data-nodrag="{{element.isOpaque ? 'true' : 'false'}}"
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
    <div ng-show="!$ctrl.elementReferenceTree || $ctrl.elementReferenceTree.length == 0">View specs loading or unavailable
    </div>
    <div ng-show="$ctrl.elementReferenceTree && $ctrl.elementReferenceTree.length > 0"><b>Bold</b> view specs are reorderable</div>
    <div class="well" ui-tree="$ctrl.treeOptions">
        <ol ui-tree-nodes class="root" ng-model="$ctrl.elementReferenceTree">
            <li ng-repeat="element in $ctrl.elementReferenceTree" ui-tree-node ng-include="'nodes_renderer2.html'"></li>
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
    controller: SpecReorderController,
};

veComponents.component(SpecReorderComponent.selector, SpecReorderComponent);
