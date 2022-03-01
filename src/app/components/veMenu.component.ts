import * as angular from 'angular';
var mmsApp = angular.module('mmsApp');


let VeMenuComponent = {
    selector: "veMenu",
    template: `
    <nav class="project-level-header navbar navbar-inverse navbar-fixed-top block" role="navigation">
    <div class="btn-group ve-dark-dropdown-nav pull-left" uib-dropdown keyboard-nav>
        <button type="button" class="dropdown-toggle" ng-click="updateProjectChecked()" uib-dropdown-toggle>
            <span class="label-dropdown">Project:&nbsp;</span><span class="selected-dropdown">{{ $ctrl.currentProject }}</span>
            <span><i class="fa fa-caret-down" aria-hidden="true"></i></span>
        </button>
        <ul class="dropdown-menu list-with-selected-item" uib-dropdown-menu role="menu">
            <li ng-repeat="project in $ctrl.mmsProjects | orderBy: 'name'" ng-click="$ctrl.updateProject(project)"
                ng-class="{'checked-list-item': project.name === $ctrl.currentProject}">
                <a ng-href="{{$ctrl.getHrefForProject(project);}}"> {{ $ctrl.mmsProject.name }} </a>
            </li>
        </ul>
    </div>
    <div class="breadcrumbs">
        <ul>
            <li ng-style="truncateStyle">
                <a class="back-to-proj" ui-sref="project.ref({refId: $ctrl.mmsBranch.id? branch.id : 'master', search: undefined})" ui-sref-opts="{reload:true}"
                    uib-tooltip="{{ $ctrl.currentProject }}" tooltip-trigger="mouseenter" tooltip-popup-delay="100" tooltip-placement="bottom">
                    <i class="fa fa-home" aria-hidden="true"></i>
                </a>
            </li>
            <li ng-style="truncateStyle" ng-show="!$ctrl.isRefsView()" ng-repeat="breadcrumb in $ctrl.breadcrumbs track by $index">
                <span> &#8250;</span>
                <a ui-sref="{{ breadcrumb.link }}" uib-tooltip="{{ breadcrumb.name }}" tooltip-trigger="mouseenter" tooltip-popup-delay="100" tooltip-placement="bottom">
                    <i ng-class="{'fa fa-file': $last && breadcrumb.type === 'doc'}" aria-hidden="true"></i>{{ breadcrumb.name }}
                </a>
            </li>
        </ul>
    </div>

    <div ng-show="!$ctrl.isRefsView()" class="nav navbar-nav navbar-right" style="padding-right: 15px">
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
                        <li ng-repeat="branch in $ctrl.mmsBranches | orderBy:'name' | filter:{name:refFilter} " ng-click="$ctrl.updateBranch(branch)"
                            ng-class="{'checked-list-item': branch.name === $ctrl.currentBranch, 'branch-disabled': branch.status == 'creating'}"
                            is-open="false" tooltip-placement="left" uib-tooltip-html="$ctrl.htmlTooltip"
                            tooltip-append-to-body="branch.status == 'creating'" tooltip-enable="branch.status == 'creating'">
                            <a ng-href="{{$ctrl.getHrefForBranch(branch);}}" ng-style="{display: 'block'}"> {{ branch.name }} </a>
                        </li>
                    </uib-tab>
                    <uib-tab index="1" classes="tab-item" heading="Tags">
                        <li ng-if="tags.length" ng-repeat="tag in $ctrl.mmsTags | orderBy:'name' | filter:{name:refFilter}" ng-click="$ctrl.updateTag(tag)"
                            ng-class="{'checked-list-item': tag.name === $ctrl.currentTag, 'branch-disabled': tag.status == 'creating'}"
                            is-open="false" tooltip-placement="left" uib-tooltip-html="$ctrl.htmlTooltip"
                            tooltip-append-to-body="tag.status == 'creating'" tooltip-enable="tag.status == 'creating'">
                            <a ng-href="{{$ctrl.getHrefForTag(tag);}}" ng-style="{display: 'block'}"> {{ tag.name }} </a>
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
        mmsOrg: '<',
        mmsProject: '<',
        mmsProjects: '<',
        mmsGroup: '<',
        mmsGroups: '<',
        mmsBranch: '<',
        mmsRef: '<',
        mmsRefs: '<',
        mmsBranches: '<',
        mmsTag: '<',
        mmsTags: '<',
        mmsDocument: '<',
        mmsView: '<'
    },
    controller: class VeMenuController {

        static $inject = ['$state', '$sce', '$timeout', '$element', 'CacheService', 'UtilsService', 'RootScopeService'];

        private cache
        private $state
        private $sce
        private $timeout
        private $element
        private utils
        private rootScopeSvc

        //local
        public htmlTooltip;
        public currentProject;
        public currentRef;
        public currentBranch;
        public currentTag;
        public breadcrumbs;
        public truncateStyle;

        //bindings
        public mmsOrg;
        public mmsProject;
        public mmsProjects;
        public mmsGroup;
        public mmsGroups;
        public mmsBranch;
        public mmsRef;
        public mmsRefs;
        public mmsBranches;
        public mmsTag;
        public mmsTags;
        public mmsDocument;
        public mmsView;

        constructor($state, $sce, $timeout, $element, CacheService, UtilsService, RootScopeService) {

            this.$state = $state;
            this.$sce = $sce
            this.$timeout = $timeout;
            this.$element = $element;
            this.cache = CacheService;
            this.utils = UtilsService;
            this.rootScopeSvc = RootScopeService;

            this.htmlTooltip = "Branch temporarily unavailable during duplication.";

        }

        $onInit() {
            this.currentProject = this.mmsProjects.filter((e) => {return e.id === this.mmsProject.id; })[0].name;

            if (this.mmsRef) {
                this.currentRef = this.mmsRef;
                if (this.mmsRef.type === 'Branch') {
                    this.currentBranch = this.mmsBranch.name;
                } else if (this.mmsRef.type === 'Tag') {
                    this.currentTag = this.mmsTag.name;
                }
            }

            let bcrumbs = [];
            let child, parentId;
            let groups = this.mmsGroups;
            let groupsMap = {};

            if (this.mmsGroup !== undefined) {
                for (var i = 0; i < groups.length; i++) {
                    groupsMap[groups[i].id] = {id: groups[i].id, name: groups[i].name, parentId: groups[i]._parentId};
                }
                child = this.mmsGroup;
            }
            if (this.mmsDocument !== undefined) {
                child = this.mmsDocument;
                this.rootScopeSvc.veTitle(this.mmsDocument.name);
            }else{
                this.rootScopeSvc.veTitle(this.currentProject);
            }
            if (child) {
                if (child.type === 'Package') {//child.hasOwnProperty('_id')) {
                    bcrumbs.push({name: child.name, id: child.id, type: "group", alfLink: child._link, link: "project.ref.preview({documentId: 'site_' + breadcrumb.id + '_cover', search: undefined})"});
                    if(child._parentId) {
                        parentId = child._parentId;
                    }
                } else {
                    bcrumbs.push({name: child.name, id: child.id, type: "doc", link: "project.ref.document({documentId: breadcrumb.id, search: undefined})"});
                    if(child._groupId) {
                        parentId = child._groupId;
                    }
                }
                if (parentId) {
                    while(groupsMap[parentId] !== undefined) {
                        var id = groupsMap[parentId].id;
                        bcrumbs.push({name: groupsMap[id].name, id: id, type: "group", link: "project.ref.preview({documentId: 'site_' + breadcrumb.id + '_cover', search: undefined})"});
                        parentId = groupsMap[id].parentId;
                    }
                }
                this.breadcrumbs = bcrumbs.reverse();
                this.$timeout(() => {
                    var eltChildren = this.$element.children().children();
                    var eltWidth = this.$element.parent().width() - eltChildren[0].scrollWidth - eltChildren[2].scrollWidth;
                    var crumbcount = this.breadcrumbs.length;
                    var liWidth = (eltWidth * 0.85)/crumbcount;
                    this.truncateStyle = {'max-width': liWidth, 'white-space': 'nowrap', 'overflow': 'hidden', 'text-overflow': 'ellipsis', 'display': 'inline-block'};
                });
            }


        }

        updateProject(project) {
            if (project) {
                this.$state.go('project.ref', {projectId: project.id, refId: 'master', search: undefined}, {reload: true});
            }
        };

        updateBranch(branch) {
            if (branch.status != 'creating') {
                this.$state.go(this.$state.current.name, {projectId: this.mmsProject.id, refId: branch.id, search: undefined}, {reload: true});
            }
        };

        updateTag(tag) {
            if (tag.status != 'creating') {
                this.$state.go(this.$state.current.name, {projectId: this.mmsProject.id, refId: tag.id, search: undefined}, {reload: true});
            }
        };

        refsView() {
            this.$state.go('project', {projectId: this.mmsProject.id}, {reload: true});
        };

        isRefsView() {
            return this.$state.includes('project') && !(this.$state.includes('project.ref'));
        };


        getHrefForProject(project) {
            var refId = project._refId || 'master';
            return this.utils.PROJECT_URL_PREFIX + project.id + '/' + refId;
        }

        getHrefForBranch(branch) {
            var res = this.utils.PROJECT_URL_PREFIX + this.mmsProject.id + '/' + branch.id;
            if (this.mmsDocument) {
                res += '/documents/' + this.mmsDocument.id;
            }
            if (this.mmsView) {
                res += '/views/' + this.mmsView.id;
            }
            return res;
        }

        getHrefForTag(tag) {
            return this.getHrefForBranch(tag);
        }

     }

}


mmsApp.component(VeMenuComponent.selector,VeMenuComponent);