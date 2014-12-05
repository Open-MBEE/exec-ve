'use strict';

angular.module('mms.directives')
.directive('mmsButtonBar', ['$templateCache', mmsButtonBar]);

function mmsButtonBar($templateCache) {
    var template = $templateCache.get('mms/templates/mmsButtonBar.html');

    var mmsButtonBarLink = function(scope, element, attrs){
        scope.clicked = function(button) {
            if (! button.active)
                return;

            if (button.onClick)
                button.onClick();
            else if (scope.onClick)
                scope.onClick({button: button});

            scope.buttons.forEach(function(b) {
                if (b === button) {
                    b.selected = true;
                } else
                    b.selected = false;
            });
        };
    };

    var mmsButtonBarCtrl = function($scope) {
        if ($scope.mmsBbApi) {
            var api = $scope.mmsBbApi;

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
                
                if ($scope.buttons.count === 0) {
                    button.placement = "bottom-left";
                }
                else {
                    button.placement = "bottom";
                }

                $scope.buttons.push(button);
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

    return {
        restrict: 'E', 
        template: template,
        link: mmsButtonBarLink,
        controller: ['$scope', mmsButtonBarCtrl],
        scope: {
            buttons: '=',
            mmsBbApi: '=',
            direction: '@'
        }
    };
}