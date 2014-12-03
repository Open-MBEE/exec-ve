'use strict';

angular.module('mms.directives')
.directive('mmsToolbar', ['$templateCache', mmsToolbar]);

function mmsToolbar($templateCache) {
    var template = $templateCache.get('mms/templates/mmsToolbar.html');

    var mmsToolbarLink = function(scope, element, attrs){

        var sortFunction = function(a, b) {
            if(b.dynamic) return -1;
            if(a.dynamic) return 1;
            return 0;
        };

        scope.clicked = function(button) {
            if (!button.active)
                return;
            if (button.dynamic)
                return;

            scope.buttons.forEach(function(b) {
                if (b === button) {
                    b.selected = true;
                    if (b.onClick)
                        b.onClick();
                    else if (scope.onClick)
                        scope.onClick({button: button});
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
        };

        if (scope.mmsTbApi) {
            var api = scope.mmsTbApi;

            api.select = function(id) {
                scope.buttons.forEach(function(button) {
                if (button.id === id && button.active)
                    button.selected = true;
                else
                    button.selected = false;
                });
            };
            api.setActive = function(id, active) {
                scope.buttons.forEach(function(button) {
                    if (button.id === id)
                        button.active = active;
                });
            };
            api.addButton = function(button) {
                scope.buttons.push(button);
                if (button.dynamic_buttons) {
                    button.dynamic_buttons.forEach(function(button) {
                        scope.buttons.push(button);
                    });
                }
                scope.buttons.sort(sortFunction);
            };
            api.removeButton = function(id) {

            };
            api.setButtonIcon = function(id, icon) {
                scope.buttons.forEach(function(button) {
                    if (button.id === id)
                        button.icon = icon;
                });
            };
        }
    };

    return {
        restrict: 'E', 
        template: template,
        link: mmsToolbarLink,
        scope: {
            buttons: '=',
            mmsTbApi: '=',
            onClick: '&',
            direction: '@'
        }
    };
}