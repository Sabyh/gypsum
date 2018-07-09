import { IProcess, ITimePeriod } from "./decorators";
import { Unique } from 'tools-box/unique';
import { timerEmitter, ItimerData } from "./timer";
import { Logger } from "./misc/logger";

const logger = new Logger('process-manager');
const processes: { [key: string]: { parent: any, process: IProcess } } = {};

export const processManger = {

  registerProcess(parent: any, process: IProcess) {
    let id = Unique.Get();
    processes[id] = { parent, process };
    logger.info(`process ${parent.name}.${process.__name} registered with id: ${id}`);

    if (process.event) {
      parent.emitter.on(process.event, (...args: any[]) => {
        process.triggered = true;

        if (process.interval && typeof process.interval === 'number') {
          if (process.timerId)
            clearInterval(process.timerId);

          process.timerId = setInterval(() => {
            if (process.paused)
              return;

            logger.info(`running process ${parent.name}.${process.__name} with id: ${id}`);
            parent[process.__name](id, ...args);
          }, process.interval);
        } else {
          if (process.paused)
            return;

          parent[process.__name](id, ...args);
        }
      });
    } if (process.interval && typeof process.interval === 'number') {
      process.timerId = setInterval(() => {
        if (process.paused)
          return;

        logger.info(`running process ${parent.name}.${process.__name} with id: ${id}`);
        parent[process.__name](id);
      }, process.interval);
    }

    processes[id] = { parent, process };
  },

  pauseProcess(id: string) {
    if (processes.hasOwnProperty(id)) {
      logger.info(`pausing process ${processes[id].parent.name}.${processes[id].process.__name} with id: ${id}`);
      processes[id].process.paused = true;
    }
  },
  
  resumeProcess(id: string) {
    if (processes.hasOwnProperty(id)) {
      logger.info(`resuming process ${processes[id].parent.name}.${processes[id].process.__name} with id: ${id}`);
      processes[id].process.paused = false;
    }
  },
  
  killProcess(id: string) {
    if (processes.hasOwnProperty(id)) {
      logger.info(`killing process ${processes[id].parent.name}.${processes[id].process.__name} with id: ${id}`);
      if (processes[id].process.event)
        processes[id].parent.emitter.removeAllListeners(processes[id].process.event);
  
      if (processes[id].process.timerId)
        clearInterval(processes[id].process.timerId);
  
      processes[id].process.triggered = false;
      processes[id].process.timerId = null;
      processes[id].process.paused = false;
      processes[id] = null;
      delete processes[id];
    }
  }
}


timerEmitter.on('timer', (timeData: ItimerData) => {
  for (let prop in processes) {
    let pros = processes[prop].process;
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
              logger.info(`running process ${parent.name}.${pros.__name} with id: ${prop}`);
              processes[prop].parent[pros.__name](prop);
            }
        }

      } else if (pros.interval.period === 'weekly') {
        pros.interval.days = pros.interval.days || [0];

        if (pros.interval.days.indexOf(timeData.weekDay) === -1)
          continue;

        if (pros.interval.time && pros.interval.time.length) {
          for (let t of pros.interval.time)
            if (t.hours === timeData.hours && t.minutes === timeData.minutes) {
              logger.info(`running process ${parent.name}.${pros.__name} with id: ${prop}`);
              processes[prop].parent[pros.__name](prop);
            }
        }

      } else if (pros.interval.time && pros.interval.time.length) {
        for (let t of pros.interval.time)
          if (t.hours === timeData.hours && t.minutes === timeData.minutes) {
            logger.info(`running process ${parent.name}.${pros.__name} with id: ${prop}`);
            processes[prop].parent[pros.__name](prop);
          }
      }
    }
  }
});