import { ViewController } from '@ve-components/presentations'
import { ITransclusion } from '@ve-components/transclusions'
import { RootScopeService } from '@ve-utils/application'
import { AutosaveService, EventService } from '@ve-utils/core'
import {
    ApiService,
    CacheService,
    ElementService,
    PermissionsService,
    URLService,
    ViewService,
} from '@ve-utils/mms-api-client'

import { veComponents } from '@ve-components'

import { VeQService } from '@ve-types/angular'
import { EditingToolbar } from '@ve-types/core/editor'
import { ElementObject, SlotObject } from '@ve-types/mms'
import { VeModalService } from '@ve-types/view-editor'

/**
 * @internal
 * @name ComponentService
 * @requires $q
 * @requires $uibModal
 * @requires $timeout
 * @requires $compile
 * @requires $window
 * @requires URLService
 * @requires CacheService
 * @requires ElementService
 * @requires AutosaveService
 * @requires _
 * * Utility methods for performing edit like behavior to a transclude element
 * WARNING These are intended to be internal utility functions and not designed to be used as api
 *
 */
export class ComponentService {
    static $inject = [
        '$q',
        '$timeout',
        '$compile',
        '$uibModal',
        'growl',
        'URLService',
        'CacheService',
        'ElementService',
        'ViewService',
        'PermissionsService',
        'RootScopeService',
        'EventService',
        'AutosaveService',
        'ApiService',
    ]

    constructor(
        private $q: VeQService,
        private $timeout: angular.ITimeoutService,
        private $compile: angular.ICompileService,
        private $uibModal: VeModalService,
        private growl: angular.growl.IGrowlService,
        private uRLSvc: URLService,
        private cacheSvc: CacheService,
        private elementSvc: ElementService,
        private viewSvc: ViewService,
        private permissionsSvc: PermissionsService,
        private rootScopeSvc: RootScopeService,
        private eventSvc: EventService,
        private autosaveSvc: AutosaveService,
        private apiSvc: ApiService
    ) {}

    public hasCircularReference = (ctrl: ITransclusion, curId: string, curType: string): boolean => {
        let curscope = ctrl.$scope
        while (curscope.$parent) {
            const parent = curscope.$parent
            if (curscope.$parent.$ctrl) {
                if (parent.$ctrl.mmsElementId === curId && parent.$ctrl.cfType === curType) return true
            }
            curscope = parent
        }
        return false
    }

    // var ENUM_ID = '_9_0_62a020a_1105704885400_895774_7947';
    // var ENUM_LITERAL = '_9_0_62a020a_1105704885423_380971_7955';

    public isDirectChildOfPresentationElementFunc(element: JQuery<HTMLElement>, mmsViewCtrl: ViewController): boolean {
        let parent = element[0].parentElement
        while (parent && parent.nodeName !== 'MMS-VIEW-PRESENTATION-ELEM' && parent.nodeName !== 'MMS-VIEW') {
            if (mmsViewCtrl.isTranscludedElement(parent.nodeName)) {
                return false
            }
            if (
                parent.nodeName === 'MMS-VIEW-TABLE' ||
                parent.nodeName === 'MMS-VIEW-LIST' ||
                parent.nodeName === 'MMS-VIEW-SECTION'
            )
                return false
            parent = parent.parentElement
        }
        return parent && parent.nodeName !== 'MMS-VIEW'
    }

    /**
     * @name Utils#reopenUnsavedElts     * called by transcludes when users have unsaved edits, leaves that view, and comes back to that view.
     * the editor will reopen if there are unsaved edits.
     * assumes no reload.
     * uses these in the scope:
     *   element - element object for the element to edit (for sections it's the instance spec)
     *   ve_edits - unsaved edits object
     *   startEdit - pop open the editor window
     * @param {ITransclusion} ctrl scope of the transclude directives or view section directive
     * @param {String} transcludeType name, documentation, or value
     */
    public reopenUnsavedElts = (ctrl: ITransclusion & EditingToolbar, transcludeType: string): void => {
        let unsavedEdits: { [p: string]: ElementObject } = {}
        if (this.autosaveSvc.openEdits() > 0) {
            unsavedEdits = this.autosaveSvc.getAll()
        }
        const key = ctrl.element.id + '|' + ctrl.element._projectId + '|' + ctrl.element._refId
        const thisEdits = unsavedEdits[key]
        if (!thisEdits || ctrl.commitId !== 'latest') {
            return
        }
        if (transcludeType === 'value') {
            if (ctrl.element.type === 'Property' || ctrl.element.type === 'Port') {
                if (
                    ctrl.element.defaultValue.value !== thisEdits.defaultValue.value ||
                    ctrl.element.defaultValue.instanceId !== thisEdits.defaultValue.instanceId
                ) {
                    ctrl.startEdit()
                }
            } else if (ctrl.element.type === 'Slot') {
                const valList1 = (thisEdits as SlotObject).value
                const valList2 = (ctrl.element as SlotObject).value

                // Check if the lists' lengths are the same
                if (valList1.length !== valList2.length) {
                    ctrl.startEdit()
                } else {
                    for (let j = 0; j < valList1.length; j++) {
                        if (
                            valList1[j].value !== valList2[j].value ||
                            valList1[j].instanceId !== valList2[j].instanceId
                        ) {
                            ctrl.startEdit()
                            break
                        }
                    }
                }
            }
        } else if (ctrl.element[transcludeType] !== thisEdits[transcludeType]) {
            ctrl.startEdit()
        }
    }

    public hasHtml = (s: string): boolean => {
        return s.indexOf('<p>') !== -1
    }
}

veComponents.service('ComponentService', ComponentService)
