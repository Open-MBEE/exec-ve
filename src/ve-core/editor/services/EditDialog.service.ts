import { ConfirmDeleteModalResolveFn } from '@ve-app/main/modals/confirm-delete-modal.component'
import { SaveConflictResolveFn } from '@ve-components/diffs'
import { AutosaveService } from '@ve-utils/core'

import { veCore } from '@ve-core'

import { VeQService } from '@ve-types/angular'
import { ElementObject } from '@ve-types/mms'
import { VeModalInstanceService, VeModalService, VeModalSettings } from '@ve-types/view-editor'

export class EditDialogService {
    constructor(private $q: VeQService, private $uibModal: VeModalService, private autosaveSvc: AutosaveService) {}

    saveConflictDialog<T extends ElementObject>(latest: T): VeModalInstanceService<string> {
        return this.$uibModal.open<SaveConflictResolveFn<T>, string>({
            component: 'saveConflict',
            size: 'lg',
            resolve: {
                latest: () => {
                    return latest
                },
            },
        })
    }

    public deleteEditModal(deleteOb: { type: string; element: ElementObject }): VeModalInstanceService<string> {
        const settings: VeModalSettings<ConfirmDeleteModalResolveFn> = {
            component: 'confirmDeleteModal',
            resolve: {
                getName: () => {
                    return `${deleteOb.type} ${deleteOb.element.id}`
                },
                getType: () => {
                    return 'edit'
                },
                finalize: () => {
                    return () => {
                        this.autosaveSvc.clearAutosave(
                            deleteOb.element._projectId + deleteOb.element._refId + deleteOb.element.id,
                            deleteOb.type
                        )
                        return this.$q.resolve()
                    }
                },
            },
        }
        return this.$uibModal.open<ConfirmDeleteModalResolveFn, string>(settings)
    }

    public deleteConfirmModal(edit: ElementObject, element: ElementObject): VeModalInstanceService<void> {
        const settings: VeModalSettings<ConfirmDeleteModalResolveFn> = {
            component: 'confirmDeleteModal',
            resolve: {
                getType: () => {
                    return edit.type ? edit.type : 'element'
                },
                getName: () => {
                    return edit.name ? edit.name : 'Element'
                },
                finalize: () => {
                    return () => {
                        this.autosaveSvc.clearAutosave(element._projectId + element._refId + element.id, edit.type)
                        return this.$q.resolve()
                    }
                },
            },
        }
        return this.$uibModal.open<ConfirmDeleteModalResolveFn, void>(settings)
    }
}

veCore.service('EditDialogService', EditDialogService)
