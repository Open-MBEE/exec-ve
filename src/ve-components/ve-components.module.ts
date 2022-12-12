import angular from 'angular'

/**
 *
 * @type {angular.IModule}
 */
export const veComponents = angular.module('ve-components', [
    've-utils',
    'ui.bootstrap',
    'angular-growl',
    'ngSanitize',
])

// veComponents.config(['$sanitizeProvider', function($sanitizeProvider: angular.sanitize.ISanitizeProvider) {
//     $sanitizeProvider.addValidElements({
//         htmlElements: ['mms-cf', 'view-link', 'transclude-doc', 'transclude-val', 'transclude-name', 'transclude-view'],
//     })
//         .addValidAttrs(['mms-data', 'mms-cf-type', 'mms-element-id', 'mms-project-id', 'mms-ref-id',
//             'mms-commit-id', 'mms-watch-id', 'non-editable', 'mms-generate-for-diff'])
//         .enableSvg()
// }])
veComponents
    .filter('veRealNum', () => {
        return (n) => {
            if (Number.isInteger(n)) {
                return n + '.0'
            }
            return n
        }
    })
    .constant('CKEDITOR', window.CKEDITOR)
    .constant('veConfig', window.__env)
