'use strict';

/* Controllers */

angular.module('mmsApp')

.controller('FullDocCtrl', ['$scope', '$templateCache', '$compile', '$timeout', '$rootScope', '$state', '$stateParams', '$window', 'MmsAppUtils', 'document', 'workspace', 'site', 'snapshot', 'time', 'ConfigService', 'UxService', 'ViewService', 'UtilsService', 'growl', 'hotkeys',
function($scope, $templateCache, $compile, $timeout, $rootScope, $state, $stateParams, $window, MmsAppUtils, document, workspace, site, snapshot, time, ConfigService, UxService, ViewService, UtilsService, growl, hotkeys) {

    $scope.ws = $stateParams.workspace;
    $scope.site = site;
    var views = [];
    if (!$rootScope.veCommentsOn)
        $rootScope.veCommentsOn = false;
    if (!$rootScope.veElementsOn)
        $rootScope.veElementsOn = false;
    if (!$rootScope.mms_ShowEdits)
        $rootScope.mms_ShowEdits = false;
    $scope.buttons = [];
    views.push({id: document.sysmlid, api: {
        init: function(dis) {
            if ($rootScope.veCommentsOn) {
                dis.toggleShowComments();
            }
            if ($rootScope.veElementsOn) {
                dis.toggleShowElements();
            }
            if ($rootScope.mms_ShowEdits && time === 'latest') {
                dis.toggleShowEdits();
            }
        }
    }});
    var view2view = document.specialization.view2view;
    var view2children = {};
    view2view.forEach(function(view) {
        view2children[view.id] = view.childrenViews;
    });

    var addToArray = function(viewId, curSection) {
        views.push({id: viewId, api: {
            init: function(dis) {
                if ($rootScope.veCommentsOn) {
                    dis.toggleShowComments();
                }
                if ($rootScope.veElementsOn) {
                    dis.toggleShowElements();
                }
                if ($rootScope.mms_ShowEdits && time === 'latest') {
                    dis.toggleShowEdits();
                }
            }
        }, number: curSection});
        if (view2children[viewId]) {
            var num = 1;
            view2children[viewId].forEach(function(cid) {
                addToArray(cid, curSection + '.' + num);
                num = num + 1;
            });
        }
    };
    var num = 1;
    view2children[document.sysmlid].forEach(function(cid) {
        addToArray(cid, num);
        num = num + 1;
    });
    $scope.version = time;
    $scope.views = views;
    $scope.tscClicked = function(elementId) {
        $rootScope.$broadcast('elementSelected', elementId, 'element');
    };

    $scope.bbApi = {};
    $scope.bbApi.init = function() {

        $scope.bbApi.addButton({
            id: 'print', 
            icon: 'fa-print', 
            selected: true, 
            active: true, 
            permission: true, 
            tooltip: 'Print', 
            spinner: false, 
            togglable: false, 
            action: function() {
                var templateString = $templateCache.get('partials/mms/docCover.html');
                var templateElement = angular.element(templateString);

                var tocContents = UtilsService.makeHtmlTOC($rootScope.mms_treeApi.get_rows());
                var printContents = $window.document.getElementById('full-doc').outerHTML;
                var printElementCopy = angular.element(printContents);
                //fix href links here
                var docView = printElementCopy.find("mms-view[mms-vid='" + document.sysmlid + "']");
                docView.remove();
                printContents = printElementCopy[0].outerHTML;
                var cover = '';
                var newScope = $rootScope.$new();
                var useCover = false;
                var openPopup = function() {
                        if (useCover)
                            cover = templateElement[0].innerHTML;
                        newScope.$destroy();
                        var popupWin = $window.open('', '_blank', 'width=800,height=600,scrollbars=1');
                        popupWin.document.open();
                        popupWin.document.write('<html><head><link href="css/ve-mms.styles.min.css" rel="stylesheet" type="text/css"></head><body style="overflow: auto">' + cover + tocContents + printContents + '</html>');
                        popupWin.document.close();
                };
                if ((document.specialization.contents && document.specialization.contents.length > 1) || 
                    (document.specialization.contains && document.specialization.contains.length > 1) ||
                    (document.documentation && document.documentation !== '')) { //use original doc view as cover
                    cover = docView[0].outerHTML;
                    $timeout(openPopup, 0, false);
                    return;
                }
                ViewService.getDocMetadata(document.sysmlid, $scope.ws)
                .then(function(metadata) {
                    useCover = true;
                    newScope.meta = metadata;
                    newScope.meta.title = document.name;
                    var compiled = $compile(templateElement.contents())(newScope); 
                }).finally(function() {
                    $timeout(openPopup, 0, false);
                });
                
            }
        });

        if (document && document.editable && time === 'latest') {
            $scope.bbApi.addButton(UxService.getButtonBarButton('show.edits'));
            $scope.bbApi.setToggleState('show.edits', $rootScope.mms_ShowEdits);
            hotkeys.bindTo($scope)
            .add({
                combo: 'alt+d',
                description: 'toggle edit mode',
                callback: function() {$scope.$broadcast('show.edits');}
            });
        }

        $scope.bbApi.addButton(UxService.getButtonBarButton('show.comments'));
        $scope.bbApi.setToggleState('show.comments', $rootScope.veCommentsOn);
        $scope.bbApi.addButton(UxService.getButtonBarButton('show.elements'));
        $scope.bbApi.setToggleState('show.elements', $rootScope.veElementsOn);
        hotkeys.bindTo($scope)
        .add({
            combo: 'alt+c',
            description: 'toggle show comments',
            callback: function() {$scope.$broadcast('show.comments');}
        }).add({
            combo: 'alt+e',
            description: 'toggle show elements',
            callback: function() {$scope.$broadcast('show.elements');}
        });
        // TODO: This code is duplicated in the ViewCtrl
        // **WARNING** IF YOU CHANGE THIS CODE, NEED TO UPDATE IN VIEW CTRL TOO

        if ($state.includes('workspace.site.document') || $state.includes('workspace.site.documentpreview')) {
            if (snapshot !== null) {
                var pdfUrl = getPDFUrl();
                if (pdfUrl !== null && pdfUrl !== undefined) {
                    $scope.bbApi.addButton(UxService.getButtonBarButton('download.pdf'));                
                } else {
                    $scope.bbApi.addButton(UxService.getButtonBarButton('generate.pdf'));

                    var pdfStatus = getPDFStatus();
                    if (pdfStatus === 'Generating...')
                        $scope.bbApi.toggleButtonSpinner('generate.pdf');
                    else if (pdfStatus !== null)
                        $scope.bbApi.setTooltip('generate.pdf', pdfStatus);
                }

                var zipUrl = getZipUrl();
                if (zipUrl !== null && zipUrl !== undefined) {
                    $scope.bbApi.addButton(UxService.getButtonBarButton('download.zip'));                
                } else {
                    $scope.bbApi.addButton(UxService.getButtonBarButton('generate.zip'));

                    var zipStatus = getZipStatus();
                    if (zipStatus === 'Generating...')
                        $scope.bbApi.toggleButtonSpinner('generate.zip');
                    else if (zipStatus !== null)
                        $scope.bbApi.setTooltip('generate.zip', zipStatus);
                }
            }
        }
    };

    // TODO: This code is duplicated in the ViewCtrl
    // **WARNING** IF YOU CHANGE THIS CODE, NEED TO UPDATE IN VIEW CTRL TOO

    var getPDFStatus = function(){
        if(!snapshot) return null;
        var formats = snapshot.formats;
        if(!formats || formats.length===0) return null;
        for(var i=0; i < formats.length; i++){
            if(formats[i].type=='pdf') {
                var status = formats[i].status;
                if(status == 'Generating') status = 'Generating...';
                else if(status == 'Error') status = 'Regenerate PDF';
                return status;
            }
        }
        return null;
    };

    var getPDFUrl = function(){
        if(!snapshot) return null;
        var formats = snapshot.formats;
        if(!formats || formats.length===0) return null;
        for(var i=0; i < formats.length; i++){
            if(formats[i].type=='pdf'){
                return formats[i].url;
            }
        }
        return null;
    };

    var getZipStatus = function(){
        if(!snapshot) return null;
        var formats = snapshot.formats;
        if(!formats || formats.length===0) return null;
        for(var i=0; i < formats.length; i++){
            if(formats[i].type=='html') {
                var status = formats[i].status;
                if(status == 'Generating') status = 'Generating...';
                else if(status == 'Error') status = 'Regenerate Zip';
                return status;
            }
        }
        return null;
    };

    var getZipUrl = function(){
        if(angular.isUndefined(snapshot)) return null;
        if(snapshot===null) return null;
        
        var formats = snapshot.formats;
        if(formats===undefined || formats===null || formats.length===0) return null;
        for(var i=0; i < formats.length; i++){
            if(formats[i].type=='html'){
                return formats[i].url;  
            } 
        }
        return null;
    };

    $scope.$on('generate.pdf', function() {
        if (getPDFStatus() === 'Generating...')
            return;
        $scope.bbApi.toggleButtonSpinner('generate.pdf');
        $scope.bbApi.toggleButtonSpinner('generate.zip');

        snapshot.formats.push({"type":"pdf",  "status":"Generating"});
        snapshot.formats.push({"type":"html", "status":"Generating"});
        snapshot.ws = $scope.ws;
        snapshot.site = site.sysmlid;
        snapshot.time = time;
        
        ConfigService.createSnapshotArtifact(snapshot, site.sysmlid, workspace).then(
            function(result){
                growl.info('Generating artifacts...Please wait for a completion email and reload the page.');
            },
            function(reason){
                growl.error('Failed to generate artifacts: ' + reason.message);
            }
        );
    });

    $scope.$on('generate.zip', function() {
        $rootScope.$broadcast('generate.pdf');        
    });

    $scope.$on('download.pdf', function() {
        $window.open(getPDFUrl());

    });

    $scope.$on('download.zip', function() {
        $window.open(getZipUrl());
    });

    $scope.$on('show.comments', function() {
        $scope.views.forEach(function(view) {
            view.api.toggleShowComments();
        });
        $scope.bbApi.toggleButtonState('show.comments');
        $rootScope.veCommentsOn = !$rootScope.veCommentsOn;
    });

    $scope.$on('show.elements', function() {
        $scope.views.forEach(function(view) {
            view.api.toggleShowElements();
        });
        $scope.bbApi.toggleButtonState('show.elements');
        $rootScope.veElementsOn = !$rootScope.veElementsOn;
    });

    $scope.$on('show.edits', function() {
        $scope.views.forEach(function(view) {
            view.api.toggleShowEdits();
        });
        $scope.bbApi.toggleButtonState('show.edits');
        $rootScope.mms_ShowEdits = !$rootScope.mms_ShowEdits;
    });
    $rootScope.mms_fullDocMode = true;

    $scope.$on('section.add.paragraph', function(event, section) {
        MmsAppUtils.addPresentationElement($scope, 'Paragraph', section);
    });

    $scope.$on('section.add.section', function(event, section) {
        MmsAppUtils.addPresentationElement($scope, 'Section', section);
    });
}]);