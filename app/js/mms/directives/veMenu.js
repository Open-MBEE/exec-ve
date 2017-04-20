'use strict';

angular.module('mmsApp')
.directive('veMenu', ['ProjectService','$state','$rootScope', '$templateCache', '$sce', 'growl', veMenu]);

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
function veMenu(ProjectService, $state, $rootScope, $templateCache, $sce, growl) {
    var template = $templateCache.get('partials/mms/veMenu.html');

    var veMenuLink = function(scope, element, attrs) {

        scope.htmlTooltip = $sce.trustAsHtml('Branch temporarily unavailable during duplication.<br><br>Branch author will be notified by email upon completion.');
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
        var child, parentId;
        var groups = scope.groups;
        var groupsMap = {};

        if(scope.group !== undefined) {
            for (var i = 0; i < groups.length; i++) {
                groupsMap[groups[i]._id] = {id: groups[i]._id, name: groups[i]._name, parentId: groups[i]._parentId};
            }
            child = scope.group; 
        }
        if(scope.document !== undefined) {
            child = scope.document; 
        }
        if(child) {
            if(child.hasOwnProperty('_id')) {
                bcrumbs.push({name: child._name, id: child._id, type: "group", link: "project.ref.preview({documentId: 'site_' + breadcrumb.id + '_cover', search: undefined})"});
                if(child._parentId) {
                    parentId = child._parentId;   
                }
            } else {
                bcrumbs.push({name: child.name, id: child.id, type: "doc", link: "project.ref.document({documentId: breadcrumb.id, search: undefined})"});
                if(child._groupId) {
                    parentId = child._groupId;
                }
            }
            if(parentId) {
                while(groupsMap[parentId] !== undefined) {
                    var id = groupsMap[parentId].id;
                    bcrumbs.push({name: groupsMap[id].name, id: id, type: "group", link: "project.ref.preview({documentId: 'site_' + breadcrumb.id + '_cover', search: undefined})"});
                    parentId = groupsMap[id].parentId;   
                } 
            }
            scope.breadcrumbs = bcrumbs.reverse();
            var eltWidth = element.parent().width();
            var crumbcount = scope.breadcrumbs.length;
            var liWidth = (eltWidth * 0.75)/crumbcount;
            scope.truncateStyle={'max-width': liWidth, 'white-space': 'nowrap', 'overflow': 'hidden', 'text-overflow': 'ellipsis', 'display': 'inline-block'};
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
