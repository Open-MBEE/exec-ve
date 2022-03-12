import * as angular from "angular";
import {MentionService} from "../../mms/services/MentionService.service";
import {Utils} from "../services/Utils.service";
var mmsDirectives = angular.module('mmsDirectives');


let MMSMention = {
    selector: 'mms-mention',
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

<mms-mention-intercept mms-mention-intercept-value="$ctrl.mmsMentionValue" mms-fast-cf="$ctrl.fastCfListing"></mms-mention-intercept>
`,
    bindings: {
        mmsEditor: '<',
        mmsMentionValue: '<',
        mmsMentionId: '<',
        mmsProjectId: '<',
        mmsRefId: '<'
    },
    controller: class MMSMentionController implements angular.IComponentController {
        //Bindings
        public mmsEditor
                mmsMentionValue
                mmsMentionId
                mmsProjectId
                mmsRefId
        
        //Local
        public fastCfListing
        
        constructor(private mentionSvc : MentionService, private utils : Utils) {
        }

        $onInit() {
            this.fastCfListing = this.mentionSvc.getFastCfListing(this.mmsProjectId, this.mmsRefId);
            // expose this api on the controller itself so that it can be accessed by codes that use $compile service to construct this directive.
        }

        public selectMentionItem($item) {
            this._createCf($item);
            this.mentionSvc.handleMentionSelection(this.mmsEditor, this.mmsMentionId);
        }

        private _createCf($item) {
            var tag = '<mms-cf mms-cf-type="' + $item.type + '" mms-element-id="' + $item.id + '">[cf:' + $item.name + '.' + $item.type + ']</mms-cf>';
            this.mmsEditor.insertHtml(tag);
            this.utils.focusOnEditorAfterAddingWidgetTag(this.mmsEditor);
        }
    }
}

mmsDirectives.component(MMSMention.selector, MMSMention);
