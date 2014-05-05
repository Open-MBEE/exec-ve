'use strict';

angular.module('mms.directives')
.directive('mmsNav', ['SiteService', mmsNav]);

function mmsNav(SiteService) {
    var template = '';
    return {
        restrict: 'E',
        template: template,
        scope: {
            image: '=',
        },
        //controller: ['$scope', controller]
        link: function(scope, element, attrs) {
        }
    };
}