// API Client for TryOnAI Backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Extract base URL without /api suffix for static files
const getBaseURL = () => {
  const url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
  // Remove /api suffix if present
  return url.replace(/\/api$/, '');
};

export interface TryOnSessionResponse {
  session_id: string;
  status: string;
  message: string;
}

export interface SessionStatus {
  id: string;
  status: 'created' | 'processing' | 'completed' | 'failed' | 'CREATED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  output_image_url?: string;
  error_reason?: string;
  progress_message?: string;
}

export class TryOnAPIClient {
  /**
   * Get the full URL for an image path
   * Converts relative paths like /uploads/outputs/abc.jpg to full URLs
   */
  static getImageURL(relativePath: string): string {
    if (!relativePath) return '';
    // If already a full URL, return as-is
    if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
      return relativePath;
    }
    // Construct full URL from base URL + relative path
    const baseURL = getBaseURL();
    return `${baseURL}${relativePath}`;
  }

  /**
   * Create a new try-on session by uploading user and garment images
   */
  static async createSession(
    userImage: File,
    garmentImage: File,
    userToken: string
  ): Promise<TryOnSessionResponse> {
    const formData = new FormData();
    formData.append('user_image', userImage);
    formData.append('garment_image', garmentImage);
    formData.append('user_token', userToken);

    const response = await fetch(`${API_BASE_URL}/tryon/sessions`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(error.detail || 'Failed to create session');
    }

    return response.json();
  }

  /**
   * Get the status of a try-on session
   */
  static async getSessionStatus(sessionId: string): Promise<SessionStatus> {
    const response = await fetch(`${API_BASE_URL}/tryon/sessions/${sessionId}`);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(error.detail || 'Failed to fetch session status');
    }

    return response.json();
  }

  /**
   * Poll session status until completion or failure
   */
  static async pollSessionStatus(
    sessionId: string,
    onProgress?: (status: SessionStatus) => void,
    maxAttempts: number = 60,
    intervalMs: number = 2000
  ): Promise<SessionStatus> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const status = await this.getSessionStatus(sessionId);
      
      if (onProgress) {
        onProgress(status);
      }

      if (status.status === 'completed' || status.status === 'failed') {
        return status;
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }

    throw new Error('Session polling timeout');
  }

  /**
   * Generate a user token (anonymous identifier)
   */
  static generateUserToken(): string {
    // Check if we have a stored token
    if (typeof window !== 'undefined') {
      let token = localStorage.getItem('tryon_user_token');
      if (!token) {
        token = `user_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        localStorage.setItem('tryon_user_token', token);
      }
      return token;
    }
    return `user_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }
}
