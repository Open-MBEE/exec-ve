import _ from 'lodash'

import { ComponentService } from '@ve-components/services'
import {
    SpecService,
    SpecTool,
    ISpecTool,
    ReorderService,
} from '@ve-components/spec-tools'
import { ToolbarService } from '@ve-core/toolbar'
import { ApplicationService } from '@ve-utils/application'
import { EventService } from '@ve-utils/core'
import {
    AuthService,
    PermissionsService,
    URLService,
    ElementService,
    ViewService,
    ProjectService,
    ApiService,
} from '@ve-utils/mms-api-client'

import { veComponents } from '@ve-components'

import { VeComponentOptions, VeQService } from '@ve-types/angular'
import {
    PresentationReference,
    ViewInstanceSpec,
    ViewObject,
} from '@ve-types/mms'

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
    private treeOptions: object

    private elementReferenceTree: PresentationReference[]
    private originalElementReferenceTree: PresentationReference[]
    public view: ViewObject | ViewInstanceSpec

    static $inject = [...SpecTool.$inject, 'ReorderService']
    reorderable: boolean

    constructor(
        $q: VeQService,
        $scope: angular.IScope,
        $element: JQuery<HTMLElement>,
        growl: angular.growl.IGrowlService,
        componentSvc: ComponentService,
        uRLSvc: URLService,
        authSvc: AuthService,
        elementSvc: ElementService,
        projectSvc: ProjectService,
        applicationSvc: ApplicationService,
        apiSvc: ApiService,
        viewSvc: ViewService,
        permissionsSvc: PermissionsService,
        eventSvc: EventService,
        specSvc: SpecService,
        toolbarSvc: ToolbarService,
        private reorderSvc: ReorderService
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
        )
        this.specType = _.kebabCase(SpecReorderComponent.selector)
        this.specTitle = 'Reorder Spec'
    }

    config = (): void => {
        this.reorderSvc.view = this.view = this.element
        this.reorderSvc.refresh()
        this.elementReferenceTree = this.reorderSvc.elementReferenceTree
        this.originalElementReferenceTree =
            this.reorderSvc.originalElementReferenceTree
        this.treeOptions = {
            accept: (
                sourceNodeScope: SpecTool,
                destNodeScope: SpecTool,
                destIndex: number
            ): boolean => {
                if (sourceNodeScope.element.isOpaque) return false
                if (destNodeScope.$element.hasClass('root')) return true
                return !!this.viewSvc.isSection(
                    destNodeScope.element as ViewInstanceSpec
                )
            },
        }

        this.subs.push(
            this.eventSvc.$on('spec-reorder', () => {
                this.specSvc.setEditing(true)
            })
        )

        let viewSaving = false
        this.subs.push(
            this.eventSvc.$on('spec-reorder.refresh', () => {
                this.reorderSvc.refresh()
            })
        )
        this.subs.push(
            this.eventSvc.$on('spec-reorder-save', () => {
                if (viewSaving) {
                    this.growl.info('Please Wait...')
                    return
                }
                viewSaving = true
                this.eventSvc.$broadcast(
                    this.toolbarSvc.constants.TOGGLEICONSPINNER,
                    { id: 'spec-reorder-save' }
                )
                this.reorderSvc.save().then(
                    () => {
                        viewSaving = false
                        this.reorderSvc.refresh()
                        this.growl.success('Save Successful')
                        this.eventSvc.$broadcast(
                            this.toolbarSvc.constants.TOGGLEICONSPINNER,
                            { id: 'spec-reorder-save' }
                        )
                        this.eventSvc.$broadcast(
                            'spec-reorder-saved',
                            this.specApi.elementId
                        )
                    },
                    (response) => {
                        this.reorderSvc.refresh()
                        viewSaving = false
                        const reason = response.data.failedRequests[0]
                        this.growl.error(reason.message)
                        this.eventSvc.$broadcast(
                            this.toolbarSvc.constants.TOGGLEICONSPINNER,
                            { id: 'spec-reorder-save' }
                        )
                    }
                )
                this.eventSvc.$broadcast(this.toolbarSvc.constants.SELECT, {
                    id: 'spec-reorder',
                })
            })
        )
        this.subs.push(
            this.eventSvc.$on('spec-reorder-cancel', () => {
                this.specSvc.setEditing(false)
                this.reorderSvc.refresh()
                this.eventSvc.$broadcast(this.toolbarSvc.constants.SELECT, {
                    id: 'spec-inspector',
                })
                //this.('element');
            })
        )
    }

    initCallback = (): void => {
        this.reorderSvc.view = this.view = this.element
        if (this.view.type === 'View' || this.viewSvc.isSection(this.view)) {
            this.reorderable = true
            this.reorderSvc.refresh()
        } else {
            this.reorderable = false
        }
    }

    public getEditing(): boolean {
        return this.specSvc.getEditing()
    }
}

const SpecReorderComponent: VeComponentOptions = {
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
    controller: SpecReorderController,
}

veComponents.component(SpecReorderComponent.selector, SpecReorderComponent)
