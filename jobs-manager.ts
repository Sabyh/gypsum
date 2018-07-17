import { IJob, ITimePeriod } from "./decorators";
import { Unique } from 'tools-box/unique';
import { timerEmitter, ItimerData } from "./timer";
import { Logger } from "./misc/logger";

const logger = new Logger('job-manager');
const Jobs: { [key: string]: { parent: any, job: IJob } } = {};

export const JobsManger = {

  registerJob(parent: any, job: IJob) {
    let id = Unique.Get();
    Jobs[id] = { parent, job };
    logger.info(`Job ${parent.name}.${job.__name} registered with id: ${id}`);

    if (job.event) {
      parent.emitter.on(job.event, (...args: any[]) => {
        job.triggered = true;

        if (job.interval && typeof job.interval === 'number') {
          if (job.timerId)
            clearInterval(job.timerId);

          job.timerId = setInterval(() => {
            if (job.paused)
              return;

            logger.info(`running Job ${parent.name}.${job.__name} with id: ${id}`);
            parent[job.__name](id, ...args);
          }, job.interval);
        } else {
          if (job.paused)
            return;

          parent[job.__name](id, ...args);
        }
      });
    } if (job.interval && typeof job.interval === 'number') {
      job.timerId = setInterval(() => {
        if (job.paused)
          return;

        logger.info(`running job ${parent.name}.${job.__name} with id: ${id}`);
        parent[job.__name](id);
      }, job.interval);
    }

    Jobs[id] = { parent, job };
  },

  pauseJob(id: string) {
    if (Jobs.hasOwnProperty(id)) {
      logger.info(`pausing job ${Jobs[id].parent.name}.${Jobs[id].job.__name} with id: ${id}`);
      Jobs[id].job.paused = true;
    }
  },
  
  resumeJob(id: string) {
    if (Jobs.hasOwnProperty(id)) {
      logger.info(`resuming job ${Jobs[id].parent.name}.${Jobs[id].job.__name} with id: ${id}`);
      Jobs[id].job.paused = false;
    }
  },
  
  killJob(id: string) {
    if (Jobs.hasOwnProperty(id)) {
      logger.info(`killing job ${Jobs[id].parent.name}.${Jobs[id].job.__name} with id: ${id}`);
      if (Jobs[id].job.event)
        Jobs[id].parent.emitter.removeAllListeners(Jobs[id].job.event);
  
      if (Jobs[id].job.timerId)
        clearInterval(Jobs[id].job.timerId);
  
      Jobs[id].job.triggered = false;
      Jobs[id].job.timerId = null;
      Jobs[id].job.paused = false;
      Jobs[id] = null;
      delete Jobs[id];
    }
  }
}


timerEmitter.on('timer', (timeData: ItimerData) => {
  for (let prop in Jobs) {
    let pros = Jobs[prop].job;
    if (pros.paused || (pros.event && !pros.triggered))
      continue;

    if (pros.interval && typeof pros.interval !== 'number') {
      if (pros.interval.period === 'monthly') {
        pros.interval.days = pros.interval.days || [1];

        if (pros.interval.days.indexOf(timeData.day) === -1)
          continue;

        if (pros.interval.time && pros.interval.time.length) {
          for (let t of pros.interval.time)
            if (t.hours === timeData.hours && t.minutes === timeData.minutes) {
              logger.info(`running job ${parent.name}.${pros.__name} with id: ${prop}`);
              Jobs[prop].parent[pros.__name](prop);
            }
        }

      } else if (pros.interval.period === 'weekly') {
        pros.interval.days = pros.interval.days || [0];

        if (pros.interval.days.indexOf(timeData.weekDay) === -1)
          continue;

        if (pros.interval.time && pros.interval.time.length) {
          for (let t of pros.interval.time)
            if (t.hours === timeData.hours && t.minutes === timeData.minutes) {
              logger.info(`running job ${parent.name}.${pros.__name} with id: ${prop}`);
              Jobs[prop].parent[pros.__name](prop);
            }
        }

      } else if (pros.interval.time && pros.interval.time.length) {
        for (let t of pros.interval.time)
          if (t.hours === timeData.hours && t.minutes === timeData.minutes) {
            logger.info(`running job ${parent.name}.${pros.__name} with id: ${prop}`);
            Jobs[prop].parent[pros.__name](prop);
          }
      }
    }
  }
});