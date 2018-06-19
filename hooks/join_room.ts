import { Context } from "../context";

export function joinRoom(ctx: Context, rooms: string | string[], sockets: string | string[]) {
  ctx.joinRoom(rooms, sockets);
  ctx.next();
}