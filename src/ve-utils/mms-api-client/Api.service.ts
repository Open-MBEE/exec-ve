import _ from 'lodash';
import * as uuid from 'uuid';

import { URLService } from '@ve-utils/mms-api-client/URL.service';
import { SchemaService } from '@ve-utils/model-schema';

import { veUtils } from '@ve-utils';

import { VePromise, VePromiseReason, VeQService } from '@ve-types/angular';
import { VeConfig } from '@ve-types/config';
import {
    BasicResponse,
    ElementObject,
    ElementsRequest,
    ExpressionObject,
    InstanceSpecObject,
    LiteralObject,
    MmsObject,
    RequestObject,
    ValueObject,
    VersionResponse,
    ViewObject,
} from '@ve-types/mms';

export class ApiService {
    private editKeys = [
        'name',
        'documentation',
        'defaultValue',
        'value',
        'valueIds',
        'specification',
        'id',
        '_projectId',
        '_refId',
        'type',
    ];

    schema: string = 'cameo';

    public veConfig: VeConfig = window.__env;

    static $inject = ['$q', '$http', 'URLService', 'SchemaService'];

    constructor(
        private $q: VeQService,
        private $http: angular.IHttpService,
        private uRLSvc: URLService,
        private schemaSvc: SchemaService
    ) {}

    public getMmsVersion(): VePromise<string, VersionResponse> {
        const deferred = this.$q.defer<string>();
        this.$http.get<VersionResponse>(this.uRLSvc.getMmsVersionURL()).then(
            (response) => {
                deferred.resolve(response.data.mmsVersion);
            },
            (response: angular.IHttpResponse<VersionResponse>) => {
                deferred.reject(this.uRLSvc.handleHttpStatus(response));
            }
        );
        return deferred.promise;
    }

    public getVeVersion = (): string => {
        return this.veConfig.version;
    };

    /**
     * @name veUtils/ApiService#handleErrorCallback
     *
     * @param {angular.IHttpResponse<T>} response
     * @param {angular.IDeferred<U>} deferredOrReject
     * @param {} type
     */
    public handleErrorCallback<T extends MmsObject, U = BasicResponse<T>>(
        response: angular.IHttpResponse<U>,
        deferredOrReject: angular.IDeferred<U> | angular.IQResolveReject<VePromiseReason<U>>,
        type?: 'error' | 'warning' | 'info'
    ): void {
        const res = this.uRLSvc.handleHttpStatus<T, U>(response);
        if (type) {
            res.type = type;
        }
        if ((deferredOrReject as angular.IDeferred<U>).reject) {
            (deferredOrReject as angular.IDeferred<U>).reject(res);
        } else {
            (deferredOrReject as angular.IQResolveReject<VePromiseReason<U>>)(res);
        }
    }

    /**
     * @name veUtils/UtilsService#_cleanValueSpec
     * Cleans value specification
     *
     * @param {Object} vs value spec object
     * @returns {void} nothing
     */

    private _cleanValueSpec = (vs: ValueObject): void => {
        if (vs.hasOwnProperty('valueExpression')) delete vs.valueExpression;
        if (vs.operand && Array.isArray(vs.operand)) {
            for (let i = 0; i < vs.operand.length; i++) {
                this._cleanValueSpec(vs.operand[i] as ValueObject);
            }
        }
    };

    /**
     * @name veUtils/UtilsService#cleanElement
     * Cleans
     *
     * @param {ElementObject} elem the element object to be cleaned
     * @param {boolean} [forEdit=false] (optional) forEdit.
     * @returns {ElementObject} clean elem
     */
    public cleanElement<T extends ElementObject>(elem: T, forEdit?: boolean): T {
        if (elem.type === 'Property' || elem.type === 'Port') {
            if (!elem.defaultValue) {
                elem.defaultValue = null;
            }
        }
        if (elem.type === 'Slot') {
            if (!Array.isArray(elem.value)) (elem as LiteralObject<unknown[]>).value = [];
        }
        if (elem.value && Array.isArray(elem.value)) {
            (elem as LiteralObject<unknown[]>).value.forEach((value: unknown) => {
                if (typeof value === 'object' && value !== null)
                    this._cleanValueSpec(value as ExpressionObject<ValueObject>);
            });
        }
        if (elem._contents) {
            this._cleanValueSpec((elem as ViewObject)._contents);
        }
        if (elem.specification) {
            this._cleanValueSpec((elem as InstanceSpecObject).specification);
        }
        if (elem.type === 'Class') {
            if (elem._contents && elem.contains) {
                delete elem.contains;
            }
            if (elem._allowedElementIds) {
                delete elem._allowedElementIds;
            }
        }

        if (elem.hasOwnProperty('specialization')) {
            delete elem.specialization;
        }
        if (!elem.hasOwnProperty('appliedStereotypeIds') && elem._appliedStereotypeIds) {
            elem.appliedStereotypeIds = elem._appliedStereotypeIds;
        }
        if (forEdit) {
            //only keep editable or needed keys in edit object instead of everything
            const keys = Object.keys(elem);
            keys.forEach((key) => {
                if (this.editKeys.indexOf(key) >= 0) {
                    return;
                }
                delete elem[key];
            });
        }
        return elem;
    }

    /**
     * @name veUtils/UtilsService#normalize
     * Normalize common arguments
     *
     * @param {RequestObject} reqOb
     * @returns {RequestObject} with default values for ref and commit
     */
    public normalize = (reqOb: RequestObject): RequestObject => {
        reqOb.refId = !reqOb.refId ? 'master' : reqOb.refId;
        reqOb.commitId = !reqOb.commitId ? 'latest' : reqOb.commitId;
        return reqOb;
    };

    /**
     * @name veUtils/UtilsService#makeRequestObject
     * Make a request object out of an ElementObject
     *
     * @param {ElementObject} elementOb
     * @returns {RequestObject}
     */
    public makeRequestObject = (elementOb: ElementObject): RequestObject => {
        return {
            projectId: elementOb._projectId,
            refId: elementOb._refId,
            commitId: elementOb._commitId,
        };
    };

    /**
     * @name veUtils/UtilsService#makeElementRequestObject
     * Make a single element request object out of an ElementObject
     *
     * @param {ElementObject} elementOb
     * @returns {ElementsRequest}
     */
    public makeElementRequestObject(elementOb: ElementObject): ElementsRequest<string> {
        return {
            elementId: elementOb.id,
            projectId: elementOb._projectId,
            refId: elementOb._refId,
            commitId: elementOb._commitId,
        };
    }

    /**
     * @name veUtils/UtilsService#makeCacheKey
     * Make key for element for use in CacheService
     *
     * @param {RequestObject | null} reqOb request object
     * @param elementId
     * @param type
     * @param {boolean} [edit=false] element is to be edited
     * @returns {Array} key to be used in CacheService
     */
    public makeCacheKey(reqOb: RequestObject | null, elementId: string, edit?: boolean, type?: string): string[] {
        const key: string[] = [];
        const keyType: string = type ? type : 'element';
        key.push(keyType);
        if (reqOb !== null) {
            if (reqOb.projectId) key.push(reqOb.projectId);
            if (reqOb.refId !== null) key.push(!reqOb.refId ? 'master' : reqOb.refId);
            if (!keyType.includes('history') && reqOb.commitId !== null)
                key.push(!reqOb.commitId ? 'latest' : reqOb.commitId);
        }
        if (elementId !== '') key.push(elementId);
        if (edit) key.push('edit');
        return key;
    }

    /**
     * @name veUtils/UtilsService#filterProperties
     * given element object a and element object b,
     * returns new object with b data minus keys not in a
     * (set notation A intersect B)
     *
     * @param {Object} a Element Object
     * @param {Object} b Element Object
     * @returns {Object} new object
     */
    // public filterProperties(a: ElementObject, b: ElementObject): ElementObject {
    //     const res: ElementObject = null
    //     for (const key in a) {
    //         if (a.hasOwnProperty(key) && b.hasOwnProperty(key)) {
    //             res[key] = b[key]
    //         }
    //     }
    //     return res
    // }

    /**
     * @name veUtils/UtilsService#hasConflict
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
    public hasConflict = (edit: ElementObject, orig: ElementObject, server: ElementObject): boolean => {
        for (const i in edit) {
            if (
                i === '_read' ||
                i === '_modified' ||
                i === '_modifier' ||
                i === '_creator' ||
                i === '_created' ||
                i === '_commitId'
            ) {
                continue;
            }
            if (edit.hasOwnProperty(i) && orig.hasOwnProperty(i) && server.hasOwnProperty(i)) {
                if (!_.isEqual(orig[i], server[i])) {
                    return true;
                }
            }
        }
        return false;
    };

    /**
     * @name veUtils/UtilsService#isRestrictedValue
     * deprecated
     *
     * @param {string} table table content
     * @returns {boolean} boolean
     */
    // public isRestrictedValue(values: ExpressionObject[]) {
    //     if (
    //         values.length > 0 &&
    //         values[0].type === 'Expression' &&
    //         values[0].operand &&
    //         values[0].operand.length === 3 &&
    //         values[0].operand[0].value === 'RestrictedValue' &&
    //         values[0].operand[2].type === 'Expression' &&
    //         values[0].operand[2].operand &&
    //         Array.isArray(values[0].operand[2].operand) &&
    //         values[0].operand[2].operand.length > 0 &&
    //         values[0].operand[1].type === 'ElementValue'
    //     ) {
    //         return true
    //     }
    //     return false
    // }

    /**
     * @name veUtils/ApiService#createUUID
     *
     * Alias for the currently adopted UUID standard for View Editor/MMS
     *
     */
    public createUUID = (): string => {
        return uuid.v4();
    };

    /**
     * @name veUtils/UtilsService#createUniqueId
     * Generate unique SysML element ID
     *
     * @returns {string} unique SysML element ID
     */
    public createUniqueId = (): string => {
        return `ve-${this.getVeVersion().replace(/\./g, '-')}-${this.createUUID()}`;
    };

    /**
     * @name veUtils/UtilsService#isView
     * Evaluates if an given element is a view or not
     *
     * @param {Object} e element
     * @returns {boolean} boolean
     */
    public isView = (e: ElementObject): boolean => {
        if (e.appliedStereotypeIds) {
            if (
                e.appliedStereotypeIds.indexOf(this.schemaSvc.getSchema('VIEW_SID', this.schema)) >= 0 ||
                e.appliedStereotypeIds.indexOf(this.schemaSvc.getSchema('DOCUMENT_SID', this.schema)) >= 0
            ) {
                return true;
            }
            const otherViewSids: string[] = this.schemaSvc.getSchema('OTHER_VIEW_SID', this.schema);
            for (const otherViewSid of otherViewSids) {
                if (e.appliedStereotypeIds.indexOf(otherViewSid) >= 0) {
                    return true;
                }
            }
        }
        return false;
    };

    /**
     * @name veUtils/UtilsService#isDocument
     * Evaluates if an given element is a document or not
     *
     * @param {Object} e element
     * @returns {boolean} boolean
     */
    public isDocument = (e: ElementObject): boolean => {
        return (
            e.appliedStereotypeIds &&
            e.appliedStereotypeIds.indexOf(this.schemaSvc.getSchema('DOCUMENT_SID', this.schema)) >= 0
        );
    };

    /**
     * @name veUtils/UtilsService#isRequirement
     * Evaluates if an given element is a requirement from list given above: this.REQUIREMENT_SID
     *
     * @param {Object} e element
     * @returns {boolean} boolean
     */
    public isRequirement = (e: ElementObject): boolean => {
        if (e.appliedStereotypeIds) {
            const reqSids = this.schemaSvc.getSchema<string[]>('REQUIREMENT_SID', this.schema);
            for (const reqSid of reqSids) {
                if (e.appliedStereotypeIds.indexOf(reqSid) >= 0) {
                    return true;
                }
            }
        }
        return false;
    };
}

veUtils.service('ApiService', ApiService);
