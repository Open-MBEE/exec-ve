import angular from 'angular'

import { ExtensionService, ComponentService } from '@ve-components/services'
import { SpecTool } from '@ve-components/spec-tools'
import { ITransclusion, Transclusion } from '@ve-components/transclusions'
import { ButtonBarService } from '@ve-core/button-bar'
import { ElementService, AuthService } from '@ve-utils/mms-api-client'
import { SchemaService } from '@ve-utils/model-schema'
import {
    MathJaxService,
    UtilsService,
    EventService,
    ImageService,
} from '@ve-utils/services'

import { veComponents } from '@ve-components'

import { VeComponentOptions, VePromise, VeQService } from '@ve-types/angular'

/**
 * @ngdoc component
 * @name veComponents/TranscludeNameController
 *
 * @requires {VeQService} $q
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
 * * Given an element id, puts in the element's name binding, if there's a parent
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
    protected editTemplate: string = `
    <div>
    <form class="input-group" ng-submit="$ctrl.save($event)">
        <input type="text" class="form-control" ng-model="$ctrl.edit.name" aria-describedby="basic-addon2">
        <span class="input-group-addon transclude-name-label">Name</span>
        <span class="input-group-addon" ng-click="$ctrl.save($event)" title="Save">
            <i ng-if="!$ctrl.elementSaving" class="fa fa-save"></i>
            <i ng-if="$ctrl.elementSaving" class="fa fa-spinner fa-spin"></i>
        </span>
        <span class="input-group-addon" ng-click="$ctrl.cancel($event)"><i class="fa fa-times" title="Cancel"></i></span>
    </form>
</div>
`

    //Locals
    noClick: unknown | undefined
    clickHandler: () => void
    mmsSpecEditorCtrl: SpecTool

    static $inject = [...Transclusion.$inject, 'SpecService']

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
    }

    $onInit(): void {
        super.$onInit()
        this.$element.on('click', (e) => {
            if (this.noClick) return

            if (this.clickHandler) {
                this.clickHandler()
                return
            }
            if (this.startEdit && !this.nonEditable) this.startEdit()

            if (!this.mmsViewCtrl) return false

            if (
                this.nonEditable &&
                this.mmsViewCtrl &&
                this.mmsViewCtrl.isEditable()
            ) {
                this.growl.warning('Cross Reference is not editable.')
            }
            this.mmsViewCtrl.transcludeClicked(this.element)
            e.stopPropagation()
        })
    }

    public getContent = (
        preview?
    ): VePromise<string | HTMLElement[], string> => {
        const deferred = this.$q.defer<string>()
        const defaultTemplate =
            '<span ng-if="$ctrl.element.name">{{$ctrl.element.name}}</span><span ng-if="!$ctrl.element.name" class="no-print placeholder">(no name)</span>'
        const editTemplate =
            '<span ng-if="$ctrl.edit.name">{{$ctrl.edit.name}}</span><span ng-if="!$ctrl.edit.name" class="no-print placeholder">(no name)</span>'
        if (preview) {
            deferred.resolve(
                '<div class="panel panel-info">' + editTemplate + '</div>'
            )
        } else {
            this.isEditing = false
            deferred.resolve(defaultTemplate)
        }
        return deferred.promise
    }
}

export const TranscludeNameComponent: VeComponentOptions = {
    selector: 'transcludeName',
    template: `<div></div>`,
    bindings: {
        mmsElementId: '@',
        mmsProjectId: '@',
        mmsRefId: '@',
        mmsCommitId: '@',
        mmsWatchId: '@',
        noClick: '@',
        nonEditable: '<',
        clickHandler: '&?',
        mmsCfLabel: '@',
    },
    transclude: true,
    require: {
        mmsViewCtrl: '?^^view',
        mmsSpecEditor: '?^^specEditor',
    },
    controller: TranscludeNameController,
}

veComponents.component(
    TranscludeNameComponent.selector,
    TranscludeNameComponent
)
