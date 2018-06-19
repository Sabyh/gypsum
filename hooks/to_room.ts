import { Context } from "../context";
import { RESPONSE_CODES } from "../types";

export function toRoom(ctx: Context, room: string) {
  try {
    room = typeof room === "string" ? room : (<any>room).toString(); 
    ctx.response.room = ctx.response.room || room;
    ctx.next();
  } catch (err) {
    ctx.next({
      message: "toRoom hook error: invalid room name!",
      original: err,
      code: RESPONSE_CODES.BAD_REQUEST
    });
  }
}