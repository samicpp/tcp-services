import { libOpt } from "./debug.ts";

export class Eventable {
  #on = {};
  #que = {};
  on(eventName: string, listener: (event: any) => void | Promise<void>): void {
    if (libOpt.eventDbg) console.log("on", eventName, listener);
    if (!this.#on[eventName]) this.#on[eventName] = [];
    this.#on[eventName].push(listener);
    if (this.#que[eventName]) {
      this.#que[eventName].forEach((e) => listener(e));
      this.#que[eventName] = [];
    };
  }
  emit(eventName: string, obj: any) {
    if (libOpt.eventDbg) console.log("emit", eventName, obj);
    //console.log(eventName,obj);
    if (!this.#que[eventName]) this.#que[eventName] = [];
    if (this.#on[eventName]) this.#on[eventName].forEach((e) => e(obj));
    else this.#que[eventName].push(obj);
  }
};