import { veCore } from '@ve-core'

export class EditorService {
    public focusOnEditorAfterAddingWidgetTag(editor: CKEDITOR.editor): void {
        const element = editor.widgets.focused.element.getParent()
        const range = editor.createRange()
        if (range) {
            range.moveToClosestEditablePosition(element, true)
            range.select()
        }
    }
}

veCore.service('EditorService', EditorService)
