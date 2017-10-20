import { FromEventPatternObservable } from 'rxjs/observable/FromEventPatternObservable';

export function fromDiscordEvent (source: any, event: string) {

  return FromEventPatternObservable.create(
    (handler) => source.on(event, handler),
    (handler) => source.removeListener(event, handler)
  );
}