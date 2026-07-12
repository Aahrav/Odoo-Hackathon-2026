export class QdrantService {
  private static readonly QDRANT_URL = 'http://localhost:6333';
  private static readonly COLLECTION_NAME = 'transit_policies';

  /**
   * Generates embeddings using local Ollama instance
   */
  static async getEmbeddings(text: string): Promise<number[]> {
    try {
      const response = await fetch('http://localhost:11434/api/embeddings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'nomic-embed-text:latest',
          prompt: text
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.embedding;
    } catch (error) {
      console.error('Failed to get embeddings from Ollama:', error);
      return []; // Return empty if ollama fails so we can fallback to normal chat
    }
  }

  /**
   * Search Qdrant for similar documents
   */
  static async search(queryText: string, limit: number = 3): Promise<any[]> {
    try {
      const vector = await this.getEmbeddings(queryText);
      if (!vector || vector.length === 0) return [];

      const response = await fetch(`${this.QDRANT_URL}/collections/${this.COLLECTION_NAME}/points/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vector: vector,
          limit: limit,
          with_payload: true
        })
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.warn('Qdrant collection not found (might not be initialized yet)');
          return [];
        }
        throw new Error(`Qdrant search error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.result || [];
    } catch (error) {
      console.error('Failed to search Qdrant:', error);
      return [];
    }
  }
}
