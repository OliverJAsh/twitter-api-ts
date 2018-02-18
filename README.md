# twitter-api-ts

TypScript compatible Twitter API client.

- [io-ts] is used to perform IO validation for type safety.
- [fp-ts] is used for its `Task`, `Either`, and `Option` types.
- Request functions return types of `type Response<T> = either.Either<ErrorResponse, T>`.

This library is written in TypeScript and is published in JavaScript with type declaration files.

## Installation

```
yarn add twitter-api-ts
```

## Example

``` ts
import { fetchHomeTimeline } from 'twitter-api-ts';
import * as option from 'fp-ts/lib/Option';

const CONSUMER_KEY = 'YOUR_CONSUMER_KEY';
const CONSUMER_SECRET = 'YOUR_CONSUMER_SECRET';
const TOKEN = 'YOUR_TOKEN';
const TOKEN_SECRET = 'YOUR_TOKEN_SECRET';

fetchHomeTimeline({
    oAuth: {
        consumerKey: CONSUMER_KEY,
        consumerSecret: CONSUMER_SECRET,
        token: option.some(TOKEN),
        tokenSecret: option.some(TOKEN_SECRET),
    },
    query: {
        count: option.some(50),
    },
})
    // We use fp-ts’ Task type, which is lazy. Running the task returns a
    // promise.
    .run()
    .then(response => {
        console.log(response);
        // => Either<ErrorResponse, TwitterAPITimelineResponseT>
    });
```

## Development

```
yarn
yarn compile
yarn lint
```

[io-ts]: https://github.com/gcanti/io-ts
[fp-ts]: https://github.com/gcanti/fp-ts
