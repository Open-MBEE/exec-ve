import $ from 'jquery';

import { ViewController } from '@ve-components/presentations/view.component';
import { ExtensionService } from '@ve-components/services';
import { CrossReferenceController } from '@ve-components/transclusions/mms-cf.component';
import { ApplicationService } from '@ve-utils/application';
import { ApiService, ElementService, ViewService } from '@ve-utils/mms-api-client';
import { handleChange, onChangesCallback } from '@ve-utils/utils';

import { veComponents } from '@ve-components';

import { VeComponentOptions } from '@ve-types/angular';
import { ElementObject, ElementsRequest } from '@ve-types/mms';

/**
 * @ngdoc directive
 * @name veComponents.component:mmsViewLink
 *
 * @requires veUtils/ElementService
 * @requires $compile
 *
 * * Given a view id and optional document id, creates a html link
 *
 * @param {string} mmsElementId The id of the view
 * @param {string} mmsProjectId The project id for the view
 * @param {string=master} mmsRefId Reference to use, defaults to master
 * @param {string=latest} mmsCommitId Commit ID, default is latest
 * @param {string} mmsDocId Document context of view
 * @param {string} mmsPeId Document context of view
 */
class ViewLinkController implements angular.IComponentController {
    //Bindings
    public mmsElementId: string;
    mmsProjectId: string;
    mmsRefId: string;
    mmsCommitId: string;
    mmsDocId: string;
    mmsPeId: string;
    linkText: string;
    linkClass: string;
    linkIconClass: string;
    linkTarget: string;
    mmsExternalLink: boolean;
    suppressNumbering: boolean;
    showName: boolean;

    // Controllers
    private mmsCfCtrl: CrossReferenceController;
    private mmsViewCtrl: ViewController;

    // Locals
    loading: boolean = true;
    target: string;
    private processed: boolean = false;
    projectId: string;
    refId: string;
    commitId: string;
    element: ElementObject;
    elementName: string;
    type: string;
    $transcludeEl: JQuery<HTMLElement>;

    static $inject = [
        '$scope',
        '$element',
        '$compile',
        'growl',
        'ElementService',
        'ApiService',
        'ViewService',
        'ApplicationService',
        'ExtensionService',
    ];
    suffix: string;
    hash: string;
    href: string;
    private docid: string;
    showNum: boolean;
    vid: string;

    constructor(
        private $scope: angular.IScope,
        private $element: JQuery<HTMLElement>,
        private $compile: angular.ICompileService,
        private growl: angular.growl.IGrowlService,
        private elementSvc: ElementService,
        private apiSvc: ApiService,
        private viewSvc: ViewService,
        private applicationSvc: ApplicationService,
        private extensionSvc: ExtensionService
    ) {}

    $onInit(): void {
        this.target = this.linkTarget ? this.linkTarget : '_self';
    }

    $onChanges(onChangesObj: angular.IOnChangesObject): void {
        handleChange(onChangesObj, 'mmsElementId', this.changeAction);
    }

    $postLink(): void {
        this.changeAction(this.mmsElementId, '', false);
    }

    protected changeAction: onChangesCallback<string> = (newVal, oldVal, firstChange) => {
        if (!newVal || (newVal === oldVal && this.processed)) return;

        this.processed = true;

        let projectId = this.mmsProjectId;
        let refId = this.mmsRefId;
        let commitId = this.mmsCommitId;
        let docid = this.mmsDocId;
        if (this.mmsCfCtrl) {
            const cfVersion = this.mmsCfCtrl.getElementOrigin();
            if (!projectId) projectId = cfVersion.projectId;
            if (!refId) refId = cfVersion.refId;
            if (!commitId) commitId = cfVersion.commitId;
        }
        if (this.mmsViewCtrl) {
            const viewVersion = this.mmsViewCtrl.getElementOrigin();
            if (!projectId) projectId = viewVersion.projectId;
            if (!refId) refId = viewVersion.refId;
            if (!commitId) commitId = viewVersion.commitId;
        }
        if (!projectId) {
            return;
        }
        this.projectId = projectId;
        this.refId = refId ? refId : 'master';
        this.commitId = commitId ? commitId : 'latest';
        let elementId = this.mmsElementId;
        if (!elementId && this.mmsPeId && !this.mmsDocId) {
            elementId = this.applicationSvc.getState().currentDoc;
        }

        const reqOb: ElementsRequest<string> = {
            elementId,
            projectId,
            refId,
            commitId,
        };
        this.elementSvc
            .getElement(reqOb, 1)
            .then(
                (data: ElementObject) => {
                    this.element = data;
                    this.elementName = data.name;
                    this.type = 'Section ';
                    this.suffix = '';
                    this.hash = '#' + data.id;
                    if (this.mmsPeId && this.mmsPeId !== '') {
                        const reqPEOb: ElementsRequest<string> = {
                            elementId: this.mmsPeId,
                            projectId,
                            refId,
                            commitId,
                        };
                        this.elementSvc.getElement(reqPEOb).then(
                            (pe) => {
                                this.vid = pe.id;
                                this.element = pe;
                                this.elementName = pe.name;
                                if (this.viewSvc.isTable(pe)) {
                                    this.type = 'Table ';
                                } else if (this.viewSvc.isFigure(pe)) {
                                    this.type = 'Fig. ';
                                } else if (this.viewSvc.isEquation(pe)) {
                                    this.type = 'Eq. (';
                                    this.suffix = ')';
                                }
                                if (this.applicationSvc.getState().fullDoc) {
                                    this.href = `main.project.ref.view.present.document({ projectId: $ctrl.projectId, refId: $ctrl.refId, documentId: $ctrl.docid, viewId: $ctrl.vid })`;
                                } else {
                                    this.href = `main.project.ref.view.present.slideshow({ projectId: $ctrl.projectId, refId: $ctrl.refId, documentId: $ctrl.docid, viewId: $ctrl.vid })`;
                                }
                            },
                            (reason) => {
                                this.growl.warning(`Unable to retrieve element: ${reason.message}`);
                            }
                        );
                    }
                    if (this.apiSvc.isDocument(data)) {
                        docid = data.id;
                        this.docid = docid;
                        this.vid = data.id;
                    } else if (this.apiSvc.isView(data) || data.type === 'InstanceSpecification') {
                        if (!docid || docid === '') {
                            docid = this.applicationSvc.getState().currentDoc;
                        }
                        this.docid = docid;
                        this.vid = data.id;
                    } else {
                        this.$element.html('<span class="ve-error">view link doesn\'t refer to a view</span>');
                    }
                    if (this.applicationSvc.getState().fullDoc) {
                        this.href = `main.project.ref.view.present.document({ projectId: $ctrl.projectId, refId: $ctrl.refId, documentId: $ctrl.docid, viewId: $ctrl.vid })`;
                    } else {
                        this.href = `main.project.ref.view.present.slideshow({ projectId: $ctrl.projectId, refId: $ctrl.refId, documentId: $ctrl.docid, viewId: $ctrl.vid })`;
                    }
                    this.showNum =
                        this.applicationSvc.getState().inDoc &&
                        this.applicationSvc.getState().currentDoc === this.docid &&
                        !this.suppressNumbering;
                },
                (reason) => {
                    this.$element.empty();
                    this.$transcludeEl = $(
                        '<annotation mms-element-id="::elementId" mms-recent-element="::recentElement" mms-type="::type"></annotation>'
                    );
                    this.$element.append(this.$transcludeEl);
                    this.$compile(this.$transcludeEl)(
                        Object.assign(this.$scope.$new(), {
                            elementId: reqOb.elementId,
                            recentElement: reason.recentVersionOfElement,
                            type: 'link',
                        })
                    );
                }
            )
            .finally(() => {
                this.loading = false;
            });
    };
}

export const MmsViewLinkComponent: VeComponentOptions = {
    selector: 'mmsViewLink',
    template: `
    <span ng-if="!$ctrl.loading">
    <a target="{{$ctrl.target}}" ng-class="$ctrl.linkClass" ui-sref="{{$ctrl.href}}">
        <i ng-class="$ctrl.linkIconClass" aria-hidden="true"></i>
        <span ng-if="$ctrl.linkText">{{$ctrl.linkText}}</span>
        <span ng-if="!$ctrl.linkText && $ctrl.showNum && $ctrl.showName">{{$ctrl.type}}{{$ctrl.element._veNumber}}{{$ctrl.suffix}} - {{$ctrl.elementName || "Unnamed View"}}</span>
        <span ng-if="!$ctrl.linkText && $ctrl.showNum && !$ctrl.showName">{{$ctrl.type}}{{$ctrl.element._veNumber}}{{$ctrl.suffix}}</span>
        <span ng-if="!$ctrl.linkText && !$ctrl.showNum">{{$ctrl.elementName || "Unnamed View"}}</span>
    </a>
    <a class="btn btn-secondary external-link no-print" target="_blank" ui-sref="{{$ctrl.href}}" ng-if="$ctrl.mmsExternalLink">
        <i class="fa-solid fa-external-link" aria-hidden="true" title="Open document in new tab"></i>
    </a>
</span>        
`,
    require: {
        mmsCfCtrl: '?^^mmsCf',
        mmsViewCtrl: '?^^view',
    },
    bindings: {
        mmsElementId: '@',
        mmsProjectId: '@',
        mmsRefId: '@',
        mmsCommitId: '@',
        mmsDocId: '@',
        mmsPeId: '@',
        linkText: '@?',
        linkClass: '@?',
        linkIconClass: '@?',
        linkTarget: '@?',
        mmsExternalLink: '<?',
        suppressNumbering: '<',
        showName: '<',
    },
    controller: ViewLinkController,
};

veComponents.component(MmsViewLinkComponent.selector, MmsViewLinkComponent);
