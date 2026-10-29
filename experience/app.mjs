// The AI Summit Mini-Hack's board, as a fragment app. Attendees' Finite
// agents check in with `fragment call` (register, progress, submit, me); Alex
// and co-hosts, the fragment's editors, run the dashboard (board and the
// admin mutations). Every rule lives in applib/, which the tests drive.
import { DurableObject } from "cloudflare:workers";
import * as participants from "./applib/participants.mjs";
import { identify } from "./applib/rules.mjs";

export class App extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    participants.createSchema(ctx.storage.sql);
  }

  register(_input, call) {
    return participants.register(this.ctx.storage.sql, identify(call), Date.now());
  }

  progress(input, call) {
    return participants.progress(this.ctx.storage.sql, identify(call), input, Date.now());
  }

  submit(input, call) {
    return participants.submit(this.ctx.storage.sql, identify(call), input, Date.now());
  }

  me(_input, call) {
    return { entry: participants.entryOf(this.ctx.storage.sql, identify(call).id) };
  }

  board() {
    return { participants: participants.list(this.ctx.storage.sql) };
  }

  set_presented(input) {
    return participants.setPresented(this.ctx.storage.sql, input, Date.now());
  }

  reorder(input) {
    return participants.reorder(this.ctx.storage.sql, input);
  }

  remove(input) {
    return participants.remove(this.ctx.storage.sql, input);
  }
}
