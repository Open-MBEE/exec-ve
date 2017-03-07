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

        var projectId, branchId, tagId;

        if(scope.project.name === scope.currentProject)
            scope.isCurrentProject = true;

        scope.updateProject = function(project) {
            if(project) {
                projectId = project.Id;
                $state.go('project.ref', {projectId: projectId, refId: 'master'});
            }
        };
        scope.isRefsView = function(){ 

        };
        scope.refsView = function(){ //the "project" state?
            $state.go('project', {search: undefined});
        };

        if(scope.branch.name === scope.currentBranch)
            scope.isCurrentBranch = true;

        scope.updateBranch = function(branch) {
            $state.go($state.current.name, {projectId: scope.project.Id, refId: branch.Id});
        };

        if(scope.tag.name === scope.currentTag)
            scope.isCurrentTag = true;

        scope.updateTag = function(tag) {
            $state.go($state.current.name, {projectId: scope.project.Id, refId: tag.id});
        };
        scope.latestTag = function() {
            $state.go($state.current.name, {projectId: scope.project.Id, refId: 'latest'});
        };

        // ProjectService.getRef(scope.ws)
        // .then(function(data) {
        //     scope.wsName = data.name;
        // });

        /*if (scope.config && scope.config !== '' && scope.config !== 'latest') {
            ConfigService.getConfig(scope.config, scope.ws, false)
            .then(function(data) {
                scope.configName = data.name;
            });
        } else {
            scope.config = 'latest';
        } */
        // if (!scope.site)
        //     return;
        // var currSiteParentId = scope.site.parent;
        // var isCharacterization = scope.site.isCharacterization;
        // var breadcrumbs = [];
        // breadcrumbs.push({name: scope.project.name, id: scope.project.Id});
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
