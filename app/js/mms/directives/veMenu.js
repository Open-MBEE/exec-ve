'use strict';

angular.module('mmsApp')
.directive('veMenu', ['ProjectService','$state','$rootScope', '$templateCache', 'growl', veMenu]);

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
        if (scope.ref) {
            scope.currentRef = scope.ref;
            if (scope.ref.type === 'Branch') {
                scope.currentBranch = scope.branch.name;
            } else if (scope.ref.type === 'Tag') {
                scope.currentTag = scope.tag.name;
            }
        } 

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
            if ( $state.includes('project') && !($state.includes('project.ref')) ) {
                return true;
            } else {
                return false;
            }
        };
        scope.refsView = function(){
            $state.go('project', {projectId: scope.project.id});
        };

        var bcrumbs = [];
        var child, parentId, display;
        var groups = scope.groups;
        
        var searchParent = function(kidId) {
            while(kidId !== scope.org.id) {
                for(var i = 0; i < groups.length; i++) {
                    if(groups[i]._id == kidId) {
                        bcrumbs.push({name: groups[i]._name, id: groups[i]._id, type: "group", link: "project.ref.preview({documentId: 'site_' + breadcrumb.id + '_cover', search: undefined})"});
                        kidId = groups[i]._parentId;
                        break;
                    } 
                }        
            }  
        };

        if(scope.group !== undefined) {
            child = scope.group; 
        }
        if(scope.document !== undefined) {
            child = scope.document; 
        }

        if(child) {
            if(child.hasOwnProperty('_id')) {
                bcrumbs.push({name: child._name, id: child._id, type: "group", link: "project.ref.preview({documentId: 'site_' + breadcrumb.id + '_cover', search: undefined})"});
                if(child._parentId) 
                    parentId = child._parentId;   
            } else {
                bcrumbs.push({name: child.name, id: child.id, type: "doc", link: "project.ref.document({documentId: breadcrumb.id, search: undefined})"});
                if(child._groupId) 
                    parentId = child._groupId;
            }

            if(parentId)
                searchParent(parentId);

            scope.breadcrumbs = bcrumbs.reverse();

            var eltWidth = element.parent().width();
            var crumbcount = scope.breadcrumbs.length;
            var liWidth = (eltWidth * 0.75)/crumbcount;
            scope.truncateStyle={'max-width': liWidth};
        }
    };

    return {
        restrict: 'E',
        template: template,
        scope: {
            org: '<mmsOrg',
            project: '<mmsProject',
            projects: '<mmsProjects',
            group: '<mmsGroup',
            groups: '<mmsGroups',
            branch: '<mmsBranch',
            ref: '<mmsRef',
            refs: '<mmsRefs',
            branches: '<mmsBranches',
            tag: '<mmsTag',
            tags: '<mmsTags',
            document: '<mmsDocument'
        },
        link: veMenuLink
    };
}
