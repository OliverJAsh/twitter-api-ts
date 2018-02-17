import * as either from 'fp-ts/lib/Either';
import * as task from 'fp-ts/lib/Task';
import * as fetch from 'node-fetch';

import Task = task.Task;
import Either = either.Either;

export type fetchTaskEither = (
    url: string,
    init?: fetch.RequestInit,
) => Task<Either<Error, fetch.Response>>;
export const fetchTaskEither: fetchTaskEither = (url, init) =>
    task.tryCatch(
        () => fetch.default(url, init),
        // We assert that we'll only ever receive an `Error` instance from `fetch`
        (error): Error => error as Error,
    );
