export class RecentMessageDeduplicator {
  constructor(maximumMessageCount = 500) {
    this.maximumMessageCount = maximumMessageCount;
    this.processedMessageIds = new Map();
  }

  hasAlreadyProcessed(messageId) {
    if (this.processedMessageIds.has(messageId)) {
      return true;
    }
    this.processedMessageIds.set(messageId, Date.now());
    if (this.processedMessageIds.size > this.maximumMessageCount) {
      const oldestMessageId = this.processedMessageIds.keys().next().value;
      this.processedMessageIds.delete(oldestMessageId);
    }
    return false;
  }
}
