import { State } from '../state';
import { Logger } from '../misc/logger';
import { Authentication } from './main';
import { initAuthorization } from '../Authorization';

export function initAuthentication() {
  Logger.Info('Initializing Authentication Layer...');
  State.Models.push(Authentication);


  if (State.config.authorization)
    initAuthorization();
}