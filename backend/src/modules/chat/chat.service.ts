import { DashboardService } from '../dashboard/dashboard.service';

export class ChatService {
  private static FASTAPI_URL = 'http://localhost:8000/api/chat';

  static async generateResponse(message: string, organizationId: string): Promise<string> {
    try {
      // 1. Fetch live operational data from the Node.js DB connection
      const liveData = await DashboardService.getOverview(organizationId).catch(() => ({}));

      // 2. Forward message and context to the FastAPI Python service
      const response = await fetch(this.FASTAPI_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: message,
          live_context: liveData
        })
      });

      if (!response.ok) {
        throw new Error(`FastAPI Service Error: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data?.reply || "No reply from AI service.";
      
    } catch (error: any) {
      console.error('API Gateway Error connecting to Python service:', error);
      return `I encountered a problem connecting to the Python AI microservice. Ensure it is running on port 8000! Error: ${error.message}`;
    }
  }
}
