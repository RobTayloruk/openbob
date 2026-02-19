export type EventHandler = (topic: string, data: Record<string, unknown>) => void;

export class EventBus {
  private handlers = new Set<EventHandler>();

  publish(topic: string, data: Record<string, unknown>) {
    for (const h of this.handlers) h(topic, data);
  }

  subscribe(handler: EventHandler) {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }
}
