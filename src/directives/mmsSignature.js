'use strict';

angular.module('mms.directives')
.directives('mmsSignature', ['$templateCache', mmsSignature]);


function mmsSignature($templateCache) {

	var template = $templateCache.get('mms/templates/mmsSignature.html');

	var mmsSignatureLink = function(scope, element, attrs) {
		//Where to save this signature data in mms?
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
