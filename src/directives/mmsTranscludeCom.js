'use strict';

angular.module('mms.directives')
.directive('mmsTranscludeCom', ['ElementService', '$compile', 'growl', mmsTranscludeCom]);

/**
 * @ngdoc directive
 * @name mms.directives.directive:mmsTranscludeCom
 *
 * @requires mms.ElementService
 * @requires $compile
 *
 * @restrict E
 *
 * @description
 * Given an element id, puts in the element's documentation binding, if there's a parent 
 * mmsView directive, will notify parent view of transclusion on init and doc change,
 * and on click. Nested transclusions inside the documentation will also be registered.
 *
 * @param {string} mmsEid The id of the element whose doc to transclude
 * @param {string=master} mmsWs Workspace to use, defaults to master
 * @param {string=latest} mmsVersion Version can be alfresco version number or timestamp, default is latest
 */
function mmsTranscludeCom(ElementService, $compile, growl) {

    var mmsTranscludeComLink = function(scope, element, attrs, mmsViewCtrl) {
        element.click(function(e) {
            if (!mmsViewCtrl)
                return false;
            mmsViewCtrl.transcludeClicked(scope.mmsEid);
            //e.stopPropagation();
            return false;
        });

        var recompile = function() {
            element.empty();
            var doc = scope.element.documentation;
            element.append(doc);
            $compile(element.contents())(scope); 
            //if (mmsViewCtrl) {
            //    mmsViewCtrl.elementTranscluded(scope.element);
            //}
        };

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
                recompile();
                scope.$watch('element.documentation', recompile);
            }, function(reason) {
                growl.error('Cf Comment Error: ' + reason.message);
            });
        });
    };

    return {
        restrict: 'E',
        scope: {
            mmsEid: '@',
            mmsWs: '@',
            mmsVersion: '@'
        },
        require: '?^mmsView',
        //controller: ['$scope', controller]
        link: mmsTranscludeComLink
    };
}