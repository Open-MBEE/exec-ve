'use strict';

angular.module('mms.directives')
.directive('mmsWorkspaceDocs', ['ElementService', 'SiteService', 'ViewService', 'growl', '$q', '$templateCache', '_', mmsWorkspaceDocs]);

/**
 * @ngdoc directive
 * @name mms.directives.directive:mmsWorkspaceDocs
 *
 * @requires mms.ElementService
 *
 * @restrict E
 *
 * @description
 *
 * @param {string=master} mmsWs Workspace to use, defaults to master
 * @param {string=latest} mmsVersion Version can be alfresco version number or timestamp, default is latest
 */
function mmsWorkspaceDocs(ElementService, SiteService, ViewService, growl, $q, $templateCache, _) {

    var mmsWorkspaceDocsLink = function(scope, element, attrs, mmsViewCtrl) {

        var docs = [];
        //scope.docs = docs;
        var docsKey = {};
        var filtered = {};
        var ws = scope.mmsWs;
        var version = scope.mmsVersion;
        if (mmsViewCtrl) {
            var viewVersion = mmsViewCtrl.getWsAndVersion();
            if (!ws)
                ws = viewVersion.workspace;
            if (!version)
                version = viewVersion.version;
        }
        scope.version = version ? version : 'latest';
        scope.ws = ws ? ws : 'master';

        var deferred = $q.defer();
        var filterPromises = [deferred.promise];
        var gotfilter = false;
        SiteService.getSites(version)
        .then(function(sites) {
            sites.forEach(function(site) {
                var siteDeferred = $q.defer();
                filterPromises.push(siteDeferred.promise);
                ViewService.getSiteDocuments(site.sysmlId, false, ws, version, 1)
                .then(function(sitedocs) {
                    ElementService.getElement("master_filter", false, ws, version, 2)
                    .then(function(filter) {
                        if (gotfilter)
                            return;
                        filtered = JSON.parse(filter.documentation);
                        gotfilter = true;
                    }, function(reason) {
                    }).finally(function() {
                        sitedocs.forEach(function(doc) {
                            if (!filtered[doc.sysmlId]) {
                                if (!docsKey[doc.sysmlId]) {
                                    docsKey[doc.sysmlId] = doc;
                                    docs.push(doc);
                                }
                            }
                        });
                        siteDeferred.resolve('ok');
                    });
                }, function(reason) {
                    siteDeferred.resolve('ok');
                });
            });
            
        }, function(reason) {

        }).finally(function() {
            deferred.resolve('ok');
            $q.all(filterPromises).then(function(data) {
                scope.docs = docs;
            }, function(bad) {
                scope.docs = docs;
            });
        });
    };

    return {
        restrict: 'E',
        template: $templateCache.get('mms/templates/mmsWorkspaceDocs.html'),
        scope: {
            mmsWs: '@',
            mmsVersion: '@'
        },
        require: '?^mmsView',
        //controller: ['$scope', controller]
        link: mmsWorkspaceDocsLink
    };
}