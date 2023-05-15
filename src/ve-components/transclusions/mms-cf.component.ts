import angular, { IComponentController } from 'angular';

import { ViewController } from '@ve-components/presentations/view.component';
import { ExtensionService } from '@ve-components/services';

import { veComponents } from '@ve-components';

import { VeComponentOptions } from '@ve-types/angular';
import { RequestObject } from '@ve-types/mms';

/**
 * @ngdoc component
 * @name veComponents.component:mmsCf
 *
 * @requires $compile
 * * Given an element id, puts in the element's name binding, if there's a parent
 * mmsView directive, will notify parent view of transclusion on init and name change,
 * and on click
 *
 * @param {string} mmsElementId The id of the view
 * @param {string} mmsProjectId The project id for the view
 * @param {string} mmsCfType one of doc, val, name, com, img
 * @param {string=master} mmsRefId Reference to use, defaults to master
 * @param {string=latest} mmsCommitId Commit ID, default is latest
 * @param {boolean=false} nonEditable can edit inline or not
 * @param {bool} mmsWatchId set to true to not destroy element ID watcher
 */

export class CrossReferenceController implements IComponentController {
    //Bindings
    mmsElementId: string;
    mmsProjectId: string;
    mmsRefId: string;
    mmsCommitId: string;
    mmsCfType: string;
    mmsWatchId: string;
    nonEditable: boolean;
    mmsGenerateForDiff: boolean;
    mmsAttr: string;
    mmsCfLabel: boolean;

    //Deps
    transclusionCtrl: CrossReferenceController;
    mmsViewCtrl: ViewController;

    //Local
    projectId: string;
    refId: string;
    commitId: string;
    clearWatch: boolean = false;
    extType: string = 'transclusion';

    static $inject = ['$compile', '$scope', '$element', 'ExtensionService'];

    protected $transcludeEl: JQuery;

    constructor(
        private $compile: angular.ICompileService,
        private $scope: angular.IScope,
        private $element: JQuery<HTMLElement>,
        private extensionSvc: ExtensionService
    ) {}

    $onInit(): void {
        this.changeAction();
    }

    //INFO this was this.getWsAndVersion
    public getElementOrigin = (): RequestObject => {
        return {
            projectId: this.projectId,
            refId: this.refId,
            commitId: this.commitId,
        };
    };

    private changeAction = (): void => {
        let projectId = this.mmsProjectId;
        let refId = this.mmsRefId;
        let commitId = this.mmsCommitId;
        if (this.transclusionCtrl) {
            const cfVersion = this.transclusionCtrl.getElementOrigin();
            if (!projectId) projectId = cfVersion.projectId;
            if (!refId) refId = cfVersion.refId;
            if (!commitId) commitId = cfVersion.commitId;
        }
        if (this.mmsViewCtrl) {
            const viewVersion = this.mmsViewCtrl.getElementOrigin();
            if (!projectId) projectId = viewVersion.projectId;
            if (!refId) refId = viewVersion.refId;
            if (!commitId) commitId = viewVersion.commitId;
        }
        if (!projectId) {
            return;
        }
        this.projectId = projectId;
        this.refId = refId ? refId : 'master';
        this.commitId = commitId ? commitId : 'latest';
        //this.templateElementHtml = this.$element[0].innerHTML;
        if (this.mmsCfType) {
            this.$element.empty();
            const tag = this.extensionSvc.getTagByType('transclude', this.mmsCfType);
            if (tag === 'extension-error') {
                this.$transcludeEl = $(
                    '<error ext-kind="$ctrl.extType" ext-type="$ctrl.mmsCfType" mms-element-id="$ctrl.mmsElementId"></error>'
                );
            } else {
                this.$transcludeEl = $(
                    '<' +
                        tag +
                        (this.mmsGenerateForDiff ? ' mms-generate-for-diff="$ctrl.mmsGenerateForDiff"' : '') +
                        (this.mmsAttr ? ' mms-attr={{$ctrl.mmsAttr}}' : '') +
                        (typeof this.mmsCfLabel !== 'undefined' ? ' mms-cf-label={{$ctrl.mmsCfLabel}}' : '') +
                        ' mms-element-id="{{$ctrl.mmsElementId}}" mms-project-id="{{$ctrl.projectId}}" mms-ref-id="{{$ctrl.refId}}" mms-commit-id="{{$ctrl.commitId}}" non-editable="$ctrl.nonEditable"></' +
                        tag +
                        '>'
                );
            }
            this.$element.append(this.$transcludeEl);
            this.$compile(this.$transcludeEl)(this.$scope);
        }
    };
}

const MmsCfComponent: VeComponentOptions = {
    selector: 'mmsCf',
    template: `<div></div>`,
    transclude: true,
    bindings: {
        mmsElementId: '@',
        mmsProjectId: '@',
        mmsRefId: '@',
        mmsCommitId: '@',
        mmsCfType: '@',
        mmsWatchId: '@',
        nonEditable: '<',
        mmsGenerateForDiff: '<',
        mmsAttr: '@',
        mmsCfLabel: '@',
    },
    require: {
        transclusionCtrl: '?^^mmsCf',
        mmsViewCtrl: '?^^view',
    },
    controller: CrossReferenceController,
};
veComponents.component(MmsCfComponent.selector, MmsCfComponent);
