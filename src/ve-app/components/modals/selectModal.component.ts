import * as angular from 'angular';
var veApp = angular.module('veApp');

let SelectModalComponent: angular.ve.ComponentOptions = {
    selector: 'selectModal',
    template: `
    <div id="modal-window" class="ve-dark-modal">
    <div class="modal-header">
        <h4 class="modal-title">Switch Org</h4>
    </div>
    <div class="modal-body" id="modal-body">
        <div class="btn-group ve-dark-dropdown-wide" uib-dropdown>
            <span class="label-dropdown">Org:</span>
            <button id="project-btn-keyboard-nav" type="button" class="dropdown-toggle" uib-dropdown-toggle>
                <span>{{ $ctrl.selectedOrg }}<i class="fa fa-caret-down" aria-hidden="true"></i></span>
            </button>
            <ul class="dropdown-menu list-with-selected-item" uib-dropdown-menu role="menu"
                aria-labelledby="project-btn-keyboard-nav">
                <li ng-repeat="org in $ctrl.orgs | orderBy: 'name'" ng-click="$ctrl.selectOrg(org)"
                    ng-class="{'checked-list-item': org.name === $ctrl.selectedOrg}">{{ org.name }}
                </li>
            </ul>
        </div>
        <div class="btn-group ve-dark-dropdown-wide" uib-dropdown keyboard-nav>
            <span class="label-dropdown">Project:</span>
            <button id="module-btn-keyboard-nav" type="button" class="dropdown-toggle" uib-dropdown-toggle
                    ng-disabled="!$ctrl.selectedOrg || !$ctrl.projects.length">
                <span ng-hide="$ctrl.projects.length">No Projects for selected Org</span>
                <span ng-show="$ctrl.projects.length">{{ $ctrl.selectedProject }}<i class="fa fa-caret-down" aria-hidden="true"></i></span>
            </button>
            <ul class="dropdown-menu list-with-selected-item" uib-dropdown-menu role="menu"
                aria-labelledby="module-btn-keyboard-nav">
                <li ng-repeat="project in $ctrl.projects | orderBy: 'name'" ng-click="$ctrl.selectProject(project)"
                    ng-class="{'checked-list-item': project.name === $ctrl.selectedProject}">{{ project.name }}
                </li>
            </ul>
        </div>
    </div>
    <div class="modal-footer ng-scope">
        <button class="btn btn-primary" type="button" ng-click="$ctrl.continue()" ng-disabled="!$ctrl.selectedProject || !$ctrl.selectedOrg">
            Continue<span ng-if="spin"><i class="fa fa-spin fa-spinner"></i></span>
        </button>
        <button class="btn btn-default" type="button" ng-click="$ctrl.cancel()">Cancel</button>
    </div>
</div>
`,
    bindings: {
        modalInstance: "<",
        resolve: "<"
    },
    controller: class SelectModalController implements angular.IComponentController {

        static $inject = ['$state', 'ProjectService'];

        private $state;
        private projectSvc;

        //bindings
        private modalInstance;
        private resolve;

        //local
        public spin;
        public orgId;
        public projectId;
        public selectedOrg;
        public selectedProject;
        public orgs;
        public projects;


        constructor($state, ProjectService) {
            this.$state = $state;
            this.projectSvc = ProjectService;
            this.spin = false;
        }

        $onInit() {
            this.orgs = this.resolve.mmsOrgs;
            this.projects = this.resolve.mmsProjects;

            this.orgId = this.resolve.mmsOrg.id;
            this.projectId = this.resolve.mmsProject.id;

            this.selectedOrg = this.resolve.mmsOrg.name;
            this.selectedProject = this.projects.filter((e) => {
                return e.id === this.projectId;
            })[0].name;



        }

        selectOrg(org) {
            if(org) {
                this.orgId = org.id;
                this.selectedOrg = org.name;
                this.selectedProject = "";
                this.projectSvc.getProjects(this.orgId).then((data) => {
                    this.projects = data;
                    if (data && data.length > 0) {
                        this.selectProject(data[0]);
                    } else {
                        //no projects
                    }
                });
            }
        };

        selectProject(project) {
            if(project) {
                this.projectId = project.id;
                this.selectedProject = project.name;
            }
        };

        continue() {
            if(this.orgId && this.projectId) {
                // was the same project selected? cancel...
                if (this.resolve.mmsProject.orgId === this.orgId &&
                    this.resolve.mmsProject.id === this.projectId) {
                    this.cancel();
                }
                else {
                    this.spin = true;
                    this.$state.go('main.project.ref', {orgId: this.orgId, projectId: this.projectId, refId: 'master', search: undefined}).then((data) => {
                    }, (reject) => {
                        this.spin = false;
                    });
                }
            }
        };

        cancel() {
            this.modalInstance.dismiss();
        };

    }
};

veApp.component(SelectModalComponent.selector,SelectModalComponent);