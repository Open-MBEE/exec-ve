'use strict';

angular.module('mms.directives')
.directive('mmsTranscludeName', ['ElementService', '$compile', 'growl', mmsTranscludeName]);

/**
 * @ngdoc directive
 * @name mms.directives.directive:mmsTranscludeName
 *
 * @requires mms.ElementService
 * @requires $compile
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
function mmsTranscludeName(ElementService, $compile, growl) {

    var mmsTranscludeNameLink = function(scope, element, attrs, mmsViewCtrl) {

        element.click(function(e) {
            if (!mmsViewCtrl)
                return false;
            mmsViewCtrl.transcludeClicked(scope.mmsEid);
            return false;
        });

        scope.$watch('mmsEid', function(newVal, oldVal) {
            if (!newVal)
                return;
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
                growl.error('Cf Name Error: ' + reason.message);
            });
        });

        scope.$watch('element.name', function(newVal) {
            if (mmsViewCtrl && newVal) {
                mmsViewCtrl.elementTranscluded(scope.element);
            }
        });
    };

    return {
        restrict: 'E',
        template: '{{element.name || "name"}}',
        scope: {
            mmsEid: '@',
            mmsWs: '@',
            mmsVersion: '@'
        },
        require: '?^mmsView',
        //controller: ['$scope', controller]
        link: mmsTranscludeNameLink
    };
}