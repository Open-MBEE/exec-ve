'use strict';

angular.module('mms.directives')
.directive('mmsViewLink', ['ElementService', '$compile', 'growl', mmsViewLink]);

/**
 * @ngdoc directive
 * @name mms.directives.directive:mmsViewLink
 *
 * @requires mms.ElementService
 * @requires $compile
 *
 * @restrict E
 *
 * @description
 * Given a view id and optional document id, creates a html link
 *
 * @param {string} mmsVid The id of the view
 * @param {string=master} mmsWs Workspace to use, defaults to master
 * @param {string=latest} mmsVersion Version can be alfresco version number or timestamp, default is latest
 * @param {string=} mmsDid Document context of view
 */
function mmsViewLink(ElementService, $compile, growl) {

    function findSite(element) {
        var path = element.qualifiedId.split('/');
        return path[1];
    }

    var mmsViewLinkLink = function(scope, element, attrs, mmsViewCtrl) {
        var processed = false;
        var ws = scope.mmsWs;
        var version = scope.mmsVersion;
        var docid = scope.mmsDid;
        if (mmsViewCtrl) {
            var viewVersion = mmsViewCtrl.getWsAndVersion();
            if (!ws)
                ws = viewVersion.workspace;
            if (!version)
                version = viewVersion.version;
        }
        if (!ws)
            ws = 'master';
        if (!version)
            version = 'latest';
        ElementService.getElement(scope.mmsVid, false, ws, version)
        .then(function(data) {
            var site = findSite(data);
            if (data.specialization.type === 'Product') {
                docid = data.sysmlid;
                element.html('<a href="ve.html#/workspaces/' + ws + '/sites/' + site + '/products/' + 
                    docid + '/' + version + '/view/' + scope.mmsVid + '">' + data.name + '</a>');
            } else if (data.specialization.type === "View") {
                if (!docid || docid === '') {
                    docid = data.sysmlid;
                } 
                element.html('<a href="ve.html#/workspaces/' + ws + '/sites/' + site + '/products/' + 
                    docid + '/' + version + '/view/' + scope.mmsVid + '">' + data.name + '</a>');
            } else {
                element.html('<span class="error">view link is not a view</span>');
                growl.error('View Link Error: not a view: ' + scope.mmsVid);
            }
        }, function(reason) {
            element.html('<span class="error">view link not found</span>');
            growl.error('View Link Error: ' + reason.message + ': ' + scope.mmsVid);
        });
/*
        scope.$watch('mmsEid', function(newVal, oldVal) {
            if (!newVal || (newVal === oldVal && processed))
                return;
            processed = true;
            var ws = scope.mmsWs;
            var version = scope.mmsVersion;
            if (mmsViewCtrl) {
                var viewVersion = mmsViewCtrl.getWsAndVersion();
                if (!ws)
                    ws = viewVersion.workspace;
                if (!version)
                    version = viewVersion.version;
            }
            ElementService.getElement(scope.mmsEid, false, ws, version)
            .then(function(data) {
                scope.element = data;
                if (mmsViewCtrl) {
                    mmsViewCtrl.elementTranscluded(scope.element);
                }
            }, function(reason) {
                element.html('<span class="error">name cf ' + newVal + ' not found</span>');
                growl.error('Cf Name Error: ' + reason.message + ': ' + scope.mmsEid);
            });
        });
*/
    };

    return {
        restrict: 'E',
        scope: {
            mmsVid: '@',
            mmsDid: '@',
            mmsWs: '@',
            mmsVersion: '@'
        },
        require: '?^mmsView',
        //controller: ['$scope', controller]
        link: mmsViewLinkLink
    };
}