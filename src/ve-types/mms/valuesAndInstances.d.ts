import { ElementObject } from '@ve-types/mms'

//Value Specs
export interface ValueObject extends ElementObject {
    expression?: ExpressionObject
}

export interface LiteralObject<T> extends ValueObject {
    value?: T
}
export interface InstanceValueObject extends ValueObject {
    instanceId?: string
}
export interface ExpressionObject<T extends ValueObject = ValueObject>
    extends ValueObject {
    operand?: T[]
}

//Constraint
export interface ConstraintObject extends ElementObject {
    specification?: ValueObject
}

//Instances
export interface InstanceSpecObject extends ElementObject {
    classifierIds?: string[]
    specification?: ValueObject
}

export interface SlotObject extends LiteralObject<LiteralObject<unknown>[]> {
    definingFeatureId: string
}
