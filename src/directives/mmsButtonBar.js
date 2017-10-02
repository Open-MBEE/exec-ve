'use strict';

angular.module('mms.directives')
.directive('mmsButtonBar', ['$templateCache', mmsButtonBar]);

function mmsButtonBar($templateCache) {
    var template = $templateCache.get('mms/templates/mmsButtonBar.html');

    // TODO: this link is currently not used
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
                    if (b.togglable) {
                        if (! b.toggle_state)
                            b.toggle_state = true;
                        else 
                            b.toggle_state = ! b.toggle_state;
                    }
                } else
                    b.selected = false;
            });
        };
    };

    var mmsButtonBarCtrl = function($scope) {
        if ($scope.mmsBbApi) {
            var api = $scope.mmsBbApi;

            // TODO: select is currently not being used, so clicked is not being used
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
            
            api.setTooltip = function (id, tooltip) {
                $scope.buttons.forEach(function(button) {
                    if (button.id === id)
                        button.tooltip = tooltip;
                });
            };

            api.setIcon = function (id, icon) {
                $scope.buttons.forEach(function(button) {
                    if (button.id === id)
                        button.icon = icon;
                });
            };

            api.setToggleState = function (id, state) {
                $scope.buttons.forEach(function(button) {
                    if (button.id === id) {
                        if (button.togglable) {
                            var original = button.toggle_state;
                            if ((!original && state) || (original && !state))
                                api.toggleButtonState(id);
                        }
                    }
                });
            };

            api.getToggleState = function (id) {
                var buttonTemp = {};
                buttonTemp.toggle_state = false;

                $scope.buttons.forEach(function(button) {
                    if (button.id === id) {
                        buttonTemp = button;
                        if (! button.togglable) button.toggle_state = false;
                        if (! button.toggle_state) button.toggle_state = false;
                    }
                });

                return buttonTemp.toggle_state;
            };

            api.addButton = function(button) {
                
                if ($scope.buttons.count === 0) {
                    button.placement = "bottom-left";
                }
                else {
                    button.placement = "bottom";
                }

                if (button.togglable) {
                    button.toggle_state = false;
                    button.tooltip_orginal = button.tooltip;
                }
                button.icon_original = button.icon;

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

            api.toggleButtonState = function (id) {
                $scope.buttons.forEach(function(button) {
                    if (button.id === id) {
                        if (button.togglable) {
                            button.toggle_state = !button.toggle_state;
                            if (button.toggle_state && button.toggle_icon && button.toggle_tooltip) {
                                button.icon = button.toggle_icon;
                                button.tooltip = button.toggle_tooltip;
                            }
                            else {
                                button.icon = button.icon_original;
                                button.tooltip = button.tooltip_orginal;
                            }
                        }
                    }
                });
            };

            if (api.init) {
                api.init();
            }
        }
    };

    return {
        restrict: 'E', 
        template: template,
        link: mmsButtonBarLink,
        controller: ['$scope', mmsButtonBarCtrl],
        scope: {
            buttons: '<',
            mmsBbApi: '<',
            direction: '@'
        }
    };
}