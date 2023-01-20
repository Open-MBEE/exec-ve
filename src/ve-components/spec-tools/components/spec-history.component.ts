import angular from 'angular'
import _ from 'lodash'

import { Commit, CompareData, DiffMergeService } from '@ve-components/diffs'
import { ComponentService } from '@ve-components/services'
import { ISpecTool, SpecService, SpecTool } from '@ve-components/spec-tools'
import { ToolbarService } from '@ve-core/toolbar'
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

import { VeComponentOptions, VePromise, VeQService } from '@ve-types/angular'
import { CommitObject, ElementsRequest, RefObject } from '@ve-types/mms'

/**
 * @ngdoc component
 * @name veComponents.component:specHistory
 *
 * @requires veUtils/ElementService
 * @requires veUtils/ProjectService
 * @requires $templateCache
 * @requires $q
 * @requires _
 *
 * * Outputs a history window of the element whose id is specified. History includes
 * name of modifier and date of change. Also modified date links to spec output below.
 *
 * ### template (html)
 * ## Example for showing an element history
 *  <pre>
    <mms-history mms-element-id="{{id}}" mms-ref-id="{{refId}}"
                         mms-project-id="{{projectId}}"></mms-history>
    </pre>
 *
 */
class SpecHistoryController extends SpecTool implements ISpecTool {
    // Locals
    gettingHistory: boolean
    refList: RefObject[]
    baseCommit: Commit
    historyVer: string
    compareCommit: Commit
    disableRevert: boolean

    static $inject = [...SpecTool.$inject, 'DiffMergeService']

    constructor(
        $scope: angular.IScope,
        $element: JQuery<HTMLElement>,
        $q: VeQService,
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
        private diffMergeSvc: DiffMergeService
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
        this.specType = _.kebabCase(SpecHistoryComponent.selector)
        this.specTitle = 'Element History'
    }

    initCallback = (): void => {
        if (!this.projectId || !this.refId) return
        this.gettingHistory = true
        const reqOb: ElementsRequest<string> = {
            elementId: this.element.id,
            projectId: this.projectId,
            refId: this.refId,
        }
        // this.elementSvc.getElement(reqOb, 2, false).then((data) => {
        //     this.element = data;
        // })
        this.elementSvc.getElementHistory(reqOb, 2, true).then(
            (data) => {
                this.historyVer = 'latest'
                this.compareCommit.history = data
                this.compareCommit.commitSelected =
                    this.compareCommit.history[0]
                this.baseCommit.history = data
                this.getRefs()
                    .then(() => {
                        if (data.length > 1) {
                            this.baseCommit.commitSelected =
                                this.compareCommit.history[1]
                        } else if (data.length > 0) {
                            this.baseCommit.commitSelected =
                                this.compareCommit.history[0]
                        } else {
                            this.baseCommit.commitSelected = '--- none ---'
                        }
                    })
                    .finally(() => {
                        this.gettingHistory = false
                        this.disableRevert = this._isSame()
                    })
            },
            (reason) => {
                this.growl.error(
                    `Unable to get Element History - ${reason.message}`
                )
            }
        )
    }

    // Get ref list for project and details on
    getRefs = (): VePromise<void, void> => {
        const deferred = this.$q.defer<void>()
        this.projectSvc.getRefs(this.projectId).then(
            (data) => {
                this.refList = data
                this.compareCommit.ref = this.refList.filter((ref) => {
                    return ref.id === this.refId
                })[0]
                this.baseCommit.ref = this.compareCommit.ref
                deferred.resolve()
            },
            (reason) => {
                this.growl.error(`Unable to get Refs - ${reason.message}`)
                deferred.reject()
            }
        )
        return deferred.promise
    }

    commitClicked = (version: CommitObject): void => {
        this.compareCommit.commitSelected = version
        this.historyVer = this.compareCommit.commitSelected.id
        this.compareCommit.isOpen = !this.compareCommit.isOpen
    }

    getElementHistoryByRef = (ref?: RefObject): void => {
        if (ref) {
            this.disableRevert = false
            // scope.gettingCompareHistory = true;
            this.baseCommit.ref = ref
            const reqOb = {
                elementId: this.element.id,
                projectId: this.projectId,
                refId: ref.id,
            }
            this.elementSvc
                .getElementHistory(reqOb, 2)
                .then(
                    (data) => {
                        this.baseCommit.history = data
                        if (data.length > 0) {
                            this.baseCommit.commitSelected =
                                this.baseCommit.history[0]
                        }
                        this.disableRevert = this._isSame()
                    },
                    (error) => {
                        this.baseCommit.history = []
                        this.baseCommit.commitSelected = ''
                        this.disableRevert = true
                    }
                )
                .finally(() => {
                    // scope.gettingCompareHistory = false;
                    this.baseCommit.refIsOpen = !this.baseCommit.refIsOpen
                })
        }
    }

    baseCommitClicked = (version: CommitObject): void => {
        this.baseCommit.commitSelected = version
        this.baseCommit.isOpen = !this.baseCommit.isOpen
    }

    //TODO
    // check if commit ids are the same - display to user that they are comparing same or disable the commit that matches
    revert = (): void => {
        if (!this._isSame()) {
            const reqOb: ElementsRequest<string> = {
                elementId: this.element.id,
                projectId: this.projectId,
                refId: this.refId,
            }
            const compareData: CompareData = {
                compareCommit: this.compareCommit,
                baseCommit: this.baseCommit,
                element: this.element,
            }
            this.diffMergeSvc.revertAction(reqOb, compareData, this.$element)
        } else this.growl.warning('Nothing to revert!')
    }

    private _isSame = (): boolean => {
        const compareId =
            typeof this.compareCommit.commitSelected === 'string'
                ? this.compareCommit.commitSelected
                : this.compareCommit.commitSelected.id
        const baseId =
            typeof this.baseCommit.commitSelected === 'string'
                ? this.baseCommit.commitSelected
                : this.baseCommit.commitSelected.id
        return baseId == compareId
    }
}

const SpecHistoryComponent: VeComponentOptions = {
    selector: 'specHistory',
    template: `
    <h4 class="right-pane-title">Element History
    <span ng-show="$ctrl.gettingHistory"><i class="fa fa-spin fa-spinner"></i></span>
</h4>
<div style="margin-bottom:6px;">
    <input type="checkbox" style="margin-right:4px;" ng-model="ModelData.ShowDiffPrototype" ng-disabled="$ctrl.disableCompare">Compare versions
</div>

<div style="position:relative;">
    <div class="inline-diff-buttons">
        <span class="inline-btn-label fade-in-out" ng-show="ModelData.ShowDiffPrototype">Compare:</span>
        <div class="btn-group ve-light-dropdown" ng-class="{'flex-grow-shrink':ModelData.ShowDiffPrototype}" uib-dropdown keyboard-nav is-open="$ctrl.compareCommit.isOpen" auto-close="outsideClick" style="flex:2">
            <button class="dropdown-toggle" type="button" uib-dropdown-toggle>
                <span>{{$ctrl.compareCommit.commitSelected._created | date:'M/d/yy h:mm a'}} by <b>{{$ctrl.compareCommit.commitSelected._creator}}</b></span>
                <span ng-if="$ctrl.compareCommit.commitSelected.id === $ctrl.compareCommit.history[0].id"> (Latest)</span>
                <i class="fa fa-caret-down" aria-hidden="true"></i>
            </button>
            <ul class="dropdown-menu menu-with-input" uib-dropdown-menu role="menu">
                <li class="dropdown-input">
                    <input class="ve-plain-input" type="text" placeholder="Filter history on {{compareCommit.ref.type}}: {{compareCommit.ref.name}}" ng-model="historyFilter">
                </li>
                <li ng-click="$ctrl.commitClicked(version)" ng-repeat="version in $ctrl.compareCommit.history | filter:historyFilter"
                    ng-class="{'checked-list-item': version === $ctrl.compareCommit.commitSelected,'secondary-checked-list-item': version === $ctrl.baseCommit.commitSelected && ModelData.ShowDiffPrototype}"
                    tooltip-placement="left" uib-tooltip="Selected before version"
                    tooltip-append-to-body="version === $ctrl.baseCommit.commitSelected" tooltip-enable="ModelData.ShowDiffPrototype && version === $ctrl.baseCommit.commitSelected">
                    <a>{{version._created | date:'M/d/yy h:mm a'}} by <b>{{ version._creator }}</b><span ng-if="$index == 0"> (Latest)</span></a>
                </li>
            </ul>
        </div>
        <span class="inline-btn-label" ng-show="ModelData.ShowDiffPrototype">on</span>
        <span class="inline-btn-label fade-in-out" ng-show="ModelData.ShowDiffPrototype" style="flex:1">{{$ctrl.compareCommit.ref.type}}: <b>{{$ctrl.compareCommit.ref.name}}</b></span>
    </div>
    <div ng-if="ModelData.ShowDiffPrototype" class="inline-diff-buttons fade-in-out">
        <span class="inline-btn-label">To:</span>
        <div class="btn-group ve-light-dropdown" uib-dropdown keyboard-nav is-open="$ctrl.baseCommit.isOpen" auto-close="outsideClick" style="flex:2" ng-hide="$ctrl.disableRevert">
            <button class="dropdown-toggle" type="button" uib-dropdown-toggle>
                {{$ctrl.baseCommit.commitSelected._created | date:'M/d/yy h:mm a'}} by <b>{{$ctrl.baseCommit.commitSelected._creator}}</b><span ng-if="$ctrl.baseCommit.commitSelected.id === $ctrl.baseCommit.history[0].id"> (Latest)</span>
                <i class="fa fa-caret-down" aria-hidden="true"></i>
            </button>
            <ul class="dropdown-menu menu-with-input" uib-dropdown-menu role="menu">
                <li class="dropdown-input">
                    <input class="ve-plain-input" ng-model="historyFilter" type="text" placeholder="Filter history on {{$ctrl.baseCommit.ref.type}}: {{$ctrl.baseCommit.ref.name}}">
                </li>
                <li ng-click="$ctrl.baseCommitClicked(version)" ng-repeat="version in $ctrl.baseCommit.history | filter:historyFilter"
                    ng-class="{'checked-list-item': version === $ctrl.baseCommit.commitSelected,'secondary-checked-list-item': version === $ctrl.compareCommit.commitSelected}"
                    ng-disabled="$index === 0" tooltip-placement="left" uib-tooltip="Selected after version"
                    tooltip-append-to-body="version === $ctrl.compareCommit.commitSelected" tooltip-enable="version === $ctrl.compareCommit.commitSelected">
                    <a>{{version._created | date:'M/d/yy h:mm a'}} by <b>{{ version._creator }}</b><span ng-if="$index == 0"> (Latest)</span></a>
                </li>
            </ul>
        </div>

        <span class="inline-btn-label" style="flex:2;text-align:right;" ng-show="$ctrl.disableRevert">Element does not exist</span>

        <span class="inline-btn-label"> on</span>

        <div class="btn-group ve-light-dropdown" uib-dropdown keyboard-nav is-open="$ctrl.baseCommit.refIsOpen" auto-close="outsideClick" style="flex:1">
            <button class="dropdown-toggle" type="button" uib-dropdown-toggle>
                {{$ctrl.baseCommit.ref.type}}: <b>{{$ctrl.baseCommit.ref.name}}</b>
                <i class="fa fa-caret-down" aria-hidden="true"></i>
            </button>
            <ul class="dropdown-menu menu-with-input pull-right" uib-dropdown-menu role="menu">
                <li class="dropdown-input">
                    <input class="ve-plain-input" type="text" placeholder="Filter branches/tags" ng-model="refFilter">
                </li>
                <li ng-click="$ctrl.getElementHistoryByRef(ref)" ng-repeat="ref in $ctrl.refList | filter:refFilter"
                    ng-class="{'checked-list-item': ref.id === $ctrl.baseCommit.ref.id}">
                    <a>{{ ref.type }}: <b>{{ref.name}}</b></a>
                </li>
            </ul>
        </div>
    </div>

    <div class="diff-dotted-connection fade-in-out" ng-show="ModelData.ShowDiffPrototype"></div>
    
</div>

<hr class="spec-title-divider">

<div ng-show="ModelData.ShowDiffPrototype">
    <div class="ve-notify-banner fade-in-out" ng-show="disableRevert">
        <span>Element does not exist on <strong>{{$ctrl.baseCommit.ref.type}}: {{$ctrl.baseCommit.ref.name}}</strong></span>
    </div>
    <div ng-hide="$ctrl.disableRevert">
        <h1 class="prop element-title">
            <transclude-attr-diff mms-attr="name"
                           mms-project-id="{{$ctrl.projectId}}"
                           mms-ref-id="{{$ctrl.baseCommit.ref.id}}"
                           mms-commit-id="{{$ctrl.baseCommit.commitSelected.id}}"
                           mms-element-id="{{$ctrl.element.id}}"
                           mms-compare-ref-id="{{$ctrl.refId}}"
                           mms-compare-commit-id="{{$ctrl.compareCommit.commitSelected.id}}">
            </transclude-attr-diff>
        </h1>

        <h2 class="prop-title spec-view-doc-heading">Documentation</h2>
        <transclude-attr-diff mms-attr="doc"
                       mms-project-id="{{$ctrl.projectId}}"
                       mms-ref-id="{{$ctrl.baseCommit.ref.id}}"
                       mms-commit-id="{{$ctrl.baseCommit.commitSelected.id}}"
                       mms-element-id="{{$ctrl.element.id}}"
                       mms-compare-ref-id="{{$ctrl.refId}}"
                       mms-compare-commit-id="{{$ctrl.compareCommit.commitSelected.id}}">
        </transclude-attr-diff>

        <div ng-if="$ctrl.element.type === 'Property' || $ctrl.element.type === 'Port' || $ctrl.element.type === 'Slot'">
            <h2 class="prop-title">Property Value</h2>
            <span class="prop">
                <transclude-attr-diff mms-attr="val"
                               mms-project-id="{{$ctrl.projectId}}"
                               mms-ref-id="{{$ctrl.baseCommit.ref.id}}"
                               mms-commit-id="{{$ctrl.baseCommit.commitSelected.id}}"
                               mms-element-id="{{$ctrl.element.id}}"
                               mms-compare-ref-id="{{$ctrl.refId}}"
                               mms-compare-commit-id="{{$ctrl.compareCommit.commitSelected.id}}">
                </transclude-attr-diff>
            </span>
        </div>
        <h2 class="prop-title">Commit</h2>
        <span class="prop">{{$ctrl.baseCommit.commitSelected.id}}<br>
        <img src="img/arrow-change.svg" class="change-connection"><br>
        {{$ctrl.compareCommit.commitSelected.id}}</span>
    </div>
</div>

<!-- Spec window -->
<div ng-hide="ModelData.ShowDiffPrototype">
    <spec-inspector></spec-inspector>
</div>

<div ng-show="ModelData.ShowDiffPrototype && $ctrl.compareCommit.ref.type === 'Tag'" class="revert-section fade-in-out">
    <div>
        <span class="ve-secondary-text">Cannot make changes on a <b>Tag</b>.</span>
    </div>
</div>
<div ng-show="ModelData.ShowDiffPrototype && !$ctrl.disableRevert && $ctrl.compareCommit.ref.type !== 'Tag'" class="revert-section fade-in-out">
    <div>
        <span>To revert <b>documentation</b>, <b>name</b>, and <b>value</b> to version created ({{$ctrl.baseCommit.commitSelected._created | date:'M/d/yy h:mm a'}} by <b>{{$ctrl.baseCommit.commitSelected._creator}}</b>):</span>
        <button class="btn btn-warning btn-sm pull-right" ng-click="$ctrl.revert()">Revert</button>
    </div>
</div>

    
`,
    controller: SpecHistoryController,
}

veComponents.component(SpecHistoryComponent.selector, SpecHistoryComponent)
