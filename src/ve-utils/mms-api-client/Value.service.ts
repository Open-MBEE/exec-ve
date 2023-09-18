import _ from 'lodash';

import { EditObject } from '@ve-utils/core';
import { ApiService } from '@ve-utils/mms-api-client/Api.service';
import { ElementService } from '@ve-utils/mms-api-client/Element.service';
import { ValueSpec } from '@ve-utils/utils';

import { PropertySpec } from '@ve-components';

import { veUtils } from '@ve-utils';

import { VePromise, VeQService } from '@ve-types/angular';
import {
    ConstraintObject,
    ElementObject,
    ElementsRequest,
    ElementTaggedValueObject,
    ElementValueObject,
    ExpressionObject,
    InstanceValueObject,
    LiteralObject,
    SlotObject,
    TaggedValueObject,
    ValueObject,
} from '@ve-types/mms';

export class ValueService {
    private valueTypes: { [type: string]: string } = {
        property: 'defaultValue',
        port: 'defaultValue',
        slot: 'value',
        constraint: 'specification',
    };

    public addValueTypes: { [primitiveType: string]: string } = {
        string: 'LiteralString',
        boolean: 'LiteralBoolean',
        integer: 'LiteralInteger',
        real: 'LiteralReal',
    };

    private taggedValue: string = 'value';
    static $inject = ['$q', 'ApiService', 'ElementService'];

    constructor(private $q: VeQService, private apiSvc: ApiService, private elementSvc: ElementService) {}
    public addValue = (editOb: EditObject, type: string): LiteralObject<unknown> => {
        const edit = editOb.element;
        let newValueSpec: ValueSpec;
        let elementOb: LiteralObject<unknown> = {
            id: '',
            _projectId: edit._projectId,
            _refId: edit._refId,
            type: '',
        };
        switch (type) {
            case 'LiteralBoolean': {
                elementOb = Object.assign(elementOb, {
                    type: type,
                    value: false,
                    id: this.apiSvc.createUniqueId(),
                    ownerId: edit.id,
                });
                newValueSpec = new ValueSpec(elementOb);
                break;
            }
            case 'LiteralInteger': {
                elementOb = Object.assign(elementOb, {
                    type: type,
                    value: 0,
                    id: this.apiSvc.createUniqueId(),
                    ownerId: edit.id,
                });
                newValueSpec = new ValueSpec(elementOb);
                break;
            }
            case 'LiteralString': {
                elementOb = Object.assign(elementOb, {
                    type: type,
                    value: '',
                    id: this.apiSvc.createUniqueId(),
                    ownerId: edit.id,
                });
                newValueSpec = new ValueSpec(elementOb);
                break;
            }
            case 'LiteralReal': {
                elementOb = Object.assign(elementOb, {
                    type: type,
                    value: 0.0,
                    id: this.apiSvc.createUniqueId(),
                    ownerId: edit.id,
                });
                newValueSpec = new ValueSpec(elementOb);
                break;
            }
            default: {
                elementOb = Object.assign(elementOb, {
                    type: type,
                    value: {},
                    id: this.apiSvc.createUniqueId(),
                    ownerId: edit.id,
                });
            }
        }

        if (edit.type == 'Property' || edit.type == 'Port') {
            edit.defaultValue = newValueSpec;
        }
        return newValueSpec;
    };

    public addEnumerationValue = (
        propertySpec: PropertySpec,
        editOb: EditObject
    ): InstanceValueObject | ElementValueObject => {
        const elementOb = editOb.element;
        let newValueSpec: InstanceValueObject | ElementValueObject = new ValueSpec({
            type: 'InstanceValue',
            instanceId: propertySpec.options[0],
            _projectId: elementOb._projectId,
            _refId: elementOb._refId,
            id: this.apiSvc.createUniqueId(),
            ownerId: elementOb.id,
        });
        if (propertySpec.isTaggedValue) {
            newValueSpec = new ValueSpec({
                type: 'ElementValue',
                elementId: propertySpec.options[0],
                _projectId: elementOb._projectId,
                _refId: elementOb._refId,
                id: this.apiSvc.createUniqueId(),
                ownerId: elementOb.id,
            });
        }
        return newValueSpec;
    };

    public getValues(elementOb: ElementObject): ValueObject[] {
        if (elementOb.type === 'Property' || elementOb.type === 'Port') {
            if (elementOb.defaultValue) {
                return [elementOb.defaultValue] as ValueObject[];
            } else {
                return [];
            }
        }
        if (elementOb.type === 'Slot') {
            return (elementOb as SlotObject).value;
        }
        if (elementOb.type === 'Constraint' && elementOb.specification) {
            return [(elementOb as ConstraintObject).specification];
        }
        if (elementOb.type === 'Expression') {
            return (elementOb as ExpressionObject<ValueObject>).operand;
        }
        const i = elementOb.type.indexOf('TaggedValue');
        if (i > 0) {
            let spoofType = '';
            const type = elementOb.type.slice(0, i);
            if (type === 'Element') {
                spoofType = 'ElementValue';
                elementOb.value = [];
                for (const [index, val] of (elementOb as ElementTaggedValueObject).valueIds.entries()) {
                    (elementOb as ElementTaggedValueObject).value.push({
                        id: `${elementOb.id}-slotvalue-${index}-elementvalue`,
                        type: spoofType,
                        elementId: val,
                        _projectId: elementOb._projectId,
                        _refId: elementOb._refId,
                    } as ElementValueObject);
                }
            } else {
                spoofType = `Literal${type}`;
                for (const val of (elementOb as TaggedValueObject).value) {
                    val.type = spoofType;
                }
            }
            return (elementOb as TaggedValueObject).value;
        }
    }

    /**
     * @name Utils#isEnumeration
     * Check if element is enumeration and if true get enumerable options
     *
     * @param {object} elementOb element object
     * @return {Promise} promise would be resolved with options and if object is enumerable.
     *      For unsuccessful saves, it will be rejected with an object with reason.
     */
    public isEnumeration(elementOb: ElementObject): VePromise<PropertySpec> {
        const deferred = this.$q.defer<PropertySpec>();
        if (elementOb.type === 'Enumeration') {
            const isEnumeration = true;
            const reqOb: ElementsRequest<string> = {
                elementId: elementOb.id,
                projectId: elementOb._projectId,
                refId: elementOb._refId,
            };
            const query = {
                params: {
                    ownerId: elementOb.id,
                },
            };
            this.elementSvc.search<ElementObject>(reqOb, query).then(
                (val) => {
                    const newArray: ElementObject[] = [];
                    // Filter for enumeration type
                    for (let i = 0; i < val.elements.length; i++) {
                        if (val.elements[i].type === 'EnumerationLiteral') {
                            newArray.push(val.elements[i]);
                        }
                    }
                    newArray.sort((a, b) => {
                        return a.name.localeCompare(b.name);
                    });
                    deferred.resolve({
                        options: newArray,
                        isEnumeration: isEnumeration,
                    });
                },
                (reason) => {
                    deferred.reject(reason);
                }
            );
        } else {
            deferred.resolve({ options: [], isEnumeration: false });
        }
        return deferred.promise;
    }

    public isValue(elementOb: ElementObject): boolean {
        const type = elementOb.type;
        return Object.keys(this.valueTypes).includes(type.toLowerCase()) || this.isTaggedValue(elementOb);
    }

    public isTaggedValue(elementOb: ElementObject): boolean {
        return elementOb.type.endsWith('TaggedValue');
    }

    public hasValue(elementOb: ElementObject): boolean {
        return (
            this.isValue(elementOb) &&
            // Check if Property/Port have defaultValues that are not just empty
            ((elementOb.defaultValue && Object.keys(elementOb.defaultValue).length !== 0) ||
                // Check if Constraints have specifications that are not just empty
                (elementOb.specification && Object.keys((elementOb as ConstraintObject).specification).length !== 0) ||
                // Check if Slots and Tagged Values have any entries
                (elementOb.value && (elementOb as LiteralObject<LiteralObject<unknown>[]>).value.length > 0))
        );
    }

    public isEqual(a: ElementObject, b: ElementObject): boolean {
        if (this.valueTypes[a.type.toLowerCase()]) {
            return _.isEqual(a[this.valueTypes[a.type.toLowerCase()]], b[this.valueTypes[a.type.toLowerCase()]]);
        } else if (this.isTaggedValue(a)) {
            return _.isEqual(a[this.taggedValue], b[this.taggedValue]);
        }
    }

    public getPropertySpec(elementOb: ElementObject): VePromise<PropertySpec> {
        const deferred = this.$q.defer<PropertySpec>();
        let id: string = elementOb.typeId;
        let isSlot = false;
        let isEnumeration = false;
        let isTaggedValue = false;
        let options: ElementObject[] = [];
        if (elementOb.type === 'Slot') {
            isSlot = true;
            id = (elementOb as SlotObject).definingFeatureId;
        }
        if (elementOb.type.includes('TaggedValue')) {
            isTaggedValue = true;
            id = (elementOb as TaggedValueObject).tagDefinitionId;
        }
        if (!id) {
            //no property type, will not be enum
            deferred.resolve({ options, isEnumeration, isSlot, isTaggedValue });
            return deferred.promise;
        }
        // Get defining feature or type info
        const reqOb = {
            elementId: id,
            projectId: elementOb._projectId,
            refId: elementOb._refId,
        };
        this.elementSvc.getElement(reqOb).then(
            (value) => {
                if (isSlot || isTaggedValue) {
                    if (!value.typeId) {
                        deferred.resolve({ options, isEnumeration, isSlot, isTaggedValue });
                        return;
                    }
                    //if it is a slot or tagged value check if the definition type is enumeration
                    reqOb.elementId = value.typeId;
                    this.elementSvc.getElement(reqOb).then(
                        (val) => {
                            this.isEnumeration(val).then(
                                (enumValue: PropertySpec) => {
                                    if (enumValue.isEnumeration) {
                                        isEnumeration = enumValue.isEnumeration;
                                        options = enumValue.options;
                                    }
                                    deferred.resolve({ options, isEnumeration, isSlot, isTaggedValue });
                                },
                                () => {
                                    deferred.resolve({ options, isEnumeration, isSlot, isTaggedValue });
                                }
                            );
                        },
                        () => {
                            deferred.resolve({ options, isEnumeration, isSlot, isTaggedValue });
                        }
                    );
                } else {
                    this.isEnumeration(value).then(
                        (enumValue) => {
                            if (enumValue.isEnumeration) {
                                isEnumeration = enumValue.isEnumeration;
                                options = enumValue.options;
                            }
                            deferred.resolve({ options, isEnumeration, isSlot, isTaggedValue });
                        },
                        (reason) => {
                            deferred.reject(reason);
                        }
                    );
                }
            },
            (reason) => {
                deferred.resolve({ options, isEnumeration, isSlot, isTaggedValue });
            }
        );
        return deferred.promise;
    }
}

veUtils.service('ValueService', ValueService);
