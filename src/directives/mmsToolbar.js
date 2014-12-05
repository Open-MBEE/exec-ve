'use strict';

angular.module('mms.directives')
.directive('mmsToolbar', ['$templateCache', mmsToolbar]);

function mmsToolbar($templateCache) {
    var template = $templateCache.get('mms/templates/mmsToolbar.html');

    var mmsToolbarCtrl = function($scope) {
        
        var sortFunction = function(a, b) {
            if(b.dynamic) return -1;
            if(a.dynamic) return 1;
            return 0;
        };

        if ($scope.mmsTbApi) {
            var api = $scope.mmsTbApi;

            api.select = function(id) {
                $scope.buttons.forEach(function(button) {
                    if (button.id === id && button.active) {
                        button.selected = true;
                        $scope.clicked(button);
                    }
                    else
                        button.selected = false;
                });
            };

            api.setPermission = function (id, permission) {
                $scope.buttons.forEach(function(button) {
                    if (button.id === id)
                        button.permission = permission;
                });
            };

            api.addButton = function(button) {
                $scope.buttons.push(button);
                if (button.dynamic_buttons) {
                    button.dynamic_buttons.forEach(function(button) {
                        $scope.buttons.push(button);
                    });
                }
                $scope.buttons.sort(sortFunction);
            };

            api.toggleButtonSpinner = function (id) {
                $scope.buttons.forEach(function(button) {
                    if (button.id === id) {
                        if (button.spinner) {
                            button.icon = button.icon_original;
                        }
                        else {
                            button.icon_original = button.icon;
                            button.icon = 'fa fa-spinner fa-spin';
                        }
                        button.spinner = ! button.spinner;
                    }
                });
            };
        }
    };

    var mmsToolbarLink = function(scope, element, attrs){

        scope.clicked = function(button) {
            if (! button.active)
                return;

            if (button.onClick)
                button.onClick();
            else if (scope.onClick)
                scope.onClick({button: button});

            if (! button.dynamic)
            {
                scope.buttons.forEach(function(b) {
                    if (b === button) {
                        b.selected = true;
                    } else
                        b.selected = false;
                });

                // de-activate all dynamic buttons
                scope.buttons.forEach(function(b) {
                    if (b.dynamic) {
                        b.active = false;
                    }
                });

                if (button.dynamic_buttons) {
                    button.dynamic_buttons.forEach(function(b) {
                        b.active = true;
                    });
                }
            }

        };
    };  



    return {
        restrict: 'E', 
        template: template,
        controller: ['$scope', mmsToolbarCtrl],
        link: mmsToolbarLink,
        scope: {
            buttons: '=',
            mmsTbApi: '=',
            onClick: '&',
            direction: '@'
        }
    };
}