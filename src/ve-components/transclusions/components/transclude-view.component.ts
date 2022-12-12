import angular from 'angular'

import { ComponentService, ExtensionService } from '@ve-components/services'
import { ITransclusion, Transclusion } from '@ve-components/transclusions'
import { ButtonBarService } from '@ve-core/button-bar'
import { AuthService, ElementService, ViewApi } from '@ve-utils/mms-api-client'
import { SchemaService } from '@ve-utils/model-schema'
import {
    EventService,
    ImageService,
    MathJaxService,
    UtilsService,
} from '@ve-utils/services'

import { veComponents } from '@ve-components'

import { VeComponentOptions, VePromise } from '@ve-types/angular'

/**
 * @ngdoc component
 * @name veComponents/TranscludeViewController
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
 * * Given an element id, puts in the view that is described by that element, if there's a parent
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
export class TranscludeViewController
    extends Transclusion
    implements ITransclusion
{
    //Custom Bindings
    public noTitle: boolean

    public viewApi: ViewApi

    static $inject = Transclusion.$inject

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
        mathJaxSvc: MathJaxService,
        extensionSvc: ExtensionService,
        buttonBarSvc: ButtonBarService,
        imageSvc: ImageService
    ) {
        super(
            $q,
            $scope,
            $compile,
            $element,
            growl,
            componentSvc,
            elementSvc,
            utilsSvc,
            schemaSvc,
            authSvc,
            eventSvc,
            mathJaxSvc,
            extensionSvc,
            buttonBarSvc,
            imageSvc
        )
        this.cfType = 'view'
        this.cfTitle = 'View'
        this.cfKind = 'contents'
        this.checkCircular = true
    }

    protected config = (): void => {
        if (typeof this.noTitle === 'undefined') {
            this.noTitle = true
        }

        if (this.mmsViewCtrl) {
            this.viewApi = this.mmsViewCtrl.mmsViewApi
        }
    }

    public getContent = (): VePromise<string | HTMLElement[], string> => {
        return this.$q.resolve(
            '<view mms-element-id="{{$ctrl.mmsElementId}}" mms-project-id="{{$ctrl.projectId}}" mms-ref-id="{{$ctrl.refId}}" mms-commit-id="{{$ctrl.commitId}}" no-title="{{$ctrl.noTitle}}" mms-view-api="$ctrl.viewApi"></view>'
        )
    }
}

const TranscludeViewComponent: VeComponentOptions = {
    selector: 'transcludeView',
    template: `<div></div>`,
    bindings: {
        mmsElementId: '@',
        mmsProjectId: '@',
        mmsRefId: '@',
        mmsCommitId: '@',
        mmsWatchId: '@',
        nonEditable: '<',
        mmsCfLabel: '@',
        mmsGenerateForDiff: '<',
        noTitle: '@',
    },
    require: {
        mmsViewCtrl: '?^^view',
        mmsViewPresentationElemCtrl: '?^^mmsViewPresentationElem',
    },
    controller: TranscludeViewController,
}

veComponents.component(
    TranscludeViewComponent.selector,
    TranscludeViewComponent
)
