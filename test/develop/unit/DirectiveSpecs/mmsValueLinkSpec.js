'use strict';

describe('Directive: mmsValueLink', function() {

	var scope;
	var element;
	var $httpBackend;
	var $rootScope,
		$compile;

	beforeEach(module('mms'));
	beforeEach(module('mms.directives'));

	beforeEach(function() {
		inject(function($injector) {
			$rootScope   = $injector.get('$rootScope');
	        $compile     = $injector.get('$compile');
	        $httpBackend = $injector.get('$httpBackend');
	        scope        = $rootScope.$new();
		});
	});

	it('should generate a hyperlink with a cross-reference value', function() {
		scope.element = {
			elementId: 'heyanelementid',
			projectId: 'heyaprojectid',
			refId: 'master',
			commitId: 'latest',
			errorText: 'this is an error',
			linkText: 'JS Space'
		};

		var url = 'https://js.jpl.nasa.gov'

		var template = '<a ng-href="{{url}}">{{element.linkText}}</a>';
		element = angular.element(template);
		$compile(element)(scope);
		scope.$apply();
		expect(element.html()).toContain('JS Space');
		// console.log(element.html());
	});


});