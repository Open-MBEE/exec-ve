describe('mmsTranscludeCom directive', function () {
	var $rootScope, $compile, Utils, ElementService, UtilsService, ViewService, UxService, $templateCache;
	var scope, element;

	beforeEach(function () {
		module('mms.directives');
		inject(function ($injector) {
			$rootScope = $injector.get('$rootScope');
			$compile = $injector.get('$compile');
			Utils = $injector.get('Utils');
			ElementService = $injector.get('UtilsService');
			UtilsService = $injector.get('ViewService');
			ViewService = $injector.get('ViewService');
			UxService = $injector.get('UxService');

			$templateCache.put('mms/templates/mmsTranscludeDoc.html');
		});
	});

});