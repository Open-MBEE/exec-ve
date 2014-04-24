'use strict';

angular.module('mms')
.directive('mmsTranscludeVal', ['ElementService', '$compile', mmsTranscludeVal]);

function mmsTranscludeVal(ElementService, $compile) {

    var mmsTranscludeValLink = function(scope, element, attrs, mmsViewCtrl) {
        element.click(function(e) {
            if (mmsViewCtrl === null || mmsViewCtrl === undefined)
                return false;
            mmsViewCtrl.transcludeClicked(scope.eid);
            //e.stopPropagation();
            return false;
        });

        var recompile = function(valueElements) {
            scope.valueElements = valueElements;
            var toCompileList = [];
            for (var i = 0; i < scope.valueElements.length; i++) {
                var type = scope.valueElements[i].type;
                if (type === 'LiteralString') {
                    toCompileList.push('<mms-transclude-vs eid="{{valueElements[' + 
                    i + '].id}}"></mms-transclude-vs>');
                } else if (type === 'LiteralBoolean') {
                    toCompileList.push('{{valueElements[' + i + '].boolean}}');
                } else if (type === 'LiteralInteger') {
                    toCompileList.push('{{valueElements[' + i + '].integer}}');
                } else if (type === 'LiteralReal') {
                    toCompileList.push('{{valueElements[' + i + '].double}}');
                }
            }
            element.empty();
            var toCompile = toCompileList.join(', ');
            element.append(toCompile);
            $compile(element.contents())(scope); 
        };

        scope.$watch('eid', function(newVal, oldVal) {
            if (newVal === undefined || newVal === null || newVal === '')
                return;
            ElementService.getElement(scope.eid).then(function(data) {
                scope.element = data;
                var el;
                ElementService.getElements(data.value).then(recompile); 
                scope.$watchCollection('element.value', function(n, o) {
                    ElementService.getElements(scope.element.value).then(recompile);
                });
            });
        });
    };

    return {
        restrict: 'E',
        //template: template,
        scope: {
            eid: '@',
        },
        require: '?^mmsView',
        //controller: ['$scope', controller]
        link: mmsTranscludeValLink
    };
}