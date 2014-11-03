'use strict';

angular.module('myApp', ['ui.router', 'mms', 'mms.directives'])
.config(function($stateProvider, $urlRouterProvider) {
    $stateProvider
    .state('portal', {
        url: '/workspaces/:ws',
        resolve: {
            sites: function($stateParams, SiteService) {
                return SiteService.getSites($stateParams.ws);
            },
            ws: function($stateParams) {
                return $stateParams.ws;
            }
        },
        views: {
            'menu': {
                template: '<mms-nav mms-title="Portal" mms-ws="{{ws}}"></mms-nav>',
                controller: function($scope, $stateParams, ws) {
                    $scope.ws = ws;
                }
            },
            'main': {
                templateUrl: 'partials/portal/sites.html',
                controller: 'PortalCtrl'
            }
        }
    });
})
.controller('PortalCtrl', ['$scope', 'SiteService', 'sites', 'ws',
    function($scope, SiteService, sites, ws) {
        $scope.ws = ws;
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
}]);



