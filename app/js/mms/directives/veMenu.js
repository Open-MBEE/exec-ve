'use strict';

angular.module('mmsApp')
.directive('veMenu', ['ProjectService', 'ViewService', 'ElementService', '$state', '$rootScope', '$templateCache', 'growl', veMenu]);

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
function veMenu(ProjectService, ViewService, ElementService, $state, $rootScope, $templateCache, growl) {
    var template = $templateCache.get('partials/mms/veMenu.html');

    var veMenuLink = function(scope, element, attrs) {

        scope.currentProject = scope.project.name;
        scope.currentBranch = scope.branch.name;
        scope.currentTag = scope.tag.name;

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

        var breadcrumbs = [];
        var base, groupId;

        if($state.current.name === 'project.ref.document') {
            base = scope.document;
        }
        else if($state.current.name === 'project.ref.document.view') {
            base = scope.view;
        }

        if(base) {
            scope.base = {name: base.name, id: base.id};
            groupId = base._groupId;
            var groups = scope.groups;

            while(groupId !== null) {
                for(var i = 0; i < groups.length; i++) {
                    if(groups[i]._id == groupId) {
                        breadcrumbs.push({name: groups[i]._name, id: groups[i]._id});
                        groupId = groups[i]._parentId;
                        break;
                    }
                }
            }
        }
        breadcrumbs = breadcrumbs.reverse();
        scope.breadcrumbs = breadcrumbs;

    };

    return {
        restrict: 'E',
        template: template,
        scope: {
            org: '<mmsOrg',
            project: '<mmsProject',
            projects: '<mmsProjects',
            groups: '<mmsGroups',
            branch: '<mmsBranch',
            ref: '<mmsRef',
            refs: '<mmsRefs',
            branches: '<mmsBranches',
            tag: '<mmsTag',
            tags: '<mmsTags',
            document: '<mmsDocument',
            view: '<mmsView',
            views: '<mmsViews'
        },
        link: veMenuLink
    };
}
