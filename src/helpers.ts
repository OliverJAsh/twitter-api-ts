import * as either from 'fp-ts/lib/Either';
import * as task from 'fp-ts/lib/Task';
import * as t from 'io-ts';
import fetch, { RequestInit as FetchRequestInit } from 'node-fetch';

export type Either<L, A> = either.Either<L, A>;

// These are only needed for emitting TypeScript declarations
/* tslint:disable no-unused-variable */
import { Response as FetchResponse } from 'node-fetch';
import { APIErrorResponseErrorResponse } from './types';
/* tslint:enable no-unused-variable */

import {
    ErrorResponse,
    ParsingErrorErrorResponse,
    Response,
    SerializedTimelineQueryParams,
    TimelineQueryParams,
    ValidationErrorsErrorResponse,
} from './types';

export const createErrorResponse = <T>(errorResponse: ErrorResponse): Response<T> => (
    either.left<ErrorResponse, T>(errorResponse)
);

export const serializeTimelineQueryParams = (
    params: TimelineQueryParams,
): SerializedTimelineQueryParams => ({
    count: params.count,
    ...params.maybeMaxId
        .map((maxId): Pick<SerializedTimelineQueryParams, 'max_id'> => ({ max_id: maxId }))
        .getOrElse(() => ({})),
});

export const fetchTask = (url: string, init?: FetchRequestInit) => (
    new task.Task(() => fetch(url, init))
);

export const nullableNullToUndefined = <T>(maybeT: T | null): T | undefined => (
    maybeT === null ? undefined : maybeT
);

export const typecheck = <A>(a: A) => a;

type jsonParse = (jsonString: string) => Either<ParsingErrorErrorResponse, any>;
const jsonParse: jsonParse = jsonString => (
    either.tryCatch(() => JSON.parse(jsonString))
        .mapLeft(error => new ParsingErrorErrorResponse(500, jsonString, error.message))
);

export type validateType = (
    <A>(type: t.Type<A>) => (value: any) => Either<ValidationErrorsErrorResponse, A>
);
export const validateType: validateType = type => value => (
    t.validate(value, type)
        .mapLeft(validationErrors => new ValidationErrorsErrorResponse(500, validationErrors))
);

export type JsonDecodeError = ParsingErrorErrorResponse | ValidationErrorsErrorResponse;

export type jsonDecodeString = (
    <A>(type: t.Type<A>) => (value: string) => Either<JsonDecodeError, A>
);
export const jsonDecodeString: jsonDecodeString = type => value => (
    // Widen Left generic
    typecheck<Either<JsonDecodeError, any>>(jsonParse(value)).chain(validateType(type))
);
