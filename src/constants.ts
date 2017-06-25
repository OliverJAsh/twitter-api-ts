export const TWITTER_API_BASE_URL = 'https://api.twitter.com';

export enum ENDPOINTS {
    OAuthAuthenticate = '/oauth/authenticate',
    OAuthRequestToken = '/oauth/request_token',
    OAuthAccessToken = '/oauth/access_token',
    StatusesHomeTimeline = '/1.1/statuses/home_timeline.json',
}
