'use strict';

angular.module('mms.directives')
.directive('mmsMenu', ['SiteService', 'WorkspaceService', 'ConfigService', '$state', '$templateCache', 'growl', 'hotkeys', mmsMenu]);

/**
 * @ngdoc directive
 * @name mms.directives.directive:mmsNav
 *
 * @requires mms.SiteService
 * @requires $templateCache
 *
 * @restrict E
 *
 * @description
 * A prebuilt nav bar that's customizable with current page title, current site,
 * and the "type" of page/app. Include navigation to other sites' dashboard
 * and docweb pages.
 * ## Example
 *  <pre>
    <mms-nav mms-title="Model Manager" mms-ws="master" mms-config="tag" mms-site="europa"></mms-nav>
    </pre>
 * ## Support for responsive sliding pane on small browser
 *  <pre>
    <div id="outer-wrap">
        <div id="inner-wrap">
            <mms-nav mms-title="Model Manager" mms-ws="master" mms-config="tag" mms-site="europa"></mms-nav>
            <!-- everything visible on the page should go in here -->
        </div>
    </div>
    </pre>
 * @param {string} mmsWs workspace name
 * @param {object} mmsSite site object
 * @param {object} mmsDoc document object
 * @param {object} mmsConfig tag/config object
 * @param {string} mmsTitle Title to display
 */
function mmsMenu(SiteService, WorkspaceService, ConfigService, $state, $templateCache, growl) {
    var template = $templateCache.get('mms/templates/mmsMenu.html');

    var mmsMenuLink = function(scope, element, attrs) {
        var catNames = [];
        var sites = {};

        scope.updateWorkspace = function() {
            $state.go($state.current.name, {workspace: scope.ws, tag: undefined, search: undefined});
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