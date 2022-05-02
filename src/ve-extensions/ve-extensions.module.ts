import * as angular from 'angular';
import {VeConfig} from "../ve-utils/types/view-editor";
import {VeExtensionConfig} from "./ve-extensions";

/**
 *
 * @type {angular.IModule}
 */
export const veExt = angular.module('veExt',['veUtils', 'veCore', 'ui.bootstrap', 'angular-growl', 'ngSanitize'])

veExt.config(['$sanitizeProvider', function($sanitizeProvider: angular.sanitize.ISanitizeProvider) {
    $sanitizeProvider.addValidElements({
        htmlElements: ['mms-cf', 'mms-view-link', 'mms-transclude-doc', 'mms-transclude-val', 'mms-transclude-name', 'mms-transclude-view'],
    })
        .addValidAttrs(['mms-data', 'mms-cf-type', 'mms-element-id', 'mms-project-id', 'mms-ref-id',
            'mms-commit-id', 'mms-watch-id', 'non-editable', 'mms-generate-for-diff'])
        .enableSvg()
}])
    .constant('CKEDITOR', window.CKEDITOR)
    .constant('veConfig', window.__env)