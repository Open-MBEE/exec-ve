'use strict';

angular.module('mms.directives')
.directive('mmsNav', ['SiteService', '$templateCache', mmsNav]);

function mmsNav(SiteService, $templateCache) {
    var template = $templateCache.get('mms/templates/mmsNav.html');

    var mmsNavLink = function(scope, element, attrs) {
        SiteService.getSites().then(function(data){
            var sites = {};
            for (var i = 0; i < data.length; i++) {
                var site = data[i];
                if (site.categories.length === 0)
                    site.categories.push("Uncategorized");
                for (var j = 0; j < site.categories.length; j++) {
                    var cat = site.categories[j];
                    if (sites.hasOwnProperty(cat)) {
                        sites[cat].push(site);
                    } else {
                        sites[cat] = [site];
                    }
                }
            }
            scope.categories = sites;
        });
    };

    return {
        restrict: 'E',
        template: template,
        scope: {
            site: '@', //current site name
            title: '@' //current page title
        },
        link: mmsNavLink
    };
}