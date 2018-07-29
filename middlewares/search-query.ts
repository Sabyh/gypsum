import { URL } from 'tools-box/url';

export function searchQuery(req: any, res: any, next: Function): void {
  req.query = URL.GetQueryObject(req.originalUrl);

  next();
}