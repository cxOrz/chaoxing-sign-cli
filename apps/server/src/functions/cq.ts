export default class CQ {
  #ws_url: string;
  #ws_instance?: WebSocket;
  #target_type: string;
  #target_id: number;
  #cache: Map<string, any>;

  constructor(ws_url: string);
  constructor(ws_url: string, target_type: string, target_id: number);
  constructor(arg1: string, arg2?: string, arg3?: number) {
    this.#ws_url = arg1;
    this.#target_type = arg2 || 'private';
    this.#target_id = arg3 || 1001;
    this.#cache = new Map();
  }

  static hasImage = (msg: string) => {
    return msg.includes('[CQ:image');
  };

  connect() {
    if (!this.#ws_instance) this.#ws_instance = new WebSocket(this.#ws_url);
    // 连接失败处理
    this.#ws_instance.onerror = function (e) {
      console.log('[连接异常]', e);
    };
    return this;
  }

  send(text: string, target_id: number): void;
  send(text: string, target_id: number, action: string, payload: any): void;
  send(arg1: string, arg2: number, arg3?: string, arg4?: any): void {
    if (arg3) { this.#ws_instance?.send(JSON.stringify({ action: arg3, params: arg4 })); return; };
    const payload: any = {
      action: arg3 || 'send_msg',
      params: {
        message_type: this.#target_type,
        message: arg1,
        auto_escape: true
      }
    };
    this.#target_type === 'private' ? payload.params.user_id = arg2 : payload.params.group_id = arg2;
    this.#ws_instance?.send(JSON.stringify(payload));
  }

  close() {
    this.#ws_instance?.close();
  }

  getTargetID() {
    return this.#target_id;
  }

  getCache(key: string) {
    return this.#cache.get(key);
  }

  setCache(key: string, object: any) {
    this.#cache.set(key, object);
  }

  clearCache() {
    this.#cache.clear();
  }

  onMessage(handler: (this: CQ, data: string) => void) {
    if (this.#ws_instance) {
      this.#ws_instance.onmessage = (e) => {
        const data = JSON.parse(e.data);
        const isTarget = !!(data.group_id === this.#target_id || data.user_id === this.#target_id);
        // 仅处理消息类型，且来自目标用户或群
        if (data.post_type === 'message' && isTarget) {
          handler.call(this, data.raw_message);
        }
      };
    }
  }

}