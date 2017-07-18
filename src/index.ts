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
    APIErrorResponseErrorResponse,
    DecodeErrorErrorResponse,
    ErrorResponse,
    JavaScriptErrorErrorResponse,
    OAuthOptions,
    OAuthOptionsInput,
    RequestMethod,
    RequestTokenResponse,
    Response,
    StatusesHomeTimelineQuery,
    StatusesHomeTimelineQueryInput,
    TimelineResponse,
    TwitterAPIAccessTokenResponse,
    TwitterAPIErrorResponse,
    TwitterAPIErrorResponseT,
    TwitterAPIRequestTokenResponse,
    TwitterAPITimelineResponse,
} from './types';

// These are only needed for emitting TypeScript declarations
/* tslint:disable no-unused-variable */
import { Left, Right } from 'fp-ts/lib/Either';
import { InterfaceOf, InterfaceType, Type } from 'io-ts';
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
            callback: oAuthWithDefaults.callback,
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
    }).map(e => e.mapLeft(error => new JavaScriptErrorErrorResponse(error)));
};

// https://dev.twitter.com/oauth/reference/post/oauth/request_token
type handleResponse = <T>(type: t.Type<T>) => (response: fetch.Response) => Task<Response<T>>;
const handleResponse: handleResponse = type => response =>
    new Task(() => response.text()).map(text => {
        if (response.ok) {
            const parsed = querystring.parse(text);
            return Decode.validateType(type)(parsed).mapLeft(
                decodeError => new DecodeErrorErrorResponse(decodeError),
            );
        } else {
            return typecheck<Response<TwitterAPIErrorResponseT>>(
                Decode.jsonDecodeString(TwitterAPIErrorResponse)(text).mapLeft(
                    decodeError => new DecodeErrorErrorResponse(decodeError),
                ),
            ).chain(errorResponse =>
                createErrorResponse(new APIErrorResponseErrorResponse(errorResponse)),
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
    }).chain(e =>
        e.fold(l => task.of(either.left(l)), handleResponse(TwitterAPIRequestTokenResponse)),
    );

// https://dev.twitter.com/oauth/reference/post/oauth/access_token
export type getAccessToken = (args: { oAuth: OAuthOptionsInput }) => Task<AccessTokenResponse>;
export const getAccessToken: getAccessToken = ({ oAuth }) =>
    fetchFromTwitter({
        oAuth,
        endpointPath: ENDPOINTS.OAuthAccessToken,
        method: 'POST',
        query: {},
    }).chain(e =>
        e.fold(l => task.of(either.left(l)), handleResponse(TwitterAPIAccessTokenResponse)),
    );

// https://dev.twitter.com/rest/reference/get/statuses/home_timeline
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
    }).chain(e => e.fold(l => task.of(either.left(l)), handleResponse(TwitterAPITimelineResponse)));
};
