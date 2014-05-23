'use strict';

angular.module('mms.directives')
.directive('mmsTranscludeVal', ['ElementService', '$compile', mmsTranscludeVal]);

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
function mmsTranscludeVal(ElementService, $compile) {
    var template = '<span ng-repeat="value in element.value">{{value}}</span>';
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
            for (var i = 0; i < scope.element.value.length; i++) {
                toCompileList.push(scope.element.value[i]);
            } 
            element.empty();
            var toCompile = toCompileList.join(', ');
            element.append(toCompile);
            $compile(element.contents())(scope); 
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
                if (scope.element.valueType === "LiteralString") {
                    recompile();
                    scope.$watchCollection('element.value', recompile);
                } else {
                    var el = $compile(template)(scope);
                    element.empty();
                    element.append(el);
                }
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