'use strict';

angular.module('myApp', ['mms', 'mms.directives'])
.controller('PortalCtrl', ['$scope', 'SiteService',
    function($scope, SiteService) {
        SiteService.getSites()
        .then(function(sites) {
            var categories = {};
            for (var i = 0; i < sites.length; i++) {
                var site = sites[i];
                if (site.categories.length === 0)
                    site.categories.push("Uncategorized");
                for (var j = 0; j < site.categories.length; j++) {
                    var cat = site.categories[j];
                    if (categories.hasOwnProperty(cat)) {
                        categories[cat].push(site);
                    } else {
                        categories[cat] = [site];
                    }
                }
            }
            $scope.categories = categories;
        });
}]);



