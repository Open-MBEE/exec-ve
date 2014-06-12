'use strict';

angular.module('mms.directives')
.directive('mmsTranscludeVal', ['ElementService', '$compile', '$templateCache', 'growl', mmsTranscludeVal]);

/**
 * @ngdoc directive
 * @name mms.directives.directive:mmsTranscludeVal
 *
 * @requires mms.ElementService
 * @requires $compile
 *
 * @restrict E
 *
 * @description
 * Given an element id, puts in the element's value binding, if there's a parent 
 * mmsView directive, will notify parent view of transclusion on init and val change,
 * and on click. The element should be a Property. Nested transclusions within 
 * string values will also be registered.
 *
 * @param {string} mmsEid The id of the element whose value to transclude
 * @param {string=master} mmsWs Workspace to use, defaults to master
 * @param {string=latest} mmsVersion Version can be alfresco version number or timestamp, default is latest
 */
function mmsTranscludeVal(ElementService, $compile, $templateCache, growl) {
    var valTemplate = $templateCache.get('mms/templates/mmsTranscludeVal.html');

    var mmsTranscludeValLink = function(scope, element, attrs, mmsViewCtrl) {
        element.click(function(e) {
            if (!mmsViewCtrl)
                return false;
            mmsViewCtrl.transcludeClicked(scope.mmsEid);
            //e.stopPropagation();
            return false;
        });

        var recompile = function() {
            var toCompileList = [];
            var areStrings = false;
            for (var i = 0; i < scope.values.length; i++) {
                if (scope.values[i].type === 'LiteralString') {
                    areStrings = true;
                    toCompileList.push(scope.values[i].string);
                } else {
                    break;
                }
            } 
            element.empty();
            if (areStrings) {
                var toCompile = toCompileList.join(' ');
                element.append(toCompile);
                $compile(element.contents())(scope); 
            } else {
                element.append(valTemplate);
                $compile(element.contents())(scope);
            }
            if (mmsViewCtrl) {
                mmsViewCtrl.elementTranscluded(scope.element);
            }
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
                scope.values = scope.element.specialization.value;
                recompile();
                scope.$watch('values', recompile, true);
            }, function(reason) {
                growl.error('Cf Val Error: ' + reason.message);
            });
        });
    };

    return {
        restrict: 'E',
        //template: template,
        scope: {
            mmsEid: '@',
            mmsWs: '@',
            mmsVersion: '@'
        },
        require: '?^mmsView',
        //controller: ['$scope', controller]
        link: mmsTranscludeValLink
    };
}