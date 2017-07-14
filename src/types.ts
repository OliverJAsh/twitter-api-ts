import * as DecodeTypes from 'decode-ts/target/types';
import * as either from 'fp-ts/lib/Either';
import * as option from 'fp-ts/lib/Option';
import * as t from 'io-ts';
import { ObjectClean, ObjectOmit } from 'typelevel-ts';

import { defaultOAuthOptions, defaultStatusesHomeTimelineQuery } from './helpers';

export type RequestMethod = 'GET' | 'POST' | 'DELETE' | 'PATCH' | 'UPDATE';

//
// Entities
//

export const Tweet = t.interface({
    id_str: t.string,
    created_at: t.string,
    user: t.interface({
        screen_name: t.string,
    }),
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

//
// Full responses (either success or error)
//

export enum ErrorResponseTypes {
    APIErrorResponse = 'APIErrorResponse',
    ValidationErrors = 'ValidationErrors',
    ParsingError = 'ParsingError',
}

export class APIErrorResponseErrorResponse {
    // Literal type annotation required due to bug whereby literal types are
    // lost in declarations.
    // https://github.com/Microsoft/TypeScript/issues/15881
    readonly type: typeof ErrorResponseTypes.APIErrorResponse = ErrorResponseTypes.APIErrorResponse;

    constructor(public apiErrorResponse: TwitterAPIErrorResponseT) {}
}

export type ErrorResponse = (
    | APIErrorResponseErrorResponse
    | DecodeTypes.ValidationErrorsError
    | DecodeTypes.ParsingErrorError);

export type Response<T> = either.Either<ErrorResponse, T>;

export type RequestTokenResponse = Response<TwitterAPIRequestTokenResponseT>;
export type AccessTokenResponse = Response<TwitterAPIAccessTokenResponseT>;
export type TimelineResponse = Response<TwitterAPITimelineResponseT>;

//
// Other
//

export type ConsiderDefaults<Defaults, All extends Defaults> = ObjectOmit<All, keyof Defaults> &
    Partial<Defaults>;

export type OAuthOptions = {
    consumerKey: string;
    consumerSecret: string;
    callback: string;
    token: option.Option<string>;
    tokenSecret: option.Option<string>;
    verifier: option.Option<string>;
};

export type OAuthOptionsInput = ObjectClean<
    ConsiderDefaults<typeof defaultOAuthOptions, OAuthOptions>
>;

export type StatuesHomeTimelineQuery = {
    count: option.Option<number>;
    maybeMaxId: option.Option<string>;
};
export type SerializedStatuesHomeTimelineQuery = {
    count?: number;
    max_id?: string;
};

export type SerializedOAuthAuthenticateEndpointQuery = { oauth_token: string };
