import * as angular from "angular";

import {ExtensionService, veExt} from "@ve-ext";
import {VeComponentOptions} from "@ve-types/view-editor";
import {ElementService, ViewService} from "@ve-utils/mms-api-client";
import {ApplicationService, UtilsService} from "@ve-utils/core-services";
import {ViewController} from "@ve-ext/presentations/view.component";
import {TransclusionController} from "@ve-ext/transclusions/transclusion.component";
import {handleChange, onChangesCallback} from "@ve-utils/utils";
import {ElementObject, ElementsRequest} from "@ve-types/mms";

/**
 * @ngdoc directive
 * @name veExt.component:mmsViewLink
 *
 * @requires veUtils/ElementService
 * @requires $compile
 *
 *
 * @description
 * Given a view id and optional document id, creates a html link
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
    public mmsElementId
        mmsProjectId
        mmsRefId
        mmsCommitId
        mmsDocId
        mmsPeId
        linkText
        linkClass
        linkIconClass
        linkTarget
        mmsExternalLink
        suppressNumbering
        showName

    // Controllers
    private mmsCfCtrl: TransclusionController
    private mmsViewCtrl: ViewController

    // Locals
    loading: boolean = true
    target: string;
    private processed: boolean = false
    projectId: string
    refId: string
    commitId: string
    element: ElementObject;
    elementName: string;
    type: string;

    static $inject = ['$scope', '$element', 'ElementService', 'UtilsService', '$compile', 'growl', 'ViewService', 'ApplicationService', 'ExtensionService']
    suffix: string;
    hash: string;
    href: string;
    private docid: string;
    showNum: boolean;
    vid: string;


    constructor(private $scope: angular.IScope, private $element: JQuery<HTMLElement>,
                private elementSvc: ElementService, private utilsSvc: UtilsService,
                private $compile: angular.ICompileService, private growl: angular.growl.IGrowlService,
                private viewSvc: ViewService, private applicationSvc: ApplicationService, private extensionSvc: ExtensionService) {
    }

    $onInit() {
        this.target = this.linkTarget ? this.linkTarget : '_self';
    }

    $onChanges(onChangesObj: angular.IOnChangesObject) {
        handleChange(onChangesObj,'mmsElementId',this.changeAction)
    }

    $postLink() {
        this.changeAction(this.mmsElementId, '', false);
    }

    protected changeAction: onChangesCallback = (
        newVal,
        oldVal,
        firstChange
    ) => {
        if (!newVal || (newVal === oldVal && this.processed))
            return;

        this.processed = true;

        let projectId = this.mmsProjectId;
        let refId = this.mmsRefId;
        let commitId = this.mmsCommitId;
        let docid = this.mmsDocId;
        if (this.mmsCfCtrl) {
            const cfVersion = this.mmsCfCtrl.getElementOrigin();
            if (!projectId)
                projectId = cfVersion.projectId;
            if (!refId)
                refId = cfVersion.refId;
            if (!commitId)
                commitId = cfVersion.commitId;
        }
        if (this.mmsViewCtrl) {
            const viewVersion = this.mmsViewCtrl.getElementOrigin();
            if (!projectId)
                projectId = viewVersion.projectId;
            if (!refId)
                refId = viewVersion.refId;
            if (!commitId)
                commitId = viewVersion.commitId;
        }
        if (!projectId) {
            return;
        }
            this.projectId = projectId;
            this.refId = refId ? refId : 'master';
            this.commitId = commitId ? commitId : 'latest';
            let elementId = this.mmsElementId;
            if (elementId) {
                elementId = elementId.replace(/[^\w\-]/gi, '');
            } else if (this.mmsPeId && !this.mmsDocId) {
                elementId = this.applicationSvc.getState().currentDoc;
            }

            const reqOb: ElementsRequest = {
                elementId,
                projectId,
                refId,
                commitId
            };
            this.elementSvc.getElement(reqOb, 1)
                .then((data: ElementObject) => {
                    this.element = data;
                    this.elementName = data.name;
                    this.type = 'Section ';
                    this.suffix = '';
                    this.hash = '#' + data.id;
                    if (this.mmsPeId && this.mmsPeId !== '') {
                        const reqPEOb: ElementsRequest = {
                            elementId: this.mmsPeId,
                            projectId,
                            refId,
                            commitId
                        };
                        this.elementSvc.getElement(reqPEOb)
                            .then((pe) => {
                                this.hash = '#' + pe.id;
                                this.element = pe;
                                this.elementName = pe.name;
                                if (this.viewSvc.isTable(pe)) {
                                    this.type = 'Table ';
                                } else if (this.viewSvc.isFigure(pe)) {
                                    this.type = "Fig. ";
                                } else if (this.viewSvc.isEquation(pe)) {
                                    this.type = "Eq. (";
                                    this.suffix = ')';
                                }
                                if (this.applicationSvc.getState().fullDoc) {
                                    this.href = this.utilsSvc.PROJECT_URL_PREFIX + this.projectId + '/' + this.refId + '/documents/' + this.docid + "/full" + this.hash;
                                } else {
                                    this.href = this.utilsSvc.PROJECT_URL_PREFIX + this.projectId + '/' + this.refId + '/documents/' + this.docid + '/views/' + this.vid + this.hash;
                                }
                            });
                    }
                    if (this.utilsSvc.isDocument(data)) {
                        docid = data.id;
                        this.docid = docid;
                        this.vid = data.id;
                    } else if (this.utilsSvc.isView(data) || data.type === 'InstanceSpecification') {
                        if (!docid || docid === '') {
                            docid = data.id;
                        }
                        this.docid = docid;
                        this.vid = data.id;
                    } else {
                        this.$element.html("<span class=\"mms-error\">view link doesn't refer to a view</span>");
                    }
                    this.loading = false;
                    if (this.applicationSvc.getState().fullDoc) {
                        this.href = this.utilsSvc.PROJECT_URL_PREFIX + this.projectId + '/' + this.refId + '/documents/' + this.docid + '/full' + this.hash;
                    } else {
                        this.href = this.utilsSvc.PROJECT_URL_PREFIX + this.projectId + '/' + this.refId + '/documents/' + this.docid + '/views/' + this.vid;
                    }
                    this.showNum = this.applicationSvc.getState().inDoc && (this.applicationSvc.getState().currentDoc === this.docid) && !this.suppressNumbering;
                }, (reason) => {
                    this.$element.html('<annotation mms-req-ob="::reqOb" mms-recent-element="::recentElement" mms-type="::type"></annotation>');
                    this.$compile($(this.$element))(Object.assign(this.$scope.$new(), {
                        reqOb: reqOb,
                        recentElement: reason.data.recentVersionOfElement,
                        type: this.extensionSvc.AnnotationType.mmsPresentationElement
                    }));
                    this.loading = false;
                });
        };
    }

export let ViewLinkComponent: VeComponentOptions = {
    selector: "viewLink",
    template: `
    <span ng-if="!$ctrl.loading">
    <a target="{{$ctrl.target}}" ng-class="$ctrl.linkClass" ng-href="{{$ctrl.href}}">
        <i ng-class="$ctrl.linkIconClass" aria-hidden="true"></i>
        <span ng-if="$ctrl.linkText">{{$ctrl.linkText}}</span>
        <span ng-if="!$ctrl.linkText && $ctrl.showNum && $ctrl.showName">{{$ctrl.type}}{{$ctrl.element._veNumber}}{{$ctrl.suffix}} - {{$ctrl.elementName || "Unnamed View"}}</span>
        <span ng-if="!$ctrl.linkText && $ctrl.showNum && !$ctrl.showName">{{$ctrl.type}}{{$ctrl.element._veNumber}}{{$ctrl.suffix}}</span>
        <span ng-if="!$ctrl.linkText && !$ctrl.showNum">{{$ctrl.elementName || "Unnamed View"}}</span>
    </a>
    <a class="external-link no-print" target="_blank" ng-href="{{$ctrl.href}}" ng-if="$ctrl.mmsExternalLink">
        <i class="fa fa-external-link" aria-hidden="true" title="Open document in new tab"></i>
    </a>
</span>        
`,
    require: {
        mmsCfCtrl: '?^^transclusion',
        mmsViewCtrl: '?^^view'
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
        showName: '<'
    },
    controller: ViewLinkController
}

veExt.component(ViewLinkComponent.selector,ViewLinkComponent);
