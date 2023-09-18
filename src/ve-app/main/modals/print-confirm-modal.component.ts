import angular from 'angular';
import _ from 'lodash';

import { AppUtilsService, DocumentStructure } from '@ve-app/main/services';
import { UtilsService } from '@ve-utils/application';
import { EditService } from '@ve-utils/core';
import { ElementService, ViewService, DocumentMetadata, ProjectService } from '@ve-utils/mms-api-client';
import { VeModalControllerImpl } from '@ve-utils/modals/ve-modal.controller';

import { veApp } from '@ve-app';

import { VePromise } from '@ve-types/angular';
import { CommitObject, CommitResponse, RefObject, ViewObject } from '@ve-types/mms';
import { VeModalComponent, VeModalController, VeModalResolve, VeModalResolveFn } from '@ve-types/view-editor';

interface PrintModalResolve extends VeModalResolve {
    print: JQLite;
    refOb: RefObject;
    viewOrDocOb: ViewObject;
    isDoc: boolean;
    mode: number;
}

export interface PrintModalResolveFn extends VeModalResolveFn {
    print(): JQLite;
    refOb(): RefObject;
    viewOrDocOb(): ViewObject;
    isDoc(): boolean;
    mode(): number;
}

export interface PrintConfirmResult {
    status: string;
    customization?: boolean;
    meta?: DocumentMetadata;
    model?: { genTotf: boolean; landscape: boolean; htmlTotf: boolean };
    customCSS?: string;
}

class PrintConfirmModalController extends VeModalControllerImpl<PrintConfirmResult> implements VeModalController {
    static $inject = [
        '$filter',
        '$window',
        'growl',
        'UtilsService',
        'ViewService',
        'EditService',
        'ElementService',
        'ProjectService',
        'AppUtilsService',
    ];

    protected resolve: PrintModalResolve;

    private refOb: RefObject;
    type: string;
    mode: number;
    action: string;
    viewOrDocOb: ViewObject;
    printElement: JQLite;
    label: string;
    meta: DocumentMetadata;
    customizeDoc: {
        useCustomStyle: boolean;
        customCSS: string;
    };
    hasError: boolean;
    isDoc: boolean;
    elementSaving: boolean;
    unsaved: boolean;
    docOption: boolean;
    model: { genTotf: boolean; landscape: boolean; htmlTotf: boolean };
    previewResult: DocumentStructure;

    constructor(
        private $filter: angular.IFilterService,
        private $window: angular.IWindowService,
        private growl: angular.growl.IGrowlService,
        private utilsSvc: UtilsService,
        private viewSvc: ViewService,
        private autosaveSvc: EditService,
        private elementSvc: ElementService,
        private projectSvc: ProjectService,
        private appUtilsSvc: AppUtilsService
    ) {
        super();
    }

    $onInit(): void {
        this.refOb = this.resolve.refOb;
        this.isDoc = this.resolve.isDoc;
        this.type = this.isDoc ? 'DOCUMENT' : 'VIEW';
        this.mode = this.resolve.mode;
        this.viewOrDocOb = this.resolve.viewOrDocOb;
        this.printElement = this.resolve.print;
        this.action = this.mode === 1 ? 'print' : this.mode === 3 ? 'Generate PDF' : 'Generate word';
        this.label = this.mode === 3 ? 'PDF' : this.mode === 2 ? 'Word' : '';
        this.customizeDoc = { useCustomStyle: false, customCSS: '' };

        if (this.printElement.find('.ve-error').length > 0) {
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
                this.customizeDoc.customCSS = this.utilsSvc.getPrintCss(false, false, {
                    numberingDepth: 0,
                    numberingSeparator: '.',
                });
            }

            // Get/Set document header/footer for PDF generation
            this.meta = {
                numberingDepth: 0,
                numberingSeparator: '.',
                'top-left': 'loading...',
                top: 'loading...',
                'top-right': 'loading...',
                'bottom-left': 'loading...',
                bottom: 'loading...',
                'bottom-right': 'loading...',
            };
            this.viewSvc
                .getDocumentMetadata(
                    {
                        elementId: this.viewOrDocOb.id,
                        projectId: this.viewOrDocOb._projectId,
                        refId: this.viewOrDocOb._refId,
                    },
                    2
                )
                .then(
                    (metadata: DocumentMetadata) => {
                        let displayTime = 'latest';
                        let promise: VePromise<CommitObject | CommitObject[], CommitResponse>;
                        if (this.refOb.parentCommitId) {
                            promise = this.projectSvc.getCommit(
                                this.refOb._projectId,
                                this.refOb.id,
                                this.refOb.parentCommitId
                            );
                        } else {
                            promise = this.projectSvc.getCommits(this.refOb.id, this.refOb._projectId, null, 1);
                        }

                        promise
                            .then(
                                (result) => {
                                    let commit: CommitObject;
                                    if (Array.isArray(result)) {
                                        commit = result[0];
                                    } else {
                                        commit = result;
                                    }
                                    displayTime = this.$filter('date')(commit._created, 'M/d/yy h:mm a');
                                },
                                (reason) => {
                                    this.growl.error(
                                        'Warning: RefOb parent commit does not exist; Defaulting to current time'
                                    );
                                }
                            )
                            .finally(() => {
                                const defaultMetadata: DocumentMetadata = {
                                    numberingDepth: 0,
                                    numberingSeparator: '.',
                                    top: '',
                                    bottom: '',
                                    'top-left': '',
                                    'top-right': '',
                                    'bottom-left': '',
                                    'bottom-right': 'counter(page)',
                                };
                                this.meta = Object.assign(metadata, defaultMetadata);
                                if (this.refOb && this.refOb.type === 'Tag') {
                                    this.meta['top-right'] = this.meta['top-right'] + ' ' + this.refOb.name;
                                }
                                if (displayTime === 'latest') {
                                    displayTime = this.$filter('date')(new Date(), 'M/d/yy h:mm a');
                                }
                                this.meta['top-right'] = this.meta['top-right'] + ' ' + displayTime;
                            });
                    },
                    (reason) => {
                        this.meta['top-left'] =
                            this.meta.top =
                            this.meta['top-right'] =
                            this.meta['bottom-left'] =
                            this.meta.bottom =
                                '';
                        this.meta['bottom-right'] = 'counter(page)';
                    }
                );
        }
        this.unsaved = this.autosaveSvc.getAll() && !_.isEmpty(this.autosaveSvc.getAll());
        this.docOption = !this.isDoc && (this.mode === 3 || this.mode === 2);
        this.model = { genTotf: false, landscape: false, htmlTotf: false };
    }

    public saveStyleUpdate(): void {
        // To only update _printCss, create new ob with doc info
        this.elementSaving = true;
        const docOb = {
            id: this.viewOrDocOb.id,
            _projectId: this.viewOrDocOb._projectId,
            _refId: this.viewOrDocOb._refId,
            _printCss: this.customizeDoc.customCSS,
        };
        this.elementSvc.updateElement(docOb).then(
            () => {
                this.elementSaving = false;
                this.growl.success('Save Successful');
            },
            () => {
                this.elementSaving = false;
                this.growl.warning('Save was not complete. Please try again.');
            }
        );
    }
    public preview(): void {
        if (!this.previewResult) {
            this.previewResult = this.appUtilsSvc.printOrGenerate(this.viewOrDocOb, 3, true, true, false);
            this.previewResult.tof = this.previewResult.tof + this.previewResult.toe;
        }
        const result = this.previewResult;
        const htmlArr = [
            '<html><head><title>' + this.viewOrDocOb.name + '</title><style type="text/css">',
            this.customizeDoc.customCSS,
            '</style></head><body style="overflow: auto">',
            result.cover,
        ];
        if (result.toc != '') htmlArr.push(result.toc);
        if (result.tot != '' && this.model.genTotf) htmlArr.push(result.tot);
        if (result.tof != '' && this.model.genTotf) htmlArr.push(result.tof);
        htmlArr.push(result.contents, '</body></html>');
        const htmlString = htmlArr.join('');
        const popupWin: Window | null = this.$window.open(
            'about:blank',
            '_blank',
            'width=800,height=600,scrollbars=1,status=1,toolbar=1,menubar=1'
        );
        if (popupWin) {
            popupWin.document.open();
            popupWin.document.write(htmlString);
            popupWin.document.close();
        } else {
            this.growl.error('Popup Window Failed to open. Allow popups and try again');
        }
    }
    public print(): void {
        const result = {
            status: 'ok',
            model: this.model,
            meta: this.meta,
            customization: this.customizeDoc.useCustomStyle,
            customCSS: this.customizeDoc.useCustomStyle ? this.customizeDoc.customCSS : null,
        };
        this.modalInstance.close(result);
    }
    public fulldoc(): void {
        this.modalInstance.close({ status: 'fulldoc' });
    }
    public cancel(): void {
        this.modalInstance.dismiss();
    }
}

const PrintConfirmModalComponent: VeModalComponent = {
    selector: 'printConfirmModal',
    template: `
    <div class="modal-header">
    <h4>{{$ctrl.action}} {{$ctrl.type | lowercase}}</h4>
</div>

<div class="modal-body">
    <p ng-if="$ctrl.hasError" class="ve-error-icon">
        WARNING: There are cross reference errors in this document that will be reflected in the export.
    </p>
    <p ng-if="$ctrl.unsaved" class="ve-error-icon">
        WARNING: Unsaved changes may not be reflected (alt + a to save all)
    </p>
    <p ng-if="$ctrl.mode === 1">
      This will bring up a popup where you can {{$ctrl.action}} the contents of this {{$ctrl.type === 'DOCUMENT' ? 'document' : 'view'}} , please disable any popup blockers if you don't
      see the popup. 
      <br/><br/>If you don't see certain content appearing in the popup, please wait until the full document appears in this pane before clicking {{$ctrl.action}}.
    </p>
    <p ng-if="$ctrl.mode !== 1">
     <span ng-if="$ctrl.type === 'VIEW'">
      Click on {{$ctrl.action | uppercase}} to generate a {{$ctrl.label}} of this view (it will not include table of contents or cover pages). If you want the full document instead, please click on GO TO FULL DOCUMENT.
     </span>
     <span ng-if="$ctrl.type === 'DOCUMENT'">
      Please wait until the full document appears in this pane before continuing.
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
        modalInstance: '<',
        resolve: '<',
    },
    controller: PrintConfirmModalController,
};

veApp.component(PrintConfirmModalComponent.selector, PrintConfirmModalComponent);
