import { task } from 'fp-ts';
import * as HttpStatus from 'http-status-codes';
import { Response as FetchResponse } from 'node-fetch';
import { getOAuthAuthorizationHeader } from 'oauth-authorization-header';
import * as querystring from 'querystring';

import { TWITTER_API_BASE_URL } from './constants';
import {
    createErrorResponse,
    fetchTask,
    nullableNullToUndefined,
    serializeTimelineQueryParams,
    validate,
} from './helpers';
import {
    AccessTokenResponse,
    APIErrorResponseErrorResponse,
    OAuthOptions,
    RequestMethod,
    RequestTokenResponse,
    TimelineQueryParams,
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
import {
    ValidationErrorsErrorResponse,
} from './types';
/* tslint:enable no-unused-variable */

export const fetchFromTwitter = ({
    oAuth,
    endpointPath,
    method,
    queryParams,
}: {
    oAuth: OAuthOptions,
    endpointPath: string,
    method: RequestMethod,
    queryParams: {},
}) => {
    const baseUrl = `${TWITTER_API_BASE_URL}${endpointPath}`;
    const paramsStr = Object.keys(queryParams).length > 0
        ? `?${querystring.stringify(queryParams)}`
        : '';
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
        queryParams,
        formParams: {},
    });

    const headers = { 'Authorization': authorizationHeader };
    return fetchTask(url, {
        method,
        headers,
    });
};

// https://dev.twitter.com/oauth/reference/post/oauth/request_token
export const getRequestToken = (
    { oAuth }: { oAuth: OAuthOptions },
): task.Task<RequestTokenResponse> => {
    const handleResponse = (response: FetchResponse) => (
        new task.Task(() => response.text()).map(text => {
            if (response.ok) {
                const parsed = querystring.parse(text);
                // tslint:disable max-line-length
                return validate(HttpStatus.INTERNAL_SERVER_ERROR, TwitterAPIRequestTokenResponse)(parsed);
            } else {
                const parsed = JSON.parse(text);
                return validate(HttpStatus.INTERNAL_SERVER_ERROR, TwitterAPIErrorResponse)(parsed)
                    .chain(errorResponse => (
                        createErrorResponse<TwitterAPIRequestTokenResponseT>(
                            new APIErrorResponseErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR, errorResponse),
                        )
                    ));
            }
        })
    );

    return fetchFromTwitter({
        oAuth,
        endpointPath: `/oauth/request_token`,
        method: 'POST',
        queryParams: {},
    })
        .chain(handleResponse);
};

// https://dev.twitter.com/oauth/reference/post/oauth/access_token
export const getAccessToken = (
    { oAuth }: { oAuth: OAuthOptions },
): task.Task<AccessTokenResponse> => {
    const handleResponse = (response: FetchResponse) => (
        new task.Task(() => response.text()).map(text => {
            if (response.ok) {
                const parsed = querystring.parse(text);
                // tslint:disable max-line-length
                return validate(HttpStatus.INTERNAL_SERVER_ERROR, TwitterAPIAccessTokenResponse)(parsed);
            } else {
                const parsed = JSON.parse(text);
                return validate(HttpStatus.INTERNAL_SERVER_ERROR, TwitterAPIErrorResponse)(parsed)
                    .chain(errorResponse => (
                        createErrorResponse<TwitterAPIAccessTokenResponseT>(
                            new APIErrorResponseErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR, errorResponse),
                        )
                    ));
            }
        })
    );

    return fetchFromTwitter({
        oAuth,
        endpointPath: `/oauth/access_token`,
        method: 'POST',
        queryParams: {},
    })
        .chain(handleResponse);
};

// https://dev.twitter.com/rest/reference/get/statuses/home_timeline
export const fetchHomeTimeline = (
    {
        oAuth,
        queryParams,
    }: {
        oAuth: OAuthOptions,
        queryParams: TimelineQueryParams,
    },
): task.Task<TimelineResponse> => {
    const handleResponse = (response: FetchResponse) => (
        new task.Task(() => response.json())
            .map(parsed => {
                if (response.ok) {
                    return validate(HttpStatus.INTERNAL_SERVER_ERROR, TwitterAPITimelineResponse)(parsed);
                } else {
                    return validate(HttpStatus.INTERNAL_SERVER_ERROR, TwitterAPIErrorResponse)(parsed)
                        .chain(errorResponse => {
                            const statusCode = response.status === HttpStatus.TOO_MANY_REQUESTS
                                ? HttpStatus.TOO_MANY_REQUESTS
                                : HttpStatus.INTERNAL_SERVER_ERROR;
                            return createErrorResponse<TwitterAPITimelineResponseT>(
                                new APIErrorResponseErrorResponse(statusCode, errorResponse),
                            );
                        });
                }
            })
    );

    return fetchFromTwitter({
        oAuth,
        endpointPath: '/1.1/statuses/home_timeline.json',
        method: 'GET',
        queryParams: serializeTimelineQueryParams(queryParams),
    })
        .chain(handleResponse);
};
