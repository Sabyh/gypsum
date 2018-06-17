import { Context } from "../context";

export function toRoom(ctx: Context, room: string) {
  ctx.response.room = ctx.response.room || room;
  ctx.next();
}