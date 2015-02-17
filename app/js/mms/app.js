'use strict';

angular.module('mmsApp', ['mms', 'mms.directives', 'fa.directive.borderLayout', 'ui.bootstrap', 'ui.router', 'ui.tree', 'angular-growl'])
.config(function($stateProvider, $urlRouterProvider) {
    // TODO: Add default state to resolve to workspace : master
    $stateProvider
    .state('workspace', {
        url: '/workspaces/:workspace',
        resolve: {
        },
        views: {
            'toolbar-right': {
                template: '<mms-toolbar buttons="buttons" on-click="onClick(button)" mms-tb-api="tbApi"></mms-toolbar>',
                controller: 'ToolbarCtrl'
            }            
        }
    });
});