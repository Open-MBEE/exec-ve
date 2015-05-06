'use strict';

angular.module('mms.directives')
.directive('mmsView', ['ViewService', '$templateCache', 'growl', mmsView]);

/**
 * @ngdoc directive
 * @name mms.directives.directive:mmsView
 *
 * @requires mms.ViewService
 * @requires $templateCache
 *
 * @restrict E
 *
 * @description
 * Given a view id, renders the view according to the json given by mms.ViewService
 * The view have a text edit mode, where transclusions can be clicked. The view's last 
 * modified time and author is the latest of any transcluded element modified time. 
 * For available api methods, see methods section.
 *
 * ## Example
 * ### controller (js)
 *  <pre>
    angular.module('app', ['mms.directives'])
    .controller('ViewCtrl', ['$scope', function($scope) {
        $scope.api = {}; //empty object to be populated by the view directive
        $scope.handler = function(elementId) {
            //element with elementId clicked in view
        };
        $scope.showComments = function() {
            $scope.api.setShowComments(true);
        };
    }]);
    </pre>
 * ### template (html)
 *  <pre>
    <div ng-controller="ViewCtrl">
        <button ng-click="showComments()">Show Comments</button>
        <mms-view mms-vid="view_element_id" mms-cf-clicked="handler(elementId)" mms-view-api="api"></mms-view>
    </div>
    </pre>
 * ## Example view at a certain time
 *  <pre>
    <mms-view mms-vid="view_element_id" mms-version="2014-07-01T08:57:36.915-0700"></mms-view>
    </pre>
 *
 * @param {string} mmsVid The id of the view
 * @param {string=master} mmsWs Workspace to use, defaults to master
 * @param {string=latest} mmsVersion Version can be alfresco version number or timestamp, default is latest
 * @param {expression=} mmsCfClicked The expression to handle transcluded elements 
 *     in the view being clicked, this should be a function whose argument is 'elementId'
 */
function mmsView(ViewService, $templateCache, growl) {
    var template = $templateCache.get('mms/templates/mmsView.html');

    var mmsViewCtrl = function($scope) {

        this.isEditingInstance = function(instance) {
            if (! $scope.editing) return false;
            if ($scope.editingInstance !== instance) return false;
            return true;
        };

        this.getShowEdits = function () {
            return $scope.showEdits;
        };

        this.getViewElements = function() {
            return ViewService.getViewElements($scope.mmsVid, false, $scope.mmsWs, $scope.mmsVersion);
        };
        this.transcludeClicked = function(elementId) {
            if ($scope.mmsCfClicked)
                $scope.mmsCfClicked({elementId: elementId});
        };
        this.elementTranscluded = function(elem, type) {
            if (elem.modified > $scope.modified && type !== 'Comment') { 
                $scope.modified = elem.modified;
                if (elem.creator)
                    $scope.creator = elem.creator;
            }
            if ($scope.mmsTranscluded)
                $scope.mmsTranscluded({element: elem, type: type});
        };
        this.getWsAndVersion = function() {
            return {
                workspace: $scope.mmsWs, 
                version: $scope.mmsVersion,
                tag: $scope.mmsTag
            };
        };
        this.getShowEditsWireFrame = function(instanceVal) {
            return $scope.showEditsViewWireFrame(instanceVal);
        };
        $scope.showEditsViewWireFrame = function(instanceVal) {
            return ($scope.openEdits.indexOf(instanceVal) !== -1) && $scope.showEdits;
        };
    };

    var mmsViewLink = function(scope, element, attrs) {
        var processed = false;
        var changeView = function(newVal, oldVal) {
            if (!newVal || (newVal === oldVal && processed))
                return;
            processed = true;
            ViewService.getView(scope.mmsVid, false, scope.mmsWs, scope.mmsVersion)
            .then(function(data) {
                if (scope.mmsVersion && scope.mmsVersion !== 'latest') {
                    if (data.specialization.contains) {
                        var hasDiagram = false;
                        data.specialization.contains.forEach(function(contain) {
                            if (contain.type === 'Image')
                                hasDiagram = true;
                        });
                        if (hasDiagram) {
                            scope.view = data;
                            scope.modified = data.modified;
                            scope.creator = data.creator;
                            return;
                        }
                    }
                }
                ViewService.getViewElements(scope.mmsVid, false, scope.mmsWs, scope.mmsVersion)
                .then(function(data2) {
                    scope.view = data;
                    scope.modified = data.modified;
                    scope.creator = data.creator;
                }, function(reason) {
                    scope.view = data;
                    scope.modified = data.modified;
                    scope.creator = data.creator;
                });
            }, function(reason) {
                growl.error('Getting View Error: ' + reason.message + ': ' + scope.mmsVid);
            });
        };
        scope.$watch('mmsVid', changeView);
        scope.showElements = false;
        scope.showComments = false;
        scope.showEdits = false;
        scope.editing = false;
        scope.openEdits = [];

        /**
         * @ngdoc function
         * @name mms.directives.directive:mmsView#toggleShowElements
         * @methodOf mms.directives.directive:mmsView
         * 
         * @description 
         * toggle elements highlighting 
         */
        scope.toggleShowElements = function() {
            scope.showElements = !scope.showElements;
            element.toggleClass('editing');
        };
        /**
         * @ngdoc function
         * @name mms.directives.directive:mmsView#toggleShowComments
         * @methodOf mms.directives.directive:mmsView
         * 
         * @description 
         * toggle comments visibility
         */
        scope.toggleShowComments = function() {
            scope.showComments = !scope.showComments;
            element.toggleClass('reviewing');
        };

        /**
         * @ngdoc function
         * @name mms.directives.directive:mmsView#toggleShowEdits
         * @methodOf mms.directives.directive:mmsView
         * 
         * @description 
         * toggle elements editing panel 
         */
        scope.toggleShowEdits = function() {
            scope.showEdits = !scope.showEdits;
        };

        /**
         * @ngdoc function
         * @name mms.directives.directive:mmsView#toggleShowEditsWireFrame
         * @methodOf mms.directives.directive:mmsView
         * 
         * @description 
         * toggle elements editing panel for a specific instanceVal
         */
        scope.toggleShowEditsWireFrame = function(instanceVal) {
            scope.openEdits.push(instanceVal);
        };

        if (angular.isObject(scope.mmsViewApi)) {
            var api = scope.mmsViewApi;
            api.toggleShowElements = scope.toggleShowElements;
            /**
             * @ngdoc function
             * @name mms.directives.directive:mmsView#setShowElements
             * @methodOf mms.directives.directive:mmsView
             * 
             * @description 
             * self explanatory
             *
             * @param {boolean} mode arg
             */
            api.setShowElements = function(mode) {
                scope.showElements = mode;
                if (mode)
                    element.addClass('editing');
                else
                    element.removeClass('editing');
            };
            api.toggleShowComments = scope.toggleShowComments;
            /**
             * @ngdoc function
             * @name mms.directives.directive:mmsView#setShowComments
             * @methodOf mms.directives.directive:mmsView
             * 
             * @description 
             * self explanatory
             *
             * @param {boolean} mode arg
             */
            api.setShowComments = function(mode) {
                scope.showComments = mode; 
                if (mode)
                    element.addClass('reviewing');
                else
                    element.removeClass('reviewing');
            };
            api.toggleShowEdits = scope.toggleShowEdits;
            api.setEditingInstance = scope.setEditingInstance;
            api.clearEditingInstance = scope.clearEditingInstance;
            api.toggleShowEditsWireFrame = scope.toggleShowEditsWireFrame;

            api.changeView = function(vid) {
                scope.changeView(vid);
            };
            if (api.init) {
                api.init(api);
            }
        }
    };

    return {
        restrict: 'E',
        template: template,
        scope: {
            mmsVid: '@',
            mmsWs: '@',
            mmsVersion: '@',
            mmsTag: '@',
            mmsNumber: '@',
            mmsLink: '=',
            mmsCfClicked: '&',
            mmsViewApi: '=',
            mmsTranscluded: '&'
        },
        controller: ['$scope', mmsViewCtrl],
        link: mmsViewLink
    };
}