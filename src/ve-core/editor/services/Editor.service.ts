import angular from 'angular';
import $ from 'jquery';

import { SaveConflictResolveFn } from '@ve-components/diffs';
import { EditDialogService } from '@ve-core/editor';
import { ConfirmDeleteModalResolveFn } from '@ve-core/modals';
import { ToolbarService } from '@ve-core/toolbar';
import { CacheService, EditObject, EditService, EventService } from '@ve-utils/core';
import { ApiService, ElementService, PermissionsService, ViewService, ValueService } from '@ve-utils/mms-api-client';

import { veCore } from '@ve-core';

import { VePromise, VePromiseReason, VeQService } from '@ve-types/angular';
import { BasicResponse, ElementObject, ElementsResponse, MmsObject } from '@ve-types/mms';
import { VeModalInstanceService, VeModalService, VeModalSettings } from '@ve-types/view-editor';

export class EditorService {
    public generatedIds: number = 0;
    private edit2editor: { [editKey: string]: { [field: string]: (destroy?: boolean) => VePromise<boolean, string> } } =
        {};
    public savingAll: boolean = false;

    static $inject = [
        '$q',
        '$timeout',
        '$uibModal',
        'growl',
        'ApiService',
        'CacheService',
        'PermissionsService',
        'ElementService',
        'ValueService',
        'ViewService',
        'ToolbarService',
        'EditDialogService',
        'EventService',
        'EditService',
    ];

    constructor(
        private $q: VeQService,
        private $timeout: angular.ITimeoutService,
        private $uibModal: VeModalService,
        private growl: angular.growl.IGrowlService,
        private apiSvc: ApiService,
        private cacheSvc: CacheService,
        private permissionsSvc: PermissionsService,
        private elementSvc: ElementService,
        private valueSvc: ValueService,
        private viewSvc: ViewService,
        private toolbarSvc: ToolbarService,
        private editdialogSvc: EditDialogService,
        private eventSvc: EventService,
        private editSvc: EditService
    ) {}

    public get(editKey: string): { [field: string]: () => VePromise<boolean, string> } {
        return this.edit2editor[editKey];
    }

    public updateAllData(
        editKey: string | string[],
        allowNone?: boolean,
        destroy?: boolean
    ): VePromise<void, BasicResponse<MmsObject>> {
        const key: string = this.editSvc.makeKey(editKey);
        return new this.$q<void, BasicResponse<MmsObject>>((resolve, reject) => {
            if (this.edit2editor[key]) {
                const promises: VePromise<boolean, string>[] = [];
                for (const id of Object.keys(this.edit2editor[key])) {
                    promises.push(this.edit2editor[key][id](destroy));
                }
                this.$q.all(promises).then(resolve, reject);
            } else if (allowNone) {
                resolve();
            } else {
                reject({ status: 500, message: 'No editors present to update from' });
            }
        });
    }

    public add(
        editKey: string | string[],
        field: string,
        updateFn: (destroy?: boolean) => VePromise<boolean, string>
    ): void {
        editKey = this.editSvc.makeKey(editKey);
        if (!this.edit2editor[editKey]) this.edit2editor[editKey] = {};
        this.edit2editor[editKey][field] = updateFn;
    }

    public remove(editKey: string | string[], field: string): void {
        editKey = Array.isArray(editKey) ? editKey.join('|') : editKey;
        if (this.edit2editor[editKey] && this.edit2editor[editKey][field]) {
            this.edit2editor[editKey][field]().finally(() => {
                delete this.edit2editor[editKey as string][field];
                if (Object.keys(this.edit2editor[editKey as string]).length === 0) {
                    delete this.edit2editor[editKey as string];
                }
            });
        }
    }

    public createId(): string {
        return `mmsCKEditor${this.generatedIds++}`;
    }
    public focusOnEditorAfterAddingWidgetTag(editor: CKEDITOR.editor): void {
        const element = editor.widgets.focused.element.getParent();
        editor.focusManager.focus(element);
    }

    public save = (editKey: string | string[], continueEdit: boolean): VePromise<ElementObject> => {
        this.eventSvc.$broadcast('element-saving', true);

        return new this.$q((resolve, reject) => {
            this._save(editKey, continueEdit).then(
                (data) => {
                    this.eventSvc.$broadcast('element-saving', false);
                    if (!data) {
                        this.growl.info('Save Skipped (No Changes)');
                    } else {
                        this.growl.success('Save Successful');
                    }

                    resolve(data);
                },
                (reason) => {
                    this.eventSvc.$broadcast('element-saving', false);
                    reject(reason);
                }
            );
        });
    };

    public saveAll = (): VePromise<void, void> => {
        if (this.savingAll) {
            this.growl.info('Please wait...');
            return this.$q.resolve();
        }
        if (this.editSvc.openEdits() === 0) {
            this.growl.info('Nothing to save');
            return this.$q.resolve();
        }

        this.savingAll = true;
        return new this.$q((resolve, reject) => {
            this.elementSvc
                .updateElements(
                    Object.values(this.editSvc.getAll()).map((editOb) => {
                        return editOb.element;
                    })
                )
                .then((responses) => {
                    responses.forEach((elementOb) => {
                        const edit = this.editSvc.get(this.elementSvc.getEditElementKey(elementOb));
                        this.cleanUpEdit(edit.key);
                        const data = {
                            element: elementOb,
                            continueEdit: false,
                        };
                        this.eventSvc.$broadcast('element.updated', data);
                    });
                    this.growl.success('Save All Successful');
                    resolve();
                }, reject);
        });
    };

    /**
     * @name Utils#save
     * save edited element
     *
     * @param {string} editKey The autosave key that points to the object being saved
     * @param continueEdit
     * @return {Promise} promise would be resolved with updated element if save is successful.
     *      For unsuccessful saves, it will be rejected with an object with type and message.
     *      Type can be error or info. In case of conflict, there is an option to discard, merge,
     *      or force save. If the user decides to discord or merge, type will be info even though
     *      the original save failed. Error means an actual error occurred.
     */
    private _save<T extends ElementObject>(editKey: string | string[], continueEdit?: boolean): VePromise<T> {
        return new this.$q<T>((resolve, reject) => {
            this.updateAllData(editKey, true, true).then(
                () => {
                    const edit = this.editSvc.get<T>(editKey).element;
                    this.elementSvc.updateElement(edit, false, true).then(
                        (element: T) => {
                            const data = {
                                element: element,
                                continueEdit: continueEdit ? continueEdit : false,
                            };
                            this.eventSvc.$broadcast('element.updated', data);
                            this.cleanUpEdit(editKey);
                            resolve(element);
                        },
                        (reason: VePromiseReason<ElementsResponse<T>>) => {
                            if (reason.status === 409) {
                                const latest = reason.data.elements[0];
                                this.saveConflictDialog(latest).result.then(
                                    (data) => {
                                        const choice = data;
                                        if (choice === 'ok') {
                                            const reqOb = {
                                                elementId: latest.id,
                                                projectId: latest._projectId,
                                                refId: latest._refId,
                                                commitId: 'latest',
                                            };
                                            this.cleanUpEdit(editKey);
                                            resolve(this.elementSvc.cacheElement(reqOb, latest));
                                        } else if (choice === 'force') {
                                            edit._modified = latest._modified;
                                            this._save<T>(editKey, continueEdit).then(
                                                (resolved) => {
                                                    resolve(resolved);
                                                },
                                                (error) => {
                                                    reject(error);
                                                }
                                            );
                                        } else {
                                            reject({ status: 444, type: 'info', message: 'Save cancelled!' });
                                        }
                                    },
                                    () => {
                                        reject({
                                            status: 500,
                                            message: 'An error occurred. Please try your request again',
                                            type: 'error',
                                        });
                                    }
                                );
                            } else {
                                reason.type = 'error';
                                reject(reason);
                            }
                        }
                    );
                },
                () => {
                    reject({
                        status: 500,
                        message: 'Error Saving from Editor; Please Retry',
                        type: 'error',
                    });
                }
            );
        });
    }

    /**
     * @name Utils#hasEdits
     * whether editor object has changes compared to base element,
     * currently compares name, doc, property values, if element is not
     * editable, returns false
     *
     * @param {object} editOb edit object
     * @param {'name' | 'value' | 'documentation'} field specific field you are interested in checking for edits
     * @return {boolean} has changes or not
     */
    public hasEdits = (
        editOb: EditObject,
        field?: 'name' | 'value' | 'documentation'
    ): VePromise<boolean, ElementsResponse<ElementObject>> => {
        const edit = editOb.element;
        edit._commitId = 'latest';
        return new this.$q<boolean, ElementsResponse<ElementObject>>((resolve) => {
            this.updateAllData(editOb.key, true, false).then(
                () => {
                    this.elementSvc.getElement<ElementObject>(this.elementSvc.getElementRequest(edit)).then(
                        (elementOb) => {
                            if (elementOb) {
                                if ((!field || field === 'name') && edit.name !== elementOb.name) {
                                    resolve(true);
                                }
                                if (
                                    (!field || field === 'documentation') &&
                                    edit.documentation !== elementOb.documentation
                                ) {
                                    resolve(true);
                                }
                                if (
                                    this.valueSvc.isValue(edit) &&
                                    (!field || field === 'value') &&
                                    !this.valueSvc.isEqual(edit, elementOb)
                                ) {
                                    resolve(true);
                                }
                                resolve(false);
                            } else if (
                                edit.id.endsWith('_temp') &&
                                (edit.name || edit.documentation || this.valueSvc.hasValue(edit))
                            ) {
                                resolve(true);
                            } else {
                                resolve(false);
                            }
                        },
                        () => {
                            resolve(false);
                        }
                    );
                },
                () => {
                    resolve(false);
                }
            );
        });
    };

    /**
     * @name Utils#openEdit
     * reset back to base element or remove editor object
     *
     * @param {object} elementOb scope with common properties
     */
    public openEdit(elementOb: ElementObject): VePromise<EditObject, ElementsResponse<ElementObject>> {
        return new this.$q((resolve, reject) => {
            this.permissionsSvc
                .initializePermissions(
                    {
                        id: elementOb._projectId,
                    },
                    {
                        id: elementOb._refId,
                        _projectId: elementOb._projectId,
                        type: 'Branch',
                    }
                )
                .finally(() => {
                    const reqOb = {
                        elementId: elementOb.id,
                        projectId: elementOb._projectId,
                        refId: elementOb._refId,
                    };
                    if (!this.permissionsSvc.hasBranchEditPermission(elementOb._projectId, elementOb._refId)) {
                        reject({ message: 'No edit permission on branch', status: 403 });
                        return;
                    }
                    this.elementSvc.getElementForEdit(reqOb).then(
                        (edit) => {
                            if (this.valueSvc.isValue(edit.element)) {
                                edit.values = this.valueSvc.getValues(edit.element);
                            }
                            resolve(edit);
                        },
                        (reason) => {
                            reject(reason);
                        }
                    );
                });
        });
    }

    public cleanUpEdit(editKey: string | string[]): void {
        this.clearAutosave(editKey);
        this.editSvc.remove(editKey);
        // Broadcast message for the ToolCtrl:
        this.eventSvc.$broadcast('editor.close');
    }

    public clearAutosave = (key: string | string[], field?: string): void => {
        key = this.editSvc.makeKey(key);
        if (field) key = key + '|' + field;
        Object.keys(window.localStorage).forEach((akey) => {
            if (akey.indexOf(key as string) !== -1) {
                window.localStorage.removeItem(akey);
            }
        });
    };

    private _makeKey(key: string | string[]): string {
        return Array.isArray(key) ? key.join('|') : key;
    }

    public handleError<T>(reason: { message: string; type: 'error' | 'warning' | 'info' } | VePromiseReason<T>): void {
        if (reason.type === 'info') this.growl.info(reason.message);
        else if (reason.type === 'warning') this.growl.warning(reason.message);
        else if (reason.type === 'error') this.growl.error(reason.message);
    }

    public updateEditor(editKey: string | string[], field: string): VePromise<boolean> {
        return new this.$q((resolve, reject) => {
            editKey = this.editSvc.makeKey(editKey);
            if (this.edit2editor[editKey] && this.edit2editor[editKey][field]) {
                this.edit2editor[editKey][field]().then(resolve, reject);
            } else {
                resolve(true); // continue for non ckeditor transcludes
            }
        });
    }

    /**
     * @name Utils#previewAction     * called by transcludes and section, previews edited element
     * uses these in the scope:
     *   element - element object for the element to edit (for sections it's the instance spec)
     *   edit - edit object
     *   elementSaving - boolean
     *   inPreviewMode - boolean
     *   isEditing - boolean
     *   bbApi - button bar api - handles spinny
     * sets these in the scope:
     *   skipBroadcast - true
     *   inPreviewMode - false
     *   isEditing - false
     *   elementSaving - false
     *
     * @param ctrl
     * @param {object} recompile recompile function object
     * @param {object} domElement dom of the directive, jquery wrapped
     */

    public scrollToElement = (domElement: JQuery): void => {
        this.$timeout(
            () => {
                const el = domElement[0];
                if ($(domElement).isOnScreen()) return;
                el.scrollIntoView();
            },
            500,
            false
        ).then(
            () => {
                /**/
            },
            () => {
                /**/
            }
        );
    };

    saveConflictDialog<T extends ElementObject>(latest: T): VeModalInstanceService<string> {
        return this.$uibModal.open<SaveConflictResolveFn<T>, string>({
            component: 'saveConflict',
            size: 'lg',
            resolve: {
                latest: () => {
                    return latest;
                },
            },
        });
    }

    public deleteEditModal(editOb: EditObject): VeModalInstanceService<string> {
        const settings: VeModalSettings<ConfirmDeleteModalResolveFn> = {
            component: 'confirmDeleteModal',
            resolve: {
                getName: () => {
                    return `${editOb.element.type} ${editOb.element.id}`;
                },
                getType: () => {
                    return 'edit';
                },
                finalize: () => {
                    return () => {
                        return this.$q.resolve();
                    };
                },
            },
        };
        return this.$uibModal.open<ConfirmDeleteModalResolveFn, string>(settings);
    }

    public deleteConfirmModal(edit: EditObject): VeModalInstanceService<void> {
        const settings: VeModalSettings<ConfirmDeleteModalResolveFn> = {
            component: 'confirmDeleteModal',
            resolve: {
                getType: () => {
                    return edit.element.type ? edit.element.type : 'element';
                },
                getName: () => {
                    return edit.element.name ? edit.element.name : 'Element';
                },
                finalize: () => {
                    return () => {
                        this.cleanUpEdit(edit.key);
                        return this.$q.resolve();
                    };
                },
            },
        };
        return this.$uibModal.open<ConfirmDeleteModalResolveFn, void>(settings);
    }
}

veCore.service('EditorService', EditorService);
