import angular from 'angular'

import { ExtensionService, ComponentService } from '@ve-components/services'
import { ITransclusion, Transclusion } from '@ve-components/transclusions'
import { ButtonBarService } from '@ve-core/button-bar'
import {
    ElementService,
    ViewService,
    AuthService,
} from '@ve-utils/mms-api-client'
import { SchemaService } from '@ve-utils/model-schema'
import {
    MathJaxService,
    UtilsService,
    EventService,
    ImageService,
} from '@ve-utils/services'

import { veComponents } from '@ve-components'

import { VeComponentOptions } from '@ve-types/view-editor'

/**
 * @ngdoc component
 * @name veComponents/TranscludeNameController
 *
 * @requires {angular.IQService} $q
 * @requires {angular.IScope} $scope
 * @requires {angular.ICompileService} $compile
 * @requires {JQuery<HTMLElement>} $element
 * @requires {angular.growl.IGrowlService} growl
 * @requires {ComponentService} componentSvc
 * @requires {ElementService} elementSvc
 * @requires {UtilsService} utilsSvc
 * @requires {ViewService} viewSvc

 * @requires {AuthService} authSvc
 * @requires {EventService} eventSvc
 * @requires {MathJaxService} mathJaxSvc
 *
 *
 * @description
 * Given an element id, puts in the element's name binding, if there's a parent
 * mmsView directive, will notify parent view of transclusion on init and name change,
 * and on click
 *
 * @param {string} mmsElementId The id of the view
 * @param {string} mmsProjectId The project id for the view
 * @param {string=master} mmsRefId Reference to use, defaults to master
 * @param {string=latest} mmsCommitId Commit ID, default is latest
 * @param {bool} mmsWatchId set to true to not destroy element ID watcher
 * @param {boolean=false} nonEditable can edit inline or not
 */
export class TranscludeNameController
    extends Transclusion
    implements ITransclusion
{
    //Custom Bindings
    mmsLinkText: string

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
        this.cfType = 'name'
        this.cfTitle = ''
        this.cfKind = 'Text'
        this.checkCircular = false
        this.nonEditable = true
    }

    protected config = () => {
        if (typeof this.mmsLinkText === 'undefined')
            this.mmsLinkText = this.mmsCfLabel ? this.mmsCfLabel : 'Link'
    }

    public getContent = () => {
        let url = ''
        if (this.element.type === 'Property') {
            const value = this.element.defaultValue
            if (value && value.type === 'LiteralString') url = value.value
        } else if (this.element.type === 'Slot') {
            if (
                angular.isArray(this.element.value) &&
                this.element.value.length > 0 &&
                this.element.value[0].type === 'LiteralString'
            ) {
                url = this.element.value[0].value
            }
        }

        if (url !== '') {
            return this.$q.resolve(
                '<a ng-href="' + url + '">' + this.mmsLinkText + '</a>'
            )
        } else {
            return this.$q.reject('Element does not provide link value.')
        }
    }
}

export const TranscludeValueLinkComponent: VeComponentOptions = {
    selector: 'transcludeValueLink',
    template: `
    <div></div>
`,
    bindings: {
        mmsElementId: '@',
        mmsProjectId: '@',
        mmsRefId: '@',
        mmsCommitId: '@',
        mmsWatchId: '@',
        mmsCfLabel: '@',
        mmsLinkText: '@',
    },
    transclude: true,
    require: {
        transclusionCtrl: '?^^transclusion',
        mmsViewCtrl: '?^^view',
    },
    controller: TranscludeNameController,
}

veComponents.component(
    TranscludeValueLinkComponent.selector,
    TranscludeValueLinkComponent
)
