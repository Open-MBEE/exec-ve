'use strict';

angular.module('mmsApp')
.directive('veNav', ['$templateCache', '$rootScope', '$state', 'hotkeys', 'growl', '$location', '$uibModal', 'ApplicationService','AuthService', 'ProjectService', veNav]);

/**
 * @ngdoc directive
 * @name mms.directives.directive:veNav
 *
 * @requires $templateCache
 *
 * @restrict E
 *
 * @description
 * A prebuilt nav bar that's customizable with current page title,
 * and the "type" of page/app. Include navigation to other sites' dashboard
 * and docweb pages.
 * ## Example
 *  <pre>
    <mms-nav mms-title="Model Manager"></mms-nav>
    </pre>
 * ## Support for responsive sliding pane on small browser
 *  <pre>
    <div id="outer-wrap">
        <div id="inner-wrap">
            <mms-nav mms-title="Model Manager"></mms-nav>
            <!-- everything visible on the page should go in here -->
        </div>
    </div>
    </pre>
 * @param {string} mmsTitle Title to display
 */
function veNav($templateCache, $rootScope, $state, hotkeys, growl, $location, $uibModal, ApplicationService, AuthService, ProjectService) {
    var template = $templateCache.get('partials/mms/veNav.html');

    var veNavLink = function(scope, element, attrs) {

        scope.updateOrg = function() {
            var instance = $uibModal.open({
                templateUrl: 'partials/mms/selectModal.html',
                scope: scope,
                controller: ['$scope', '$uibModalInstance', function($scope, $uibModalInstance) {

                    $scope.selectedOrg = $scope.org.name;
                    $scope.selectedProject = $scope.project.name;

                    var orgId = $scope.org.id;
                    var projectId = $scope.project.id;

                    $scope.selectOrg = function(org) { 
                        if(org) {
                            orgId = org.id;
                            $scope.selectedOrg = org.name;
                            $scope.selectedProject = "";
                            ProjectService.getProjects(orgId).then(function(data) {
                                $scope.projects = data;
                                if (data.length > 0) {
                                    $scope.selectProject(data[0]);
                                } else {
                                    //no projects
                                }
                            });
                        }
                    }; 
                    $scope.selectProject = function(project) {
                        if(project) {
                            projectId = project.id;
                            $scope.selectedProject = project.name;
                        }
                    };
                    $scope.spin = false;
                    $scope.continue = function() {
                        if(orgId && projectId) {
                            $scope.spin = true;
                            $state.go('project.ref', {orgId: orgId, projectId: projectId, refId: 'master', search: undefined}).then(function(data) {
                            }, function(reject) {
                                $scope.spin = false;
                            });
                        }
                    };
                    $scope.cancel = function() {
                        $uibModalInstance.dismiss();
                    };
                }]
            });
        };
        scope.toggleHelp = function() {
            hotkeys.toggleCheatSheet();
        };
        scope.toggleAbout = function() {
            scope.veV = '3.0.0';
            scope.mmsV = 'Loading...';
            ApplicationService.getMmsVersion().then(function(data) {
                scope.mmsV = data;
            }, function(reason) {
                scope.mmsV = "Could not retrieve due to failure: " + reason.message;
            });
            $uibModal.open({
                templateUrl: 'partials/mms/about.html',
                scope: scope,
                controller: ['$scope', '$uibModalInstance', function($scope, $uibModalInstance) {
                    $scope.cancel = function() {
                        $uibModalInstance.dismiss();
                    };
                }]
            });
        };
        scope.logout = function() {
            AuthService.logout().then(function() {
                $state.go('login');
            }, function() {
                growl.error('You were not logged out');
            });
        };

        scope.searchClass = "";
        scope.search = function(searchText) {
            if ($state.includes('project.ref.document.order')) {
                growl.warning("Please finish reorder action first.");
                return;
            } else if ($state.includes('project.diff')) {
                growl.warning("Please finish diff action first.");
                return;
            } else {
                if ($state.params.search === searchText)
                    return;
                scope.searchClass = "fa fa-spin fa-spinner";
                $state.go($state.current.name, {search: searchText});
            }
        };
        scope.stagingView = function(){ //changing to something "opencae"?
            var hostName = $location.host();
            var address = "https://cae-ems-uat.jpl.nasa.gov";
            if (hostName !== 'localhost' && hostName.split('.')[0].substr(-3) !== 'uat')
                address = 'https://' + hostName.split('.')[0] + '-uat.jpl.nasa.gov';
            window.open(address ,'_blank');
        };
        scope.displayUsername = function(){
            var username = AuthService.checkLogin();
            if (username) {
                return username;
            } else {
                return 'Logged Out'; //what to display for this?
            }       
        };
    };

    return {
        restrict: 'E',
        template: template,
        scope: {
            title: '<mmsTitle', //page title - used in mobile view only
            org: '<mmsOrg',
            orgs: '<mmsOrgs',
            project: '<mmsProject',
            projects: '<mmsProjects',
            ref: '<mmsRef',
            branch: '<mmsBranch',
            branches: '<mmsBranches',
            tag: '<mmsTag',
            tags: '<mmsTags',
            search: '<mmsSearch'
        },
        link: veNavLink
    };
}