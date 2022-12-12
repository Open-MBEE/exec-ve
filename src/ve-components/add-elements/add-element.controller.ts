import angular from 'angular'
import flatpickr from 'flatpickr'
import _ from 'lodash'

import {
    AddElementApi,
    AddElementData,
} from '@ve-app/main/modals/add-item-modal.component'
import { LoginModalResolveFn } from '@ve-app/main/modals/login-modal.component'
import { CoreUtilsService } from '@ve-core/services'
import {
    ApiService,
    ElementService,
    ProjectService,
    ViewService,
} from '@ve-utils/mms-api-client'
import { SchemaService } from '@ve-utils/model-schema'
import { ApplicationService, UtilsService } from '@ve-utils/services'

import { VePromise, VePromiseReason } from '@ve-types/angular'
import { BasicResponse, ElementObject, MmsObject } from '@ve-types/mms'
import {
    VeModalService,
    VeModalSettings,
    VeSearchOptions,
} from '@ve-types/view-editor'

/**
 * @name veComponents/AddElement
 * @description
 * Generic controller used for the creation and update of elements.
 *
 * @template T Type of the add data required for creation of the desired element
 * @template U Type of the eventual element that will be returned by the Server
 */
export class AddElement<
    T extends AddElementData,
    U extends MmsObject = ElementObject
> {
    //Bindings
    public addElementData: T
    public addElementApi: AddElementApi<U>
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
    projectId: string
    refId: string
    orgId: string
    displayName: string = ''
    addType: string
    newItem: U
    now: Date
    dateTimeOpts: flatpickr.Options.Options

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
        'CoreUtilsService',
    ]

    protected schema = 'cameo'

    //local

    private $componentEl: JQuery<HTMLElement>

    constructor(
        protected $scope: angular.IScope,
        protected $q: angular.IQService,
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
        protected utils: CoreUtilsService
    ) {}

    public parentData: ElementObject = {} as ElementObject

    $onInit(): void {
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
        // if (this.resolve.init && this.resolve.init instanceof Function) {
        //     this.resolve.init(this)
        //     return
        // }

        this.config()
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

        this.create().then(this.resolve, this.reject, this.last)
    }

    public loginCb = (result?: boolean): void => {
        if (result) {
            this.ok()
        } else {
            this.reject({ status: 666, message: 'User not Authenticated' })
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
            this.reject({
                status: 666,
                message: 'User Cancelled Authentication',
            })
        })
    }
    protected resolve = (data: U): void => {
        this.growl.success(this.displayName + ' is being created')
        this.success(data)
        this.addElementApi.resolve(data)
    }
    protected reject = (reason: VePromiseReason<BasicResponse<U>>): void => {
        this.fail(reason)
        this.addElementApi.reject(reason)
    }

    public success = (data?: U): void => {
        /* Put custom success logic here*/
    }

    public fail = (reason: VePromiseReason<BasicResponse<U>>): void => {
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
        this.oking = false
    }

    /**
     * @name Presentation/config
     *
     * @description Extension API method to allow presentation components to implement custom initialization steps.
     * Such as non-standard variables or services.
     */
    protected config = (): void => {
        /* Implement any initialization Logic Here */
        this.growl.warning(
            `Add ${
                this.addType === 'item'
                    ? 'Item'
                    : 'PE' + ' of Type ' + this.type + ' is not supported'
            }`
        )
    }

    /**
     * @name AddElement/callback
     * @param {ElementObject} data
     */
    public callback = (data: U): void => {
        if (this.oking) {
            this.growl.info('Please wait...')
            return
        }
        this.oking = true
        this.addExisting(data).then(this.resolve, this.reject, this.last)
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

    public create = (): VePromise<U, BasicResponse<U>> => {
        this.growl.error(`Add Item of Type ${this.type} is not supported`)
        return this.$q.reject()
    }

    /**
     * @name AddElement/addExisting
     * @param {U} existingOb
     * @return {VePromise<U>}
     */
    public addExisting = (existingOb: U): VePromise<U> => {
        return this.$q.resolve<U>(null as U)
    }
}
