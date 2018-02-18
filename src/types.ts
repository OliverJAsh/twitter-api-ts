import { unionize, ofType } from 'unionize';
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

export const ErrorResponse = unionize({
    JavaScriptError: ofType<{ error: Error }>(),
    APIErrorResponse: ofType<{ apiErrorResponse: TwitterAPIErrorResponseT }>(),
    DecodeError: ofType<{ decodeError: DecodeTypes.JsonDecodeError }>(),
});
export type ErrorResponse = typeof ErrorResponse._Union;

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
    // Required for request_token
    callback: Option<string>;
    token: Option<string>;
    tokenSecret: Option<string>;
    // Required for access_token
    verifier: Option<string>;
};

export type OAuthOptionsInput = ObjectClean<ObjectDiff<OAuthOptions, typeof defaultOAuthOptions>>;

// https://github.com/gcanti/io-ts-types/blob/d3c51fbd92e4d214acfc45236fd02c4b900088ef/src/fp-ts/createOptionFromNullable.ts
// Difference: `T | undefined` instead of `T | null`
// https://github.com/gcanti/io-ts-types/issues/21
export const createOptionFromNullable = <A, O>(
    type: t.Type<A, O>,
): t.Type<Option<A>, O | undefined> => {
    const Nullable = t.union([type, t.null, t.undefined]);
    return new t.Type(
        `Option<${type.name}>`,
        (m): m is Option<A> =>
            m instanceof option.None || (m instanceof option.Some && type.is(m.value)),
        (s, c) => Nullable.validate(s, c).chain(u => t.success(option.fromNullable(u))),
        a => a.map(type.encode).toUndefined(),
    );
};

export const StatusesHomeTimelineQuery = t.interface({
    count: createOptionFromNullable(t.number),
    maybeMaxId: createOptionFromNullable(t.string),
});
export type StatusesHomeTimelineQueryT = t.TypeOf<typeof StatusesHomeTimelineQuery>;

export type StatusesHomeTimelineQueryInput = ObjectClean<
    ObjectDiff<StatusesHomeTimelineQueryT, typeof defaultStatusesHomeTimelineQuery>
>;
