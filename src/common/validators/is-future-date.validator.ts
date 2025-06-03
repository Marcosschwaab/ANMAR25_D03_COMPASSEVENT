import { ValidatorConstraint, ValidatorConstraintInterface, ValidationOptions, registerDecorator } from 'class-validator';

@ValidatorConstraint({ async: false })
export class IsFutureDateConstraint implements ValidatorConstraintInterface {
  validate(dateString: string) { 
    const date = new Date(dateString);
    return date > new Date();
  }

  defaultMessage() {
    return 'Date must be in the future.';
  }
}

export function IsFutureDate(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsFutureDateConstraint,
    });
  };
}