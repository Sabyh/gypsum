import { Context } from "../context";

export function joinRoom(ctx: Context, rooms: string | string[], sockets: string | string[]) {
  ctx.joinRoom(rooms, sockets)
    .then(() => {
      ctx.next();
    })
    .catch(err => ctx.next(err));
}