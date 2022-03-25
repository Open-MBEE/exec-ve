import * as angular from 'angular';

var veExt = angular.module('veExt',['veUtils', 'ui.bootstrap', 'angular-growl', 'angular-sanitize'])

veExt.config(['$sanitizeProvider', function($sanitizeProvider: angular.sanitize.ISanitizeProvider) {
    $sanitizeProvider.addValidElements({
        htmlElements: ['mms-cf', 'mms-view-link', 'mms-transclude-doc', 'mms-transclude-val', 'mms-transclude-name', 'mms-transclude-view'],
    })
        .addValidAttrs(['mms-data', 'mms-cf-type', 'mms-element-id', 'mms-project-id', 'mms-ref-id',
            'mms-commit-id', 'mms-watch-id', 'non-editable', 'mms-generate-for-diff'])
        .enableSvg()
}])
    .constant('CKEDITOR', window.CKEDITOR);