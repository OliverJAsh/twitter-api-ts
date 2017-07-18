import * as either from 'fp-ts/lib/Either';
import { Lazy } from 'fp-ts/lib/function';

import Either = either.Either;

export function eitherTryCatchAsync<E, A>(f: Lazy<Promise<A>>): Promise<Either<E, A>> {
    try {
        return f().then(a => either.right<E, A>(a), e => either.left<E, A>(e));
    } catch (e) {
        return Promise.resolve(either.left<E, A>(e));
    }
}
