import type {
  RookProvider,
  RookAuthorizationResponse,
  RookUserResponse,
  RookRevokeResponse,
  RookEnvironment,
} from './types'

// =====================================================
// ROOK API CLIENT
// =====================================================

const ROOK_SANDBOX_URL = 'https://api.rook-connect.review'
const ROOK_PRODUCTION_URL = 'https://api.rook-connect.com'

export class RookClient {
  private clientUuid: string
  private secretKey: string
  private baseUrl: string
  private accessToken: string | null = null
  private tokenExpiry: number = 0

  constructor(
    clientUuid?: string,
    secretKey?: string,
    environment: RookEnvironment = 'sandbox'
  ) {
    this.clientUuid = clientUuid || process.env.ROOK_CLIENT_UUID || ''
    this.secretKey = secretKey || process.env.ROOK_SECRET_KEY || ''
    
    const env = environment || process.env.ROOK_ENVIRONMENT || 'sandbox'
    this.baseUrl = env === 'production' ? ROOK_PRODUCTION_URL : ROOK_SANDBOX_URL

    if (!this.clientUuid || !this.secretKey) {
      console.warn('[RookClient] Missing ROOK_CLIENT_UUID or ROOK_SECRET_KEY')
    }
  }

  // =====================================================
  // AUTHENTICATION
  // =====================================================

  /**
   * Get access token for API calls
   */
  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid (with 5 minute buffer)
    if (this.accessToken && Date.now() < this.tokenExpiry - 300000) {
      return this.accessToken
    }

    const response = await fetch(`${this.baseUrl}/api/v1/auth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_uuid: this.clientUuid,
        secret_key: this.secretKey,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Rook auth failed: ${response.status} - ${error}`)
    }

    const data = await response.json()
    this.accessToken = data.access_token
    // Token typically valid for 1 hour
    this.tokenExpiry = Date.now() + (data.expires_in || 3600) * 1000

    return this.accessToken!
  }

  /**
   * Make authenticated API request
   */
  private async request<T>(
    method: string,
    endpoint: string,
    body?: unknown
  ): Promise<T> {
    const token = await this.getAccessToken()

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Rook API error: ${response.status} - ${error}`)
    }

    return response.json()
  }

  // =====================================================
  // USER MANAGEMENT
  // =====================================================

  /**
   * Register a user in Rook system
   * Must be called before getting authorization URL
   */
  async registerUser(userId: string): Promise<RookUserResponse> {
    return this.request<RookUserResponse>('POST', '/api/v1/users', {
      user_id: userId,
    })
  }

  /**
   * Get user info including connected data sources
   */
  async getUser(userId: string): Promise<RookUserResponse> {
    return this.request<RookUserResponse>('GET', `/api/v1/users/${userId}`)
  }

  /**
   * Delete user from Rook (and revoke all data source authorizations)
   */
  async deleteUser(userId: string): Promise<void> {
    await this.request<void>('DELETE', `/api/v1/users/${userId}`)
  }

  // =====================================================
  // DATA SOURCE AUTHORIZATION
  // =====================================================

  /**
   * Get authorization URL for a specific data source
   * User will be redirected to this URL to authorize
   */
  async getAuthorizationUrl(
    userId: string,
    dataSource: RookProvider,
    redirectUrl: string
  ): Promise<RookAuthorizationResponse> {
    return this.request<RookAuthorizationResponse>('POST', '/api/v1/authorizer', {
      user_id: userId,
      data_source: dataSource,
      redirect_url: redirectUrl,
    })
  }

  /**
   * Revoke authorization for a specific data source
   */
  async revokeDataSource(
    userId: string,
    dataSource: RookProvider
  ): Promise<RookRevokeResponse> {
    return this.request<RookRevokeResponse>('POST', '/api/v1/data-sources/revoke', {
      user_id: userId,
      data_source: dataSource,
    })
  }

  /**
   * Get list of authorized data sources for a user
   */
  async getDataSources(userId: string): Promise<RookUserResponse> {
    return this.getUser(userId)
  }

  // =====================================================
  // DATA RETRIEVAL (Manual Pull - Optional)
  // =====================================================

  /**
   * Request historical data sync for a user
   * Note: Rook typically delivers data via webhooks
   * This method is for manual sync requests
   */
  async requestSync(
    userId: string,
    dataSource: RookProvider,
    startDate: string,
    endDate: string
  ): Promise<{ success: boolean; message: string }> {
    return this.request('POST', '/api/v1/sync', {
      user_id: userId,
      data_source: dataSource,
      start_date: startDate,
      end_date: endDate,
    })
  }

  /**
   * Get physical summaries for a date range
   */
  async getPhysicalSummaries(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<unknown[]> {
    return this.request('GET', 
      `/api/v1/users/${userId}/physical?start_date=${startDate}&end_date=${endDate}`
    )
  }

  /**
   * Get sleep summaries for a date range
   */
  async getSleepSummaries(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<unknown[]> {
    return this.request('GET',
      `/api/v1/users/${userId}/sleep?start_date=${startDate}&end_date=${endDate}`
    )
  }

  /**
   * Get body summaries for a date range
   */
  async getBodySummaries(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<unknown[]> {
    return this.request('GET',
      `/api/v1/users/${userId}/body?start_date=${startDate}&end_date=${endDate}`
    )
  }

  /**
   * Get activity events for a date range
   */
  async getActivityEvents(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<unknown[]> {
    return this.request('GET',
      `/api/v1/users/${userId}/activities?start_date=${startDate}&end_date=${endDate}`
    )
  }
}

// =====================================================
// SINGLETON INSTANCE
// =====================================================

let rookClientInstance: RookClient | null = null

export function getRookClient(): RookClient {
  if (!rookClientInstance) {
    rookClientInstance = new RookClient()
  }
  return rookClientInstance
}

// =====================================================
// WEBHOOK VALIDATION
// =====================================================

/**
 * Validate incoming webhook signature
 */
export function validateWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  // Rook uses HMAC-SHA256 for webhook signatures
  const crypto = require('crypto')
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}
