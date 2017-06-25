import * as task from 'fp-ts/lib/Task';
import { Response as FetchResponse } from 'node-fetch';
import { getOAuthAuthorizationHeader } from 'oauth-authorization-header';
import * as querystring from 'querystring';

import * as Decode from 'decode-ts/target';
import { ENDPOINTS, TWITTER_API_BASE_URL } from './constants';
import {
    createErrorResponse,
    fetchTask,
    nullableNullToUndefined,
    serializeTimelineQuery,
    typecheck,
} from './helpers';
import {
    AccessTokenResponse,
    APIErrorResponseErrorResponse,
    OAuthOptions,
    RequestMethod,
    RequestTokenResponse,
    Response,
    TimelineQuery,
    TimelineResponse,
    TwitterAPIAccessTokenResponse,
    TwitterAPIAccessTokenResponseT,
    TwitterAPIErrorResponse,
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
import { TwitterAPIErrorResponseT } from './types';
import { ErrorResponse } from './types';
/* tslint:enable no-unused-variable */

export type fetchFromTwitter = (
    args: {
        oAuth: OAuthOptions;
        endpointPath: ENDPOINTS;
        method: RequestMethod;
        query: {};
    },
) => task.Task<FetchResponse>;
export const fetchFromTwitter: fetchFromTwitter = ({ oAuth, endpointPath, method, query }) => {
    const baseUrl = `${TWITTER_API_BASE_URL}${endpointPath}`;
    const paramsStr = Object.keys(query).length > 0 ? `?${querystring.stringify(query)}` : '';
    const url = `${baseUrl}${paramsStr}`;

    const authorizationHeader = getOAuthAuthorizationHeader({
        oAuth: {
            consumerKey: oAuth.consumerKey,
            consumerSecret: oAuth.consumerSecret,
            callback: oAuth.callback,
            token: nullableNullToUndefined(oAuth.token.toNullable()),
            tokenSecret: nullableNullToUndefined(oAuth.tokenSecret.toNullable()),
            verifier: nullableNullToUndefined(oAuth.verifier.toNullable()),
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
type handleRequestTokenResponse = (response: FetchResponse) => task.Task<RequestTokenResponse>;
const handleRequestTokenResponse: handleRequestTokenResponse = response =>
    new task.Task(() => response.text()).map(text => {
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
export type getRequestToken = (args: { oAuth: OAuthOptions }) => task.Task<RequestTokenResponse>;
export const getRequestToken: getRequestToken = ({ oAuth }) =>
    fetchFromTwitter({
        oAuth,
        endpointPath: ENDPOINTS.OAuthRequestToken,
        method: 'POST',
        query: {},
    }).chain(handleRequestTokenResponse);

// https://dev.twitter.com/oauth/reference/post/oauth/access_token
type handleAccessTokenResponse = (response: FetchResponse) => task.Task<AccessTokenResponse>;
const handleAccessTokenResponse: handleAccessTokenResponse = response =>
    new task.Task(() => response.text()).map(text => {
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
export type getAccessToken = (args: { oAuth: OAuthOptions }) => task.Task<AccessTokenResponse>;
export const getAccessToken: getAccessToken = ({ oAuth }) =>
    fetchFromTwitter({
        oAuth,
        endpointPath: ENDPOINTS.OAuthAccessToken,
        method: 'POST',
        query: {},
    }).chain(handleAccessTokenResponse);

// https://dev.twitter.com/rest/reference/get/statuses/home_timeline
const handleTimelineResponse = (response: FetchResponse) =>
    new task.Task(() => response.text()).map(text => {
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
        oAuth: OAuthOptions;
        query: TimelineQuery;
    },
) => task.Task<TimelineResponse>;
export const fetchHomeTimeline: fetchHomeTimeline = ({ oAuth, query }) =>
    fetchFromTwitter({
        oAuth,
        endpointPath: ENDPOINTS.StatusesHomeTimeline,
        method: 'GET',
        query: serializeTimelineQuery(query),
    }).chain(handleTimelineResponse);
