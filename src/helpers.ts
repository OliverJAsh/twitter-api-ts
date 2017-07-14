import * as either from 'fp-ts/lib/Either';
import * as option from 'fp-ts/lib/Option';
import * as task from 'fp-ts/lib/Task';
import fetch, { RequestInit as FetchRequestInit } from 'node-fetch';

export type Either<L, A> = either.Either<L, A>;

// These are only needed for emitting TypeScript declarations
/* tslint:disable no-unused-variable */
import * as DecodeTypes from 'decode-ts/target/types';
import { Response as FetchResponse } from 'node-fetch';
import { APIErrorResponseErrorResponse } from './types';
/* tslint:enable no-unused-variable */

import {
    ErrorResponse,
    Response,
    SerializedStatuesHomeTimelineQuery,
    StatuesHomeTimelineQuery,
} from './types';

export const createErrorResponse = <T>(errorResponse: ErrorResponse): Response<T> =>
    either.left<ErrorResponse, T>(errorResponse);

export const nullableNullToUndefined = <T>(maybeT: T | null): T | undefined =>
    maybeT === null ? undefined : maybeT;

export const serializeStatuesHomeTimelineQuery = (
    query: StatuesHomeTimelineQuery,
): SerializedStatuesHomeTimelineQuery => ({
    count: nullableNullToUndefined(query.count.toNullable()),
    ...query.maybeMaxId
        .map((maxId): Pick<SerializedStatuesHomeTimelineQuery, 'max_id'> => ({ max_id: maxId }))
        .getOrElse(() => ({})),
});

export const fetchTask = (url: string, init?: FetchRequestInit) =>
    new task.Task(() => fetch(url, init));

export const typecheck = <A>(a: A) => a;

// Defaults

export const defaultOAuthOptions = {
    verifier: option.none,
    token: option.none,
    tokenSecret: option.none,
};
