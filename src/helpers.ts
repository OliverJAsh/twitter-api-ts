import * as either from 'fp-ts/lib/Either';
import * as option from 'fp-ts/lib/Option';

// These are only needed for emitting TypeScript declarations
/* tslint:disable no-unused-variable */
import * as DecodeTypes from 'decode-ts/target/types';
import { Response as FetchResponse } from 'node-fetch';
/* tslint:enable no-unused-variable */

// tslint:disable-next-line no-duplicate-imports
import {
    ErrorResponse,
    OAuthOptions,
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
        .getOrElseL(() => ({})),
});

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
    StatusesHomeTimelineQuery,
    'count' | 'maybeMaxId'
> = {
    count: option.none,
    maybeMaxId: option.none,
};
