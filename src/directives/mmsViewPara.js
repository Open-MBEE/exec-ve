'use strict';

angular.module('mms.directives')
.directive('mmsViewPara', [mmsViewPara]);

function mmsViewPara() {
    var template = '<div ng-switch on="para.sourceType">' +
                '<div ng-switch-when="text" ng-bind-html="para.text"></div>' +
                '<div ng-switch-when="reference" ng-switch on="para.sourceProperty">' + 
                    '<mms-transclude-doc eid="{{para.source}}" ng-switch-when="documentation"></mms-transclude-doc>' + 
                    '<mms-transclude-name eid="{{para.source}}" ng-switch-when="name"></mms-transclude-name>' + 
                    '<mms-transclude-val eid="{{para.source}}" ng-switch-when="value"></mms-transclude-val>' +
                '</div>' + 
            '</div>';
    return {
        restrict: 'E',
        template: template,
        scope: {
            para: '=',
        },
        //controller: ['$scope', controller]
        link: function(scope, element, attrs) {
        }
    };
}