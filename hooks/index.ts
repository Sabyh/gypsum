import { Context } from '../context';
import { MongoModel } from '../models';
import { exists } from './exists';
import { filter } from './filter';
import { hash } from './hash';
import { validate } from './validate';
import { reference } from './reference';
import { toRoom } from './to_room';
import { joinRoom } from './join_room';
import { leaveRoom } from './leave_room';

export const hooks = [
  exists,
  filter,
  hash,
  validate,
  reference,
  toRoom,
  joinRoom,
  leaveRoom
];