import {veCore} from "@ve-core";

export interface VeEditorApi {
    save?(e?): void
    saveC?(e?): void
    cancel?(e?): void
    startEdit?(e?): void
    preview?(e?): void
    delete?(e?): void
}

export class EditorService {

    public focusOnEditorAfterAddingWidgetTag(editor) {
        const element = editor.widgets.focused.element.getParent();
        const range = editor.createRange();
        if(range) {
            range.moveToClosestEditablePosition(element, true);
            range.select();
        }
    }

}

veCore.service("EditorService", EditorService)
