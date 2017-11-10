import * as either from 'fp-ts/lib/Either';
import * as task from 'fp-ts/lib/Task';
import * as fetch from 'node-fetch';

import { eitherTryCatchAsync } from './fp-ts';

import Task = task.Task;
import Either = either.Either;

export type fetchPromiseEither = (
    url: string,
    init?: fetch.RequestInit,
) => Promise<Either<Error, fetch.Response>>;
export const fetchPromiseEither: fetchPromiseEither = (url, init) =>
    eitherTryCatchAsync(
        () => fetch.default(url, init),
        // We assert that `fetch` will only ever throw `Error` instances
        (error): Error => error as Error,
    )();

export type fetchTaskEither = (
    url: string,
    init?: fetch.RequestInit,
) => Task<Either<Error, fetch.Response>>;
export const fetchTaskEither: fetchTaskEither = (url, init) =>
    new Task(() => fetchPromiseEither(url, init));
