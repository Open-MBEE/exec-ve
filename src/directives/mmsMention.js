'use strict';

angular.module('mms.directives')
    .directive('mmsMention', ['$templateCache', 'MentionService', 'Utils', mmsMention]);

function mmsMention($templateCache, MentionService, Utils) {
    return {
        template: $templateCache.get('mms/templates/mmsMention.html'),
        scope: {
            mmsEditor: '<',
            mmsMentionValue: '<',
            mmsMentionId: '<',
            mmsProjectId: '<',
            mmsRefId: '<'
        },
        controller: ['$scope', mmsMentionCtrl],
        link: mmsMentionLink
    };
    function mmsMentionLink(scope, element, attrs, ctrls) {}

    function mmsMentionCtrl($scope) {
        $scope.fastCfListing = MentionService.getFastCfListing($scope.mmsProjectId, $scope.mmsRefId);
        // expose this api so on the controller itself so that it can be access by codes that use $compile service.
        this.autocompleteOnSelect = autocompleteOnSelect;
        $scope.autocompleteOnSelect = autocompleteOnSelect;

        function autocompleteOnSelect($item, $model) {
            _createCf($item);
            MentionService.handleMentionSelection($scope.mmsEditor, $scope.mmsMentionId);
        }

        function _createCf($item) {
            var tag = '<mms-cf mms-cf-type="' + $item.type + '" mms-element-id="' + $item.id + '">[cf:' + $item.name + '.' + $item.type + ']</mms-cf>';
            $scope.mmsEditor.insertHtml(tag);
            Utils.focusOnEditorAfterAddingWidgetTag($scope.mmsEditor);
        }
    }

}

angular.module('mms.directives')
    .directive('mmsMentionIntercept', ['$templateCache',  mmsMentionIntercept]);

function mmsMentionIntercept() {
    return {
        scope: {
            mmsMentionInterceptValue: '<'
        },
        controller: ['$scope', mmsTestingController],
        require: ['ngModel'],
        link: function(scope, el, attrs, ctls) {
            scope.$watch('mmsMentionInterceptValue', function(newV, oldV) {
                if(newV !== oldV) {
                    ctls[0].$setViewValue(newV);
                    ctls[0].$render();
                }
            });
        }
    };
    function mmsTestingController($scope) {}
}
