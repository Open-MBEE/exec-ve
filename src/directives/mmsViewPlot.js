'use strict';

angular.module('mms.directives')
.directive('mmsViewPlot', ['$compile',mmsViewPlot]);

function mmsViewPlot($compile) {
    return {
        restrict: 'E',
        require: '?^mmsView',
        scope: {
            plot: '<mmsPlot'
        },
        link: function(scope, domElement, element, attrs) {
            if ( scope.plot.type === "Plot") {
                domElement[0].innerHTML = '<figure><mms-' + scope.plot.ptype + '-plot splot="{{plot}}"></mms-' + scope.plot.ptype + '-plot><figcaption>{{plot.title}}</figcaption></figure>';
                $compile(domElement.contents())(scope);
            }

        }
    };
}