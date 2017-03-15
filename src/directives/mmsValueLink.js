'use strict';

angular.module('mms.directives')
.directive('mmsValueLink', ['ElementService', mmsValueLink]);

/**
 * @ngdoc directive
 * @name mms.directives.directive:mmsValueLink
 *
 * @requires mms.ElementService
 *
 * @restrict E
 *
 * @description
 * Given an element id, generates a hyperlink with a cross-reference value
 *
 * @param {string} mmsEid The id of the element
 * @param {string=master} mmsWs Workspace to use, defaults to master
 * @param {string=latest} mmsVersion Version can be alfresco version number or timestamp, default is latest
 * @param {string} mmsErrorText Text to display when element is not found
 * @param {string} mmsLinkText Text to display for hyperlink
 */
function mmsValueLink(ElementService, $compile, growl) {

    var mmsValueLinkLink = function(scope, element, attrs, mmsViewCtrl) {
        var ws = scope.mmsWs;
        var version = scope.mmsVersion;
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
        scope.ws = ws;

        ElementService.getElement(scope.mmsEid, false, ws, version)
        .then(function(data) {
            if (data.specialization && data.specialization.type === 'Property') {
                var value = data.specialization.value;
                if (angular.isArray(value) && value.length !== 0 && value[0].string.length !== 0) {
                    scope.url = value[0].string;
                } else {
                    if (scope.mmsErrorText){
                        element.html('<span>'+ scope.mmsErrorText +'</span>');
                    } else {
                        element.html('<span class="mms-error">Element does not provide link value.</span>');
                    }
                }
            }
        }, function(reason) {
            element.html('<span class="mms-error">Element was not found.</span>');
        });
    };

    return {
        restrict: 'E',
        scope: {
            mmsWs: '@',
            mmsVersion: '@',
            mmsEid: '@',
            mmsErrorText: '@',
            mmsLinkText: '@',
        },
        require: '?^mmsView',
        template: '<a ng-href="{{url}}">{{mmsLinkText}}</a>',
        link: mmsValueLinkLink
    };
}