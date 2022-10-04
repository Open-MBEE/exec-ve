import * as angular from 'angular';

/**
 *
 * @type {angular.IModule}
 */
export const veExt = angular.module('ve-ext',['ve-utils', 'ui.bootstrap', 'angular-growl', 'ngSanitize'])

// veExt.config(['$sanitizeProvider', function($sanitizeProvider: angular.sanitize.ISanitizeProvider) {
//     $sanitizeProvider.addValidElements({
//         htmlElements: ['mms-cf', 'view-link', 'transclude-doc', 'transclude-val', 'transclude-name', 'transclude-view'],
//     })
//         .addValidAttrs(['mms-data', 'mms-cf-type', 'mms-element-id', 'mms-project-id', 'mms-ref-id',
//             'mms-commit-id', 'mms-watch-id', 'non-editable', 'mms-generate-for-diff'])
//         .enableSvg()
// }])
    veExt
        .filter('veRealNum', function() {
            return function(n) {
                if (Number.isInteger(n)) {
                    return n + '.0';
                }
                return n;
            };
        })
        .constant('CKEDITOR', window.CKEDITOR)
        .constant('veConfig', window.__env)
