import * as MongoDB from 'mongodb';

export function toObjectID(query: { [key: string]: any }) {
  if (!query || !query._id)
    return query;

  if (typeof query._id === 'string') {
    query._id = new MongoDB.ObjectID(query._id);
    return query;
  }

  for (let prop in query._id) {
    if (Array.isArray(query._id[prop]))
      query._id[prop] = query._id[prop].map((id: string) => new MongoDB.ObjectId(id));
    else if (typeof query._id[prop] === 'string')
      query._id[prop] = new MongoDB.ObjectID(query._id[prop]);
  }

  return query;
} 