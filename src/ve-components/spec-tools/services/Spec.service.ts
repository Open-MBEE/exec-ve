import { ComponentService } from '@ve-components/services';
import { EditorService } from '@ve-core/editor';
import { ToolbarService } from '@ve-core/toolbar';
import { UtilsService } from '@ve-utils/application';
import { EditObject, EditService, EventService } from '@ve-utils/core';
import {
    ApiService,
    AuthService,
    ElementService,
    PermissionsService,
    ProjectService,
    URLService,
    UserService,
    ViewService,
    ValueService,
} from '@ve-utils/mms-api-client';

import { PropertySpec, veComponents } from '@ve-components';

import { VePromise, VePromiseReason, VeQService } from '@ve-types/angular';
import {
    DocumentObject,
    ElementObject,
    ElementsRequest,
    RefObject,
    UserObject,
    ValueObject,
    ViewInstanceSpec,
    ViewObject,
} from '@ve-types/mms';

export interface SpecApi extends ElementsRequest<string> {
    rootId?: string;
    refType: string;
    displayOldSpec?: boolean | null;
    relatedDocuments?: ViewObject[];
    propSpec?: PropertySpec;
    typeClass?: string;
    dataLink?: string;
    qualifiedName?: string;
}

export class SpecService implements angular.Injectable<any> {
    private element: ElementObject;
    private view: ViewObject | ViewInstanceSpec;
    private document: DocumentObject;
    private modifier: UserObject;
    private ref: RefObject;
    private values: ValueObject[];
    private edit: EditObject;
    private editing: boolean = false;
    public editable: boolean;
    private keeping: boolean = false;

    public specApi: SpecApi = { refType: '', refId: '', elementId: '', projectId: '' };
    public tracker: {
        etrackerSelected?: string;
    } = {};

    public editValues: ValueObject[] = [];

    static $inject = [
        '$q',
        '$timeout',
        'growl',
        'ElementService',
        'ProjectService',
        'ViewService',
        'EventService',
        'ToolbarService',
        'EditService',
        'ComponentService',
        'URLService',
        'AuthService',
        'UserService',
        'PermissionsService',
        'UtilsService',
        'ApiService',
        'ValueService',
        'EditorService',
    ];
    private ran: boolean;
    private lastid: string;
    private gettingSpec: boolean;
    constructor(
        private $q: VeQService,
        private $timeout: angular.ITimeoutService,
        private growl: angular.growl.IGrowlService,
        private elementSvc: ElementService,
        private projectSvc: ProjectService,
        private viewSvc: ViewService,
        private eventSvc: EventService,
        private toolbarSvc: ToolbarService,
        private autosaveSvc: EditService,
        private componentSvc: ComponentService,
        private uRLSvc: URLService,
        private authSvc: AuthService,
        private userSvc: UserService,
        private permissionsSvc: PermissionsService,
        private utilsSvc: UtilsService,
        private apiSvc: ApiService,
        private valueSvc: ValueService,
        private editorSvc: EditorService
    ) {}

    /**
     * @name veComponents.component:mmsSpec#toggleEditing
     * toggles editor
     *
     * @return {boolean} toggle successful
     */
    public toggleEditing = (): boolean => {
        if (!this.editing) {
            if (this.editable) this.editing = true;
            else return false;
        } else {
            this.editing = false;
        }
        return true;
    };
    /**
     * @name veComponents.component:mmsSpec#setEditing
     * sets editor state
     *
     * @param {boolean} mode true or false
     * @return {boolean} set successful
     */
    public setEditing = (mode): boolean => {
        if (mode) {
            if (this.editable) this.editing = true;
            else return false;
        } else this.editing = false;
        return true;
    };
    /**
     * @name veComponents.component:mmsSpec#getEditing
     * get editor state
     *
     * @return {boolean} editor or not
     */
    public getEditing = (): boolean => {
        return this.editing;
    };
    /**
     * @name veComponents.component:mmsSpec#getEdits
     * get current edit object
     *
     * @return {Object} may be null or undefined, if not, is
     *  current element object that can be edited (may include changes)
     */
    public getEdits = (): EditObject => {
        return this.edit;
    };

    public setEdits = (editOb: EditObject): void => {
        if (this.valueSvc.isValue(editOb.element)) {
            editOb.values = this.valueSvc.getValues(editOb.element);
        }
        this.edit = editOb;
    };

    public getElement = (): ElementObject => {
        return this.element;
    };

    public getDocument = (): DocumentObject => {
        return this.document;
    };

    public getView = (): ElementObject => {
        return this.view;
    };

    public getModifier = (): UserObject => {
        return this.modifier;
    };

    public getValues(): ValueObject[] {
        return this.values;
    }

    public getRef = (): RefObject => {
        return this.ref;
    };

    public getTypeClass = (element: ElementObject): void => {
        // Get Type
        this.specApi.typeClass = this.utilsSvc.getElementTypeClass(element, this.viewSvc.getElementType(element));
    };

    public getQualifiedName(element: ElementObject): VePromise<boolean> {
        const deferred = this.$q.defer<boolean>();
        if (this.edit) element = this.edit.element;
        const reqOb: ElementsRequest<string> = {
            commitId: element._commitId ? element._commitId : 'latest',
            projectId: element._projectId,
            refId: element._refId,
            elementId: element.id,
        };
        this.elementSvc.getElementQualifiedName(reqOb).then(
            (result) => {
                this.specApi.qualifiedName = result;
                deferred.resolve(true);
            },
            (reason) => {
                deferred.reject(reason);
            }
        );
        return deferred.promise;
    }

    public setElement = (): void => {
        this.specApi.relatedDocuments = null;
        this.specApi.propSpec = {};

        this.ran = true;
        this.lastid = this.specApi.elementId;

        this.specApi.extended = !(this.specApi.commitId && this.specApi.commitId !== 'latest');

        this._updateElement();
    };

    private _updateElement = (): void => {
        const reqOb = Object.assign({}, this.specApi);
        this.elementSvc
            .getElement(reqOb, 2, false)
            .then(
                (data) => {
                    const promises: angular.IPromise<any>[] = [];
                    if (data.id !== this.lastid) {
                        return;
                    }
                    this.element = data;
                    if (this.apiSvc.isView(data) || this.viewSvc.isSection(data)) {
                        this.view = data;
                    }
                    this.values = this.valueSvc.getValues(data);
                    promises.push(
                        this.userSvc.getUserData(data._modifier).then((result) => {
                            this.modifier = result;
                        })
                    );
                    /* no more related docs search supported
                    if (!this.specApi.commitId || this.specApi.commitId === 'latest') {
                        promises.push(
                            this.elementSvc
                                .search<ViewObject>(reqOb, {
                                    size: 1,
                                    params: {
                                        id: data.id,
                                        _projectId: data._projectId,
                                    },
                                })
                                .then((searchResultOb) => {
                                    if (data.id !== this.lastid) {
                                        return
                                    }
                                    const searchResult = searchResultOb.elements
                                    if (
                                        searchResult &&
                                        searchResult.length == 1 &&
                                        searchResult[0].id === data.id &&
                                        searchResult[0]._relatedDocuments &&
                                        searchResult[0]._relatedDocuments.length > 0
                                    ) {
                                        this.specApi.relatedDocuments = searchResult[0]._relatedDocuments
                                    }
                                })
                        )
                    }
                    */
                    if (this.specApi.rootId) {
                        const docReq: ElementsRequest<string> = {
                            elementId: this.specApi.rootId,
                            projectId: this.specApi.projectId,
                            refId: this.specApi.refId,
                            commitId: this.specApi.commitId ? this.specApi.commitId : 'latest',
                        };
                        promises.push(
                            this.viewSvc.getProjectDocument(docReq, 1).then((result) => {
                                this.document = result;
                            })
                        );
                    }
                    if (
                        (this.specApi.commitId && this.specApi.commitId !== 'latest') ||
                        !this.permissionsSvc.hasBranchEditPermission(data._projectId, data._refId) ||
                        this.specApi.refType === 'Tag'
                    ) {
                        this.editable = false;
                        this.edit = null;
                        this.setEditing(false);
                    } else {
                        this.editable = true;
                        // only get edit object if in spec edit
                    }
                    promises.push(
                        this.projectSvc.getRef(this.specApi.refId, this.specApi.projectId).then((result) => {
                            this.ref = result;
                        })
                    );
                    this.getTypeClass(this.element);
                    promises.push(this.getQualifiedName(this.element));
                    this.specApi.dataLink =
                        this.uRLSvc.getRoot() +
                        '/projects/' +
                        this.element._projectId +
                        '/refs/' +
                        this.element._refId +
                        '/elements/' +
                        this.element.id +
                        '?commitId=' +
                        this.element._commitId +
                        '&token=' +
                        this.authSvc.getToken();

                    this.$q.allSettled(promises).then(
                        () => this.eventSvc.resolve<boolean>('spec.ready', true),
                        (reason: VePromiseReason<unknown>) => {
                            this.growl.error('Getting Element Error: ' + reason.message);
                        }
                    );
                },
                (reason) => {
                    this.growl.error('Getting Element Error: ' + reason.message);
                }
            )
            .finally(() => {
                this.gettingSpec = false;
            });
    };

    public setKeepMode = (value?: boolean): void => {
        if (value === undefined) {
            this.keepMode();
        }
        this.keeping = value;
    };

    public getKeepMode = (): boolean => {
        return this.keeping;
    };

    public keepMode = (): void => {
        this.keeping = true;
    };

    // Check edit count and toggle appropriate save all and edit/edit-asterisk buttons
    public toggleSave = (toolbarId: string): void => {
        this.toolbarSvc.waitForApi(toolbarId).then(
            (api) => {
                if (this.autosaveSvc.openEdits() > 0) {
                    api.setPermission('spec-editor.saveall', true);
                    api.setIcon('spec-editor', 'fa-edit-asterisk');
                } else {
                    api.setPermission('spec-editor.saveall', false);
                    api.setIcon('spec-editor', 'fa-edit');
                }
            },
            (reason) => {
                this.growl.error(ToolbarService.error(reason));
            }
        );
    };
    //

    // Check edit count and toggle appropriate save all and edit/edit-asterisk buttons
    // public cleanUpSaveAll = (toolbarId: string): void => {
    //     this.toolbarSvc.waitForApi(toolbarId).then(
    //         (api) => {
    //             if (this.autosaveSvc.openEdits() > 0) {
    //                 api.setPermission('spec-editor.saveall', true)
    //                 api.setIcon('spec-editor', 'fa-edit-asterisk')
    //             } else {
    //                 api.setPermission('spec-editor.saveall', false)
    //                 api.setIcon('spec-editor', 'fa-edit')
    //             }
    //         },
    //         (reason) => {
    //             this.growl.error(ToolbarService.error(reason))
    //         }
    //     )
    // }
}

veComponents.service('SpecService', SpecService);
