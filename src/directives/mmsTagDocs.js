'use strict';

angular.module('mms.directives')
.directive('mmsTagDocs', ['ElementService', 'SiteService', 'ViewService', 'ConfigService', 'growl', '$q', '$templateCache', '_', mmsTagDocs]);

/**
 * @ngdoc directive
 * @name mms.directives.directive:mmsTagDocs
 *
 * @requires mms.ElementService
 *
 * @restrict E
 *
 * @description
 *
 * @param {string} mmsTag The id of the site to show documents for
 * @param {string=master} mmsWs Workspace to use, defaults to master
 */
function mmsTagDocs(ElementService, SiteService, ViewService, ConfigService, growl, $q, $templateCache, _) {

    var mmsTagDocsLink = function(scope, element, attrs, mmsViewCtrl) {

        var update = function() {
            var filteredDocs = [];
            scope.docs.forEach(function(snapshot) {
                if (!scope.filtered[snapshot.sysmlid])
                    filteredDocs.push(snapshot);
            });
            scope.snapshots = filteredDocs;
        };

        var ws = scope.mmsWs;
        if (mmsViewCtrl) {
            var viewVersion = mmsViewCtrl.getWsAndVersion();
            if (!ws)
                ws = viewVersion.workspace;
        }
        scope.ws = ws ? ws : 'master';

        ConfigService.getConfig(scope.mmsTag, scope.ws, false, 1)
        .then(function(tag) {
            ConfigService.getConfigSnapshots(scope.mmsTag, scope.ws, false, 1)
            .then(function(docs) {
                scope.filtered = {};
                scope.docs = docs;
                ElementService.getElement("master_filter", false, scope.ws, tag.timestamp, 2)
                .then(function(filter) {
                    scope.filter = filter;
                    scope.filtered = JSON.parse(scope.filter.documentation);
                }).finally(function() {
                    update();
                });
            });
        });
        
    };

    return {
        restrict: 'E',
        template: $templateCache.get('mms/templates/mmsTagDocs.html'),
        scope: {
            mmsWs: '@',
            mmsTag: '@',
        },
        require: '?^mmsView',
        //controller: ['$scope', controller]
        link: mmsTagDocsLink
    };
}