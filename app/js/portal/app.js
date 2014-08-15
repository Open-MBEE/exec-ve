'use strict';

angular.module('myApp', ['mms', 'mms.directives'])
.controller('PortalCtrl', ['$scope', 'SiteService',
    function($scope, SiteService) {
        SiteService.getSites()
        .then(function(sites) {
            $scope.sites = sites;
        });
}]);



