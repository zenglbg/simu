import { from, Observable, Subscriber } from 'rxjs';
import { delay, expand, filter, take } from 'rxjs/operators';

interface RetryOptions<T = any, P = any> {
  try: (tryRequest: P) => Promise<T>;
  tryRequest: P;
  retryUntil: (response: T, index?: number) => boolean;
  maxTimes?: number;
  tick?: number;
}

export const polling = <T = any, P = any>(options: RetryOptions<T, P>) => {
  options = Object.assign(
    {
      maxTimes: 20,
      tick: 1000,
    },
    options,
  );
  let count = 0;

  const request$ = new Observable((subscriber: Subscriber<T>) => {
    if (count >= options.maxTimes) {
      subscriber.error(new Error('超过最大轮询次数'));
    } else {
      options
        .try(options.tryRequest)
        .then(response => {
          subscriber.next(response);
          count++;
        })
        .catch(err => {
          subscriber.error(err);
        });
    }
  });

  return from([0]).pipe(
    expand(() => request$.pipe(delay(1000))),
    filter((value, index) => {
      return options.retryUntil(value, index);
    }),
    take(1),
  );
};
