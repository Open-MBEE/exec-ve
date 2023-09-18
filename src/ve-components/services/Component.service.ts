import { ViewController } from '@ve-components/presentations';
import { ITransclusion } from '@ve-components/transclusions';

import { veComponents } from '@ve-components';

import { VeQService } from '@ve-types/angular';
import { VeModalService } from '@ve-types/view-editor';

/**
 * @internal
 * @name ComponentService
 * @requires $q
 * @requires $uibModal
 * @requires $timeout
 * @requires $compile
 * * Utility methods for performing edit like behavior to a transclude element
 * WARNING These are intended to be internal utility functions and not designed to be used as api
 *
 */
export class ComponentService {
    static $inject = ['$q', '$timeout', '$compile', '$uibModal'];

    constructor(
        private $q: VeQService,
        private $timeout: angular.ITimeoutService,
        private $compile: angular.ICompileService,
        private $uibModal: VeModalService
    ) {}

    public hasCircularReference = (ctrl: ITransclusion, curId: string, curType: string): boolean => {
        let curscope = ctrl.$scope;
        while (curscope.$parent) {
            const parent = curscope.$parent;
            if (curscope.$parent.$ctrl) {
                if (parent.$ctrl.mmsElementId === curId && parent.$ctrl.cfType === curType) return true;
            }
            curscope = parent;
        }
        return false;
    };

    // var ENUM_ID = '_9_0_62a020a_1105704885400_895774_7947';
    // var ENUM_LITERAL = '_9_0_62a020a_1105704885423_380971_7955';

    public isDirectChildOfPresentationElementFunc(element: JQuery<HTMLElement>, mmsViewCtrl: ViewController): boolean {
        let parent = element[0].parentElement;
        while (parent && parent.nodeName !== 'MMS-VIEW-PRESENTATION-ELEM' && parent.nodeName !== 'MMS-VIEW') {
            if (mmsViewCtrl.isTranscludedElement(parent.nodeName)) {
                return false;
            }
            if (
                parent.nodeName === 'MMS-VIEW-TABLE' ||
                parent.nodeName === 'MMS-VIEW-LIST' ||
                parent.nodeName === 'MMS-VIEW-SECTION'
            )
                return false;
            parent = parent.parentElement;
        }
        return parent && parent.nodeName !== 'MMS-VIEW';
    }

    public hasHtml = (s: string): boolean => {
        return s.indexOf('<p>') !== -1;
    };
}

veComponents.service('ComponentService', ComponentService);
