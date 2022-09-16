import * as angular from "angular";
import {VeComponentOptions} from "@ve-types/view-editor";
import {handleChange} from "@ve-utils/utils/change.util";
import {ExtensionService, veExt} from "@ve-ext";
import {ViewController} from "@ve-ext/presentations/view.component";


/**
 * @ngdoc component
 * @name veExt.component:mmsCf
 *
 * @requires $compile
 *
 * @description
 * Given an element id, puts in the element's name binding, if there's a parent
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

export class TransclusionController implements angular.IComponentController {

    //Bindings
    mmsElementId: string;
    mmsProjectId: string;
    mmsRefId: string;
    mmsCommitId: string;
    mmsCfType: string;
    mmsWatchId: string;
    nonEditable: boolean;
    mmsGenerateForDiff: boolean;

    //Deps
    transclusionCtrl: TransclusionController
    mmsViewCtrl: ViewController

    //Local
    projectId: string
    refId: string
    commitId: string
    clearWatch: boolean = false;
    extType: string = 'transclusion';

    static $inject = ['$compile', '$scope', '$element', 'ExtensionService']
    private templateElementHtml: any;

    protected $transcludeEl: JQuery;

    constructor(private $compile: angular.ICompileService, private $scope: angular.IScope,
                private $element: JQuery<HTMLElement>, private extensionSvc: ExtensionService) {
    }

    $onChanges(onChangesObj: angular.IOnChangesObject) {
        if (!this.clearWatch) {
            handleChange(onChangesObj, 'mmsElementId', this.changeAction)
            handleChange(onChangesObj, 'mmsCommitId', this.changeAction)
        }
    }

    $postLink() {
        //this.$transcludeEl = $(this.$element.children()[0]);
        this.changeAction(this.mmsElementId,'',false);
    }

    //INFO this was this.getWsAndVersion
    public getElementOrigin = () => {
        return {
            projectId: this.projectId,
            refId: this.refId,
            commitId: this.commitId
        };
    };

    private changeAction = (newVal, oldVal, firstChange) => {
        if (this.clearWatch || !newVal || firstChange) {
            return;
        }
        if (!this.mmsWatchId && newVal) {
            this.clearWatch = true;
        }

        let projectId = this.mmsProjectId;
        let refId = this.mmsRefId;
        let commitId = this.mmsCommitId;
        if (this.transclusionCtrl) {
            let cfVersion = this.transclusionCtrl.getElementOrigin();
            if (!projectId)
                projectId = cfVersion.projectId;
            if (!refId)
                refId = cfVersion.refId;
            if (!commitId)
                commitId = cfVersion.commitId;
        }
        if (this.mmsViewCtrl) {
            var viewVersion = this.mmsViewCtrl.getElementOrigin();
            if (!projectId)
                projectId = viewVersion.projectId;
            if (!refId)
                refId = viewVersion.refId;
            if (!commitId)
                commitId = viewVersion.commitId;
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
            let tag = this.extensionSvc.getTagByType("transclude", this.mmsCfType)
            if (tag === 'extension-error') {
                this.$transcludeEl = $('<error ext-kind="$ctrl.extType" ext-type="$ctrl.mmsCfType" mms-element-id="$ctrl.mmsElementId"></error>');
            }else {
                this.$transcludeEl = $('<' + tag + (this.mmsGenerateForDiff ? ' mms-generate-for-diff="mmsGenerateForDiff" ' : '') + ' mms-element-id="{{$ctrl.mmsElementId}}" mms-project-id="{{$ctrl.projectId}}" mms-ref-id="{{$ctrl.refId}}" mms-commit-id="{{$ctrl.commitId}}" non-editable="$ctrl.nonEditable" mms-cf-label="{{$ctrl.templateElementHtml}}"></' + tag + '>');
            }
            this.$element.append(this.$transcludeEl);
            this.$compile(this.$transcludeEl)(this.$scope);
        }
    };
}

let TransclusionComponent: VeComponentOptions = {
    selector: 'transclusion',
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
        mmsGenerateForDiff: '<'
    },
    require: {
        transclusionCtrl: '?^^transclusion',
        mmsViewCtrl: '?^^view'
    },
    controller: TransclusionController
}


veExt.component(TransclusionComponent.selector,TransclusionComponent)
.component('mmsCf',TransclusionComponent);
