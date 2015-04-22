'use strict';

angular.module('mms.directives')
.directive('mmsTranscludeDoc', ['ElementService', 'UtilsService', '$compile', '$log', '$templateCache', 'growl', mmsTranscludeDoc]);

/**
 * @ngdoc directive
 * @name mms.directives.directive:mmsTranscludeDoc
 *
 * @requires mms.ElementService
 * @requires mms.UtilsService
 * @requires $compile
 *
 * @restrict E
 *
 * @description
 * Given an element id, puts in the element's documentation binding, if there's a parent 
 * mmsView directive, will notify parent view of transclusion on init and doc change,
 * and on click. Nested transclusions inside the documentation will also be registered.
 * 
 * ## Example
 *  <pre>
    <mms-transclude-doc mms-eid="element_id"></mms-transclude-doc>
    </pre>
 *
 * @param {string} mmsEid The id of the element whose doc to transclude
 * @param {string=master} mmsWs Workspace to use, defaults to master
 * @param {string=latest} mmsVersion Version can be alfresco version number or timestamp, default is latest
 */
function mmsTranscludeDoc(ElementService, UtilsService, $compile, $log, $templateCache, growl) {

    var template = $templateCache.get('mms/templates/mmsTranscludeDoc.html');

    var mmsTranscludeDocCtrl = function ($scope) {
        $scope.callDoubleClick = function(value) {
            growl.info(value.type);
        };
    };

    var mmsTranscludeDocLink = function(scope, element, attrs, controllers) {

        var mmsViewCtrl = controllers[0];
        var mmsViewElemRefTreeCtrl = controllers[1];

        var processed = false;
        scope.cfType = 'doc';

        element.click(function(e) {
            if (mmsViewCtrl)
                mmsViewCtrl.transcludeClicked(scope.mmsEid);
            if (e.target.tagName !== 'A' && e.target.tagName !== 'INPUT')
                return false;
            //e.stopPropagation();
        });

        var recompile = function() {
            element.empty();
            scope.value = scope.element.documentation;
            if (!scope.value)
                scope.value = '<p ng-class="{placeholder: version!=\'latest\'}">(no documentation)</p>';
            element.append(template);
            $compile(element.contents())(scope); 
            if (mmsViewCtrl) {
                mmsViewCtrl.elementTranscluded(scope.element);
            }
        };

        scope.$watch('mmsEid', function(newVal, oldVal) {
            if (!newVal || (newVal === oldVal && processed))
                return;
            processed = true;
            if (UtilsService.hasCircularReference(scope, scope.mmsEid, 'doc')) {
                element.html('<span class="error">Circular Reference!</span>');
                //$log.log("prevent circular dereference!");
                return;
            }
            var ws = scope.mmsWs;
            var version = scope.mmsVersion;
            if (mmsViewCtrl) {
                var viewVersion = mmsViewCtrl.getWsAndVersion();
                if (!ws)
                    ws = viewVersion.workspace;
                if (!version)
                    version = viewVersion.version;
            }
            scope.version = version ? version : 'latest';
            ElementService.getElement(scope.mmsEid, false, ws, version)
            .then(function(data) {
                scope.element = data;
                recompile();
                scope.$watch('element.documentation', recompile);
            }, function(reason) {
                element.html('<span class="error">doc cf ' + newVal + ' not found</span>');
                growl.error('Cf Doc Error: ' + reason.message + ': ' + scope.mmsEid);
            });
        });

        if (mmsViewCtrl && mmsViewElemRefTreeCtrl) {
            scope.isEditing = function(instance) {
                return mmsViewCtrl.isEditingInstance(instance);
            };

            scope.getInstance = function() {
                return mmsViewElemRefTreeCtrl.getInstanceId();
            };
            scope.raffi = 'haha';
        }

    };

    return {
        restrict: 'E',
        scope: {
            mmsEid: '@',
            mmsWs: '@',
            mmsVersion: '@'
        },
        require: ['?^mmsView','?^mmsViewElemRefTree'],
        controller: ['$scope', mmsTranscludeDocCtrl],
        link: mmsTranscludeDocLink
    };
}