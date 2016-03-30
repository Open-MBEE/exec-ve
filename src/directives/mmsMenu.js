'use strict';

angular.module('mms.directives')
.directive('mmsMenu', ['SiteService', 'WorkspaceService', 'ConfigService', '$state', '$templateCache', 'growl', mmsMenu]);

/**
 * @ngdoc directive
 * @name mms.directives.directive:mmsMenu
 *
 * @requires mms.SiteService
 * @requires mms.WorkspaceService
 * @requires mms.ConfigService
 * @requires $state
 * @requires $templateCache
 * @requires growl
 *
 * @restrict E
 *
 * @description
 * //TODO - update
 * mmsMenu is responsible for gathering all breadcrumbs for current view and
 * displaying breadcrumbs accordingly. When a specific product is selected,
 * the product name will be displayed as well. Breadcrumb list is truncated to
 * to fit window width.
 * mmsMenu is also repsonsible for gathering and displaying all tasks and tags
 * for specific view.
 *
 */
function mmsMenu(SiteService, WorkspaceService, ConfigService, $state, $templateCache, growl) {
    var template = $templateCache.get('mms/templates/mmsMenu.html');

    var mmsMenuLink = function(scope, element, attrs) {

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
        var eltWidth = element.parent().width();

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
            scope.breadcrumbs = breadcrumbs.reverse();
            var Bcount = scope.breadcrumbs.length;
            if (scope.product) {
              Bcount++;
            }
            var liWidth = (eltWidth*0.75)/Bcount;
            scope.truncateStyle={'max-width':liWidth};
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
