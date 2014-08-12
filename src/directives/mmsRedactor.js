'use strict';

angular.module('mms.directives')
.directive('mmsRedactor', ['ElementService', 'ViewService', '$modal', '$templateCache', '$window', 'growl', mmsRedactor]);

/**
 * @ngdoc directive
 * @name mms.directives.directive:mmsRedactor
 * @element textarea
 *
 * @requires mms.ElementService
 * @requires mms.ViewService
 * @requires $modal
 * @requires $templateCache
 *
 * @restrict A
 *
 * @description
 * Make any textarea with an ngModel attached to be a redactor wysiwyg editor. This
 * requires the Redactor library. Transclusion is supported. ngModel is required.
 * ### Example
 * <pre>
   <textarea mms-redactor ng-model="element.documentation"></textarea>
   </pre>
 *
 * @param {Array=} mmsCfElements Array of element objects as returned by ElementService
 *      that can be transcluded. Regardless, transclusion allows keyword searching 
 *      elements to transclude from alfresco
 */
function mmsRedactor(ElementService, ViewService, $modal, $templateCache, $window, growl) { //depends on angular bootstrap

    var mmsRedactorLink = function(scope, element, attrs, ngModelCtrl) {
        var transcludeModalTemplate = $templateCache.get('mms/templates/mmsCfModal.html');
        var commentModalTemplate = $templateCache.get('mms/templates/mmsCommentModal.html');

        var transcludeCtrl = function($scope, $modalInstance) {
            $scope.filter = '';
            $scope.searchText = '';
            $scope.choose = function(elementId, property, name) {
                var tag = '<mms-transclude-' + property + ' data-mms-eid="' + elementId + '">[cf:' + name + '.' + property + ']</mms-transclude-' + property + '>&nbsp;';
                $modalInstance.close(tag);
            };
            $scope.cancel = function() {
                $modalInstance.dismiss();
            };
            $scope.search = function(searchText) {
                //var searchText = $scope.searchText; //TODO investigate why searchText isn't in $scope
                growl.info("Searching...");
                ElementService.search(searchText)
                .then(function(data) {
                    $scope.mmsCfElements = data;
                }, function(reason) {
                    growl.error("Search Error: " + reason.message);
                });
            };
            $scope.makeNew = function(newName) {
                ElementService.createElement({name: newName, documentation: '', specialization: {type: 'Element'}})
                .then(function(data) {
                    $scope.mmsCfElements = [data];
                }, function(reason) {
                    growl.error("Propose Error: " + reason.message);
                });
            };
        };

        var commentCtrl = function($scope, $modalInstance) {
            $scope.comment = {
                name: '', 
                documentation: '', 
                specialization: {
                    type: 'Comment'
                }
            };
            $scope.ok = function() {
                $modalInstance.close($scope.comment);
            };
            $scope.cancel = function() {
                $modalInstance.dismiss();
            };
        };

        var transcludeCallback = function() {
            element.redactor('selectionSave'); //this is needed to preserve element.redactor(selection used by insertHTML
            var instance = $modal.open({
                template: transcludeModalTemplate,
                scope: scope,
                controller: ['$scope', '$modalInstance', transcludeCtrl],
                size: 'lg'
            });
            instance.result.then(function(tag) {
                element.redactor('selectionRestore');
                //element.redactor(saveUndoStep();
                element.redactor('bufferSet');
                element.redactor('insertHtml', tag);
                //element.redactor(saveUndoStep();
                //element.redactor(sync();
            });
        };

        var commentCallback = function() {
            element.redactor('selectionSave');
            var instance = $modal.open({
                template: commentModalTemplate,
                scope: scope,
                controller: ['$scope', '$modalInstance', commentCtrl],
            });
            instance.result.then(function(comment) {
                if (ViewService.getCurrentViewId())
                    comment.owner = ViewService.getCurrentViewId();
                ElementService.createElement(comment)
                .then(function(data) {
                    var tag = '<mms-transclude-com data-mms-eid="' + data.sysmlid + '">comment:' + data.author + '</mms-transclude-com> ';
                    element.redactor('selectionRestore');
                    //element.redactor(saveUndoStep();
                    element.redactor('bufferSet');
                    element.redactor('insertHtml', tag);
                    //element.redactor(saveUndoStep();
                    //element.redactor(sync();
                }, function(reason) {
                    growl.error("Comment Error: " + reason.message);
                });
            });
        };

        function read(html) {
            var cleanhtml = html.replace(new RegExp('<mms-transclude-[^>]+></mms-transclude-[^>]+>', 'g'), '');
            cleanhtml = cleanhtml.replace('<br>', '');
            //var cleanhtml = html.replace(/<mms-transclude[^>]+><\/mms-transclude[^>]+>/gi, '');
            ngModelCtrl.$setViewValue(cleanhtml);

            element.redactor('selectionSave');
            var editor = element.redactor('getEditor');
            var editorHtml = editor.html();
            var cleanEditorHtml = editorHtml.replace(new RegExp('<mms-transclude-[^>]+></mms-transclude-[^>]+>', 'g'), '');
            cleanEditorHtml = cleanEditorHtml.replace('<br>', '');
            if (editorHtml !== cleanEditorHtml) {
                editor.html(cleanEditorHtml);
            }
            //element.redactor('sync');
            element.redactor('selectionRestore');
            //element.redactor('set', cleanhtml);
            //ngModelCtrl.$render();
            //scope.$apply();
        }

        element.html(ngModelCtrl.$viewValue);

        element.redactor({
            buttons: ['html', 'formatting',  'bold', 'italic', 'underline', 'deleted', 
                        'fontcolor', 'unorderedlist', 'orderedlist', 'outdent', 'indent', 
                        'image', 'video', 'file', 'table', 'link', 'alignment', 
                        'horizontalrule'],
            plugins: ['fontcolor', 'fontsize'],
            changeCallback: read,
            maxHeight: $window.innerHeight*0.65,
            imageUploadURL: '', //prevent default upload to public url
            placeholder: "Placeholder",
            autoresize: true,
            wym: true
        });

        element.redactor('buttonAdd', 'transclude', 'Cross-Reference', transcludeCallback);
        element.redactor('buttonAwesome', 'transclude', 'fa-asterisk');
        element.redactor('buttonAdd', 'comment', 'Comment', commentCallback);
        element.redactor('buttonAwesome', 'comment', 'fa-comment');
        element.redactor('buttonAdd', 'cfixr', 'Set Cursor Outside Right', function() {
            var current = element.redactor('getCurrent');
            var cfElem = current.parentElement;
            if (!cfElem || cfElem.localName.substr(0, 3) !== 'mms')
                return;
            var space = angular.element('<span>&nbsp;</span>');
            space.insertAfter(cfElem);
            element.redactor('setCaretAfter', space);//current.parentElement);
        });
        element.redactor('buttonAwesome', 'cfixr', 'fa-external-link');
        element.redactor('buttonAdd', 'cfixl', 'Set Cursor Outside Left', function() {
            var current = element.redactor('getCurrent');
            var cfElem = current.parentElement;
            if (!cfElem || cfElem.localName.substr(0, 3) !== 'mms')
                return;
            var space = angular.element('<span>&nbsp;</span>');
            space.insertBefore(cfElem);
            element.redactor('setCaretBefore', space);//current.parentElement);
        });
        element.redactor('buttonAwesome', 'cfixl', 'fa-external-link fa-flip-horizontal');
        element.redactor('buttonAdd', 'undo', 'Undo', function() {
            //element.redactor('execCommand', 'undo');
            element.redactor('bufferUndo');
            element.redactor('sync');
        });
        //element.redactor('buttonAwesome', 'undo', 'fa-undo');
        element.redactor('buttonAdd', 'redo', 'Redo', function() {
            //element.redactor('execCommand', 'redo');
            element.redactor('bufferRedo');
            element.redactor('sync');
        });
        //element.redactor('buttonAwesome', 'redo', 'fa-repeat');
        ngModelCtrl.$render = function() {
            element.redactor("set", ngModelCtrl.$viewValue || '');
        };

        scope.$on('$destroy', function() {
            element.redactor("destroy");
        });
    };

    return {
        restrict: 'A',
        require: 'ngModel',
        scope: {
            mmsCfElements: '=',
            mmsEid: '@'
        },
        link: mmsRedactorLink
    };
}
