import * as angular from "angular";

import {
    AuthService,
    ElementService,
    ViewService
} from "@ve-utils/mms-api-client"
import {

    EventService,
    MathJaxService,
    UtilsService
} from "@ve-utils/core-services";
import {ButtonBarService} from "@ve-utils/button-bar";
import {VeComponentOptions} from "@ve-types/view-editor";
import {ITransclusion, Transclusion} from "@ve-ext/transclusions";
import {veExt, ExtUtilService, ExtensionService} from "@ve-ext";
import {SchemaService} from "@ve-utils/model-schema";

/**
 * @ngdoc component
 * @name veExt/TranscludeViewController
 * @type {ITransclusion}
 *
 * @requires {angular.IScope} $scope
 * @requires {angular.ICompileService} $compile
 * @requires {angular.IRootElementService} $element
 * @requires {angular.growl.IGrowlService} growl
 * @requires {Utils} utils
 * @requires {ElementService} elementSvc
 * @requires {UtilsService} utilsSvc
 * @requires {ViewService} viewSvc

 * @requires {AuthService} authSvc
 * @requires {EventService} eventSvc
 * @requires {ButtonBarService} buttonBarSvc
 * @requires {MathJaxService} mathJaxSvc
 *
 * @description
 * Given an element id, puts in the view that is described by that element, if there's a parent
 * mmsView directive, will notify parent view of transclusion on init and doc change,
 * and on click. Nested transclusions inside the documentation will also be registered.
 *
 * ## Example
 *  <pre>
 <transclude-view mms-element-id="element_id"></transclude-view>
 </pre>
 *
 * @param {string} mmsElementId The id of the view
 * @param {string} mmsProjectId The project id for the view
 * @param {string=master} mmsRefId Reference to use, defaults to master
 * @param {string=latest} mmsCommitId Commit ID, default is latest
 * @param {bool} mmsWatchId set to true to not destroy element ID watcher
 * @param {boolean=false} nonEditable can edit inline or not
 */
export class TranscludeViewController extends Transclusion implements ITransclusion {

    static $inject = Transclusion.$inject

    constructor(
        $q: angular.IQService,
        $scope: angular.IScope,
        $compile: angular.ICompileService,
        $element: JQuery<HTMLElement>,
        growl: angular.growl.IGrowlService,
        extUtilSvc: ExtUtilService,
        elementSvc: ElementService,
        utilsSvc: UtilsService,
        schemaSvc: SchemaService,
        authSvc: AuthService,
        eventSvc: EventService,
        mathJaxSvc: MathJaxService,
        extensionSvc: ExtensionService,
        buttonBarSvc: ButtonBarService
    ) {
        super($q,$scope,$compile,$element,growl,extUtilSvc,elementSvc,utilsSvc,schemaSvc,authSvc,eventSvc,
            mathJaxSvc, extensionSvc, buttonBarSvc)
        this.cfType = 'view'
        this.cfTitle = 'View'
        this.cfKind = 'contents'
        this.checkCircular = true;
    }

    protected getContents = () => {
        return this.$q.resolve('<view mms-element-id="$ctrl.elementId" mms-project-id="$ctrl.projectId" mms-ref-id="$ctrl.refId" mms-commit-id="$ctrl.commitId"></view>')
    }


}


const TranscludeViewComponent: VeComponentOptions = {
    selector: "mmsTranscludeView",
    template: `<div></div>`,
    bindings: {
        mmsElementId: '@',
        mmsProjectId: '@',
        mmsRefId: '@',
        mmsCommitId: '@',
        mmsWatchId: '@',
        nonEditable: '<',
        mmsCfLabel: '@',
        mmsGenerateForDiff: '<'
    },
    require: {
        mmsViewCtrl: '?^^view',
        mmsViewPresentationElemCtrl: '?^^mmsViewPresentationElem'
    },
    controller: TranscludeViewController
}

veExt.component(TranscludeViewComponent.selector, TranscludeViewComponent);