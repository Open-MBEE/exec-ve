import { veCore } from '@ve-core'

export class EditorService {
    public generatedIds: number = 0
    public focusOnEditorAfterAddingWidgetTag(editor: CKEDITOR.editor): void {
        const element = editor.widgets.focused.element.getParent()
        editor.focusManager.focus(element)
    }
}

veCore.service('EditorService', EditorService)
