import { objectUtil } from '../util/object';

export function searchQuery(req: any, res: any, next: Function): void {
  let query = req.originalUrl.split('?')[1];

  if (query && typeof query === 'string')
    req.query = objectUtil.toQueryObject(query);

  next();
}