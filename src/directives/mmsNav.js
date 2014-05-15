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

        angular.element("#accordian a").click(function(){
            var lnk = angular.element(this);
            var closest_ul = lnk.closest("ul");
            var parallel_active_links = closest_ul.find(".active");
            var closest_li = lnk.closest("li");
            var lnk_status = closest_li.hasClass("active");
            var count = 0;

            closest_ul.find("ul").slideUp(function(){
                if(++count == closest_ul.find("ul").length)
                    parallel_active_links.removeClass("active");
            });

            if(!lnk_status)
            {
                closest_li.children("ul").slideDown();
                closest_li.addClass("active");
            }
        });
    };

    return {
        restrict: 'E',
        template: template,
        scope: {
            site: '@', //current site name
            title: '@', //current page title
            type: '@' //current page type
        },
        link: mmsNavLink
    };
}