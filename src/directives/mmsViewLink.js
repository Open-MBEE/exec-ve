'use strict';

angular.module('mms.directives')
.directive('mmsViewLink', ['ElementService', 'UtilsService', '$compile', 'growl', mmsViewLink]);

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
function mmsViewLink(ElementService, UtilsService, $compile, growl) {

    function findSite(element) {
        if (element.siteCharacterizationId)
            return element.siteCharacterizationId;
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
                if (!version && !tag) //if a time is passed in manually, ignore the tag on the surrounding view
                    tag = viewVersion.tag;
                if (!version)
                    version = viewVersion.version;
            }
            if (!ws)
                ws = 'master';
            if (!version)
                version = 'latest';
            scope.ws = ws;

            ElementService.getElement(scope.mmsVid, false, ws, version, 1, true)
            .then(function(data) {
                scope.element = data;
                var site = findSite(data);
                scope.site = site;
                var queryParam = '';
                scope.name = data.name;
                if (tag !== undefined && tag !== null && tag !== '') {
                    queryParam = '?tag=' + tag;
                }
                else if (version !== 'latest') {
                    queryParam = '?time=' + version;
                }
                scope.query = queryParam;
                if (scope.mmsPeid && scope.mmsPeid !== '') {
                    scope.hash = '#' + scope.mmsPeid;
                    ElementService.getElement(scope.mmsPeid, false, ws, version)
                    .then(function(pe) {
                        scope.name = pe.name;
                    });
                }
                if (UtilsService.isDocument(data)) {
                    docid = data.sysmlId;
                    scope.docid = docid;
                    scope.vid = data.sysmlId;
                    //element.html('<a href="mms.html#/workspaces/' + ws + '/sites/' + site + '/documents/' + 
                        //docid + '/views/' + scope.mmsVid + queryParam + '">' + data.name + '</a>');
                } else if (UtilsService.isView(data) || data.type === 'InstanceSpecification') {
                    if (!docid || docid === '') {
                        docid = data.sysmlId;
                    } 
                    scope.docid = docid;
                    scope.vid = data.sysmlId;
                    //element.html('<a href="mms.html#/workspaces/' + ws + '/sites/' + site + '/documents/' + 
                    //    docid + '/views/' + scope.mmsVid + queryParam + '">' + data.name + '</a>');
                } else {
                    element.html('<span class="mms-error">view link is not a view</span>');
                    //growl.error('View Link Error: not a view: ' + scope.mmsVid);
                }
            }, function(reason) {
                element.html('<span class="mms-error">view link not found</span>');
                //growl.error('View Link Error: ' + reason.message + ': ' + scope.mmsVid);
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
            mmsTag: '@',
            mmsPeid: '@'
        },
        require: '?^mmsView',
        template: '<a href="mms.html#/workspaces/{{ws}}/sites/{{site}}/documents/{{docid}}/views/{{vid}}{{query}}{{hash}}">{{name || "Unnamed View"}}</a>',
        //controller: ['$scope', controller]
        link: mmsViewLinkLink
    };
}