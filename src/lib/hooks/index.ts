import { Context } from '../context';
import { MongoModel } from '../model/mongo-model';
import { exists } from './exists';
import { filter } from './filter';
import { hash } from './hash';
import { validate } from './validate';

export const hooks = [
  exists,
  filter,
  hash,
  validate
];