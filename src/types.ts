import * as DecodeTypes from 'decode-ts/target/types';
import * as either from 'fp-ts/lib/Either';
import * as option from 'fp-ts/lib/Option';
import * as t from 'io-ts';
import { ObjectClean, ObjectDiff } from 'typelevel-ts';

import Option = option.Option;
import Either = either.Either;

import { defaultOAuthOptions, defaultStatusesHomeTimelineQuery } from './helpers';

export type RequestMethod = 'GET' | 'POST' | 'DELETE' | 'PATCH' | 'UPDATE';

//
// Entities
//

// https://developer.twitter.com/en/docs/tweets/data-dictionary/overview/user-object
export const User = t.interface({
    id_str: t.string,
    screen_name: t.string,
    time_zone: t.union([t.string, t.null]),
});

export const Tweet = t.interface({
    id_str: t.string,
    created_at: t.string,
    user: User,
    text: t.string,
});
export type TweetT = t.TypeOf<typeof Tweet>;

//
// Responses
//

export const TwitterAPIErrorResponse = t.interface({
    errors: t.array(
        t.interface({
            code: t.number,
            message: t.string,
        }),
    ),
});
export type TwitterAPIErrorResponseT = t.TypeOf<typeof TwitterAPIErrorResponse>;

export const TwitterAPIRequestTokenResponse = t.interface({
    oauth_token: t.string,
    oauth_token_secret: t.string,
    oauth_callback_confirmed: t.string,
});
export type TwitterAPIRequestTokenResponseT = t.TypeOf<typeof TwitterAPIRequestTokenResponse>;

export const TwitterAPIAccessTokenResponse = t.interface({
    oauth_token: t.string,
    oauth_token_secret: t.string,
    user_id: t.string,
    screen_name: t.string,
    x_auth_expires: t.string,
});
export type TwitterAPIAccessTokenResponseT = t.TypeOf<typeof TwitterAPIAccessTokenResponse>;

export const TwitterAPITimelineResponse = t.array(Tweet);
export type TwitterAPITimelineResponseT = t.TypeOf<typeof TwitterAPITimelineResponse>;

export const TwitterAPIAccountVerifyCredentials = User;
export type TwitterAPIAccountVerifyCredentialsT = t.TypeOf<
    typeof TwitterAPIAccountVerifyCredentials
>;

//
// Full responses (either success or error)
//

export enum ErrorResponseTypes {
    APIErrorResponse = 'APIErrorResponse',
    DecodeError = 'DecodeError',
    JavaScriptError = 'JavaScriptError',
}

export class APIErrorResponseErrorResponse {
    // Literal type annotation required due to bug whereby literal types are
    // lost in declarations.
    // https://github.com/Microsoft/TypeScript/issues/15881
    readonly type: typeof ErrorResponseTypes.APIErrorResponse = ErrorResponseTypes.APIErrorResponse;

    constructor(public apiErrorResponse: TwitterAPIErrorResponseT) {}
}

export class DecodeErrorErrorResponse {
    // Literal type annotation required due to bug whereby literal types are
    // lost in declarations.
    // https://github.com/Microsoft/TypeScript/issues/15881
    readonly type: typeof ErrorResponseTypes.DecodeError = ErrorResponseTypes.DecodeError;

    constructor(
        public decodeError: DecodeTypes.ValidationErrorsError | DecodeTypes.ParsingErrorError,
    ) {}
}

export class JavaScriptErrorErrorResponse {
    // Literal type annotation required due to bug whereby literal types are
    // lost in declarations.
    // https://github.com/Microsoft/TypeScript/issues/15881
    readonly type: typeof ErrorResponseTypes.JavaScriptError = ErrorResponseTypes.JavaScriptError;

    constructor(public error: Error) {}
}

export type ErrorResponse =
    | JavaScriptErrorErrorResponse
    | APIErrorResponseErrorResponse
    | DecodeErrorErrorResponse;

export type Response<T> = Either<ErrorResponse, T>;

export type RequestTokenResponse = Response<TwitterAPIRequestTokenResponseT>;
export type AccessTokenResponse = Response<TwitterAPIAccessTokenResponseT>;
export type TimelineResponse = Response<TwitterAPITimelineResponseT>;
export type AccountVerifyCredentialsResponse = Response<TwitterAPIAccountVerifyCredentialsT>;

//
// Other
//

export type OAuthOptions = {
    consumerKey: string;
    consumerSecret: string;
    callback: Option<string>;
    token: Option<string>;
    tokenSecret: Option<string>;
    verifier: Option<string>;
};

export type OAuthOptionsInput = ObjectClean<ObjectDiff<OAuthOptions, typeof defaultOAuthOptions>>;

export type StatusesHomeTimelineQuery = {
    count: Option<number>;
    maybeMaxId: Option<string>;
};

export type StatusesHomeTimelineQueryInput = ObjectClean<
    ObjectDiff<StatusesHomeTimelineQuery, typeof defaultStatusesHomeTimelineQuery>
>;

export type SerializedStatusesHomeTimelineQuery = {
    count?: number;
    max_id?: string;
};

export type SerializedOAuthAuthenticateEndpointQuery = { oauth_token: string };
