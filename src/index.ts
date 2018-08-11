import * as Decode from 'decode-ts/target';
import * as either from 'fp-ts/lib/Either';
import * as task from 'fp-ts/lib/Task';
import * as fetch from 'node-fetch';
import { getOAuthAuthorizationHeader } from 'oauth-authorization-header';
import * as querystring from 'querystring';
import * as qsLib from 'qs';

import Either = either.Either;
import Task = task.Task;

import { ENDPOINTS, TWITTER_API_BASE_URL } from './constants';
import {
    createErrorResponse,
    defaultOAuthOptions,
    defaultStatusesHomeTimelineQuery,
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
    StatusesHomeTimelineQueryT,
    StatusesHomeTimelineQueryInput,
    TimelineResponse,
    TwitterAPIAccessTokenResponse,
    TwitterAPIAccountVerifyCredentials,
    TwitterAPIErrorResponse,
    TwitterAPIErrorResponseT,
    TwitterAPIRequestTokenResponse,
    TwitterAPITimelineResponse,
    StatusesHomeTimelineQuery,
    TwitterAPIAccountSettings,
    AccountSettingsResponse,
} from './types';

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
    // We must use `qs` and not `querystring` for stringifying because that's what
    // `oauth-authorization-header` uses, and the query string needs to be consistent. (`qs` differs
    // in many ways, including the way it stringifies `undefined`.)
    const queryString = qsLib.stringify(query);
    const paramsStr = Object.keys(query).length > 0 ? `?${queryString}` : '';
    const url = `${baseUrl}${paramsStr}`;

    const authorizationHeader = getOAuthAuthorizationHeader({
        oAuth: {
            consumerKey: oAuthWithDefaults.consumerKey,
            consumerSecret: oAuthWithDefaults.consumerSecret,
            callback: oAuthWithDefaults.callback.toUndefined(),
            token: oAuthWithDefaults.token.toUndefined(),
            tokenSecret: oAuthWithDefaults.tokenSecret.toUndefined(),
            verifier: oAuthWithDefaults.verifier.toUndefined(),
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
            return Decode.validateType(TwitterAPIRequestTokenResponse)(parsed).mapLeft(
                decodeError => ErrorResponse.DecodeError({ decodeError }),
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
    const queryWithDefaults: StatusesHomeTimelineQueryT = {
        ...defaultStatusesHomeTimelineQuery,
        ...query,
    };

    return fetchFromTwitter({
        oAuth,
        endpointPath: ENDPOINTS.StatusesHomeTimeline,
        method: 'GET',
        query: StatusesHomeTimelineQuery.encode(queryWithDefaults),
    }).chain(e => e.fold(l => task.task.of(either.left(l)), handleTimelineResponse));
};

// https://developer.twitter.com/en/docs/accounts-and-users/manage-account-settings/api-reference/get-account-verify_credentials
const handleAccountVerifyCredentialsResponse = (
    response: fetch.Response,
): Task<AccountVerifyCredentialsResponse> =>
    new Task(() => response.text()).map(text => {
        if (response.ok) {
            return Decode.jsonDecodeString(TwitterAPIAccountVerifyCredentials)(text).mapLeft(
                decodeError => ErrorResponse.DecodeError({ decodeError }),
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

// https://developer.twitter.com/en/docs/accounts-and-users/manage-account-settings/api-reference/get-account-settings
const handleAccountSettingsResponse = (response: fetch.Response): Task<AccountSettingsResponse> =>
    new Task(() => response.text()).map(text => {
        if (response.ok) {
            return Decode.jsonDecodeString(TwitterAPIAccountSettings)(text).mapLeft(decodeError =>
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
export type fetchAccountSettings = (
    args: {
        oAuth: OAuthOptionsInput;
    },
) => Task<AccountSettingsResponse>;
export const fetchAccountSettings: fetchAccountSettings = ({ oAuth }) =>
    fetchFromTwitter({
        oAuth,
        endpointPath: ENDPOINTS.AccountSettings,
        method: 'GET',
        query: {},
    }).chain(e => e.fold(l => task.task.of(either.left(l)), handleAccountSettingsResponse));
