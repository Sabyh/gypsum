import * as EventEmitter from 'events';

export class GypsumEmitter extends EventEmitter {}

export const gypsumEmitter = new GypsumEmitter();