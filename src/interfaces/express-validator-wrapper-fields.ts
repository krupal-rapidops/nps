export interface ExpressValidatorWrapperFields {
    name: string,
    query?: boolean,
    param?: boolean,
    mandatory?: boolean,
    nullable?: boolean,
    ifCondition?: any,
    ifConditions?: any[],
    minLength?: number,
    maxLength?: number,
    min?: number,
    max?: number,
    message: string,
    customValidators?: any[]
}

