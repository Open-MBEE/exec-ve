import angular from 'angular'
import _ from 'lodash'

import { ComponentService } from '@ve-components/services'
import { ISpecTool, SpecService, SpecTool } from '@ve-components/spec-tools'
import { MergeConfirmResolveFn } from '@ve-core/diff-merge/modals/merge-confirm-modal.component'
import { ToolbarService } from '@ve-core/tool-bar'
import {
    ApiService,
    AuthService,
    ElementService,
    PermissionsService,
    ProjectService,
    URLService,
    ViewService,
} from '@ve-utils/mms-api-client'
import { EventService, UtilsService } from '@ve-utils/services'

import { veComponents } from '@ve-components'

import { VeComponentOptions } from '@ve-types/angular'
import { RefObject } from '@ve-types/mms'
import { VeModalService } from '@ve-types/view-editor'

/**
 * @ngdoc component
 * @name veComponents.component:SpecRefListController
 *
 * @requires {angular.IScope} $scope
 * @requires {JQuery<HTMLElement>} $element
 * @requires {angular.IQService} $q
 * @requires {angular.growl.IGrowlService} growl
 * @requires {ComponentService} componentSvc
 * @requires {URLService} uRLSvc
 * @requires {AuthService} authSvc
 * @requires {ElementService} elementSvc
 * @requires {ProjectService} projectSvc
 * @requires {UtilsService} utilsSvc
 * @requires {ViewService} viewSvc
 * @requires {PermissionsService} permissionsSvc
 * @requires {EventService} eventSvc
 * @requires {SpecService} specSvc
 * @requires {ToolbarService} toolbarSvc
 *
 * * Displays a list of branches/tags with details. Provides options for taking action on ref.
 * For the time being it only allows for running a doc merge job on current document.
 *
 * @param {RefObject[]} mmsBranches List of current project branches
 * @param {RefObject[]} mmsTags List of current project tags
 */
class SpecRefListController extends SpecTool implements ISpecTool {
    //Locals
    showMerge: boolean
    runCleared: boolean
    docEditable: boolean
    docName: string
    private isDoc: boolean
    srcRefOb: RefObject

    static $inject = [...SpecTool.$inject, '$uibModal']

    constructor(
        $scope: angular.IScope,
        $element: JQuery<HTMLElement>,
        $q: angular.IQService,
        growl: angular.growl.IGrowlService,
        componentSvc: ComponentService,
        uRLSvc: URLService,
        authSvc: AuthService,
        elementSvc: ElementService,
        projectSvc: ProjectService,
        utilsSvc: UtilsService,
        apiSvc: ApiService,
        viewSvc: ViewService,
        permissionsSvc: PermissionsService,
        eventSvc: EventService,
        specSvc: SpecService,
        toolbarSvc: ToolbarService,
        private $uibModal: VeModalService
    ) {
        super(
            $scope,
            $element,
            $q,
            growl,
            componentSvc,
            uRLSvc,
            authSvc,
            elementSvc,
            projectSvc,
            utilsSvc,
            apiSvc,
            viewSvc,
            permissionsSvc,
            eventSvc,
            specSvc,
            toolbarSvc
        )
        this.specType = _.kebabCase(SpecRefListComponent.selector)
        this.specTitle = 'Branch/Tag List'
    }

    public config = (): void => {
        this.showMerge =
            this.uRLSvc.getMmsServer().indexOf('opencae.jpl.nasa.gov') == -1
        this.runCleared = true
        this.docEditable = false
    }
    //Callback function for document change
    public initCallback = (): void => {
        if (this.document) this.docName = this.document.name
        if (!this.apiSvc.isDocument(this.element)) {
            this.isDoc = false
            return
        } else {
            this.isDoc = true
        }

        this.docEditable =
            this.specApi.refType != 'Tag' &&
            this.permissionsSvc.hasProjectIdBranchIdEditPermission(
                this.specApi.projectId,
                this.specApi.refId
            )
    }

    public docMergeAction = (srcRef: RefObject): void => {
        this.srcRefOb = srcRef

        const instance = this.$uibModal.open<MergeConfirmResolveFn, void>({
            resolve: {
                getDocName: (): string => {
                    if (this.document) return this.document.name
                    return '(Not Found)'
                },
                getSrcRefOb: (): RefObject => {
                    return this.srcRefOb
                },
            },
            component: 'mergeConfirmModal',
        })
        instance.result.then(
            () => {
                // TODO: do anything here?
            },
            () => {
                this.growl.error('Unable to Merge')
            }
        )
    }
}

const SpecRefListComponent: VeComponentOptions = {
    selector: 'specRefList',
    template: `
    
<input class="form-control" ng-model="refFilter" type="text" placeholder="Filter branches/tags">

<table class="tags-table table table-condensed">
    <thead>
        <tr>
            <td><h3 class="Tag-icon">Tag</h3></td>
            <td><h3>Created</h3></td>
            <td ng-if="$ctrl.isDoc && $ctrl.docEditable && $ctrl.showMerge"></td>
        </tr>
    </thead>
    <tbody ng-show="filteredTags.length">
        <tr ng-repeat="tag in filteredTags = (mmsTags | orderBy:'-_created' | filter: {name : refFilter})">
            <td>
                <a ui-sref="{refId: tag.id}"><b>{{tag.name}}</b></a>
                <div>{{tag.description}}</div>
            </td>
            <td class="ve-secondary-text">{{tag._created | date:'M/d/yy h:mm a'}}</td>
            <td ng-if="isDoc && docEditable && showMerge">
                <div class="btn-group" uib-dropdown is-open="status.isopen">
                    <button type="button" class="btn btn-default" uib-dropdown-toggle ng-disabled="disabled" title="Tag actions">
                        <i class="fa fa-ellipsis-v"></i>
                    </button>
                    <ul class="dropdown-menu pull-right" uib-dropdown-menu role="menu" aria-labelledby="single-button">
                        <li role="menuitem" style="padding:10px;">
                            <button class="btn btn-default btn-sm" ng-class="{'disabled': !$ctrl.docEditable || !$ctrl.runCleared}" ng-click="$ctrl.docMergeAction(tag)">
                                Pull In<i ng-show="!$ctrl.runCleared" class="fa fa-spin fa-spinner"></i>
                            </button> to this document on current branch
                        </li>
                    </ul>
                </div>
            </td>
        </tr>
    </tbody>

    <tbody ng-show="$ctrl.mmsTags.length && !$ctrl.filteredTags.length"><tr><td colspan="3" class="ve-secondary-text">No tags found</td></tr></tbody>

    <tbody ng-hide="$ctrl.mmsTags.length"><tr><td colspan="3" class="ve-secondary-text">No tags in current project.</td></tr></tbody>

    <thead>
        <tr>
            <td><h3 class="branch-icon">Branch</h3></td>
            <td><h3>Created</h3></td>
            <td ng-if="$ctrl.isDoc && $ctrl.docEditable && $ctrl.showMerge"></td>
        </tr>
    </thead>
    <tbody ng-show="filteredBranches.length">
        <tr ng-repeat="branch in filteredBranches = ($ctrl.mmsBranches | orderBy:'-_created' | filter: {name : refFilter})">
            <td>
                <a ui-sref="{refId: branch.id}"><b>{{branch.name}}</b></a>
                <div>{{branch.description}}</div>
            </td>
            <td class="ve-secondary-text">{{branch._created | date:'M/d/yy h:mm a'}}</td>
            <td ng-if="isDoc && docEditable && showMerge">
                <div class="btn-group" uib-dropdown is-open="status.isopen">
                    <button type="button" class="btn btn-default" uib-dropdown-toggle ng-disabled="disabled" title="Branch actions">
                        <i class="fa fa-ellipsis-v"></i>
                    </button>
                    <ul class="dropdown-menu pull-right" uib-dropdown-menu role="menu" aria-labelledby="single-button">
                        <li role="menuitem" style="padding:10px;">
                            <button class="btn btn-default btn-sm" ng-class="{'disabled': !$ctrl.docEditable || !$ctrl.runCleared}" ng-click="$ctrl.docMergeAction(branch)">
                                Pull In<i ng-show="!runCleared" class="fa fa-spin fa-spinner"></i>
                            </button> to this document on current branch
                        </li>
                    </ul>
                </div>
            </td>
        </tr>
    </tbody>
    <tbody><tr ng-hide="filteredBranches.length"><td colspan="3" class="ve-secondary-text">No branches found</td></tr></tbody>
</table>    
`,
    bindings: {
        mmsBranches: '<',
        mmsTags: '<',
    },
    controller: SpecRefListController,
}

veComponents.component(SpecRefListComponent.selector, SpecRefListComponent)
