import { capitalizeFirst } from 'tools-box/string';

export interface ITimePeriod {
  period?: string;
  days?: number[];
  time: { hours: number; minutes: number }[];
}

export interface IProcess {
  __name: string;
  isProcess: boolean;
  event: string;
  interval: number | ITimePeriod;
  triggered: boolean;
  timerId: NodeJS.Timer;
  paused: boolean;
}

export interface IProcessOptions {
  interval: number | ITimePeriod;
  event?: string;
}

const defaultOptions: IProcess = {
  __name: '',
  isProcess: true,
  event: null,
  triggered: false,
  interval: null,
  timerId: null,
  paused: false
}

export function PROCESS(options: IProcessOptions) {

  return function (target: any, key: string, descriptor: PropertyDescriptor) {
    let processName = capitalizeFirst(key);

    function userProcess() {
      this[key]();
    }
    
    Object.assign(userProcess, defaultOptions);

    if (options)
      Object.assign(userProcess, options);

    (<Partial<IProcess>>userProcess).__name = key;

    Object.defineProperty(target.constructor.prototype, processName, {
      value: userProcess,
      enumerable: true
    });
  }
}