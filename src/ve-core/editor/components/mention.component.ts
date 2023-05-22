import { EditorService, MentionService } from '@ve-core/editor';

import { veCore } from '@ve-core';

import { ElementObject } from '@ve-types/mms';

export class MMSMentionController implements angular.IComponentController {
    //Bindings
    public mmsEditor: CKEDITOR.editor;
    mmsMentionValue: string;
    mmsMentionId: string;
    mmsProjectId: string;
    mmsRefId: string;

    //Local
    public fastCfListing: ElementObject[];

    static $inject = ['MentionService', 'EditorService'];

    constructor(private mentionSvc: MentionService, private editorSvc: EditorService) {}

    $onInit(): void {
        this.fastCfListing = this.mentionSvc.getFastCfListing(this.mmsProjectId, this.mmsRefId);
        // expose this api on the controller itself so that it can be accessed by codes that use $compile service to construct this directive.
    }

    public selectMentionItem($item: ElementObject): void {
        this._createCf($item);
        this.mentionSvc.handleMentionSelection(this.mmsEditor, this.mmsMentionId);
    }

    private _createCf($item: ElementObject): void {
        const tag =
            '<mms-cf mms-cf-type="' +
            $item.type +
            '" mms-element-id="' +
            $item.id +
            '">[cf:' +
            $item.name +
            '.' +
            $item.type +
            ']</mms-cf>';
        this.mmsEditor.insertHtml(tag);
        this.editorSvc.focusOnEditorAfterAddingWidgetTag(this.mmsEditor);
    }
}

const MMSMention = {
    selector: 'mention',
    template: `
    <script type="text/ng-template" id="customTemplate.html">
    <a class="itemContainer" ng-switch="match.model.type">
        <span ng-switch-when="name" class="nameContainer">
            <div class="leftItem">
                <i class="icon" ng-class="match.model.iconClass"></i>
                <span> name </span>
                <span id="{{match.model.id + match.model.type}}" class="matchName mentionMatch" ng-bind-html="match.model.name | underlineMatch:query"></span>
                <br>
            </div>
            <div class="rightItem">
                <span class="elementType">{{match.model.elementType}}</span>
                <span>last mod {{match.model.editTime}} by
                    <span class="editor">{{match.model.editor}}</span>
                </span>
            </div>
        </span>
        <span ng-switch-when="doc" class="contentContainer">
            <span> documentation </span>
            <span id="{{match.model.id + match.model.type}}" class="content mentionMatch">{{match.model.documentation}}</span>
        </span>
        <div ng-switch-when="val" class="contentContainer" ng-if="match.model.type === 'val'">
            <span> value </span>
            <span id="{{match.model.id + match.model.type}}" class="content mentionMatch">{{match.model.value}}</span>
        </div>
    </a>
</script>

<mention-intercept mms-mention-intercept-value="$ctrl.mmsMentionValue" mms-fast-cf="$ctrl.fastCfListing" mms-mention-id="$ctrl.mmsMentionId"></mention-intercept>
`,
    bindings: {
        mmsEditor: '<',
        mmsMentionValue: '<',
        mmsMentionId: '<',
        mmsProjectId: '<',
        mmsRefId: '<',
    },
    controller: MMSMentionController,
};

veCore.component(MMSMention.selector, MMSMention);
