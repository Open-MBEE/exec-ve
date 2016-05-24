'use strict';

angular.module('mms.directives')
.directive('mmsRedactor', ['ElementService', 'ViewService', '$uibModal', '$templateCache', '$window', 'growl', mmsRedactor]);

function mmsRedactor(ElementService, ViewService, $uibModal, $templateCache, $window, growl) { //depends on angular bootstrap

    var mmsRedactorLink = function(scope, element, attrs, ngModelCtrl) {
        var transcludeModalTemplate = $templateCache.get('mms/templates/mmsCfModal.html');
        var commentModalTemplate = $templateCache.get('mms/templates/mmsCommentModal.html');

        var transcludeCtrl = function($scope, $uibModalInstance) {
            $scope.searchClass = "";
            $scope.proposeClass = "";
            var originalElements = $scope.mmsCfElements;
            $scope.filter = '';
            $scope.searchText = '';
            $scope.choose = function(elementId, property, name) {
                var tag = '<mms-transclude-' + property + ' data-mms-eid="' + elementId + '">[cf:' + name + '.' + property + ']</mms-transclude-' + property + '>&nbsp;';
                $uibModalInstance.close(tag);
            };
            $scope.cancel = function() {
                $uibModalInstance.dismiss();
            };
            $scope.search = function(searchText) {
                //var searchText = $scope.searchText; //TODO investigate why searchText isn't in $scope
                //growl.info("Searching...");
                $scope.searchClass = "fa fa-spin fa-spinner";
                ElementService.search(searchText)
                .then(function(data) {
                    $scope.mmsCfElements = data;
                    $scope.searchClass = "";
                }, function(reason) {
                    growl.error("Search Error: " + reason.message);
                    $scope.searchClass = "";
                });
            };
            $scope.makeNew = function(newName) {
                $scope.proposeClass = "fa fa-spin fa-spinner";
                ElementService.createElement({name: newName, documentation: '', specialization: {type: 'Element'}})
                .then(function(data) {
                    $scope.mmsCfElements = [data];
                    $scope.proposeClass = "";
                }, function(reason) {
                    growl.error("Propose Error: " + reason.message);
                    $scope.proposeClass = "";
                });
            };
            $scope.showOriginalElements = function() {
                $scope.mmsCfElements = originalElements;
            };
        };

        var commentCtrl = function($scope, $uibModalInstance) {
            $scope.comment = {
                name: '', 
                documentation: '', 
                specialization: {
                    type: 'Comment'
                }
            };
            $scope.ok = function() {
                if (ViewService.getCurrentViewId())
                    $scope.comment.owner = ViewService.getCurrentViewId();
                ElementService.createElement($scope.comment)
                .then(function(data) {
                    var tag = '<mms-transclude-com data-mms-eid="' + data.sysmlid + '">comment:' + data.author + '</mms-transclude-com> ';
                    $uibModalInstance.close(tag);
                }, function(reason) {
                    growl.error("Comment Error: " + reason.message);
                });
            };
            $scope.cancel = function() {
                $uibModalInstance.dismiss();
            };
        };

        var transcludeCallback = function() {
            element.redactor('selectionSave'); //this is needed to preserve element.redactor(selection used by insertHTML
            var instance = $uibModal.open({
                template: transcludeModalTemplate,
                scope: scope,
                controller: ['$scope', '$uibModalInstance', transcludeCtrl],
                size: 'lg'
            });
            instance.result.then(function(tag) {
                element.redactor('selectionRestore');
                //element.redactor(saveUndoStep();
                element.redactor('bufferSet');
                element.redactor('insertHtmlAdvanced', tag);
                //element.redactor(saveUndoStep();
                //element.redactor(sync();
            });
        };

        var commentCallback = function() {
            element.redactor('selectionSave');
            var instance = $uibModal.open({
                template: commentModalTemplate,
                scope: scope,
                controller: ['$scope', '$uibModalInstance', commentCtrl],
            });
            instance.result.then(function(tag) {
                element.redactor('selectionRestore');
                //element.redactor(saveUndoStep();
                element.redactor('bufferSet');
                element.redactor('insertHtmlAdvanced', tag);
                //element.redactor(saveUndoStep();
                //element.redactor(sync();
            });
        };

        function read(html) {
            var cleanhtml = html.replace(new RegExp('<mms-transclude-[^>]+></mms-transclude-[^>]+>', 'g'), '');
            cleanhtml = cleanhtml.replace(new RegExp('<br>', 'g'), '');
            if (ngModelCtrl.$viewValue !== cleanhtml)
                ngModelCtrl.$setViewValue(cleanhtml);

            //element.redactor('selectionSave');
            var editor = element.redactor('getEditor');
            var editorHtml = editor.html();
            var cleanEditorHtml = editorHtml.replace(new RegExp('<mms-transclude-[^>]+></mms-transclude-[^>]+>', 'g'), '');
            //cleanEditorHtml = cleanEditorHtml.replace('<br>', '');
            if (editorHtml !== cleanEditorHtml) {
                editor.html(cleanEditorHtml);
            }
            //element.redactor('selectionRestore');
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
            placeholder: "Start typing here",
            autoresize: true,
            wym: true
        });

        element.redactor('buttonAdd', 'transclude', 'Insert a Cross-Reference', transcludeCallback);
        element.redactor('buttonAwesome', 'transclude', 'fa-asterisk');
        element.redactor('buttonAdd', 'comment', 'Insert a Comment', commentCallback);
        element.redactor('buttonAwesome', 'comment', 'fa-comment');
        element.redactor('buttonAdd', 'cfixl', 'Set Cursor Outside Left of CF/Comment', function() {
            var current = element.redactor('getCurrent');
            var cfElem = current.parentElement;
            if (!cfElem || cfElem.localName.substr(0, 3) !== 'mms')
                return;
            var space = angular.element('<span>&nbsp;</span>');
            space.insertBefore(cfElem);
            element.redactor('setCaretBefore', space);//current.parentElement);
        });
        element.redactor('buttonAdd', 'cfixr', 'Set Cursor Outside Right of CF/Comment', function() {
            var current = element.redactor('getCurrent');
            var cfElem = current.parentElement;
            if (!cfElem || cfElem.localName.substr(0, 3) !== 'mms')
                return;
            var space = angular.element('<span>&nbsp;</span>');
            space.insertAfter(cfElem);
            element.redactor('setCaretAfter', space);//current.parentElement);
        });
        element.redactor('buttonAwesome', 'cfixr', 'fa-external-link');
        element.redactor('buttonAwesome', 'cfixl', 'fa-external-link fa-flip-horizontal');
        element.redactor('buttonAdd', 'addptop', 'Add Paragraph to Top', function() {
            var editor = element.redactor('getEditor');
            var editorHtml = editor.html();
            editorHtml = '<p><br></p>' + editorHtml;
            //element.redactor('set', editorHtml);
            editor.html(editorHtml);
            //element.redactor('sync');
        });
        element.redactor('buttonAdd', 'addpbottom', 'Add Paragraph to Bottom', function() {
            var editor = element.redactor('getEditor');
            var editorHtml = editor.html();
            editorHtml =  editorHtml + '<p><br></p>';
            //element.redactor('set', editorHtml);
            editor.html(editorHtml);
            //element.redactor('sync');
        });
        element.redactor('buttonAwesome', 'addptop', 'fa-sign-in fa-rotate-270');
        element.redactor('buttonAwesome', 'addpbottom', 'fa-sign-in fa-rotate-90');
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
            var current = element.redactor('get');
            if (current !== ngModelCtrl.$viewValue)
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
