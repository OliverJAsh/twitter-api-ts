import * as either from 'fp-ts/lib/Either';
import * as option from 'fp-ts/lib/Option';
import * as t from 'io-ts';
import { Enum } from 'typescript-string-enums';

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
    errors: t.array(t.interface({
        code: t.number,
        message: t.string,
    })),
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

export const ErrorResponseTypes = Enum(
    'APIErrorResponse',
    'ValidationErrorsError',
    'ParsingError',
);

export class APIErrorResponseErrorResponse {
    // Literal type annotation required due to bug whereby literal types are
    // lost in declarations.
    // https://github.com/Microsoft/TypeScript/issues/15881
    readonly type: typeof ErrorResponseTypes.APIErrorResponse = ErrorResponseTypes.APIErrorResponse;

    constructor(
        public apiErrorResponse: TwitterAPIErrorResponseT,
    ) {}
}

export class ValidationErrorsErrorResponse {
    // Literal type annotation required due to bug whereby literal types are
    // lost in declarations.
    // https://github.com/Microsoft/TypeScript/issues/15881
    // tslint:disable-next-line max-line-length
    readonly type: typeof ErrorResponseTypes.ValidationErrorsError = ErrorResponseTypes.ValidationErrorsError;

    constructor(
        public validationErrors: t.ValidationError[],
    ) {}
}

export class ParsingErrorErrorResponse {
    // Literal type annotation required due to bug whereby literal types are
    // lost in declarations.
    // https://github.com/Microsoft/TypeScript/issues/15881
    readonly type: typeof ErrorResponseTypes.ParsingError = ErrorResponseTypes.ParsingError;

    constructor(
        public input: string,
        public errorMessage: string,
    ) {}
}

export type ErrorResponse = (
      APIErrorResponseErrorResponse
    | ValidationErrorsErrorResponse
    | ParsingErrorErrorResponse
);

export type Response<T> = either.Either<ErrorResponse, T>;

export type RequestTokenResponse = Response<TwitterAPIRequestTokenResponseT>;
export type AccessTokenResponse = Response<TwitterAPIAccessTokenResponseT>;
export type TimelineResponse = Response<TwitterAPITimelineResponseT>;

//
// Other
//

export type OAuthOptions = {
    consumerKey: string;
    consumerSecret: string;
    callback: string;
    token: option.Option<string>;
    tokenSecret: option.Option<string>;
    verifier: option.Option<string>;
};

export type TimelineQueryParams = {
    count: number,
    maybeMaxId: option.Option<string>,
};

export type SerializedTimelineQueryParams = {
    count: number,
    max_id?: string,
};
