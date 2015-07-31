'use strict';

angular.module('mms.directives')
.directive('mmsToolbar', ['$templateCache', mmsToolbar]);

function mmsToolbar($templateCache) {
    var template = $templateCache.get('mms/templates/mmsToolbar.html');

    var mmsToolbarCtrl = function($scope) {
        
        if ($scope.mmsTbApi) {
            var api = $scope.mmsTbApi;

            api.select = function(id) {
                $scope.buttons.forEach(function(button) {
                    if (button.id === id && button.active) {
                        // button.selected = true;
                        // $scope.clicked(button);

                        if (! button.dynamic)
                        {
                            $scope.buttons.forEach(function(b) {
                                if (b === button) {
                                    b.selected = true;
                                } else
                                    b.selected = false;
                            });

                            // de-activate all dynamic buttons
                            $scope.buttons.forEach(function(b) {
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

                    }
                    //else
                        // button.selected = false;
                });
            };

            api.deactivate = function(id) {
                $scope.buttons.forEach(function(button) {
                    if (button.id === id) {
                        if (button.dynamic_buttons) {
                            // de-activate all dynamic buttons
                            button.dynamic_buttons.forEach(function(b) {
                                b.active = false;
                            });
                        }                        
                    }
                });
            };

            api.setPermission = function (id, permission) {
                $scope.buttons.forEach(function(button) {
                    if (button.id === id)
                        button.permission = permission;
                });
            };

            api.setSelected = function (id, selected) {
                $scope.buttons.forEach(function(button) {
                    if (button.id === id)
                        button.selected = selected;
                });
            };

            api.setIcon = function (id, icon) {
                $scope.buttons.forEach(function(button) {
                    if (button.id === id)
                        button.icon = icon;
                });
            };

            api.addButton = function(button) {
                button.priority = $scope.buttons.length;
                $scope.buttons.push(button);
                if (button.dynamic_buttons) {
                    var firstButton = true;
                    button.dynamic_buttons.forEach(function(button) {
                        if (firstButton) {
                            button.pullDown = true;
                            firstButton = false;
                        }
                        button.priority = $scope.buttons.length + 1000;
                        $scope.buttons.push(button);
                    });
                }
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

            if (api.init) {
                api.init();
            }
        }
    };

    var mmsToolbarLink = function(scope, element, attrs){

        scope.clicked = function(button) {

            if (! button.active)
                return;

            var toggleDecativeFlag = false;
            if (this.$root.mms_togglePane) {
                if (button.selected || this.$root.mms_togglePane.closed) { 
                    if (button.selected && ! this.$root.mms_togglePane.closed)
                        toggleDecativeFlag = true;
                    this.$root.mms_togglePane.toggle();
                }
            }

            if (this.$root.mms_tbApi)
                this.$root.mms_tbApi.select(button.id);

            if (button.onClick)
                button.onClick();
            else if (scope.onClick)
                scope.onClick({button: button});

            if (toggleDecativeFlag)
                this.$root.mms_tbApi.deactivate(button.id);

            /*if (! button.dynamic)
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
            }*/

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