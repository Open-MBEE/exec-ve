'use strict';

angular.module('mms.directives')
    .directive('mmsMention', ['$templateCache', mmsMention]);

function mmsMention($templateCache) {
    return {
        template: $templateCache.get('mms/templates/mmsMention.html'),
        scope: {
            mmsMentionItems: '<',
            editor: '<',
            inputValue: '<',
            done: '<'
        },
        controller: ['$scope', mmsMentionCtrl],
        link: mmsMentionLink
    };

    function mmsMentionCtrl($scope) {

    }

    function mmsMentionLink(scope, element, attrs, ctrls) {
        scope.id = 'hong';
        scope.autocompleteOnSelect = function($item, $model, $label) {
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
            scope.editor.insertHtml(tag);

            // remove the input or maybe figure out a way to destroy this whole tthing
            $('#' + scope.id).remove();
            var iframe = $($('iframe')[0]);
            iframe.contents().find('#hong007').remove();
            scope.done();

            focusOnEditorAfterAddingWidgetTag(scope.editor);
        };
    }

    function focusOnEditorAfterAddingWidgetTag(editor) {
        var element = editor.widgets.focused.element.getParent();
        var range = editor.createRange();
        if(range) {
            range.moveToClosestEditablePosition(element, true);
            range.select();
        }
    }
}

angular.module('mms.directives')
    .directive('mmsTesting', ['$templateCache',  mmsTesting]);

function mmsTesting() {
    return {
        scope: {
            testValue: '<'
        },
        controller: ['$scope', mmsTestingController],
        require: ['ngModel'],
        link: function(scope, el, attrs, ctls) {
            console.log(ctls);
            scope.$watch('testValue', function(newV, oldV) {
                console.log(oldV);
                console.log(newV);
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

// childScope.$destroy();
// $('.my-directive-placeholder').empty();
