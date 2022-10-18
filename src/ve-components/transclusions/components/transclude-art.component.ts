import angular from 'angular'

import { ExtensionService, ComponentService } from '@ve-components/services'
import { Transclusion, ITransclusion } from '@ve-components/transclusions'
import { ButtonBarService } from '@ve-core/button-bar'
import {
    ElementService,
    AuthService,
    URLService,
    ViewService,
} from '@ve-utils/mms-api-client'
import { SchemaService } from '@ve-utils/model-schema'
import {
    UtilsService,
    EventService,
    MathJaxService,
    ImageService,
} from '@ve-utils/services'

import { veComponents } from '@ve-components'

import { VeComponentOptions } from '@ve-types/view-editor'

/**
 * @ngdoc component
 * @name veComponents/TranscludeArtController
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
export class TranscludeArtController
    extends Transclusion
    implements ITransclusion
{
    //Custom Bindings
    mmsArtExt: string

    //Locals
    artExt: string
    artifacts: any[]

    static $inject: string[] = [...Transclusion.$inject, 'URLService']

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
        imageSvc: ImageService,
        private urlSvc: URLService
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
        this.cfType = 'doc'
        this.cfTitle = 'Documentation'
        this.cfKind = 'Text'
        this.checkCircular = true
    }

    config = () => {
        this.artExt = this.mmsArtExt

        this.$element.on('click', (e) => {
            if (this.mmsViewCtrl)
                this.mmsViewCtrl.transcludeClicked(this.element)

            e.stopPropagation()
        })
    }

    public getContent = (preview?) => {
        const artifacts = this.element._artifacts
        if (artifacts !== undefined) {
            const allExt = artifacts.map((a) => a.extension)
            let includeExt = allExt
            if (this.artExt !== '' || this.artExt !== undefined) {
                includeExt = this.artExt
                    .split(',')
                    .filter((a) => allExt.includes(a))
            }
            const reqOb = {
                elementId: this.mmsElementId,
                projectId: this.projectId,
                refId: this.refId,
                commitId: this.commitId,
                includeRecentVersionElement: true,
            }
            this.artifacts = artifacts
                .filter((a) => includeExt.includes(a.extension))
                .map((a) => {
                    return {
                        url: this.urlSvc.getArtifactURL(reqOb, a.extension),
                        image: a.mimetype.indexOf('image') > -1,
                        ext: a.extension,
                    }
                })
        }
        const result =
            '<div ng-repeat="artifact in $ctrl.artifacts"><img ng-if="artifact.image" ng-src="{{artifact.url}}"></img><a ng-if="!artifact.image" ng-href="{{artifact.url}}">{{$ctrl.element.name}} - {{artifact.ext}}</a></div>'
        return this.$q.resolve(result)
    }
}

export const TranscludeArtComponent: VeComponentOptions = {
    selector: 'transcludeArt',
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
        mmsArtExt: '@',
    },
    require: {
        mmsViewCtrl: '?^view',
        mmsViewPresentationElemCtrl: '?^viewPe',
    },
    controller: TranscludeArtController,
}

veComponents.component(TranscludeArtComponent.selector, TranscludeArtComponent)
