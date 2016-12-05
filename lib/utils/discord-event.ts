import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/fromEventPattern';

export function fromDiscordEvent (source: any, event: string) {

  return Observable.fromEventPattern(
    (handler) => source.on(event, handler),
    (handler) => source.removeListener(event, handler)
  );
}