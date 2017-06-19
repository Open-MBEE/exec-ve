'use strict';

angular.module('mms.directives')
.directive('mmsSignature', ['$templateCache', mmsSignature]);


function mmsSignature($templateCache) {

	var template = $templateCache.get('mms/templates/mmsSignature.html');

	var mmsSignatureLink = function(scope, element, attrs) {

		//parse documentation html for signature information?
		var parseHtml = function() {

		};

		//function for posting to MMS

		//function for getting from MMS
			//Where to save this signature data in mms? Extract from documentation html and parse?

	};

	return {
		restrict: 'A',
		scope: {
			mmsSignatureName: '=',
			mmsSignatureTitle: '=',
			mmsSignatureDate: '='
		},
		link: mmsSignatureLink
	};
}
