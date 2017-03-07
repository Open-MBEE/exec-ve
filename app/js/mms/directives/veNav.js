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

        scope.switchOrg = function() {
            var instance = $uibModal.open({
                templateUrl: 'partials/mms/selectModal.html',
                scope: scope,
                controller: ['$scope','$uibModalInstance', function($scope, $uibModalInstance) {

                    if(scope.org.name === $scope.org.name)
                        $scope.orgChecked = true;

                    var orgId, projectId;
                    $scope.orgClicked = function(org) { 
                        if(org) {
                            orgId = org.id;
                            $scope.selectedOrg = org.name;
                            $scope.projects = ProjectService.getProjects(orgId);
                        }
                    }; 

                    if(scope.project.name === $scope.project.name)
                        $scope.projectChecked = true;

                    $scope.projectClicked = function(project) {
                        if(project)
                            projectId = project.id;
                            $scope.selectedProject = project.name;
                    };
                    $scope.continue = function() {
                        if(orgId && projectId)
                            $state.go('project.ref', {orgId: orgId, projectId: projectId, refId: 'master'});
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
            var instance = $uibModal.open({
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
            }, function(failure) {
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
        scope.stagingView = function(){
            var hostName = $location.host();
            var address = "https://cae-ems-uat.jpl.nasa.gov";
            if (hostName !== 'localhost' && hostName.split('.')[0].substr(-3) !== 'uat')
                address = 'https://' + hostName.split('.')[0] + '-uat.jpl.nasa.gov';
            window.open(address ,'_blank');
        };
    };

    return {
        restrict: 'E',
        template: template,
        scope: {
            title: '@mmsTitle', //page title - used in mobile view only
            org: '<mmsOrg',
            orgs: '<mmsOrgs',
            project: '<mmsProject',
            projects: '<mmsProjects',
            ref: '<mmsRef',
            branch: '<mmsBranch',
            branches: '<mmsBranches',
            tag: '<mmsTag',
            tags: '<mmsTags'
        },
        link: veNavLink
    };
}