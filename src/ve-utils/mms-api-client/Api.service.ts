import angular from 'angular'

import { URLService } from '@ve-utils/mms-api-client/URL.provider'
import { SchemaService } from '@ve-utils/model-schema'

import { veUtils } from '@ve-utils'

import {
    ElementObject,
    ExpressionObject,
    RequestObject,
    ValueObject,
} from '@ve-types/mms'

export class ApiService {
    private editKeys = [
        'name',
        'documentation',
        'defaultValue',
        'value',
        'specification',
        'id',
        '_projectId',
        '_refId',
        'type',
    ]

    schema: string = 'cameo'

    static $inject = ['SchemaService']

    constructor(private schemaSvc: SchemaService, private uRLSvc: URLService) {}

    /**
     * @name veUtils/ApiService#handleErrorCallback
     *
     * @param {angular.IHttpResponse<T>} response
     * @param {angular.IDeferred<U>} deferred
     */
    public handleErrorCallback<T, U>(
        response: angular.IHttpResponse<T>,
        deferred: angular.IDeferred<U>
    ) {
        deferred.reject(this.uRLSvc.handleHttpStatus(response))
    }

    /**
     * @ngdoc method
     * @name veUtils/UtilsService#_cleanValueSpec
     * @methodOf veUtils/UtilsService
     *
     * @description
     * Cleans value specification
     *
     * @param {Object} vs value spec object
     * @returns {void} nothing
     */

    private _cleanValueSpec(vs: ValueObject) {
        if (vs.hasOwnProperty('valueExpression')) delete vs.valueExpression
        if (vs.operand && Array.isArray(vs.operand)) {
            for (let i = 0; i < vs.operand.length; i++) {
                this._cleanValueSpec(vs.operand[i] as ValueObject)
            }
        }
    }

    /**
     * @ngdoc method
     * @name veUtils/UtilsService#cleanElement
     * @methodOf veUtils/UtilsService
     *
     * @description
     * Cleans
     *
     * @param {ElementObject} elem the element object to be cleaned
     * @param {boolean} [forEdit=false] (optional) forEdit.
     * @returns {ElementObject} clean elem
     */
    public cleanElement(elem: ElementObject, forEdit?: boolean): ElementObject {
        if (elem.type === 'Property' || elem.type === 'Port') {
            if (!elem.defaultValue) {
                elem.defaultValue = null
            }
        }
        if (elem.type === 'Slot') {
            if (!Array.isArray(elem.value)) elem.value = []
        }
        if (elem.value && Array.isArray(elem.value)) {
            elem.value.forEach((value) => {
                if (typeof value === 'object' && value !== null)
                    this._cleanValueSpec(value as ExpressionObject)
            })
        }
        if (elem._contents) {
            this._cleanValueSpec(elem._contents as ExpressionObject)
        }
        if (elem.specification) {
            this._cleanValueSpec(elem.specification as ExpressionObject)
        }
        if (elem.type === 'Class') {
            if (elem._contents && elem.contains) {
                delete elem.contains
            }
            if (Array.isArray(elem._displayedElementIds)) {
                elem._displayedElementIds = JSON.stringify(
                    elem._displayedElementIds
                )
            }
            if (elem._allowedElementIds) {
                delete elem._allowedElementIds
            }
        }

        if (elem.hasOwnProperty('specialization')) {
            delete elem.specialization
        }
        if (forEdit) {
            //only keep editable or needed keys in edit object instead of everything
            const keys = Object.keys(elem)
            keys.forEach((key) => {
                if (this.editKeys.indexOf(key) >= 0) {
                    return
                }
                delete elem[key]
            })
        }
        return elem
    }

    /**
     * @ngdoc method
     * @name veUtils/UtilsService#normalize
     * @methodOf veUtils/UtilsService
     *
     * @description
     * Normalize common arguments
     *
     * @param {RequestObject} reqOb
     * @returns {RequestObject} with default values for ref and commit
     */
    public normalize(reqOb: RequestObject) {
        reqOb.refId = !reqOb.refId ? 'master' : reqOb.refId
        reqOb.commitId = !reqOb.commitId ? 'latest' : reqOb.commitId
        return reqOb
    }

    /**
     * @name veUtils/UtilsService#makeRequestObject
     * @methodOf veUtils/UtilsService
     *
     * @description
     * Make a single element request object out of an ElementObject
     *
     * @param {ElementObject} elementOb
     * @returns {ElementsRequest}
     */
    public makeRequestObject(elementOb: ElementObject): RequestObject {
        return {
            projectId: elementOb._projectId,
            refId: elementOb._refId,
            commitId: elementOb._commitId,
        }
    }

    /**
     * @ngdoc method
     * @name veUtils/UtilsService#makeCacheKey
     * @methodOf veUtils/UtilsService
     *
     * @description
     * Make key for element for use in CacheService
     *
     * @param {RequestObject | null} reqOb request object
     * @param elementId
     * @param type
     * @param {boolean} [edit=false] element is to be edited
     * @returns {Array} key to be used in CacheService
     */
    public makeCacheKey(
        reqOb: RequestObject | null,
        elementId: string,
        edit?: boolean,
        type?: string
    ): string[] {
        const key: string[] = []
        const keyType: string = type ? type : 'element'
        key.push(keyType)
        if (reqOb !== null) {
            if (reqOb.projectId) key.push(reqOb.projectId)
            if (reqOb.refId !== null)
                key.push(!reqOb.refId ? 'master' : reqOb.refId)
            if (!keyType.includes('history') && reqOb.commitId !== null)
                key.push(!reqOb.commitId ? 'latest' : reqOb.commitId)
        }
        if (elementId !== '') key.push(elementId)
        if (edit) key.push('edit')
        return key
    }

    /**
     * @ngdoc method
     * @name veUtils/UtilsService#filterProperties
     * @methodOf veUtils/UtilsService
     *
     * @description
     * given element object a and element object b,
     * returns new object with b data minus keys not in a
     * (set notation A intersect B)
     *
     * @param {Object} a Element Object
     * @param {Object} b Element Object
     * @returns {Object} new object
     */
    public filterProperties(a: ElementObject, b: ElementObject): ElementObject {
        const res: ElementObject = null
        for (const key in a) {
            if (a.hasOwnProperty(key) && b.hasOwnProperty(key)) {
                res[key] = b[key]
            }
        }
        return res
    }

    /**
     * @ngdoc method
     * @name veUtils/UtilsService#hasConflict
     * @methodOf veUtils/UtilsService
     *
     * @description
     *  Checks if sever and cache version of the element are
     *  the same so that the user is aware that they are overriding
     *  changes to the element that they have not seen in the cache element.
     *  Given edit object with only keys that were edited,
     * 'orig' object and 'server' object, should only return true
     *	if key is in edit object and value in orig object is different
     *  from value in server object.
     *
     * @param {Object} edit An object that contains element id and any property changes to be saved.
     * @param {Object} orig version of elem object in cache.
     * @param {Object} server version of elem object from server.
     * @returns {Boolean} true if conflict, false if not
     */
    public hasConflict(
        edit: ElementObject,
        orig: ElementObject,
        server: ElementObject
    ): boolean {
        for (const i in edit) {
            if (
                i === '_read' ||
                i === '_modified' ||
                i === '_modifier' ||
                i === '_creator' ||
                i === '_created' ||
                i === '_commitId'
            ) {
                continue
            }
            if (
                edit.hasOwnProperty(i) &&
                orig.hasOwnProperty(i) &&
                server.hasOwnProperty(i)
            ) {
                if (!angular.equals(orig[i], server[i])) {
                    return true
                }
            }
        }
        return false
    }

    /**
     * @ngdoc method
     * @name veUtils/UtilsService#isRestrictedValue
     * @methodOf veUtils/UtilsService
     *
     * @description
     * deprecated
     *
     * @param {string} table table content
     * @returns {boolean} boolean
     */
    public isRestrictedValue(values: ExpressionObject[]) {
        if (
            values.length > 0 &&
            values[0].type === 'Expression' &&
            values[0].operand &&
            values[0].operand.length === 3 &&
            values[0].operand[0].value === 'RestrictedValue' &&
            values[0].operand[2].type === 'Expression' &&
            values[0].operand[2].operand &&
            Array.isArray(values[0].operand[2].operand) &&
            values[0].operand[2].operand.length > 0 &&
            values[0].operand[1].type === 'ElementValue'
        ) {
            return true
        }
        return false
    }

    /**
     * @ngdoc method
     * @name veUtils/UtilsService#createMmsId
     * @methodOf veUtils/UtilsService
     *
     * @description
     * Generate unique SysML element ID
     *
     * @returns {string} unique SysML element ID
     */
    public createMmsId() {
        let d = Date.now()
        const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
            /[xy]/g,
            (c) => {
                const r = (d + Math.random() * 16) % 16 | 0
                d = Math.floor(d / 16)
                return (c == 'x' ? r : (r & 0x3) | 0x8).toString(16)
            }
        )
        return `MMS_${Date.now()}_${uuid}`
    }

    /**
     * @ngdoc method
     * @name veUtils/UtilsService#isView
     * @methodOf veUtils/UtilsService
     *
     * @description
     * Evaluates if an given element is a view or not
     *
     * @param {Object} e element
     * @returns {boolean} boolean
     */
    public isView(e: ElementObject) {
        if (e._appliedStereotypeIds) {
            if (
                e._appliedStereotypeIds.indexOf(
                    this.schemaSvc.getSchema('VIEW_SID', this.schema) as string
                ) >= 0 ||
                e._appliedStereotypeIds.indexOf(
                    this.schemaSvc.getSchema(
                        'DOCUMENT_SID',
                        this.schema
                    ) as string
                ) >= 0
            ) {
                return true
            }
            const otherViewSids: string[] = this.schemaSvc.getSchema(
                'OTHER_VIEW_SID',
                this.schema
            ) as string[]
            for (const otherViewSid of otherViewSids) {
                if (e._appliedStereotypeIds.indexOf(otherViewSid) >= 0) {
                    return true
                }
            }
        }
        return false
    }

    /**
     * @ngdoc method
     * @name veUtils/UtilsService#isDocument
     * @methodOf veUtils/UtilsService
     *
     * @description
     * Evaluates if an given element is a document or not
     *
     * @param {Object} e element
     * @returns {boolean} boolean
     */
    public isDocument(e: ElementObject) {
        return (
            e._appliedStereotypeIds &&
            e._appliedStereotypeIds.indexOf(
                this.schemaSvc.getSchema('DOCUMENT_SID', this.schema) as string
            ) >= 0
        )
    }

    /**
     * @ngdoc method
     * @name veUtils/UtilsService#isRequirement
     * @methodOf veUtils/UtilsService
     *
     * @description
     * Evaluates if an given element is a requirement from list given above: this.REQUIREMENT_SID
     *
     * @param {Object} e element
     * @returns {boolean} boolean
     */
    public isRequirement(e: ElementObject) {
        if (e._appliedStereotypeIds) {
            const reqSids = this.schemaSvc.getSchema(
                'REQUIREMENT_SID',
                this.schema
            ) as string[]
            for (const reqSid of reqSids) {
                if (e._appliedStereotypeIds.indexOf(reqSid) >= 0) {
                    return true
                }
            }
        }
        return false
    }
}

veUtils.service('ApiService', ApiService)
