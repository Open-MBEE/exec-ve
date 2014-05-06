'use strict';

angular.module('mms.directives')
.directive('mmsNav', ['SiteService', mmsNav]);

function mmsNav(SiteService) {
    var template = '<nav class="navbar navbar-default navbar-fixed-top" role="navigation">' + 
            '<div class="container-fluid">' + 
                '<a class="navbar-brand" href="/share/page/site/{{site}}/dashboard">{{site}}</a>' + 
                '<ul class="nav navbar-nav">' + 
                    '<li class="active"><a href="">{{title}}</a></li>' +
                '</ul>' + 
            '</div></nav>';
    return {
        restrict: 'E',
        template: template,
        scope: {
            site: '@', //current site name
            title: '@' //current page title
        },
        link: function(scope, element, attrs) {
        }
    };
}