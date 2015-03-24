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
 * Given an element id, puts in the element's name binding, if there's a parent 
 * mmsView directive, will notify parent view of transclusion on init and name change,
 * and on click
 *
 * @param {string} mmsEid The id of the element whose name to transclude
 * @param {string=master} mmsWs Workspace to use, defaults to master
 * @param {string=latest} mmsVersion Version can be alfresco version number or timestamp, default is latest
 */
function mmsWorkspaceDocs(ElementService, SiteService, ViewService, growl, $q, $templateCache, _) {

    var mmsWorkspaceDocsLink = function(scope, element, attrs, mmsViewCtrl) {

        var docs = [];
        var docsKey = {};
        scope.docs = docs;
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

        var filterPromises = [];

        SiteService.getSites(version)
        .then(function(sites) {
            sites.forEach(function(site) {
                ViewService.getSiteDocuments(site.sysmlid, false, ws, version)
                .then(function(sitedocs) {
                    ElementService.getElement(site.sysmlid + '_filtered_docs', false, ws, version)
                    .then(function(filter) {
                        var sitefilter = JSON.parse(filter.documentation);
                        _.merge(filtered, sitefilter);
                    }, function(reason) {
                    }).finally(function() {
                        sitedocs.forEach(function(doc) {
                            if (!filtered[doc.sysmlid]) {
                                if (!docsKey[doc.sysmlid]) {
                                    docsKey[doc.sysmlid] = doc;
                                    docs.append(doc);
                                }
                            }
                        });
                    });
                }, function(reason) {

                });
            });
        }, function(reason) {

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