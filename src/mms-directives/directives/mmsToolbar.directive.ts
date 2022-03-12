import * as angular from "angular";
var mmsDirectives = angular.module('mmsDirectives');

mmsDirectives.directive('veToolbar', ['$templateCache', 'RootScopeService', 'EventService',
	'ToolbarService', mmsToolbar]);

function mmsToolbar($templateCache, RootScopeService, EventService, ToolbarService)
{
	const rootScopeSvc = RootScopeService;
	const eventSvc = EventService;
	var template = $templateCache.get('mms/templates/mmsToolbar.html');

	var mmsToolbarCtrl = function($scope)
	{
		$scope.buttons = ToolbarService.buttons;
	};

	var mmsToolbarLink = function(scope, element, attrs)
	{

		scope.clicked = function(button)
		{

			if (!button.permission) {
				return;
			}
			if (!button.active) {
				return;
			}

			var toggleDecativeFlag = false;
			if (typeof rootScopeSvc.rightPaneClosed() === 'boolean' && rootScopeSvc.rightPaneToggleable() !== false)
			{
				if (button.selected || rootScopeSvc.rightPaneClosed())
				{
					if (button.selected && !rootScopeSvc.rightPaneClosed()) toggleDecativeFlag = true;
					eventSvc.$broadcast('right-pane-toggle');
				}
			}

			if (scope.mmsTbApi) scope.mmsTbApi.select(button.id);

			if (button.onClick) {
				button.onClick();
			} else if (scope.onClick) {
				scope.onClick({ button: button });
			}

			if (toggleDecativeFlag && scope.mmsTbApi) {
				scope.mmsTbApi.deactivate(button.id);
			}

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
			mmsTbApi: '<',
			onClick: '&',
			direction: '@'
		}
	};
}