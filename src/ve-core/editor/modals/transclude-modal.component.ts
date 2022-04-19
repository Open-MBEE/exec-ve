import * as angular from 'angular';
import * as _ from 'lodash';
import {VeComponentOptions, VeSearchOptions} from "../../../ve-utils/types/view-editor";
import {UtilsService} from "../../../ve-utils/services/Utils.service";
import {ElementService} from "../../../ve-utils/services/Element.service";
import {VeEditorController} from "../ve-editor.component";
import {ViewService} from "../../../ve-utils/services/View.service";
import {ApplicationService} from "../../../ve-utils/services/Application.service";
import {ElementObject, ViewObject} from "../../../ve-utils/types/mms";


import {veExt} from "../../../ve-extensions/ve-extensions.module";
import {Class} from "../../../ve-utils/utils/emf.util";

// Component for inserting cross reference
// Defines scope variables for html template and how to handle user click
// Also defines options for search interfaces -- see mmsSearch.js for more info
let TranscludeModalComponent: VeComponentOptions = {
    selector: 'transcludeModal',
    template: `
    <div class="modal-header">
    <h4>{{$ctrl.title}}</h4>
</div>
<div class="modal-body">
    <div class="ve-light-tabs modal-top-tabs" ng-show="$ctrl.viewLink">
        <ul class="nav nav-tabs">
            <li class="uib-tab nav-item tab-item" ng-class="{'active': !$ctrl.searchExisting}">
                <a class="nav-link" ng-click="$ctrl.searchExisting = false"><i class="fa fa-plus"></i>Create New</a>
            </li>
            <li class="uib-tab nav-item tab-item" ng-class="{'active': $ctrl.searchExisting}">
                <a class="nav-link" ng-click="$ctrl.searchExisting = true"><i class="fa fa-search"></i>Search for existing</a>
            </li>
        </ul>
    </div>

    <!-- Search for existing panel -->
    <div ng-show="$ctrl.searchExisting">
        <div class="transclude-modal-instructions">
            {{$ctrl.description}}
        </div>
        <div class="form-group" ng-show="!$ctrl.viewLink"><br>
            <label>Link Text:</label>
            <div class="radio radio-with-label">
                <label><input type="radio" ng-model="$ctrl.linkType" ng-value="1">&nbsp;Auto-Numbering
                    <a uib-tooltip="For links within current document, otherwise defaults to name" tooltip-trigger="mouseenter" tooltip-popup-delay="100"><i class="fa fa-info-circle"></i></a></label><br>
                <label><input type="radio" ng-model="$ctrl.linkType" ng-value="4">&nbsp;Auto-Numbering w/ Name</label><br>
                    <a uib-tooltip="For links within current document, otherwise defaults to name" tooltip-trigger="mouseenter" tooltip-popup-delay="100"><i class="fa fa-info-circle"></i></a></label><br>
                <label><input type="radio" ng-model="$ctrl.linkType" ng-value="2">&nbsp;Name</label><br>
                <label><input type="radio" ng-model="$ctrl.linkType" ng-value="3">&nbsp;Custom&nbsp;
                    <input type="text" ng-model="$ctrl.linkText" placeholder="custom title"/></label>
            </div>
        </div>
        <label ng-show="$ctrl.showEditableOp" for="$ctrl.nonEditableCheckbox">
            <input id="$ctrl.nonEditableCheckbox" type="checkbox" ng-model="$ctrl.nonEditableCheckbox">&nbsp;Restrict editing
        </label>

        <mms-search mms-options="$ctrl.searchOptions" mms-project-id="{{$ctrl.mmsProjectId}}" mms-ref-id="{{$ctrl.mmsRefId}}"></mms-search>
    </div>

    <!-- Create New Panel -->
    <div ng-show="!$ctrl.searchExisting">
        <form>
            <div class="form-group">
                <label>Name </label><span class="star-mandatory">*</span>
                <input class="form-control" type="text" ng-model="$ctrl.newE.name" placeholder="Name your new element" autofocus/>
            </div>
            <div class="form-group">
                <label class="label-documentation">Documentation</label>
                <ve-editor editor-data="$ctrl.newE.documentation" mms-project-id="{{$ctrl.mmsProjectId}}" mms-ref-id="{{$ctrl.mmsRefId}}" class="textarea-transclude-modal"></ve-editor>
            </div>
            <label>Property to cross-reference</label><span class="star-mandatory">*</span>
            <div class="radio radio-with-label">
                <label><input type="radio" name="optradio" value="true" ng-click="$ctrl.toggleRadio('name')">Name</label><br>
                <label><input type="radio" name="optradio" value="true" ng-click="$ctrl.toggleRadio('documentation')">Documentation</label>
            </div>
        </form>

        <p class="help-block pull-left"><i>Fields marked with <span class="star-mandatory">*</span> are required</i></p>
    </div>
</div>
<div class="modal-footer">
    <button class="btn btn-primary" ng-show="!$ctrl.searchExisting" type="button" ng-click="$ctrl.makeNewAndChoose()">Create & Cross Reference<i class="{{$ctrl.proposeClass}}"></i></button>
    <button class="btn btn-default" ng-click="$ctrl.cancel()">Cancel</button>
</div>
`,
    bindings: {
        close: "<",
        dismiss: "<",
        modalInstance: "<",
        resolve: "<"
    },
    controller: class TranscludeModalController implements angular.IComponentController {

        //bindings
        private dismiss
        close
        resolve

        private editor: VeEditorController

        protected title: string = 'Insert cross reference';
        protected description: string = 'Begin by searching for an element, then click a field to cross-reference.';
        protected searchExisting: boolean = true;
        protected newE: { name: string, documentation: string } = {name: '', documentation: ''};
        protected requestName: boolean = false;
        protected requestDocumentation: boolean = false;
        protected viewLink: boolean;
        protected nonEditableCheckbox: boolean = false;
        protected showEditableOp: boolean = true;
        protected proposeClass: string;
        protected linkType: number = null;
        protected linkText: string;

        // Set search result options
        protected searchOptions: VeSearchOptions


        static $inject = ['growl', 'ElementService', 'ViewService', 'ApplicationService',  'UtilsService']
        private mmsProjectId: string;
        private mmsRefId: string;


        constructor(private growl: angular.growl.IGrowlService, private elementSvc: ElementService,
                    private viewSvc: ViewService, private applicationSvc: ApplicationService,
                    private utilsSvc: UtilsService) {
        }

        $onInit() {
            this.editor = this.resolve.editor();
            this.mmsProjectId = this.editor.mmsProjectId;
            this.mmsRefId = this.editor.mmsRefId;
            this.searchOptions.callback = this.choose;
            this.viewLink = this.resolve.viewLink();

            if (!this.viewLink) {
                this.searchOptions.getProperties = true
                this.searchOptions.emptyDocTxt = 'This field is empty, but you can still click here to cross-reference a placeholder.'
            }
            else {
                this.searchOptions.relatedCallback = this.chooseDoc
                this.searchOptions.filterQueryList = [this.mainSearchFilter]
                this.searchOptions.itemsPerPage = 200
            }
        }

        public choose = (elem: ElementObject, property: string) => {
            let tag = '';
            if (!this.viewLink) {
                tag = '<mms-cf mms-cf-type="' + property + '" mms-element-id="' + elem.id + '" non-editable="' + this.nonEditableCheckbox + '">[cf:' + elem.name + '.' + property + ']</mms-cf>';
            }
            else {
                var did = null;
                var vid = null;
                var peid = null;
                var currentDoc = this.applicationSvc.getState().currentDoc;
                if (elem._relatedDocuments && elem._relatedDocuments.length > 0) {
                    var cur = _.find(elem._relatedDocuments, {id: currentDoc});
                    if (cur) {
                        did = currentDoc;
                        if (cur._parentViews.length > 0) {
                            vid = cur._parentViews[0].id;
                        }
                    } else {
                        did = elem._relatedDocuments[0].id;
                        if (elem._relatedDocuments[0]._parentViews.length > 0) {
                            vid = elem._relatedDocuments[0]._parentViews[0].id;
                        }
                    }
                }
                if (elem.type === 'InstanceSpecification') {
                    if (this.viewSvc.isSection(elem)) {
                        vid = elem.id;
                    } else {
                        peid = elem.id;
                    }
                } else {
                    vid = elem.id;
                }
                tag = this.createViewLink(elem, did, vid, peid);
            }

            this.close({$value: tag});
        };

        public cancel = () => {
            this.dismiss();
        };

        public makeNewAndChoose = () => {
            if (!this.newE.name) {
                this.growl.error('Error: A name for your new element is required.');
                return;
            } else if (!this.requestName && !this.requestDocumentation) {
                this.growl.error('Error: Selection of a property to cross-reference is required.');
                return;
            }
            this.proposeClass = "fa fa-spin fa-spinner";
            let id = this.utilsSvc.createMmsId();
            let createObj: ElementObject = {
                id: id,
                _projectId: this.mmsProjectId,
                _refId: this.mmsRefId,
                ownerId: "holding_bin_" + this.mmsProjectId,
                name: this.newE.name,
                documentation: this.newE.documentation,
                type: 'Class',
                _appliedStereotypeIds: []
            }
            let toCreate: ElementObject = new Class(createObj);
            var reqOb = {
                elements: [toCreate],
                elementId: toCreate.id,
                projectId: this.mmsProjectId,
                refId: this.mmsRefId
            };

            this.elementSvc.createElement(reqOb)
                .then((data) => {
                    if (this.requestName) {
                        this.choose(data, 'name');
                    } else if (this.requestDocumentation) {
                        this.choose(data, 'doc');
                    }
                    this.proposeClass = "";
                }, (reason) => {
                    this.growl.error("Propose Error: " + reason.message);
                    this.proposeClass = "";
                });
        };

        public toggleRadio = (field) => {
            if (field === "name") {
                this.requestName = true;
                this.requestDocumentation = false;
            } else if (field === "documentation") {
                this.requestName = false;
                this.requestDocumentation = true;
            }
        };

        private createViewLink = (elem, did, vid, peid) => {
        var tag = '<mms-view-link';
        if (did) {
            tag += ' mms-doc-id="' + did + '"';
        }
        if (vid) {
            tag += ' mms-element-id="' + vid + '"';
        }
        if (peid) {
            tag += ' mms-pe-id="' + peid + '"';
        }
        if (this.linkType == 1) {
            tag += ' suppress-numbering="false"';
            tag += ' show-name="false"';
        }
        if (this.linkType == 2) {
            tag += ' suppress-numbering="true"';
            tag += ' show-name="true"';
        }
        if (this.linkType == 3 && this.linkText) {
            tag += ' link-text="' + this.linkText + '"';
        }
        if (this.linkType == 4) {
            tag += ' suppress-numbering="false"';
            tag += ' show-name="true"';
        }
        tag += '>[cf:' + elem.name + '.vlink]</mms-view-link>';
        return tag;
    };

    public chooseDoc = (doc: ViewObject, view: ViewObject, elem: ElementObject) => {
        var did = doc.id;
        var vid = view.id;
        var peid = null;
        if (this.viewSvc.isSection(elem)) {
            vid = elem.id;
        } else if (this.viewSvc.getPresentationElementType(elem)) {
            peid = elem.id;
        }
        var tag = this.createViewLink(elem, did, vid, peid);
        this.close({ $value: tag });
    };

    private mainSearchFilter = () => {
            var stereoQuery = {
                terms: {}
            };
            stereoQuery.terms = {"_appliedStereotypeIds": [this.utilsSvc.VIEW_SID, this.utilsSvc.DOCUMENT_SID].concat(this.utilsSvc.OTHER_VIEW_SID)};

            var classifierList = [];
            var allClassifierIds = this.viewSvc.TYPE_TO_CLASSIFIER_ID;
            for (var k in allClassifierIds) {
                if (allClassifierIds.hasOwnProperty(k)) {
                    classifierList.push(allClassifierIds[k]);
                }
            }
            var classifierIdQuery = {
                terms: {}
            };
            classifierIdQuery.terms = {"classifierIds": classifierList};
            return {
                "bool": {
                    "should": [
                        stereoQuery,
                        classifierIdQuery
                    ]
                }
            };
        };
    }
}

veExt.component(TranscludeModalComponent.selector, TranscludeModalComponent);