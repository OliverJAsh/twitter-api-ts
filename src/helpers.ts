import * as either from 'fp-ts/lib/Either';
import { Lazy } from 'fp-ts/lib/function';
import * as option from 'fp-ts/lib/Option';
import * as task from 'fp-ts/lib/Task';
import * as fetch from 'node-fetch';

import Task = task.Task;
import Either = either.Either;

// These are only needed for emitting TypeScript declarations
/* tslint:disable no-unused-variable */
import * as DecodeTypes from 'decode-ts/target/types';
import { Response as FetchResponse } from 'node-fetch';
import {
    APIErrorResponseErrorResponse,
    DecodeErrorErrorResponse,
    JavaScriptErrorErrorResponse,
} from './types';
/* tslint:enable no-unused-variable */

import {
    ErrorResponse,
    Response,
    SerializedStatusesHomeTimelineQuery,
    StatusesHomeTimelineQuery,
} from './types';

export const createErrorResponse = <T>(errorResponse: ErrorResponse): Response<T> =>
    either.left(errorResponse);

export const nullableNullToUndefined = <T>(maybeT: T | null): T | undefined =>
    maybeT === null ? undefined : maybeT;

export const serializeStatusesHomeTimelineQuery = (
    query: StatusesHomeTimelineQuery,
): SerializedStatusesHomeTimelineQuery => ({
    count: nullableNullToUndefined(query.count.toNullable()),
    ...query.maybeMaxId
        .map((maxId): Pick<SerializedStatusesHomeTimelineQuery, 'max_id'> => ({ max_id: maxId }))
        .getOrElse(() => ({})),
});

export function eitherTryCatchAsync<E, A>(f: Lazy<Promise<A>>): Promise<Either<E, A>> {
    try {
        return f().then(a => either.right<E, A>(a), e => either.left<E, A>(e));
    } catch (e) {
        return Promise.resolve(either.left<E, A>(e));
    }
}

export type fetchPromiseEither = (
    url: string,
    init?: fetch.RequestInit,
) => Promise<Either<Error, fetch.Response>>;
export const fetchPromiseEither: fetchPromiseEither = (url, init) =>
    eitherTryCatchAsync(() => fetch.default(url, init));

export type fetchTaskEither = (
    url: string,
    init?: fetch.RequestInit,
) => Task<Either<Error, fetch.Response>>;
export const fetchTaskEither: fetchTaskEither = (url, init) =>
    new Task(() => fetchPromiseEither(url, init));

export const typecheck = <A>(a: A) => a;

// Defaults

export const defaultOAuthOptions = {
    verifier: option.none,
    token: option.none,
    tokenSecret: option.none,
};

export const defaultStatusesHomeTimelineQuery = {
    count: option.none,
    maybeMaxId: option.none,
};
