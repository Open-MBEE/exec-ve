'use strict';

angular.module('mms.directives')
.directive('mmsNav', ['SiteService', '$templateCache', 'growl', mmsNav]);

/**
 * @ngdoc directive
 * @name mms.directives.directive:mmsNav
 *
 * @requires mms.SiteService
 * @requires $templateCache
 *
 * @restrict E
 *
 * @description
 * Make any div with an ngModel attached to be a Froala content editable. This
 * requires the Froala library. Transclusion is supported. ngModel is required.
 *
 * @param {string} site The current site name
 * @param {string} title Title to display
 * @param {string} type The type of current page (docweb, product, snapshot, etc)
 */
function mmsNav(SiteService, $templateCache, growl) {
    var template = $templateCache.get('mms/templates/mmsNav.html');

    var mmsNavLink = function(scope, element, attrs) {
        SiteService.getSites()
        .then(function(data) {
            var sites = {};
            for (var i = 0; i < data.length; i++) {
                var site = data[i];
                if (site.name === scope.site)
                    scope.siteTitle = site.title;
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
        }, function(reason) {
            growl.error("Getting Sites Error: " + reason.message);
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