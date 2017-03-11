'use strict';

angular.module('mmsApp')
.directive('veMenu', ['ProjectService', '$state', '$rootScope', '$templateCache', 'growl', veMenu]);

/**
 * @ngdoc directive
 * @name mms.directives.directive:veMenu
 *
 * @requires mms.ProjectService
 * @requires $state
 * @requires $templateCache
 * @requires growl
 *
 * @restrict E
 *
 * @description
 * //TODO - update
 * veMenu is responsible for gathering all breadcrumbs for current view and
 * displaying breadcrumbs accordingly. When a specific product is selected,
 * the product name will be displayed as well. Breadcrumb list is truncated to
 * to fit window width.
 * veMenu is also repsonsible for gathering and displaying all tasks and tags
 * for specific view.
 *
 */
function veMenu(ProjectService, $state, $rootScope, $templateCache, growl) {
    var template = $templateCache.get('partials/mms/veMenu.html');

    var veMenuLink = function(scope, element, attrs) {

        scope.currentProject = scope.project.name;
        scope.currentBranch = scope.branch.name;
        scope.currentTag = scope.tag.name;

        var projList = scope.projects;
        var branchList = scope.branches;
        var tagList = scope.tags;

        scope.updateProjectChecked = function() {
            for(var i=0; i<projList; i++) {
                if(scope.currentProject === projList[i].name)
                    scope.project.checked = true;
            }
        };
        scope.updateBranchChecked = function() {
            for(var i=0; i<branchList; i++) {
                if(scope.currentBranch === branchList[i].name)
                    scope.branch.checked = true;
            }
        };
        scope.updateTagChecked = function() {
            for(var i=0; i<tagList; i++) {
                if(scope.currentTag === tagList[i].name)
                    scope.tag.checked = true;
            }
        };

        var projectId, branchId, tagId;

        scope.updateProject = function(project) {
            if(project) {
                projectId = project.id;
                $state.go('project.ref', {projectId: projectId, refId: 'master'});
            }
        };
        scope.updateBranch = function(branch) {
            $state.go($state.current.name, {projectId: scope.project.id, refId: branch.id});
        };
        scope.updateTag = function(tag) {
            $state.go($state.current.name, {projectId: scope.project.id, refId: tag.id});
        };
        scope.latestTag = function() {
            $state.go($state.current.name, {projectId: scope.project.id, refId: 'latest'});
        };

        scope.isRefsView = function(){
            if ( $state.is('project') ) {
                return true;
            } else {
                return false;
            }
        };
        scope.refsView = function(){
            $state.go('project', {projectId: scope.project.id});
        };



        // if (!scope.site)
        //     return;
        // var currSiteParentId = scope.site.parent;
        // var isCharacterization = scope.site.isCharacterization;
        // var breadcrumbs = [];
        // breadcrumbs.push({name: scope.project.name, id: scope.project.id});
        // var eltWidth = element.parent().width();

        // SiteService.getSites()
        // .then(function(data) {
        //     for (var i = data.length -1 ; i >= 0; i--) {
        //         var site = data[i];
        //         var siteParent = site.parent;
        //         var siteIsChara = site.isCharacterization;
        //         if (site.id == currSiteParentId && isCharacterization === siteIsChara) {
        //           breadcrumbs.push({name: site.name, id: site.id});
        //           if (site.parent) {
        //             currSiteParentId = site.parent;
        //           }
        //         }
        //     }
        //     scope.breadcrumbs = breadcrumbs.reverse();
        //     var Bcount = scope.breadcrumbs.length;
        //     if (scope.product) {
        //       Bcount++;
        //     }
        //     var liWidth = (eltWidth*0.75)/Bcount;
        //     scope.truncateStyle={'max-width':liWidth};
        // }, function(reason) {
        //     growl.error("Sites Error: " + reason.message);
        // });
    };

    return {
        restrict: 'E',
        template: template,
        scope: {
            title: '@mmsTitle', //page title - used in mobile view only
            org: '<mmsOrg',
            project: '<mmsProject',
            projects: '<mmsProjects',
            branch: '<mmsBranch',
            branches: '<mmsBranches',
            tag: '<mmsTag',
            tags: '<mmsTags'
        },
        link: veMenuLink
    };
}
