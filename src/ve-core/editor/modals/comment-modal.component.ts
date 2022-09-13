import * as angular from "angular";

import{ElementService} from "@ve-utils/mms-api-client";
import {UtilsService} from "@ve-utils/core-services";
import {VeComponentOptions} from "@ve-types/view-editor";
import {VeEditorController} from "../ve-editor.component";
import { Class } from "@ve-utils/utils";

import {veCore} from "@ve-core";


let CommentModalComponent: VeComponentOptions = {
    selector: 'commentModal',
    template: `
    
`,
    bindings: {
        close: "<",
        dismiss: "<",
        modalInstance: "<",
        resolve: "<"
    },
    controller: class CommentModalController implements angular.IComponentController {

        //bindings
        private dismiss
        close
        resolve

        protected comment;
        protected oking;

        private editor: VeEditorController;
        private mmsProjectId: string;
        private mmsRefId: string;

        constructor(private growl: angular.growl.IGrowlService, private elementSvc: ElementService,
                    private utilsSvc: UtilsService) {
        }

        $onInit() {
            this.editor = this.resolve.editor();
            this.mmsProjectId = this.editor.mmsProjectId;
            this.mmsRefId = this.editor.mmsRefId;

            var id = this.utilsSvc.createMmsId();
            this.comment = new Class({
                id: id,
                _projectId: this.mmsProjectId,
                _refId: this.mmsRefId,
                name: 'Comment ' + new Date().toISOString(),
                documentation: '',
                type: 'Class',
                ownerId: "holding_bin_" + this.mmsProjectId,
                _appliedStereotypeIds: []
            });
            this.oking = false;
        }


        ok = () => {
        if (this.oking) {
            this.growl.info("Please wait...");
            return;
        }
        this.oking = true;
        var reqOb = {elements: this.comment, elementId: this.comment.id, projectId: this.mmsProjectId, refId: this.mmsRefId};
        this.elementSvc.createElement(reqOb)
            .then((data) => {
                let tag = '<transclusion mms-cf-type="com" mms-element-id="' + data.id + '">comment:' + data._creator + '</transclusion>';
                this.close({ $value: tag });
            }, (reason) => {
                this.growl.error("Comment Error: " + reason.message);
            }).finally(() => {
            this.oking = false;
        });
    };

    cancel = () => {
        this.dismiss();
    };
}
}

veCore.component(CommentModalComponent.selector, CommentModalComponent)
