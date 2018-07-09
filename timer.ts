import { GypsumEmitter } from './emitter';

export const timerEmitter = new GypsumEmitter();
export interface ItimerData {
  hours: number;
  minutes: number;
  day: number;
  weekDay: number;
  milliseconds: number;
}

setInterval(() => {
  let date = new Date();
  timerEmitter.emit('timer', { hour: date.getHours(), minute: date.getMinutes(), day: date.getDate(), weekDay: date.getDay(), milliseconds: Date.now() });
}, 60000);