'use strict';

angular.module('mms.directives')
.directive('mmsMenu', ['SiteService', 'WorkspaceService', 'ConfigService', '$state', '$templateCache', 'growl', 'hotkeys', mmsMenu]);

/**
 * @ngdoc directive
 * @name mms.directives.directive:mmsMenu
 *
 * @requires mms.SiteService
 * @requires $templateCache
 *
 * @restrict E
 *
 * @description
 * TBA
 *
 */
function mmsMenu(SiteService, WorkspaceService, ConfigService, $state, $templateCache, growl) {
    var template = $templateCache.get('mms/templates/mmsMenu.html');

    var mmsMenuLink = function(scope, element, attrs) {
        var catNames = [];
        var sites = {};
        
        scope.isTasksAndTagsView = function(){
             if ($state.includes('workspaces') && 
                ! ($state.includes('workspace.site') || $state.includes('workspace.sites') ))
                return true;
            else 
                return false;
        };
        scope.tasksAndTagsView = function(){
            $state.go('workspaces', {search: undefined});
        };        
        scope.updateWorkspace = function(wsId) {
            $state.go($state.current.name, {workspace: wsId, tag: undefined, search: undefined});
        };
        scope.updateTag = function() {
            $state.go($state.current.name, {tag: scope.config.id, search: undefined});
        };
        scope.latestTag = function() {
            $state.go($state.current.name, {tag: undefined, search: undefined});
        };

        WorkspaceService.getWorkspace(scope.ws)
        .then(function(data) {
            scope.wsName = data.name;
        });
        
        /*if (scope.config && scope.config !== '' && scope.config !== 'latest') {
            ConfigService.getConfig(scope.config, scope.ws, false)
            .then(function(data) {
                scope.configName = data.name;
            });
        } else {
            scope.config = 'latest';
        } */

        var currSiteParentId = scope.site.parent;
        var isCharacterization = scope.site.isCharacterization;
        var breadcrumbs = [];
        breadcrumbs.push({name: scope.site.name, sysmlid: scope.site.sysmlid});
        
        SiteService.getSites()
        .then(function(data) {
            for (var i = data.length -1 ; i >= 0; i--) {
                var site = data[i];
                var siteParent = site.parent;
                var siteIsChara = site.isCharacterization;
                if (site.sysmlid == currSiteParentId && isCharacterization === siteIsChara) {
                  breadcrumbs.push({name: site.name, sysmlid: site.sysmlid});
                  if (site.parent) {
                    currSiteParentId = site.parent;
                  }
                }
            }
        }, function(reason) {
            growl.error("Sites Error: " + reason.message);
        });
    };

    return {
        restrict: 'E',
        template: template,
        scope: {
            title: '@mmsTitle', //page title - used in mobile view only
            ws: '@mmsWs',
            site: '=mmsSite', //site object
            product: '=mmsDoc', //document object
            config: '=mmsConfig', //config object
            snapshot: '@mmsSnapshotTag', // snapshot titles (before tags - need to be backward compatible), if any
            showTag: '@mmsShowTag',
            tags: '=mmsTags',
            workspaces: '=mmsWorkspaces'
        },
        link: mmsMenuLink
    };
}