import angular from 'angular'
import _ from 'lodash'

import { LoginModalResolveFn } from '@ve-app/main/modals/login-modal.component'
import { AddElementsService } from '@ve-components/add-elements'
import {
    ApiService,
    ElementService,
    ProjectService,
    ViewService,
} from '@ve-utils/mms-api-client'
import { SchemaService } from '@ve-utils/model-schema'
import { ApplicationService, UtilsService } from '@ve-utils/services'

import { VePromise, VePromiseReason, VeQService } from '@ve-types/angular'
import { AddElementApi, AddElementData } from '@ve-types/components'
import { BasicResponse, ElementObject, MmsObject } from '@ve-types/mms'
import {
    VeModalService,
    VeModalSettings,
    veSearchCallback,
    VeSearchOptions,
} from '@ve-types/view-editor'

/**
 * @name veComponents/AddElement
 * @description
 * Generic controller used for the creation and update of elements.
 *
 */
export class AddElement<
    /**
     * @typedef T Type of the add data required for creation of the desired element
     */
    T extends AddElementData,
    /**
     * @typedef U Type of the eventual object that will be returned by the Server
     */
    U extends MmsObject = ElementObject
> {
    //Bindings
    public addElementData: T
    public addElementApi: AddElementApi<
        U,
        VePromiseReason<BasicResponse<MmsObject>>
    >
    public mmsProjectId: string
    public mmsRefId: string
    public mmsOrgId: string

    //Locals
    public name: string
    public ownerId: string
    public searchOptions: VeSearchOptions<U> = null
    type: string
    createForm: boolean = true
    oking: boolean = false
    continue: boolean = false
    projectId: string
    refId: string
    orgId: string
    displayName: string = ''
    addType: string
    newItem: U

    static $inject = [
        '$scope',
        '$q',
        '$element',
        'growl',
        '$timeout',
        'ViewService',
        'ElementService',
        'ProjectService',
        'SchemaService',
        'ApplicationService',
        'UtilsService',
        'ApiService',
        'AddElementsService',
    ]

    protected schema = 'cameo'

    //local

    private $componentEl: JQuery<HTMLElement>

    constructor(
        protected $scope: angular.IScope,
        protected $q: VeQService,
        protected $element: JQuery<HTMLElement>,
        protected growl: angular.growl.IGrowlService,
        protected $timeout: angular.ITimeoutService,
        protected $uibModal: VeModalService,
        protected viewSvc: ViewService,
        protected elementSvc: ElementService,
        protected projectSvc: ProjectService,
        protected schemaSvc: SchemaService,
        protected applicationSvc: ApplicationService,
        protected utilsSvc: UtilsService,
        protected apiSvc: ApiService,
        protected utils: AddElementsService
    ) {}

    public parentData: ElementObject = {} as ElementObject

    $onInit(): void {
        this.addType = this.addElementData.addType
        this.projectId = this.mmsProjectId
        this.refId = this.mmsRefId ? this.mmsRefId : ''
        this.orgId = this.mmsOrgId

        this.searchOptions = {
            callback: this.callback,
            itemsPerPage: 200,
            filterQueryList: [this.queryFilter],
            hideFilterOptions: true,
            closeable: false,
        }

        this.type = this.addElementData.type
    }

    public ok = (): void => {
        if (this.oking) {
            this.growl.info('Please wait...')
            return
        }
        this.oking = true

        this.ownerId = this.parentData
            ? this.parentData.id
            : 'holding_bin_' + this.projectId

        this.create()
            .then((data) => {
                this.addResolve(data, 'created')
            }, this.addReject)
            .finally(this.addFinally)
    }

    public loginCb = (result?: boolean): void => {
        if (result) {
            this.ok()
        } else {
            this.addReject({
                status: 666,
                message: 'User not Authenticated',
            })
        }
    }

    public reLogin = (): void => {
        this.$componentEl = this.$element.children()
        this.$element.empty()
        const settings: VeModalSettings<LoginModalResolveFn> = {
            component: 'loginModal',
            resolve: {
                continue: () => {
                    return true
                },
            },
        }
        const instance = this.$uibModal.open<LoginModalResolveFn, boolean>(
            settings
        )
        instance.result.then(this.loginCb, () => {
            this.addReject({
                status: 666,
                message: 'User Cancelled Authentication',
            })
        })
    }

    public addResolve = (data: U, type: string): void => {
        this.growl.success(this.displayName + ' is being ' + type)
        this.success(data)
        this.addElementApi.resolve(data)
    }

    protected addReject = <V extends VePromiseReason<BasicResponse<MmsObject>>>(
        reason: V
    ): void => {
        this.fail(reason)
        if (!this.continue) {
            this.addElementApi.reject(reason)
        }
        this.continue = false
    }

    public success = (data?: U): void => {
        /* Put custom success logic here*/
    }

    public fail = <V extends VePromiseReason<MmsObject>>(reason: V): void => {
        if (reason.status === 401) {
            this.reLogin()
        } else {
            this.growl.error(
                `Create ${_.upperCase(this.addElementData.type)} Error: ${
                    reason.message
                }`
            )
        }
    }

    public last = (): void => {
        /* Put custom finally logic here*/
    }

    public addFinally = (): void => {
        this.last()
        this.oking = false
    }

    /**
     * @name AddElement/callback
     * @param {ElementObject} data
     * @param {string} property
     */
    public callback: veSearchCallback<U> = (
        data: U,
        property?: string
    ): void => {
        if (this.oking) {
            this.growl.info('Please wait...')
            return
        }
        this.oking = true
        this.addExisting(data, property)
            .then((finalData) => {
                this.addResolve(finalData, 'added')
            }, this.addReject)
            .finally(this.addFinally)
    }
    /**
     *
     */
    public queryFilter = (): {
        _appliedStereotypeIds?: string[]
        classifierIds?: string[]
    } => {
        /* Implement and Search Filtering Logic Here */
        return {
            _appliedStereotypeIds: [],
            classifierIds: [],
        }
    }

    /**
     *
     * @return {VePromise<U, BasicResponse<U>>}
     */
    public create = (): VePromise<U, BasicResponse<U>> => {
        this.growl.error(`Add Item of Type ${this.type} is not supported`)
        return this.$q.reject()
    }

    /**
     * @name AddElement/addExisting
     * @param {U} existingOb
     * @param {string} property any property that was specified for use as a transclusion target
     * @return {VePromise<U>}
     */
    public addExisting = (existingOb: U, property?: string): VePromise<U> => {
        return this.$q.resolve<U>(null as U)
    }
}
