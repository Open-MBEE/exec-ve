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
        var base, child;
        var groups = scope.groups;

        if(scope.group !== undefined) {
            scope.base = {name: scope.group._name, id: scope.group._id};
            child = {type: 'group', obj: scope.group}; 
        }   
        if(scope.document !== undefined) { 
            scope.base = {name: scope.document.name, id: scope.document.id};
            child = {type: 'docview', obj: scope.document}; 
        }
        if(scope.view !== undefined) {
            scope.base = {name: scope.view.name, id: scope.view.id};
            child = {type: 'docview', obj: scope.view};
        }

        if(child) {
            var searchParent = function(child) {
                if(child === undefined)
                    return breadcrumbs;
                else {
                    if(child.type === 'group' && child.obj._parentId !== null) {
                        for(var i = 0; i < groups.length; i++) {
                            if(groups[i]._id == child.obj._parentId) {
                                breadcrumbs.push({name: groups[i]._name, id: groups[i]._id});

                                if(groups[i]._parentId) {
                                    var groupParent = ProjectService.getGroup(groups[i]._parentId, scope.project.id, scope.ref.id);
                                    child = {type: 'group', obj: groupParent};
                                } else {
                                    child = undefined;
                                }
                                break;
                            }
                        }
                    }
                    else if(child.type === 'docview') {
                        if(child.obj._groupId) {
                            var docParent = ProjectService.getGroup(child.obj._groupId, scope.project.id, scope.ref.id);
                            breadcrumbs.push({name: docParent._name, id: docParent._id});
                            child = {type: 'group', obj: docParent};
                        } else if(child.obj.ownerId) {
                            var viewParent = ElementService.getElement({
                                projectId: scope.project.id,
                                refId: scope.ref.id,
                                extended: true,
                                elementId: child.obj.id
                            }, 2);
                            breadcrumbs.push({name: viewParent.name, id: viewParent.id});
                            child = {type: 'docview', obj: viewParent};
                        } else {
                            child = undefined;
                        }
                    } 
                }
                    return searchParent(child);
            };

            breadcrumbs = searchParent(child);
            scope.breadcrumbs = breadcrumbs.reverse();
            console.log("bread: " + scope.breadcrumbs);
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
            group: '<mmsGroup',
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
