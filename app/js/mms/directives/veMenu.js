'use strict';

angular.module('mmsApp')
.directive('veMenu', ['CacheService','$state','$templateCache','$sce',veMenu]);

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
function veMenu(CacheService, $state, $templateCache, $sce) {
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

        scope.updateProject = function(project) {
            if (project) {
                $state.go('project.ref', {projectId: project.id, refId: 'master', search: undefined}, {reload: true});
            }
        };
        scope.updateBranch = function(branch) {
            $state.go($state.current.name, {projectId: scope.project.id, refId: branch.id, search: undefined}, {reload: true});
        };
        scope.updateTag = function(tag) {
            $state.go($state.current.name, {projectId: scope.project.id, refId: tag.id, search: undefined}, {reload: true});
        };
        scope.refsView = function() {
            $state.go('project', {projectId: scope.project.id}, {reload: true});
        };
        scope.isRefsView = function() {
            if ( $state.includes('project') && !($state.includes('project.ref')) ) {
                return true;
            } else {
                return false;
            }
        };
        scope.$on("stomp.branchCreated", function(event, createdRef, projectId) {
            var cacheKey = ['refs', scope.project.id];
            if (CacheService.exists(cacheKey) && scope.project.id === projectId) {
                var refObs = CacheService.get(cacheKey);
                var tag = [];
                for (var i = 0; i < refObs.length; i++) {
                    if (refObs[i].type === "Tag")
                        tag.push(refObs[i]);
                }
                scope.tags = tag;

                var branches = [];
                for (var j = 0; j < refObs.length; j++) {
                    if (refObs[j].type === "Branch")
                        branches.push(refObs[j]);
                }
                scope.branches = branches;

            }

            //var index = -1;
            //if (createdRef.type === 'Branch') {
            //    index = _.findIndex(scope.branches, {name: createdRef.id});
            //    if ( index > -1 ) {
            //        scope.branches[index].loading = false;
            //        // scope.branches[index] = createdRef;
            //    }
            //} else if (createdRef.type === 'Tag') {
            //    index = _.findIndex(scope.tags, {name: createdRef.id});
            //    if ( index > -1 ) {
            //        scope.tags[index].loading = false;
            //        // scope.tags[index] = createdRef;
            //    }
            //}
        });

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
