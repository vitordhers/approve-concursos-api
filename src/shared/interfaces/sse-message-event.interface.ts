export interface SseMessageEvent {
  data: string | object;
  id?: string;
  type?: string;
  retry?: number;
}
