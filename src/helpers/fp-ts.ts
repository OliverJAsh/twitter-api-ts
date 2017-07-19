import * as either from 'fp-ts/lib/Either';
import { Lazy } from 'fp-ts/lib/function';

import Either = either.Either;

export const eitherTryCatchAsync = <E, A>(
    f: Lazy<Promise<A>>,
    onError: (reason: any) => E,
): Lazy<Promise<Either<E, A>>> => () => {
    try {
        return f().then(a => either.right<E, A>(a), reason => either.left<E, A>(onError(reason)));
    } catch (e) {
        return Promise.resolve(either.left<E, A>(e));
    }
};
