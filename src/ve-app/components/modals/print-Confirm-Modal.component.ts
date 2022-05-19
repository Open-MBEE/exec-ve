import * as angular from 'angular';
import * as _ from "lodash";

import {DocMetadata, EditService, ElementService, UtilsService, ViewService} from "@ve-utils/services";
import {AppUtilsService} from "../../services/AppUtils.service";

import {veApp} from "@ve-app";

let PrintConfirmModalComponent: angular.Injectable<any> = {
    selector: 'printConfirmModal',
    template: `
    <div class="modal-header">
    <h4>{{$ctrl.action}} {{$ctrl.type | lowercase}}</h4>
</div>

<div class="modal-body">
    <p ng-if="$ctrl.hasError" class="mms-error-icon">
        WARNING: There are cross reference errors in this document that will be reflected in the export.
    </p>
    <p ng-if="$ctrl.unsaved" class="mms-error-icon">
        WARNING: Unsaved changes may not be reflected (alt + a to save all)
    </p>
    <p ng-if="$ctrl.mode === 1">
      This will bring up a popup where you can {{$ctrl.action}} the contents of this {{$ctrl.type === 'DOCUMENT' ? 'document' : 'view'}} , please disable any popup blockers if you don't
      see the popup. 
      <br/><br/>If you don't see certain content appearing in the popup, please wait until the full document appears in this pane before clicking {{$ctrl.action}}.
    </p>
    <p ng-if="$ctrl.mode !== 1">
     <span ng-if="$ctrl.type === 'VIEW'">
      Click on {{$ctrl.action | uppercase}} to generate a {{$ctrl.label}} of this view (it will not include table of contents or cover pages). You will receive an email with subject line "HTML to {{$ctrl.label}} generation completed" with a link to the generated {{label | uppercase}}. If you want the full document instead, please click on GO TO FULL DOCUMENT.
     </span>
     <span ng-if="$ctrl.type === 'DOCUMENT'">
      Please wait until the full document appears in this pane before continuing. You will receive an email with subject line "HTML to {{$ctrl.label}} generation completed" with a link to the generated {{$ctrl.label}}.
     </span>
    </p>
    <p ng-if="$ctrl.type == 'DOCUMENT' && $ctrl.mode === 3">
      Choose either basic or advanced styling options.
    </p>    
    <br/>
    <div ng-if="$ctrl.type == 'DOCUMENT' && $ctrl.mode !== 1">
    </div>
    <div ng-if="$ctrl.type == 'DOCUMENT' && $ctrl.mode !== 1"><input type="checkbox" ng-model="$ctrl.model.genTotf"> Include List of Tables, Figures and Equations</div>
    <br/>

    <div ng-if="$ctrl.type == 'DOCUMENT' && $ctrl.mode === 3">
        <br/>
        <form class="ve-light-tabs">
            <input type="radio" name="Options" ng-click="$ctrl.customizeDoc.useCustomStyle = false" data-ng-model="$ctrl.customizeDoc.useCustomStyle" data-ng-value="false">
            <label for="Basic">Basic Options</label>&nbsp;&nbsp;&nbsp;
            <input type="radio" name="Options" ng-click="$ctrl.customizeDoc.useCustomStyle = true" data-ng-model="$ctrl.customizeDoc.useCustomStyle" data-ng-value="true">
            <label for="Advanced">Advanced Options (CSS)</label>
        </form>

        <div class="well" ng-show="!$ctrl.customizeDoc.useCustomStyle">
        <form role="form">

            <div ng-if="$ctrl.mode !== 1">
                <label>Orientation</label><br>
                <form>
                    <input type="radio" name="export-orientation" ng-model="$ctrl.model.landscape" ng-value="false">
                    <label for="portrait" class="ve-font-weight-normal">&nbsp;<i class="fa fa-file ve-secondary-text"></i> Portrait</label><br>
                    <input type="radio" name="export-orientation" ng-model="$ctrl.model.landscape" ng-value="true">
                    <label for="landscape" class="ve-font-weight-normal">&nbsp;<i class="fa fa-file fa-rotate-270 ve-secondary-text"></i> Landscape</label>
                </form>
            </div>
            <br />

            <div class="form-group">
                <label>Header</label>
                <div class="row narrow-gutter-row">
                    <div class="col-md-3">
                        <input class="ve-plain-input" type="text" ng-model="$ctrl.meta['top-left']" placeholder="Left" aria-labelledby="left header">
                    </div>
                    <div class="col-md-6">
                        <input class="ve-plain-input" type="text" ng-model="$ctrl.meta.top" placeholder="Center" aria-labelledby="center header">
                    </div>
                    <div class="col-md-3">
                        <input class="ve-plain-input" type="text" ng-model="$ctrl.meta['top-right']" placeholder="Right" aria-labelledby="right header">
                    </div>
                </div>
            </div>
            <div class="form-group">
                <label for="footer">Footer</label>
                <div class="row narrow-gutter-row">
                    <div class="col-md-3">
                        <input class="ve-plain-input" type="text" ng-model="$ctrl.meta['bottom-left']" placeholder="Left" aria-labelledby="left footer">
                    </div>
                    <div class="col-md-6">
                        <input class="ve-plain-input" type="text" ng-model="$ctrl.meta.bottom" placeholder="Center" aria-labelledby="center footer">
                    </div>
                    <div class="col-md-3">
                        <input class="ve-plain-input" type="text" ng-model="$ctrl.meta['bottom-right']"  placeholder="Right" aria-labelledby="right footer">
                    </div>
                </div>
            </div>
            <p class="help-block"><i>Use 'counter(page)' for page number</i></p>

        </form>
        </div>

        <div class="well" ng-show="$ctrl.customizeDoc.useCustomStyle">
            <form ng-submit="$ctrl.saveStyleUpdate()" role="form">

                <div class="form-group">
                    <textarea class="form-control" rows="6" style="width:100%" ng-model="$ctrl.customizeDoc.customCSS"></textarea>
                </div>
                <p class="help-block">
                    <a target="_blank" href="https://wiki.jpl.nasa.gov/display/opencae/View+Editor+User+Guide%3A+8+PDF+Customization">Example CSS customizations</a>
                </p>
                <button class="btn btn-default" type="submit"><i class="fa fa-save"></i>Save CSS for document<span ng-if="$ctrl.elementSaving"><i class="fa fa-spinner fa-spin"></i></span></button>
                <button class="btn btn-default" type="button" ng-click="$ctrl.preview()">Preview</button>
            </form>
        </div>
    </div>

</div>

<div class="modal-footer">
    <button ng-if="$ctrl.type == 'VIEW' && $ctrl.docOption" class="btn btn-primary" ng-click="$ctrl.fulldoc()">Go to full document</button>
    <button class="btn btn-primary" ng-click="$ctrl.print()">{{$ctrl.action | uppercase}}</button>
    <button class="btn btn-default" ng-click="$ctrl.cancel()">Cancel</button>
</div>
`,
    bindings: {
        close: "<",
        dismiss: "<",
        modalInstance: "<",
        resolve: "<"
    },
    controller: class PrintConfirmModalController implements angular.IComponentController {
        static $inject = ['$filter', '$window', 'growl', 'UtilsService', 'ViewService', 'EditService', 'ElementService',
            'AppUtilsService'];

        //bindings
        public modalInstance
        dismiss
        close
        resolve

        private refOb: any;
        type: string;
        mode: any;
        action: string;
        viewOrDocOb: any;
        printElement: any;
        label: string;
        meta: {
            'top-left': string, top: string, 'top-right': string,
            'bottom-left': string, bottom: string, 'bottom-right': string
        };
        customizeDoc: {
            useCustomStyle: boolean,
            customCSS: any
        };
        hasError: boolean;
        isDoc: boolean;
        elementSaving: boolean;
        unsaved: boolean;
        docOption: boolean;
        model: { genTotf: boolean; landscape: boolean; htmlTotf: boolean; };
        previewResult: any;
        customization: any;

        constructor(private $filter: angular.IFilterService, private $window: angular.IWindowService, private growl: angular.growl.IGrowlService,
                    private utilsSvc: UtilsService, private viewSvc: ViewService, private editSvc: EditService,
                    private elementSvc: ElementService, private appUtilsSvc: AppUtilsService) {
        }

        $onInit() {
            this.refOb = this.resolve.refOb()
            this.isDoc = this.resolve.isDoc()
            this.type = this.isDoc ? 'DOCUMENT' : 'VIEW';
            this.mode = this.resolve.mode();
            this.viewOrDocOb = this.resolve.viewOrDocOb();
            this.printElement = this.resolve.print();
            this.action = this.mode === 1 ? 'print' : this.mode === 3 ? 'Generate PDF' : 'Generate word';
            this.label = this.mode === 3 ? 'PDF' : this.mode === 2 ? 'Word' : '';
            this.customizeDoc.useCustomStyle = false;

            if (this.printElement.find('.mms-error').length > 0) {
                this.hasError = true;
            }

            if (this.isDoc) {
                // If _printCss, use to set doc css for export/print
                this.customizeDoc.useCustomStyle = false;
                if (this.viewOrDocOb._printCss) {
                    // If _printCss, show tab for custom css
                    this.customizeDoc.useCustomStyle = true;
                    this.customizeDoc.customCSS = this.viewOrDocOb._printCss;
                } else {
                    this.customizeDoc.customCSS = this.utilsSvc.getPrintCss(false, false, {});
                }

                // Get/Set document header/footer for PDF generation
                this.meta = {
                    'top-left': 'loading...', top: 'loading...', 'top-right': 'loading...',
                    'bottom-left': 'loading...', bottom: 'loading...', 'bottom-right': 'loading...'
                };
                this.viewSvc.getDocMetadata({
                    elementId: this.viewOrDocOb.id,
                    projectId: this.viewOrDocOb._projectId,
                    refId: this.viewOrDocOb._refId
                }, 2).then((metadata: DocMetadata) => {
                    this.meta.top = metadata.top ? metadata.top : '';
                    this.meta.bottom = metadata.bottom ? metadata.bottom : '';
                    this.meta['top-left'] = metadata.topl ? metadata.topl : '';
                    this.meta['top-right'] = metadata.topr ? metadata.topr : '';
                    if (this.refOb && this.refOb.type === 'Tag') {
                        this.meta['top-right'] = this.meta['top-right'] + ' ' + this.refOb.name;
                    }
                    var displayTime = this.refOb.type === 'Tag' ? this.refOb._timestamp : 'latest';
                    if (displayTime === 'latest') {
                        displayTime = new Date();
                        displayTime = this.$filter('date')(displayTime, 'M/d/yy h:mm a');
                    }
                    this.meta['top-right'] = this.meta['top-right'] + ' ' + displayTime;
                    this.meta['bottom-left'] = metadata.bottoml ? metadata.bottoml : '';
                    this.meta['bottom-right'] = metadata.bottomr ? metadata.bottomr : 'counter(page)';
                }, (reason) => {
                    this.meta['top-left'] = this.meta.top = this.meta['top-right'] = this.meta['bottom-left'] = this.meta.bottom = '';
                    this.meta['bottom-right'] = 'counter(page)';
                });
            }
            this.unsaved = (this.editSvc.getAll() && !_.isEmpty(this.editSvc.getAll()));
            this.docOption = (!this.isDoc && (this.mode === 3 || this.mode === 2));
            this.model = { genTotf: false, landscape: false, htmlTotf: false };

        }



        public saveStyleUpdate() {
            // To only update _printCss, create new ob with doc info
            this.elementSaving = true;
            var docOb = {
                id: this.viewOrDocOb.id,
                _projectId: this.viewOrDocOb._projectId,
                _refId: this.viewOrDocOb._refId,
                _printCss: this.customizeDoc.customCSS
            };
            this.elementSvc.updateElement(docOb).then(() => {
                this.elementSaving = false;
                this.growl.success('Save Successful');
            }, () => {
                this.elementSaving = false;
                this.growl.warning('Save was not complete. Please try again.');
            });
        };
        public preview() {
            if (!this.previewResult) {
                this.previewResult = this.appUtilsSvc.printOrGenerate(this.viewOrDocOb, 3, true, true, false);
                this.previewResult.tof = this.previewResult.tof + this.previewResult.toe;
            }
            var result = this.previewResult;
            var htmlArr = ['<html><head><title>' + this.viewOrDocOb.name + '</title><style type="text/css">', this.customizeDoc.customCSS, '</style></head><body style="overflow: auto">', result.cover];
            if (result.toc != '') htmlArr.push(result.toc);
            if (result.tot != '' && this.model.genTotf) htmlArr.push(result.tot);
            if (result.tof != '' && this.model.genTotf) htmlArr.push(result.tof);
            htmlArr.push(result.contents, '</body></html>');
            var htmlString = htmlArr.join('');
            var popupWin: Window | null = this.$window.open('about:blank', '_blank', 'width=800,height=600,scrollbars=1,status=1,toolbar=1,menubar=1');
            if (popupWin) {
                popupWin.document.open();
                popupWin.document.write(htmlString);
                popupWin.document.close();
            }else {
                this.growl.error("Popup Window Failed to open. Allow popups and try again")
            }
        };
        public print() {
            this.customization = this.customizeDoc.useCustomStyle ? this.customizeDoc.customCSS : false;
            this.close({$value: ['ok', this.model.genTotf, this.model.htmlTotf, this.model.landscape, this.meta, this.customization]});
        };
        public fulldoc() {
            this.close({$value: ['fulldoc']});
        };
        public cancel() {
            this.dismiss();
        };
    }
};

veApp.component(PrintConfirmModalComponent.selector,PrintConfirmModalComponent);