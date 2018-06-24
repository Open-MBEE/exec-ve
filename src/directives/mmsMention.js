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
            mmsRefId: '<',
            mmsDone: '<'
        },
        controller: ['$scope', mmsMentionCtrl],
        link: mmsMentionLink
    };
    function mmsMentionLink(scope, element, attrs, ctrls) {}

    function mmsMentionCtrl($scope) {
        $scope.fastCfListing = MentionService.getFastCfListing($scope.mmsProjectId, $scope.mmsRefId);
        $scope.autocompleteOnSelect = autocompleteOnSelect;

        function autocompleteOnSelect($item, $model, $label) {
            _createCf($item, $label);
            MentionService.handleMentionSelection($scope.mmsEditor, $scope.mmsMentionId);
            $scope.mmsDone();
        }

        function _createCf($item, $label) {
            var autocompleteElementId = $item.id;
            var lastIndexOfName = $item.name.lastIndexOf(" ");
            var autocompleteName = $item.name.substring(0, lastIndexOfName);
            var property = $label.split(' ');
            property = property[property.length - 1];
            var autocompleteProperty;
            if (property === 'name') {
                autocompleteProperty = 'name';
            } else if (property === 'documentation') {
                autocompleteProperty = 'doc';
            } else if (property === 'value') {
                autocompleteProperty = 'val';
            }
            var tag = '<mms-cf mms-cf-type="' + autocompleteProperty + '" mms-element-id="' + autocompleteElementId + '">[cf:' + autocompleteName + '.' + autocompleteProperty + ']</mms-cf>';
            $scope.mmsEditor.insertHtml(tag);
            Utils.focusOnEditorAfterAddingWidgetTag($scope.mmsEditor);
        }
    }

}

angular.module('mms.directives')
    .directive('mmsMentionIntercept', ['$templateCache',  mmsTesting]);

function mmsTesting() {
    return {
        scope: {
            mmsMentionInterceptValue: '<'
        },
        controller: ['$scope', mmsTestingController],
        require: ['ngModel'],
        link: function(scope, el, attrs, ctls) {
            scope.$watch('mmsMentionInterceptValue', function(newV, oldV) {
                if(newV) {
                    ctls[0].$setViewValue(newV);
                    ctls[0].$render();
                }
            });
        }
    };
    function mmsTestingController($scope) {

    }
}
