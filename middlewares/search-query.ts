import TB from 'tools-box';

export function searchQuery(req: any, res: any, next: Function): void {
  let query = req.originalUrl.split('?')[1];

  if (query && typeof query === 'string')
    req.query = TB.queryStrToObject(query);

  next();
}