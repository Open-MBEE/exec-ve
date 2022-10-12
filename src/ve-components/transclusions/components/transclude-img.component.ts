import * as angular from 'angular'

import {
    ElementService,
    ViewService,
    AuthService,
    URLService
} from "@ve-utils/mms-api-client"
import {
    UtilsService,
    EventService,
    MathJaxService
} from "@ve-utils/services"
import { ButtonBarService } from '@ve-core/button-bar'
import {VeComponentOptions} from '@ve-types/view-editor'
import {Transclusion, ITransclusion} from '@ve-components/transclusions'
import {veComponents} from "@ve-components";
import {ExtensionService, ComponentService} from "@ve-components/services"
import {SchemaService} from "@ve-utils/model-schema";

/**
 * @ngdoc component
 * @name veComponents/TranscludeImgController
 * @type {ITransclusion}
 *
 * @requires {angular.IScope} $scope
 * @requires {angular.ICompileService} $compile
 * @requires {angular.IRootElementService} $element
 * @requires {angular.growl.IGrowlService} growl
 * @requires {ComponentService} componentSvc
 * @requires {ElementService} elementSvc
 * @requires {UtilsService} utilsSvc
 * @requires {ViewService} viewSvc

 * @requires {AuthService} authSvc
 * @requires {EventService} eventSvc
 * @requires {ButtonBarService} buttonBarSvc
 * @requires {MathJaxService} mathJaxSvc
 *
 * @description
 * Given an element id, puts in the element's documentation binding, if there's a parent
 * mmsView directive, will notify parent view of transclusion on init and doc change,
 * and on click. Nested transclusions inside the documentation will also be registered.
 *
 * ## Example
 *  <pre>
 <transclude-doc mms-element-id="element_id"></transclude-doc>
 </pre>
 *
 * @param {string} mmsElementId The id of the view
 * @param {string} mmsProjectId The project id for the view
 * @param {string=master} mmsRefId Reference to use, defaults to master
 * @param {string=latest} mmsCommitId Commit ID, default is latest
 * @param {bool} mmsWatchId set to true to not destroy element ID watcher
 * @param {boolean=false} nonEditable can edit inline or not
 */
export class TranscludeImgController extends Transclusion implements ITransclusion {

    //Locals
    includeExt = [
        'svg', 'png'
    ];
    svg: { url: string, image: boolean, ext: string }[]
    png: { url: string, image: boolean, ext: string }[]
    artifacts: { url: string, image: boolean, ext: string }[]

    static $inject: string[] = [...Transclusion.$inject, 'URLService'];

    constructor(
        $q: angular.IQService,
        $scope: angular.IScope,
        $compile: angular.ICompileService,
        $element: JQuery<HTMLElement>,
        growl: angular.growl.IGrowlService,
        componentSvc: ComponentService,
        elementSvc: ElementService,
        utilsSvc: UtilsService,
        schemaSvc: SchemaService,
        authSvc: AuthService,
        eventSvc: EventService,
        extensionSvc: ExtensionService,
        mathJaxSvc: MathJaxService,
        buttonBarSvc: ButtonBarService,
        private urlSvc: URLService,
    ) {
        super($q, $scope,$compile,$element,growl,componentSvc,elementSvc,utilsSvc,schemaSvc,authSvc,eventSvc,
            mathJaxSvc, extensionSvc, buttonBarSvc)
        this.cfType = 'doc'
        this.cfTitle = 'Documentation'
        this.cfKind = 'Text'
        this.checkCircular = true;
    }

    config = () => {
        this.$element.on('click', (e) => {

            if (this.mmsViewCtrl)
                this.mmsViewCtrl.transcludeClicked(this.element)

            e.stopPropagation()
        })
    }



    public getContent = (preview?) => {
        var artifacts = this.element._artifacts;
        if (artifacts !== undefined) {
            var reqOb = {
                elementId: this.mmsElementId,
                projectId: this.projectId,
                refId: this.refId,
                commitId: this.commitId,
                includeRecentVersionElement: true,
            }
            this.artifacts = artifacts.filter(a => this.includeExt.includes(a.extension))
                .map(a => {
                    return {
                        url: this.urlSvc.getArtifactURL(reqOb, a.extension),
                        image: (a.mimetype.indexOf('image') > -1),
                        ext: a.extension
                    };
                });
            this.svg = this.artifacts.filter(a => a.ext === 'svg');
            this.png = this.artifacts.filter(a => a.ext === 'png');
        }
        let result = '<img class="mms-svg" ng-src="{{$ctrl.svg[0].url}}" alt="{{$ctrl.element.name}}"><img class="mms-png" ng-src="{{$ctrl.png[0].url}}"  alt="{{$ctrl.element.name}}"/>'
        return this.$q.resolve(result);
    }

}

export let TranscludeImgComponent: VeComponentOptions = {
    selector: 'transcludeImg',
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
        mmsViewCtrl: '?^view',
        mmsViewPresentationElemCtrl: '?^viewPe',
    },
    controller: TranscludeImgController,
}

veComponents.component(TranscludeImgComponent.selector, TranscludeImgComponent)

