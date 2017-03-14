'use strict';

angular.module('mms.directives')
.directive('mmsSiteDocs', ['ElementService', 'SiteService', 'ViewService', 'growl', '$q', '$templateCache', '_', mmsSiteDocs]);

/**
 * @ngdoc directive
 * @name mms.directives.directive:mmsSiteDocs
 *
 * @requires mms.ElementService
 *
 * @restrict E
 *
 * @description
 *
 * @param {string} mmsSite The id of the site to show documents for
 * @param {string=master} mmsWs Workspace to use, defaults to master
 * @param {string=latest} mmsVersion Version can be alfresco version number or timestamp, default is latest
 */
function mmsSiteDocs(ElementService, SiteService, ViewService, growl, $q, $templateCache, _) {

    var mmsSiteDocsLink = function(scope, element, attrs, mmsViewCtrl) {

        var update = function() {
            var filteredDocs = [];
            var seen = {};
            scope.siteDocs.forEach(function(doc) {
                if (seen[doc.id])
                    return;
                filteredDocs.push(doc);
                seen[doc.id] = 'seen';
            });
            scope.docs = filteredDocs;
        };

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

        ViewService.getSiteDocuments(scope.mmsSite, false, scope.ws, scope.version, 1)
        .then(function(docs) {
            scope.siteDocs = docs;
            update();
            scope.$watchCollection("siteDocs", function(newVal, oldVal) {
                update();
            });
        });
    };


    return {
        restrict: 'E',
        template: $templateCache.get('mms/templates/mmsWorkspaceDocs.html'),
        scope: {
            mmsWs: '@',
            mmsVersion: '@',
            mmsSite: '@'
        },
        require: '?^mmsView',
        //controller: ['$scope', controller]
        link: mmsSiteDocsLink
    };
}