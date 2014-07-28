'use strict';

angular.module('mm', ['ui.router', 'mms', 'mms.directives', 'ui.bootstrap', 'ui.tree', 'fa.directive.borderLayout'])
.config(function($stateProvider, $urlRouterProvider) {
    $stateProvider
    .state('diff', {
        url: '/diff',
        views: {
            'menu': {
                template: '<mms-nav mms-type="Model Manager" mms-go-to="false" mms-other-sites="false"></mms-nav>'
            },
            'main-view': {
                templateUrl: 'partials/mm/main-view.html'
            },
            'tree-view': {
                templateUrl: 'partials/mm/tree-view.html'
            }
        }
    });
});
