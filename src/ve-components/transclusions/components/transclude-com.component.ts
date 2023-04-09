import { ExtensionService, ComponentService } from '@ve-components/services'
import { ITransclusion, ITransclusionComponentOptions, Transclusion } from '@ve-components/transclusions'
import { ButtonBarService } from '@ve-core/button-bar'
import { ImageService, MathService, UtilsService } from '@ve-utils/application'
import { EventService } from '@ve-utils/core'
import { ElementService } from '@ve-utils/mms-api-client'
import { SchemaService } from '@ve-utils/model-schema'

import { veComponents } from '@ve-components'

import { VePromise, VeQService } from '@ve-types/angular'
import {TranscludeDocController} from "@ve-components/transclusions/components/transclude-doc.component";

/**
 * @ngdoc directive
 * @name veComponents.component:mmsTranscludeCom
 *
 * @requires veUtils/ElementService
 * @requires veUtils/UtilsService
 * @requires veUtils/ViewService
 * @requires veComponents/ButtonBarService
 * @requires veComponents/ComponentService
 * @requires $compile
 * @requires $templateCache
 * @requires growl
 * @requires MathJax
 *
 * * Given an element id, puts in the element's documentation binding, if there's a parent
 * mmsView directive, will notify parent view of transclusion on init and doc change,
 * and on click. Nested transclusions inside the documentation will also be registered.
 * (This is different from mmsTranscludeDoc because of special styles applied to comments)
 *
 * @param {string} mmsElementId The id of the view
 * @param {string} mmsProjectId The project id for the view
 * @param {string=master} mmsRefId Reference to use, defaults to master
 * @param {string=latest} mmsCommitId Commit ID, default is latest
 */
export class TranscludeComController extends TranscludeDocController implements ITransclusion {

    static $inject = Transclusion.$inject

    constructor(
        $q: VeQService,
        $scope: angular.IScope,
        $compile: angular.ICompileService,
        $element: JQuery<HTMLElement>,
        growl: angular.growl.IGrowlService,
        componentSvc: ComponentService,
        elementSvc: ElementService,
        utilsSvc: UtilsService,
        schemaSvc: SchemaService,
        eventSvc: EventService,
        mathSvc: MathService,
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
            eventSvc,
            mathSvc,
            extensionSvc,
            buttonBarSvc,
            imageSvc
        )
        this.cfType = 'doc'
        this.cfTitle = 'comment'
        this.cfKind = 'Comment'
        this.checkCircular = true
    }

    $onInit(): void {
        super.$onInit()
        if (this.mmsViewPresentationElemCtrl) {
            if (this.isDirectChildOfPresentationElement) this.panelTitle = this.instanceSpec.name
            this.panelType = 'Comment'
        }
    }

    public getContent = (preview?: boolean): VePromise<string | HTMLElement[], string> => {
        const deferred = this.$q.defer<string | HTMLElement[]>()

        let doc = (preview ? this.edit.documentation : this.element.documentation) || '(No comment)'
        doc += ' - <span class="mms-commenter"> Comment by <b>' + this.element._creator + '</b></span>'

        let result = ''
        if (preview) {
            result = '<div class="panel panel-info">' + doc + '</div>'
        } else {
            this.isEditing = false
            result = doc
        }
        if (!this.mmsGenerateForDiff) {
            const resultHtml = $('<p></p>').html(result).toArray()
            this.mathSvc.typeset(resultHtml).then(
                () => deferred.resolve(resultHtml),
                (reason) => {
                    deferred.reject(reason)
                }
            )
        } else {
            deferred.resolve(result)
        }
        return deferred.promise
    }
}

export const TranscludeComComponent: ITransclusionComponentOptions = {
    selector: 'transcludeCom',
    template: `<div></div>`,
    bindings: {
        mmsElementId: '@',
        mmsProjectId: '@',
        mmsRefId: '@',
        mmsCommitId: '@',
        mmsWatchId: '<',
        nonEditable: '<',
        mmsCfLabel: '@',
        mmsGenerateForDiff: '<',
        mmsCallback: '&',
    },
    require: {
        mmsViewCtrl: '?^view',
        mmsViewPresentationElemCtrl: '?^viewPe',
    },
    controller: TranscludeComController,
}

veComponents.component(TranscludeComComponent.selector, TranscludeComComponent)
