import { capitalizeFirst } from 'tools-box/string';

export interface ITimePeriod {
  period?: string;
  days?: number[];
  time: { hours: number; minutes: number }[];
}

export interface IJob {
  __name: string;
  isJob: boolean;
  event: string;
  interval: number | ITimePeriod;
  triggered: boolean;
  timerId: NodeJS.Timer;
  paused: boolean;
}

export interface IJobOptions {
  interval: number | ITimePeriod;
  event?: string;
}

const defaultOptions: IJob = {
  __name: '',
  isJob: true,
  event: null,
  triggered: false,
  interval: null,
  timerId: null,
  paused: false
}

export function JOB(options: IJobOptions) {

  return function (target: any, key: string, descriptor: PropertyDescriptor) {
    let jobName = capitalizeFirst(key);

    function userJob() {
      this[key]();
    }
    
    Object.assign(userJob, defaultOptions);

    if (options)
      Object.assign(userJob, options);

    (<Partial<IJob>>userJob).__name = key;

    Object.defineProperty(target.constructor.prototype, jobName, {
      value: userJob,
      enumerable: true
    });
  }
}