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
        scope.$watch('mmsVid', function(newVal, oldVal) {
            if (!newVal || (newVal === oldVal && processed))
                return;
            processed = true;

            var ws = scope.mmsWs;
            var version = scope.mmsVersion;
            var docid = scope.mmsDid;
            var tag = scope.mmsTag;
            if (mmsViewCtrl) {
                var viewVersion = mmsViewCtrl.getWsAndVersion();
                if (!ws)
                    ws = viewVersion.workspace;
                if (!version)
                    version = viewVersion.version;
                if (!tag)
                    tag = viewVersion.tag;
            }
            if (!ws)
                ws = 'master';
            if (!version)
                version = 'latest';
            scope.ws = ws;

            ElementService.getElement(scope.mmsVid, false, ws, version)
            .then(function(data) {
                scope.element = data;
                var site = findSite(data);
                scope.site = site;
                var queryParam = '';
                if (tag !== undefined && tag !== null && tag !== '') {
                    queryParam = '?tag=' + tag;
                }
                else if (version !== 'latest') {
                    queryParam = '?time=' + version;
                }
                scope.query = queryParam;
                if (data.specialization.type === 'Product') {
                    docid = data.sysmlid;
                    scope.docid = docid;
                    scope.vid = data.sysmlid;
                    //element.html('<a href="mms.html#/workspaces/' + ws + '/sites/' + site + '/documents/' + 
                        //docid + '/views/' + scope.mmsVid + queryParam + '">' + data.name + '</a>');
                } else if (data.specialization.type === "View") {
                    if (!docid || docid === '') {
                        docid = data.sysmlid;
                    } 
                    scope.docid = docid;
                    scope.vid = data.sysmlid;
                    //element.html('<a href="mms.html#/workspaces/' + ws + '/sites/' + site + '/documents/' + 
                    //    docid + '/views/' + scope.mmsVid + queryParam + '">' + data.name + '</a>');
                } else {
                    element.html('<span class="error">view link is not a view</span>');
                    growl.error('View Link Error: not a view: ' + scope.mmsVid);
                }
            }, function(reason) {
                element.html('<span class="error">view link not found</span>');
                growl.error('View Link Error: ' + reason.message + ': ' + scope.mmsVid);
            });
        });
    };

    return {
        restrict: 'E',
        scope: {
            mmsVid: '@',
            mmsDid: '@',
            mmsWs: '@',
            mmsVersion: '@',
            mmsTag: '@'
        },
        require: '?^mmsView',
        template: '<a href="mms.html#/workspaces/{{ws}}/sites/{{site}}/documents/{{docid}}/views/{{vid}}{{query}}">{{element.name}}</a>',
        //controller: ['$scope', controller]
        link: mmsViewLinkLink
    };
}