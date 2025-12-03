/**
 * Client-side API helpers for Storage Connectors (Google Drive, etc.).
 * 
 * All functions make requests to Next.js API routes which proxy to Admin API.
 * 
 * @module lib/api/storage
 */

import { handleApiError } from './errorHandler';
import { safeParseJson } from './responseParser';

/**
 * Base URL for storage API routes.
 */
const API_BASE = '/api/admin/storage';

/**
 * Storage provider type.
 */
export type StorageProvider = 'gdrive';

/**
 * Connection status response.
 */
export interface StorageConnection {
  id: string;
  provider: StorageProvider;
  provider_account_id: string;
  provider_account_name: string;
  token_expires_at: string | null;
  created_at: string;
}

/**
 * Folder item from browse endpoint.
 */
export interface BrowseFolder {
  id: string;
  name: string;
  type: 'folder' | 'file';
  parent_id: string | null;
  modified_time: string;
}

/**
 * Selected folder (from list endpoint).
 */
export interface SelectedFolder {
  id: string; // UUID
  folder_id: string; // Provider-specific ID
  folder_name: string;
  folder_type: 'folder' | 'file';
  sync_enabled: boolean;
  created_at: string;
}

/**
 * OAuth start response.
 */
export interface OAuthStartResponse {
  ok: boolean;
  oauth_url: string;
  state: string;
}

/**
 * List connections response.
 */
export interface ListConnectionsResponse {
  ok: boolean;
  connections: StorageConnection[];
}

/**
 * Browse folders response.
 */
export interface BrowseFoldersResponse {
  ok: boolean;
  folders: BrowseFolder[];
}

/**
 * List selected folders response.
 */
export interface ListSelectedFoldersResponse {
  ok: boolean;
  folders: SelectedFolder[];
}

/**
 * Select folder request body.
 */
export interface SelectFolderRequest {
  folder_id: string;
  folder_name: string;
  folder_type: 'folder' | 'file';
  sync_enabled: boolean;
  provider_data?: Record<string, unknown>;
}

/**
 * Starts OAuth flow for connecting a storage provider.
 * 
 * @param provider - Storage provider (e.g., 'gdrive')
 * @param redirectUri - Frontend URL to redirect to after OAuth
 * @returns OAuth URL and state token
 * @throws Error if request fails
 * 
 * @example
 * ```typescript
 * const { oauth_url } = await startOAuth('gdrive', 'https://app.example.com/settings/integrations/gdrive?success=true');
 * window.location.href = oauth_url;
 * ```
 */
export async function startOAuth(
  provider: StorageProvider,
  redirectUri: string
): Promise<OAuthStartResponse> {
  const searchParams = new URLSearchParams();
  searchParams.set('redirect_uri', redirectUri);

  const url = `${API_BASE}/${provider}/oauth/start?${searchParams.toString()}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const data = await safeParseJson(response);
    throw new Error(handleApiError(response, data));
  }

  const data = await safeParseJson<OAuthStartResponse>(response);
  if (!data) {
    throw new Error('Empty response from server');
  }

  return data;
}

/**
 * Lists all connections for a storage provider.
 * 
 * @param provider - Storage provider (e.g., 'gdrive')
 * @returns List of connections
 * @throws Error if request fails
 * 
 * @example
 * ```typescript
 * const { connections } = await listConnections('gdrive');
 * if (connections.length === 0) {
 *   // Show "Connect" button
 * }
 * ```
 */
export async function listConnections(
  provider: StorageProvider
): Promise<ListConnectionsResponse> {
  const url = `${API_BASE}/${provider}/connections`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const data = await safeParseJson(response);
    throw new Error(handleApiError(response, data));
  }

  const data = await safeParseJson<ListConnectionsResponse>(response);
  if (!data) {
    throw new Error('Empty response from server');
  }

  return data;
}

/**
 * Gets a single connection by ID.
 * 
 * @param provider - Storage provider (e.g., 'gdrive')
 * @param connectionId - Connection UUID
 * @returns Connection details
 * @throws Error if request fails
 */
export async function getConnection(
  provider: StorageProvider,
  connectionId: string
): Promise<StorageConnection> {
  const url = `${API_BASE}/${provider}/connections/${connectionId}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const data = await safeParseJson(response);
    throw new Error(handleApiError(response, data));
  }

  const data = await safeParseJson<StorageConnection>(response);
  if (!data) {
    throw new Error('Empty response from server');
  }

  return data;
}

/**
 * Deletes a connection (also deletes associated folders via CASCADE).
 * 
 * @param provider - Storage provider (e.g., 'gdrive')
 * @param connectionId - Connection UUID
 * @throws Error if request fails
 * 
 * @example
 * ```typescript
 * await deleteConnection('gdrive', connectionId);
 * ```
 */
export async function deleteConnection(
  provider: StorageProvider,
  connectionId: string
): Promise<void> {
  const url = `${API_BASE}/${provider}/connections/${connectionId}`;

  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const data = await safeParseJson(response);
    throw new Error(handleApiError(response, data));
  }
}

/**
 * Browses folders in a connection (tree view).
 * 
 * @param provider - Storage provider (e.g., 'gdrive')
 * @param connectionId - Connection UUID
 * @param parentId - Parent folder ID (default: 'root')
 * @param includeSharedDrives - Include shared drives (default: false)
 * @returns List of folders
 * @throws Error if request fails
 * 
 * @example
 * ```typescript
 * const { folders } = await browseFolders('gdrive', connectionId, 'root');
 * ```
 */
export async function browseFolders(
  provider: StorageProvider,
  connectionId: string,
  parentId: string = 'root',
  includeSharedDrives: boolean = false
): Promise<BrowseFoldersResponse> {
  const searchParams = new URLSearchParams();
  searchParams.set('parent_id', parentId);
  if (includeSharedDrives) {
    searchParams.set('include_shared_drives', 'true');
  }

  const url = `${API_BASE}/${provider}/connections/${connectionId}/folders/browse?${searchParams.toString()}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const data = await safeParseJson(response);
    throw new Error(handleApiError(response, data));
  }

  const data = await safeParseJson<BrowseFoldersResponse>(response);
  if (!data) {
    throw new Error('Empty response from server');
  }

  return data;
}

/**
 * Lists selected folders for a connection.
 * 
 * @param provider - Storage provider (e.g., 'gdrive')
 * @param connectionId - Connection UUID
 * @returns List of selected folders
 * @throws Error if request fails
 * 
 * @example
 * ```typescript
 * const { folders } = await listSelectedFolders('gdrive', connectionId);
 * ```
 */
export async function listSelectedFolders(
  provider: StorageProvider,
  connectionId: string
): Promise<ListSelectedFoldersResponse> {
  const url = `${API_BASE}/${provider}/connections/${connectionId}/folders`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const data = await safeParseJson(response);
    throw new Error(handleApiError(response, data));
  }

  const data = await safeParseJson<ListSelectedFoldersResponse>(response);
  if (!data) {
    throw new Error('Empty response from server');
  }

  return data;
}

/**
 * Selects a folder for syncing (enables sync).
 * 
 * @param provider - Storage provider (e.g., 'gdrive')
 * @param connectionId - Connection UUID
 * @param folder - Folder details
 * @throws Error if request fails
 * 
 * @example
 * ```typescript
 * await selectFolder('gdrive', connectionId, {
 *   folder_id: 'gdrive-folder-id',
 *   folder_name: 'My Documents',
 *   folder_type: 'folder',
 *   sync_enabled: true,
 * });
 * ```
 */
export async function selectFolder(
  provider: StorageProvider,
  connectionId: string,
  folder: SelectFolderRequest
): Promise<void> {
  const url = `${API_BASE}/${provider}/connections/${connectionId}/folders`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(folder),
  });

  if (!response.ok) {
    const data = await safeParseJson(response);
    throw new Error(handleApiError(response, data));
  }
}

/**
 * Updates folder sync status (enable/disable sync).
 * 
 * @param provider - Storage provider (e.g., 'gdrive')
 * @param connectionId - Connection UUID
 * @param folderId - Provider-specific folder ID (not UUID)
 * @param syncEnabled - Enable or disable sync
 * @throws Error if request fails
 * 
 * @example
 * ```typescript
 * await updateFolderSync('gdrive', connectionId, 'gdrive-folder-id', true);
 * ```
 */
export async function updateFolderSync(
  provider: StorageProvider,
  connectionId: string,
  folderId: string,
  syncEnabled: boolean
): Promise<void> {
  const searchParams = new URLSearchParams();
  searchParams.set('sync_enabled', String(syncEnabled));

  const url = `${API_BASE}/${provider}/connections/${connectionId}/folders/${folderId}?${searchParams.toString()}`;

  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const data = await safeParseJson(response);
    throw new Error(handleApiError(response, data));
  }
}

/**
 * Removes a folder from sync.
 * 
 * @param provider - Storage provider (e.g., 'gdrive')
 * @param connectionId - Connection UUID
 * @param folderId - Provider-specific folder ID (not UUID)
 * @throws Error if request fails
 * 
 * @example
 * ```typescript
 * await removeFolder('gdrive', connectionId, 'gdrive-folder-id');
 * ```
 */
export async function removeFolder(
  provider: StorageProvider,
  connectionId: string,
  folderId: string
): Promise<void> {
  const url = `${API_BASE}/${provider}/connections/${connectionId}/folders/${folderId}`;

  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const data = await safeParseJson(response);
    throw new Error(handleApiError(response, data));
  }
}

