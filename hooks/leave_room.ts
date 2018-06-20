import { Context } from "../context";

export function leaveRoom(ctx: Context, rooms: string | string[], sockets: string | string[]) {
  ctx.leaveRoom(rooms, sockets)
  .then(() => {
    ctx.next();
  })
  .catch(err => ctx.next(err));
}