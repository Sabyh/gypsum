import * as MongoDB from 'mongodb';

export function toObjectID(query: { [key: string]: any }) {
  if (!query || !query._id || query._id instanceof MongoDB.ObjectID)
    return query;

  if (typeof query._id === 'string') {
    query._id = new MongoDB.ObjectID(query._id);
    return query;
  }

  for (let prop in query._id) {
    if (Array.isArray(query._id[prop]))
      query._id[prop] = query._id[prop].map((id: string) => {
        if (typeof id === "string")
          return new MongoDB.ObjectID(id)

        return id;
      });
    else if (typeof query._id[prop] === 'string')
      query._id[prop] = new MongoDB.ObjectID(query._id[prop]);
  }

  return query;
} 