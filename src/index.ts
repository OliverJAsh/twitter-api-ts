import * as Decode from 'decode-ts/target';
import * as task from 'fp-ts/lib/Task';
import { Response as FetchResponse } from 'node-fetch';
import { getOAuthAuthorizationHeader } from 'oauth-authorization-header';
import * as querystring from 'querystring';

import Task = task.Task;

import { ENDPOINTS, TWITTER_API_BASE_URL } from './constants';
import {
    createErrorResponse,
    defaultOAuthOptions,
    fetchTask,
    nullableNullToUndefined,
    serializeStatuesHomeTimelineQuery,
    typecheck,
} from './helpers';
import {
    AccessTokenResponse,
    APIErrorResponseErrorResponse,
    OAuthOptions,
    OAuthOptionsInput,
    RequestMethod,
    RequestTokenResponse,
    Response,
    StatuesHomeTimelineQuery,
    TimelineResponse,
    TwitterAPIAccessTokenResponse,
    TwitterAPIAccessTokenResponseT,
    TwitterAPIErrorResponse,
    TwitterAPIErrorResponseT,
    TwitterAPIRequestTokenResponse,
    TwitterAPIRequestTokenResponseT,
    TwitterAPITimelineResponse,
    TwitterAPITimelineResponseT,
} from './types';

// These are only needed for emitting TypeScript declarations
/* tslint:disable no-unused-variable */
import { Left, Right } from 'fp-ts/lib/Either';
import { InterfaceOf, InterfaceType, Type } from 'io-ts';
import * as t from 'io-ts';
import { ErrorResponse } from './types';
/* tslint:enable no-unused-variable */

export type fetchFromTwitter = (
    args: {
        oAuth: OAuthOptionsInput;
        endpointPath: ENDPOINTS;
        method: RequestMethod;
        query: {};
    },
) => Task<FetchResponse>;
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
    return fetchTask(url, {
        method,
        headers,
    });
};

// https://dev.twitter.com/oauth/reference/post/oauth/request_token
type handleRequestTokenResponse = (response: FetchResponse) => Task<RequestTokenResponse>;
const handleRequestTokenResponse: handleRequestTokenResponse = response =>
    new Task(() => response.text()).map(text => {
        if (response.ok) {
            const parsed = querystring.parse(text);
            return Decode.validateType(TwitterAPIRequestTokenResponse)(parsed);
        } else {
            return typecheck<Response<TwitterAPIErrorResponseT>>(
                Decode.jsonDecodeString(TwitterAPIErrorResponse)(text),
            ).chain(errorResponse =>
                createErrorResponse<TwitterAPIRequestTokenResponseT>(
                    new APIErrorResponseErrorResponse(errorResponse),
                ),
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
    }).chain(handleRequestTokenResponse);

// https://dev.twitter.com/oauth/reference/post/oauth/access_token
type handleAccessTokenResponse = (response: FetchResponse) => Task<AccessTokenResponse>;
const handleAccessTokenResponse: handleAccessTokenResponse = response =>
    new Task(() => response.text()).map(text => {
        if (response.ok) {
            const parsed = querystring.parse(text);
            return Decode.validateType(TwitterAPIAccessTokenResponse)(parsed);
        } else {
            return typecheck<Response<TwitterAPIErrorResponseT>>(
                Decode.jsonDecodeString(TwitterAPIErrorResponse)(text),
            ).chain(errorResponse =>
                createErrorResponse<TwitterAPIAccessTokenResponseT>(
                    new APIErrorResponseErrorResponse(errorResponse),
                ),
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
    }).chain(handleAccessTokenResponse);

// https://dev.twitter.com/rest/reference/get/statuses/home_timeline
const handleTimelineResponse = (response: FetchResponse): Task<TimelineResponse> =>
    new Task(() => response.text()).map(text => {
        if (response.ok) {
            return Decode.jsonDecodeString(TwitterAPITimelineResponse)(text);
        } else {
            return typecheck<Response<TwitterAPIErrorResponseT>>(
                Decode.jsonDecodeString(TwitterAPIErrorResponse)(text),
            ).chain(errorResponse =>
                createErrorResponse<TwitterAPITimelineResponseT>(
                    new APIErrorResponseErrorResponse(errorResponse),
                ),
            );
        }
    });
export type fetchHomeTimeline = (
    args: {
        oAuth: OAuthOptionsInput;
        query: StatuesHomeTimelineQuery;
    },
) => Task<TimelineResponse>;
export const fetchHomeTimeline: fetchHomeTimeline = ({ oAuth, query }) =>
    fetchFromTwitter({
        oAuth,
        endpointPath: ENDPOINTS.StatusesHomeTimeline,
        method: 'GET',
        query: serializeStatuesHomeTimelineQuery(query),
    }).chain(handleTimelineResponse);
