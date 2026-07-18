import axios from 'axios';

export class AgentServerClient {
  constructor(configuration) {
    this.configuration = configuration;
    this.httpClient = axios.create({
      baseURL: configuration.agentServerUrl,
      timeout: configuration.agentRequestTimeoutMilliseconds,
      headers: {
        'X-Internal-API-Key': configuration.agentServerApiKey,
        'Content-Type': 'application/json',
      },
    });
  }

  async sendChatMessage(chatRequest) {
    try {
      const response = await this.httpClient.post('/api/v1/chat', chatRequest);
      return response.data;
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        return {
          success: false,
          reply: 'The ERP assistant is temporarily unavailable. Please try again shortly.',
          classification: 'UNKNOWN',
          authenticated: false,
          error_code: 'AGENT_TIMEOUT',
        };
      }
      return {
        success: false,
        reply: 'The ERP assistant is temporarily unavailable. Please try again shortly.',
        classification: 'UNKNOWN',
        authenticated: false,
        error_code: 'AGENT_UNAVAILABLE',
      };
    }
  }

  async checkReadiness() {
    try {
      const response = await this.httpClient.get('/ready');
      return { reachable: true, data: response.data };
    } catch {
      return { reachable: false, data: null };
    }
  }
}
