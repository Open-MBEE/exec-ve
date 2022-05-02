import * as angular from "angular";
import Rx from "rx";

import {TransclusionService} from "./Transclusion.service";
import {ElementService} from "../../ve-utils/services/Element.service";
import {UtilsService} from "../../ve-utils/services/Utils.service";
import {ViewService} from "../../ve-utils/services/View.service";
import {UxService} from "../../ve-utils/services/Ux.service";
import {AuthService} from "../../ve-utils/services/Authorization.service";
import {EventService} from "../../ve-utils/services/Event.service";
import {MathJaxService} from "../../ve-utils/services/MathJax.service";
import {BButton, ButtonBarApi, ButtonBarService} from "../../ve-core/button-bar/ButtonBar.service";
import {ViewController} from "../../ve-core/view/view.component";
import {ViewPresentationElemController} from "../views/view-pe.component";
import {VeComponentOptions} from "../../ve-utils/types/view-editor";
import {TransclusionController} from "./transclusion";
import {veExt} from "../ve-extensions.module";
import {veUtils} from "../../ve-utils/ve-utils.module"
import {TransclusionControllerImpl} from "./transclusion.controller";

/**
 * @ngdoc component
 * @name veExt/TranscludeViewController
 * @type {TransclusionController}
 *
 * @requires {angular.IScope} $scope
 * @requires {angular.ICompileService} $compile
 * @requires {angular.IRootElementService} $element
 * @requires {angular.growl.IGrowlService} growl
 * @requires {Utils} utils
 * @requires {ElementService} elementSvc
 * @requires {UtilsService} utilsSvc
 * @requires {ViewService} viewSvc
 * @requires {UxService} uxSvc
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
 <mms-transclude-view mms-element-id="element_id"></mms-transclude-view>
 </pre>
 *
 * @param {string} mmsElementId The id of the view
 * @param {string} mmsProjectId The project id for the view
 * @param {string=master} mmsRefId Reference to use, defaults to master
 * @param {string=latest} mmsCommitId Commit ID, default is latest
 * @param {bool} mmsWatchId set to true to not destroy element ID watcher
 * @param {boolean=false} nonEditable can edit inline or not
 */
export class TranscludeViewController extends TransclusionControllerImpl implements TransclusionController {

    static $inject = ['$scope', '$compile', '$element', 'growl', 'TransclusionService','ElementService', 'UtilsService',
        'ViewService', 'UxService', 'AuthService', 'EventService', 'ButtonBarService', 'MathJaxService'];

    constructor(
        $q: angular.IQService,
        $scope: angular.IScope,
        $compile: angular.ICompileService,
        $element: JQuery<HTMLElement>,
        growl: angular.growl.IGrowlService,
        transclusionSvc: TransclusionService,
        elementSvc: ElementService,
        utilsSvc: UtilsService,
        viewSvc: ViewService,
        uxSvc: UxService,
        authSvc: AuthService,
        eventSvc: EventService,
        mathJaxSvc: MathJaxService,
    ) {
        super($q,$scope,$compile,$element,growl,transclusionSvc,elementSvc,utilsSvc,viewSvc,uxSvc,authSvc,eventSvc,
            mathJaxSvc)
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