/**
 * Custom Validation Pipe
 * 
 * Enhanced validation with Dutch error messages.
 */

import {
    PipeTransform,
    Injectable,
    ArgumentMetadata,
    BadRequestException,
} from '@nestjs/common';
import { validate, ValidationError } from 'class-validator';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class CustomValidationPipe implements PipeTransform<any> {
    async transform(value: any, { metatype }: ArgumentMetadata) {
        if (!metatype || !this.toValidate(metatype)) {
            return value;
        }

        const object = plainToInstance(metatype, value);
        const errors = await validate(object, {
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        });

        if (errors.length > 0) {
            const formattedErrors = this.formatErrors(errors);
            throw new BadRequestException({
                message: 'Validatiefout',
                errors: formattedErrors,
            });
        }

        return object;
    }

    private toValidate(metatype: Function): boolean {
        const types: Function[] = [String, Boolean, Number, Array, Object];
        return !types.includes(metatype);
    }

    private formatErrors(errors: ValidationError[]): Record<string, string[]> {
        const result: Record<string, string[]> = {};

        for (const error of errors) {
            const field = error.property;
            const messages = this.getConstraintMessages(error);

            if (result[field]) {
                result[field].push(...messages);
            } else {
                result[field] = messages;
            }

            // Handle nested errors
            if (error.children && error.children.length > 0) {
                const nestedErrors = this.formatErrors(error.children);
                for (const [nestedField, nestedMessages] of Object.entries(nestedErrors)) {
                    const key = `${field}.${nestedField}`;
                    result[key] = nestedMessages;
                }
            }
        }

        return result;
    }

    private getConstraintMessages(error: ValidationError): string[] {
        if (!error.constraints) {
            return [];
        }

        return Object.values(error.constraints).map(msg => this.translateMessage(msg));
    }

    /**
     * Translate common validation messages to Dutch
     */
    private translateMessage(message: string): string {
        const translations: Record<string, string> = {
            'should not be empty': 'mag niet leeg zijn',
            'must be a string': 'moet tekst zijn',
            'must be a number': 'moet een nummer zijn',
            'must be an integer': 'moet een geheel getal zijn',
            'must be a positive number': 'moet een positief nummer zijn',
            'must be an email': 'moet een geldig e-mailadres zijn',
            'must be a valid enum value': 'moet een geldige waarde zijn',
            'must be shorter than': 'mag niet langer zijn dan',
            'must be longer than': 'moet langer zijn dan',
            'must contain at least': 'moet minimaal bevatten',
            'must not be greater than': 'mag niet groter zijn dan',
            'must not be less than': 'mag niet kleiner zijn dan',
            'must be a boolean value': 'moet waar of onwaar zijn',
            'must be an array': 'moet een lijst zijn',
            'must be a valid UUID': 'moet een geldige ID zijn',
            'must be a valid date': 'moet een geldige datum zijn',
        };

        for (const [english, dutch] of Object.entries(translations)) {
            if (message.toLowerCase().includes(english.toLowerCase())) {
                return message.replace(new RegExp(english, 'gi'), dutch);
            }
        }

        return message;
    }
}
