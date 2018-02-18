import * as Decode from 'decode-ts/target';
import * as either from 'fp-ts/lib/Either';
import * as task from 'fp-ts/lib/Task';
import * as fetch from 'node-fetch';
import { getOAuthAuthorizationHeader } from 'oauth-authorization-header';
import * as querystring from 'querystring';

import Either = either.Either;
import Task = task.Task;

import { ENDPOINTS, TWITTER_API_BASE_URL } from './constants';
import {
    createErrorResponse,
    defaultOAuthOptions,
    defaultStatusesHomeTimelineQuery,
    nullableNullToUndefined,
    serializeStatusesHomeTimelineQuery,
    typecheck,
} from './helpers';
import { fetchTaskEither } from './helpers/fetch';
import {
    AccessTokenResponse,
    AccountVerifyCredentialsResponse,
    ErrorResponse,
    OAuthOptions,
    OAuthOptionsInput,
    RequestMethod,
    RequestTokenResponse,
    Response,
    StatusesHomeTimelineQuery,
    StatusesHomeTimelineQueryInput,
    TimelineResponse,
    TwitterAPIAccessTokenResponse,
    TwitterAPIAccountVerifyCredentials,
    TwitterAPIErrorResponse,
    TwitterAPIErrorResponseT,
    TwitterAPIRequestTokenResponse,
    TwitterAPITimelineResponse,
} from './types';

// These are only needed for emitting TypeScript declarations
/* tslint:disable no-unused-variable */
// tslint:disable-next-line no-duplicate-imports
import { Left, Right } from 'fp-ts/lib/Either';
import { InterfaceType, Type } from 'io-ts';
// tslint:disable-next-line no-duplicate-imports
import * as t from 'io-ts';
/* tslint:enable no-unused-variable */

export type fetchFromTwitter = (
    args: {
        oAuth: OAuthOptionsInput;
        endpointPath: ENDPOINTS;
        method: RequestMethod;
        query: {};
    },
) => Task<Either<ErrorResponse, fetch.Response>>;
export const fetchFromTwitter: fetchFromTwitter = ({ oAuth, endpointPath, method, query }) => {
    const oAuthWithDefaults: OAuthOptions = { ...defaultOAuthOptions, ...oAuth };

    const baseUrl = `${TWITTER_API_BASE_URL}${endpointPath}`;
    const paramsStr = Object.keys(query).length > 0 ? `?${querystring.stringify(query)}` : '';
    const url = `${baseUrl}${paramsStr}`;

    const authorizationHeader = getOAuthAuthorizationHeader({
        oAuth: {
            consumerKey: oAuthWithDefaults.consumerKey,
            consumerSecret: oAuthWithDefaults.consumerSecret,
            callback: nullableNullToUndefined(oAuthWithDefaults.callback.toNullable()),
            token: nullableNullToUndefined(oAuthWithDefaults.token.toNullable()),
            tokenSecret: nullableNullToUndefined(oAuthWithDefaults.tokenSecret.toNullable()),
            verifier: nullableNullToUndefined(oAuthWithDefaults.verifier.toNullable()),
        },
        url,
        method,
        queryParams: query,
        formParams: {},
    });

    const headers = { Authorization: authorizationHeader };
    return fetchTaskEither(url, {
        method,
        headers,
    }).map(e => e.mapLeft(error => ErrorResponse.JavaScriptError({ error })));
};

// https://developer.twitter.com/en/docs/basics/authentication/api-reference/request_token
type handleRequestTokenResponse = (response: fetch.Response) => Task<RequestTokenResponse>;
const handleRequestTokenResponse: handleRequestTokenResponse = response =>
    new Task(() => response.text()).map(text => {
        if (response.ok) {
            const parsed = querystring.parse(text);
            return Decode.validateType(TwitterAPIRequestTokenResponse)(
                parsed,
            ).mapLeft(decodeError => ErrorResponse.DecodeError({ decodeError }));
        } else {
            return typecheck<Response<TwitterAPIErrorResponseT>>(
                Decode.jsonDecodeString(TwitterAPIErrorResponse)(text).mapLeft(decodeError =>
                    ErrorResponse.DecodeError({ decodeError }),
                ),
            ).chain(apiErrorResponse =>
                createErrorResponse(ErrorResponse.APIErrorResponse({ apiErrorResponse })),
            );
        }
    });
export type getRequestToken = (args: { oAuth: OAuthOptionsInput }) => Task<RequestTokenResponse>;
export const getRequestToken: getRequestToken = ({ oAuth }) =>
    fetchFromTwitter({
        oAuth,
        endpointPath: ENDPOINTS.OAuthRequestToken,
        method: 'POST',
        query: {},
    }).chain(e => e.fold(l => task.task.of(either.left(l)), handleRequestTokenResponse));

// https://developer.twitter.com/en/docs/basics/authentication/api-reference/access_token
type handleAccessTokenResponse = (response: fetch.Response) => Task<AccessTokenResponse>;
const handleAccessTokenResponse: handleAccessTokenResponse = response =>
    new Task(() => response.text()).map(text => {
        if (response.ok) {
            const parsed = querystring.parse(text);
            return Decode.validateType(TwitterAPIAccessTokenResponse)(parsed).mapLeft(decodeError =>
                ErrorResponse.DecodeError({ decodeError }),
            );
        } else {
            return typecheck<Response<TwitterAPIErrorResponseT>>(
                Decode.jsonDecodeString(TwitterAPIErrorResponse)(text).mapLeft(decodeError =>
                    ErrorResponse.DecodeError({ decodeError }),
                ),
            ).chain(apiErrorResponse =>
                createErrorResponse(ErrorResponse.APIErrorResponse({ apiErrorResponse })),
            );
        }
    });
export type getAccessToken = (args: { oAuth: OAuthOptionsInput }) => Task<AccessTokenResponse>;
export const getAccessToken: getAccessToken = ({ oAuth }) =>
    fetchFromTwitter({
        oAuth,
        endpointPath: ENDPOINTS.OAuthAccessToken,
        method: 'POST',
        query: {},
    }).chain(e => e.fold(l => task.task.of(either.left(l)), handleAccessTokenResponse));

// https://developer.twitter.com/en/docs/tweets/timelines/api-reference/get-statuses-home_timeline
const handleTimelineResponse = (response: fetch.Response): Task<TimelineResponse> =>
    new Task(() => response.text()).map(text => {
        if (response.ok) {
            return Decode.jsonDecodeString(TwitterAPITimelineResponse)(text).mapLeft(decodeError =>
                ErrorResponse.DecodeError({ decodeError }),
            );
        } else {
            return typecheck<Response<TwitterAPIErrorResponseT>>(
                Decode.jsonDecodeString(TwitterAPIErrorResponse)(text).mapLeft(decodeError =>
                    ErrorResponse.DecodeError({ decodeError }),
                ),
            ).chain(apiErrorResponse =>
                createErrorResponse(ErrorResponse.APIErrorResponse({ apiErrorResponse })),
            );
        }
    });
export type fetchHomeTimeline = (
    args: {
        oAuth: OAuthOptionsInput;
        query: StatusesHomeTimelineQueryInput;
    },
) => Task<TimelineResponse>;
export const fetchHomeTimeline: fetchHomeTimeline = ({ oAuth, query }) => {
    const queryWithDefaults: StatusesHomeTimelineQuery = {
        ...defaultStatusesHomeTimelineQuery,
        ...query,
    };

    return fetchFromTwitter({
        oAuth,
        endpointPath: ENDPOINTS.StatusesHomeTimeline,
        method: 'GET',
        query: serializeStatusesHomeTimelineQuery(queryWithDefaults),
    }).chain(e => e.fold(l => task.task.of(either.left(l)), handleTimelineResponse));
};

// https://developer.twitter.com/en/docs/accounts-and-users/manage-account-settings/api-reference/get-account-verify_credentials
const handleAccountVerifyCredentialsResponse = (
    response: fetch.Response,
): Task<AccountVerifyCredentialsResponse> =>
    new Task(() => response.text()).map(text => {
        if (response.ok) {
            return Decode.jsonDecodeString(TwitterAPIAccountVerifyCredentials)(
                text,
            ).mapLeft(decodeError => ErrorResponse.DecodeError({ decodeError }));
        } else {
            return typecheck<Response<TwitterAPIErrorResponseT>>(
                Decode.jsonDecodeString(TwitterAPIErrorResponse)(text).mapLeft(decodeError =>
                    ErrorResponse.DecodeError({ decodeError }),
                ),
            ).chain(apiErrorResponse =>
                createErrorResponse(ErrorResponse.APIErrorResponse({ apiErrorResponse })),
            );
        }
    });
export type fetchAccountVerifyCredentials = (
    args: {
        oAuth: OAuthOptionsInput;
    },
) => Task<AccountVerifyCredentialsResponse>;
export const fetchAccountVerifyCredentials: fetchAccountVerifyCredentials = ({ oAuth }) =>
    fetchFromTwitter({
        oAuth,
        endpointPath: ENDPOINTS.AccountVerifyCredentials,
        method: 'GET',
        query: {},
    }).chain(e =>
        e.fold(l => task.task.of(either.left(l)), handleAccountVerifyCredentialsResponse),
    );
