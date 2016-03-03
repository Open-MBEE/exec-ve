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

        SiteService.getSites()
        .then(function(data) {
            // var sites = {};
            //var catNames = [];
            for (var i = 0; i < data.length; i++) {
                var site = data[i];
                site.isOpen = true;
                if (site.sysmlid === scope.site)
                    scope.siteTitle = site.name;
                // TODO: Replace with .parent
                site.categories = ["Uncategorized"];
                if (site.categories.length === 0)
                    site.categories.push("Uncategorized");
                for (var j = 0; j < site.categories.length; j++) {
                    var cat = site.categories[j];
                    catNames.push(cat);
                    if (sites.hasOwnProperty(cat)) {
                        sites[cat].push(site);
                    } else {
                        sites[cat] = [site];
                    }
                }
            }
            scope.categories = sites;
            for(var k = 0; k < catNames.length; k++){
                var str = catNames[k];
                scope.categories[str].open = false;
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