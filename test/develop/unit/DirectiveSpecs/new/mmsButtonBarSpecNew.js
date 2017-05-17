'use strict';

describe('mmsButtonBar Directive', function() {

	var $templateCache, $rootScope, $scope, $compile;

	beforeEach(inject(function($injector) {
		module('mms.directives');
		$templateCache 	= $injector.get('$templateCache');
		$rootScope		= $injector.get('$rootScope');
		$compile		= $injector.get('$compile');
		$scope 			= $rootScope.$new();
	}));

});