import * as either from 'fp-ts/lib/Either';
import * as task from 'fp-ts/lib/Task';
import * as t from 'io-ts';
import fetch, { RequestInit as FetchRequestInit } from 'node-fetch';

// These are only needed for emitting TypeScript declarations
/* tslint:disable no-unused-variable */
import { Response as FetchResponse } from 'node-fetch';
import { APIErrorResponseErrorResponse } from './types';
/* tslint:enable no-unused-variable */

import {
    ErrorResponse,
    Response,
    SerializedTimelineQueryParams,
    TimelineQueryParams,
    ValidationErrorsErrorResponse,
} from './types';

export const createErrorResponse = <T>(
    errorResponse: ErrorResponse,
): Response<T> => (
    either.left<ErrorResponse, T>(errorResponse)
);

export const createSuccessResponse = <T>(
    successResponse: T,
): Response<T> => (
    either.right<ErrorResponse, T>(successResponse)
);

const validationResultToResponse = (
    statusCode: number,
) => <T>(
    validationResult: t.Validation<T>,
): Response<T> => (
    validationResult.mapLeft(validationErrors => (
        new ValidationErrorsErrorResponse(
            statusCode,
            validationErrors,
        )
    ))
);

export const validate = <T>(
    statusCode: number,
    type: t.Type<T>,
) => (
    value: T,
): Response<T> => (
    validationResultToResponse(statusCode)(t.validate(value, type))
);

export const serializeTimelineQueryParams = (
    params: TimelineQueryParams,
): SerializedTimelineQueryParams => (
    {
        count: params.count,
        ...(
            params.maybeMaxId
                .map((maxId): Partial<SerializedTimelineQueryParams> => ({ max_id: maxId }))
                .getOrElse(() => ({}))
        ),
    }
);

export const fetchTask = (url: string, init?: FetchRequestInit) => (
    new task.Task(() => fetch(url, init))
);

export const nullableNullToUndefined = <T>(maybeT: T | null): T | undefined => (
    maybeT === null
        ? undefined
        : maybeT
);
