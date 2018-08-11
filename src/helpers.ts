import * as either from 'fp-ts/lib/Either';
import * as option from 'fp-ts/lib/Option';

// These are only needed for emitting TypeScript declarations
/* tslint:disable no-unused-variable */
// @ts-ignore
import {
    ValidationError,
    TypeOfProps,
    ArrayType,
    InterfaceType,
    NumberType,
    StringType,
} from 'io-ts';
/* tslint:enable no-unused-variable */

// tslint:disable-next-line no-duplicate-imports
import { ErrorResponse, OAuthOptions, Response, StatusesHomeTimelineQueryT } from './types';

export const createErrorResponse = <T>(errorResponse: ErrorResponse): Response<T> =>
    either.left(errorResponse);

export const typecheck = <A>(a: A) => a;

// Defaults

export const defaultOAuthOptions: Pick<
    OAuthOptions,
    'callback' | 'verifier' | 'token' | 'tokenSecret'
> = {
    callback: option.none,
    verifier: option.none,
    token: option.none,
    tokenSecret: option.none,
};

export const defaultStatusesHomeTimelineQuery: Pick<
    StatusesHomeTimelineQueryT,
    'count' | 'max_id'
> = {
    count: option.none,
    max_id: option.none,
};
