import { StateService, UIRouterGlobals } from '@uirouter/angularjs'
import angular, { IComponentController } from 'angular'

import { CacheService, ProjectService } from '@ve-utils/mms-api-client'
import {
    EventService,
    RootScopeService,
    UtilsService,
} from '@ve-utils/services'
import { onChangesCallback, watchChangeEvent } from '@ve-utils/utils'

import { veApp } from '@ve-app'

import { VeComponentOptions, VeQService } from '@ve-types/angular'
import {
    DocumentObject,
    GroupObject,
    ParamsObject,
    ProjectObject,
    RefObject,
    ViewObject,
} from '@ve-types/mms'

interface BreadcrumbObject {
    name: string
    id: string
    type: string
    link: string
}

class MenuController implements IComponentController {
    //bindings
    public params: ParamsObject
    public mmsProject: ProjectObject
    public mmsProjects: ProjectObject[]
    public mmsGroup: GroupObject
    public mmsGroups: GroupObject[]
    public mmsRef: RefObject
    public mmsRefs: RefObject[]
    public mmsDocument: DocumentObject
    public mmsView: ViewObject

    //Locals
    spin: boolean
    public child: DocumentObject | GroupObject
    crumbs: BreadcrumbObject[] = []
    groups: GroupObject[]
    projects: ProjectObject[]
    refs: RefObject[]
    document: DocumentObject
    view: ViewObject
    groupsMap: {
        [id: string]: { id: string; name: string; parentId: string }
    } = {}
    isRefsView: boolean = false
    public htmlTooltip
    public currentProject: string
    public currentRef: RefObject
    public currentBranch: string
    public currentTag: string
    public breadcrumbs: BreadcrumbObject[]
    public truncateStyle
    public subs: Rx.IDisposable[]

    static $inject = [
        '$q',
        '$uiRouterGlobals',
        '$state',
        '$sce',
        '$timeout',
        '$element',
        'ProjectService',
        'CacheService',
        'UtilsService',
        'RootScopeService',
        'EventService',
    ]
    constructor(
        public $q: VeQService,
        private $uiRouterGlobals: UIRouterGlobals,
        private $state: StateService,
        private $sce: angular.ISCEService,
        private $timeout: angular.ITimeoutService,
        private $element: JQuery<HTMLElement>,
        private projectSvc: ProjectService,
        private cacheSvc: CacheService,
        private utilsSvc: UtilsService,
        private rootScopeSvc: RootScopeService,
        public eventSvc: EventService
    ) {
        this.htmlTooltip = 'Branch temporarily unavailable during duplication.'
    }

    $onInit(): void {
        this.eventSvc.$init(this)
        this.projects = this.mmsProjects
        this.groups = this.mmsGroups
        if (this.mmsProject && !this.currentProject) {
            this.currentProject = this.mmsProject.name
        }
        if (this.mmsRef && !this.currentRef) {
            this.currentRef = this.mmsRef
            if (this.mmsRef.type === 'Branch') {
                this.currentBranch = this.mmsRef.name
            } else if (this.mmsRef.type === 'Tag') {
                this.currentTag = this.mmsRef.name
            }
        }

        watchChangeEvent(this, 'mmsDocument', this.updateBreadcrumbs, true)
        watchChangeEvent(this, 'mmsGroups', this.updateGroups, true)
        this.updateGroups()
    }

    updateGroups: onChangesCallback<undefined> = () => {
        this.groupsMap = {}
        this.spin = true
        if (typeof this.mmsGroups !== 'undefined') {
            this.groups = this.mmsGroups
            for (let i = 0; i < this.groups.length; i++) {
                this.groupsMap[this.groups[i].id] = {
                    id: this.groups[i].id,
                    name: this.groups[i].name,
                    parentId: this.groups[i]._parentId,
                }
            }
            this.updateBreadcrumbs()
        } else {
            this.updateBreadcrumbs()
        }
    }

    public updateBreadcrumbs: onChangesCallback<undefined> = () => {
        let parentId = ''
        let oldChild = null
        if (this.child) oldChild = this.child

        if (this.mmsDocument) {
            this.child = this.mmsDocument
            this.rootScopeSvc.veTitle(this.mmsDocument.name)
        } else if (this.mmsGroup) {
            this.rootScopeSvc.veTitle(this.mmsGroup.name)
            this.child = this.mmsGroup
        } else {
            this.rootScopeSvc.veTitle(this.currentProject)
        }

        // Check for Refs View, Skip the rest if it is
        if (this.$state.includes('main.project.refs')) {
            this.isRefsView = true
            return
        }

        if (this.child && this.child != oldChild) {
            this.crumbs = []
            if (this.child.type === 'Package') {
                //child.hasOwnProperty('_id')) {
                this.crumbs.push({
                    name: this.child.name,
                    id: this.child.id,
                    type: 'group',
                    link: "main.project.ref.preview({documentId: 'site_' + breadcrumb.id + '_cover', search: undefined})",
                })
                if (this.child._parentId) {
                    parentId = (this.child as GroupObject)._parentId
                }
            } else {
                this.crumbs.push({
                    name: this.child.name,
                    id: this.child.id,
                    type: 'doc',
                    link: 'main.project.ref.document({documentId: breadcrumb.id, search: undefined})',
                })
                if (this.child._groupId) {
                    parentId = (this.child as DocumentObject)._groupId
                }
            }
            if (parentId) {
                while (this.groupsMap[parentId] !== undefined) {
                    const id = this.groupsMap[parentId].id
                    this.crumbs.push({
                        name: this.groupsMap[id].name,
                        id: id,
                        type: 'group',
                        link: "main.project.ref.preview({documentId: 'site_' + breadcrumb.id + '_cover', search: undefined})",
                    })
                    parentId = this.groupsMap[id].parentId
                }
            }
            this.breadcrumbs = this.crumbs.reverse()
            void this.$timeout(() => {
                const eltChildren = this.$element.children().children()
                const eltParent: Element = document.children[0]
                const eltWidth =
                    eltParent.clientWidth -
                    eltChildren[1].scrollWidth -
                    eltChildren[3].scrollWidth
                const crumbcount = this.breadcrumbs.length
                const liWidth = (eltWidth * 0.85) / crumbcount
                this.truncateStyle = {
                    'max-width': liWidth,
                    'white-space': 'nowrap',
                    overflow: 'hidden',
                    'text-overflow': 'ellipsis',
                    display: 'inline-block',
                }
            })
        }
        this.spin = false
    }

    updateProject(project: ProjectObject): void {
        if (project) {
            void this.$state.go(
                'main.project.ref.portal',
                {
                    projectId: project.id,
                    refId: 'master',
                    search: undefined,
                },
                { reload: true }
            )
        }
    }

    updateRef(ref: RefObject): void {
        if (ref.status != 'creating') {
            void this.$state.go(
                this.$uiRouterGlobals.$current.name,
                {
                    projectId: ref._projectId,
                    refId: ref.id,
                    search: undefined,
                },
                { reload: true }
            )
        }
    }

    refsView(): void {
        void this.$state.go(
            'main.project.refs',
            { projectId: this.params.projectId },
            { reload: true }
        )
    }

    checkRefsView(): boolean {
        return this.$state.includes('refs')
    }

    getHrefForProject(project: ProjectObject): string {
        const refId = project._refId || 'master'
        return this.utilsSvc.PROJECT_URL_PREFIX + project.id + '/' + refId
    }

    getHrefForRef(branch: RefObject): string {
        let res =
            this.utilsSvc.PROJECT_URL_PREFIX +
            this.params.projectId +
            '/' +
            branch.id
        if (this.params.documentId) {
            res += '/documents/' + this.params.documentId
        }
        if (this.params.viewId) {
            res += '/views/' + this.params.viewId
        }
        return res
    }
}

const MainMenuComponent: VeComponentOptions = {
    selector: 'mainMenu',
    template: `
    <nav class="project-level-header navbar navbar-inverse navbar-fixed-top block" role="navigation">
    <i ng-show="$ctrl.spin" class="fa fa-spin fa-spinner nav-spin"></i>
    <div class="btn-group ve-dark-dropdown-nav pull-left" uib-dropdown keyboard-nav>
        <button type="button" class="dropdown-toggle" uib-dropdown-toggle>
            <span class="label-dropdown">Project:&nbsp;</span><span class="selected-dropdown">{{ $ctrl.currentProject }}</span>
            <span><i class="fa-solid fa-caret-down" aria-hidden="true"></i></span>
        </button>
        <ul class="dropdown-menu list-with-selected-item" uib-dropdown-menu role="menu">
            <li ng-repeat="project in $ctrl.projects | orderBy: 'name'" ng-click="$ctrl.updateProject(project)"
                ng-class="{'checked-list-item': project.name === $ctrl.currentProject}">
                {{ project.name }}
            </li>
        </ul>
    </div>
    <div ng-hide="$ctrl.spin" class="breadcrumbs">
        <ul>
            <li ng-style="truncateStyle">
                <a class="back-to-proj" ui-sref="main.project.ref.portal({refId: $ctrl.currentBranch ? $ctrl.currentRef.id : 'master', search: undefined})"
                    uib-tooltip="{{ $ctrl.currentProject }}" tooltip-trigger="mouseenter" tooltip-popup-delay="100" tooltip-placement="bottom">
                    <i class="fa-solid fa-home fa-1x" aria-hidden="true"></i>
                </a>
            </li>
            <li ng-style="truncateStyle" ng-show="!$ctrl.isRefsView" ng-repeat="breadcrumb in $ctrl.breadcrumbs track by $index">
                <span><i class="fa-solid fa-angle-right"></i></span>
                <a ui-sref="{{ breadcrumb.link }}" uib-tooltip="{{ breadcrumb.name }}" tooltip-trigger="mouseenter" tooltip-popup-delay="100" tooltip-placement="bottom">
                    <i ng-class="{'fa-solid fa-file': $last && breadcrumb.type === 'doc'}" aria-hidden="true"></i>{{ breadcrumb.name }}
                </a>
            </li>
        </ul>
    </div>
    <div ng-show="!$ctrl.isRefsView" class="nav navbar-nav navbar-right" style="padding-right: 15px">
        <div class="btn-group ve-dark-dropdown-nav" uib-dropdown keyboard-nav auto-close="outsideClick">
            <button id="task-selection-button" type="button" class="dropdown-toggle" uib-dropdown-toggle>
                <span class="label-dropdown">{{ $ctrl.currentRef.type }}:</span>
                <span class="selected-dropdown">{{ $ctrl.currentRef.name }}</span>
                <i class="fa fa-caret-down" aria-hidden="true"></i>
            </button>
            <ul class="dropdown-menu pull-right list-with-selected-item list-with-button list-with-tabs" uib-dropdown-menu role="menu"
                aria-labelledby="task-selection-button">
                <li class="button-item">
                    <button class="btn btn-large btn-block btn-primary" ng-click="$ctrl.refsView()">Manage Branches/Tags
                    </button>
                </li>
                <li class="button-item">
                    <form class="ve-dark-minor-search">
                        <input placeholder="Filter branches/tags" ng-model="refFilter">
                    </form>
                </li>
                <uib-tabset active="active" type="tabs" justified="false">
                    <uib-tab index="0" classes="tab-item" heading="Branches">
                        <li ng-repeat="branch in $ctrl.mmsRefs | orderBy:'name' | filter:{name:refFilter, type: 'Branch' } " ng-click="$ctrl.updateRef(branch)"
                            ng-class="{'checked-list-item': branch.name === $ctrl.currentBranch, 'branch-disabled': branch.status == 'creating'}"
                            is-open="false" tooltip-placement="left" uib-tooltip-html="$ctrl.htmlTooltip"
                            tooltip-append-to-body="branch.status == 'creating'" tooltip-enable="branch.status == 'creating'">
                            <a ng-href="{{$ctrl.getHrefForRef(branch);}}" ng-style="{display: 'block'}"> {{ branch.name }} </a>
                        </li>
                    </uib-tab>
                    <uib-tab index="1" classes="tab-item" heading="Tags">
                        <li ng-if="tags.length" ng-repeat="tag in $ctrl.mmsRefs | orderBy:'name' | filter:{name:refFilter, type: 'Tag' }" ng-click="$ctrl.updateRef(tag)"
                            ng-class="{'checked-list-item': tag.name === $ctrl.currentTag, 'branch-disabled': tag.status == 'creating'}"
                            is-open="false" tooltip-placement="left" uib-tooltip-html="$ctrl.htmlTooltip"
                            tooltip-append-to-body="tag.status == 'creating'" tooltip-enable="tag.status == 'creating'">
                            <a ng-href="{{$ctrl.getHrefForRef(tag);}}" ng-style="{display: 'block'}"> {{ tag.name }} </a>
                        </li>
                        <li ng-if="!$ctrl.mmsTags.length" class="ve-secondary">No Tags</li>
                    </uib-tab>
                </uib-tabset>
            </ul>
        </div>
    </div>
</nav>
`,
    bindings: {
        params: '<',
        mmsProject: '<',
        mmsProjects: '<',
        mmsGroup: '<',
        mmsGroups: '<',
        mmsRef: '<',
        mmsRefs: '<',
        mmsDocument: '<',
        mmsView: '<',
    },
    controller: MenuController,
}

veApp.component(MainMenuComponent.selector, MainMenuComponent)
