'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  startOAuth, 
  listConnections, 
  deleteConnection,
  listSelectedFolders,
  browseFolders,
  selectFolder,
  updateFolderSync,
  removeFolder,
  type StorageConnection,
  type BrowseFolder,
  type SelectedFolder,
} from '@/lib/api/storage';
import { Loader2, CheckCircle2, XCircle, Folder, FolderOpen, Trash2, RefreshCw } from 'lucide-react';

export default function GoogleDriveIntegrationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [connection, setConnection] = useState<StorageConnection | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [selectedFolders, setSelectedFolders] = useState<SelectedFolder[]>([]);
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [browsingFolders, setBrowsingFolders] = useState<BrowseFolder[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [loadingBrowse, setLoadingBrowse] = useState<Record<string, boolean>>({});

  // Check for OAuth callback success
  useEffect(() => {
    const success = searchParams.get('success');
    const connectionId = searchParams.get('connection_id');
    const provider = searchParams.get('provider');

    if (success === '1' && connectionId && provider === 'gdrive') {
      toast.success('Google Drive connected successfully!');
      // Remove query params from URL
      router.replace('/admin/settings/integrations/gdrive');
      // Reload connection
      loadConnection();
    }
  }, [searchParams, router]);

  // Load connection on mount
  useEffect(() => {
    loadConnection();
  }, []);

  // Load selected folders when connection exists
  useEffect(() => {
    if (connection) {
      loadSelectedFolders();
    }
  }, [connection]);

  async function loadConnection() {
    try {
      setLoading(true);
      const response = await listConnections('gdrive');
      if (response.connections.length > 0) {
        setConnection(response.connections[0]);
      } else {
        setConnection(null);
      }
    } catch (error) {
      console.error('Failed to load connection:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load connection';
      toast.error(errorMessage);
      setConnection(null);
    } finally {
      setLoading(false);
    }
  }

  async function loadSelectedFolders() {
    if (!connection) return;

    try {
      setLoadingFolders(true);
      const response = await listSelectedFolders('gdrive', connection.id);
      setSelectedFolders(response.folders);
    } catch (error) {
      console.error('Failed to load selected folders:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load folders';
      toast.error(errorMessage);
    } finally {
      setLoadingFolders(false);
    }
  }

  async function handleConnect() {
    try {
      setConnecting(true);
      const redirectUri = `${window.location.origin}/admin/settings/integrations/gdrive?success=true`;
      const { oauth_url } = await startOAuth('gdrive', redirectUri);
      // Redirect to Google OAuth
      window.location.href = oauth_url;
    } catch (error) {
      console.error('Failed to start OAuth:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect Google Drive';
      toast.error(errorMessage);
      setConnecting(false);
    }
  }

  async function handleDisconnect() {
    if (!connection) return;

    if (!confirm('Are you sure you want to disconnect Google Drive? This will also remove all selected folders.')) {
      return;
    }

    try {
      setDisconnecting(true);
      await deleteConnection('gdrive', connection.id);
      toast.success('Google Drive disconnected successfully');
      setConnection(null);
      setSelectedFolders([]);
    } catch (error) {
      console.error('Failed to disconnect:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to disconnect Google Drive';
      toast.error(errorMessage);
    } finally {
      setDisconnecting(false);
    }
  }

  async function handleBrowseFolder(parentId: string = 'root') {
    if (!connection) return;

    const cacheKey = parentId;
    if (loadingBrowse[cacheKey]) return;

    try {
      setLoadingBrowse(prev => ({ ...prev, [cacheKey]: true }));
      const response = await browseFolders('gdrive', connection.id, parentId);
      
      // Filter to only show folders (not files)
      const folders = response.folders.filter(f => f.type === 'folder');
      
      // Update browsing folders state
      setBrowsingFolders(prev => {
        const existing = prev.filter(f => f.parent_id !== parentId);
        return [...existing, ...folders];
      });
    } catch (error) {
      console.error('Failed to browse folders:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to browse folders';
      toast.error(errorMessage);
    } finally {
      setLoadingBrowse(prev => ({ ...prev, [cacheKey]: false }));
    }
  }

  function toggleFolderExpansion(folderId: string) {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
        // Load children when expanding
        if (connection) {
          handleBrowseFolder(folderId);
        }
      }
      return next;
    });
  }

  async function handleSelectFolder(folder: BrowseFolder) {
    if (!connection) return;

    try {
      await selectFolder('gdrive', connection.id, {
        folder_id: folder.id,
        folder_name: folder.name,
        folder_type: folder.type,
        sync_enabled: true,
        provider_data: {},
      });
      toast.success(`Folder "${folder.name}" added for syncing`);
      await loadSelectedFolders();
    } catch (error) {
      console.error('Failed to select folder:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to select folder';
      toast.error(errorMessage);
    }
  }

  async function handleToggleSync(folder: SelectedFolder) {
    if (!connection) return;

    try {
      await updateFolderSync('gdrive', connection.id, folder.folder_id, !folder.sync_enabled);
      toast.success(`Sync ${!folder.sync_enabled ? 'enabled' : 'disabled'} for "${folder.folder_name}"`);
      await loadSelectedFolders();
    } catch (error) {
      console.error('Failed to toggle sync:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update sync status';
      toast.error(errorMessage);
    }
  }

  async function handleRemoveFolder(folder: SelectedFolder) {
    if (!connection) return;

    if (!confirm(`Remove "${folder.folder_name}" from syncing?`)) {
      return;
    }

    try {
      await removeFolder('gdrive', connection.id, folder.folder_id);
      toast.success(`Folder "${folder.folder_name}" removed`);
      await loadSelectedFolders();
    } catch (error) {
      console.error('Failed to remove folder:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove folder';
      toast.error(errorMessage);
    }
  }

  // Load root folders when connection exists and browsing starts
  useEffect(() => {
    if (connection && browsingFolders.length === 0) {
      handleBrowseFolder('root');
    }
  }, [connection]);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Google Drive Integration</h1>
        <p className="text-sm text-gray-600">
          Connect your Google Drive account to automatically sync documents to Ask Abilitix.
        </p>
      </div>

      {/* Connection Status Card */}
      <Card>
        <CardHeader>
          <CardTitle>Connection Status</CardTitle>
          <CardDescription>
            Manage your Google Drive connection
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {connection ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="font-medium">Connected</div>
                    <div className="text-sm text-gray-600">
                      {connection.provider_account_name} ({connection.provider_account_id})
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Connected: {new Date(connection.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <Button
                  variant="destructive"
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                >
                  {disconnecting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Disconnecting...
                    </>
                  ) : (
                    'Disconnect'
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <XCircle className="h-5 w-5 text-gray-400" />
                <div>
                  <div className="font-medium">Not Connected</div>
                  <div className="text-sm text-gray-600">
                    Connect your Google Drive account to start syncing documents
                  </div>
                </div>
              </div>
              <Button
                onClick={handleConnect}
                disabled={connecting}
              >
                {connecting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  'Connect Google Drive'
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Folder Selection */}
      {connection && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Browse Folders</CardTitle>
              <CardDescription>
                Select folders from your Google Drive to sync
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {browsingFolders.length === 0 && !loadingBrowse['root'] ? (
                  <div className="text-sm text-gray-500 py-4 text-center">
                    Click "Load Folders" to browse your Google Drive
                  </div>
                ) : (
                  <FolderTree
                    folders={browsingFolders}
                    parentId="root"
                    expandedFolders={expandedFolders}
                    loadingBrowse={loadingBrowse}
                    onToggleExpansion={toggleFolderExpansion}
                    onSelectFolder={handleSelectFolder}
                    onBrowseFolder={handleBrowseFolder}
                  />
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBrowseFolder('root')}
                  disabled={loadingBrowse['root']}
                  className="mt-4"
                >
                  {loadingBrowse['root'] ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Load Folders
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Selected Folders */}
          <Card>
            <CardHeader>
              <CardTitle>Selected Folders</CardTitle>
              <CardDescription>
                Folders that are currently syncing to Ask Abilitix
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingFolders ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                </div>
              ) : selectedFolders.length === 0 ? (
                <div className="text-sm text-gray-500 py-4 text-center">
                  No folders selected. Browse and select folders above to start syncing.
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedFolders.map((folder) => (
                    <div
                      key={folder.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <Folder className="h-5 w-5 text-blue-600" />
                        <div className="flex-1">
                          <div className="font-medium">{folder.folder_name}</div>
                          <div className="text-xs text-gray-500">
                            Added: {new Date(folder.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant={folder.sync_enabled ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleToggleSync(folder)}
                        >
                          {folder.sync_enabled ? 'Sync: ON' : 'Sync: OFF'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveFolder(folder)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

// Folder Tree Component
function FolderTree({
  folders,
  parentId,
  expandedFolders,
  loadingBrowse,
  onToggleExpansion,
  onSelectFolder,
  onBrowseFolder,
}: {
  folders: BrowseFolder[];
  parentId: string;
  expandedFolders: Set<string>;
  loadingBrowse: Record<string, boolean>;
  onToggleExpansion: (folderId: string) => void;
  onSelectFolder: (folder: BrowseFolder) => void;
  onBrowseFolder: (parentId: string) => void;
}) {
  const childFolders = folders.filter(f => f.parent_id === parentId);

  if (childFolders.length === 0) {
    return null;
  }

  return (
    <div className="space-y-1">
      {childFolders.map((folder) => {
        const isExpanded = expandedFolders.has(folder.id);
        const isLoading = loadingBrowse[folder.id];
        const hasChildren = folders.some(f => f.parent_id === folder.id);

        return (
          <div key={folder.id} className="pl-4">
            <div className="flex items-center gap-2 py-1 hover:bg-gray-50 rounded">
              <button
                onClick={() => {
                  if (hasChildren || isLoading) {
                    onToggleExpansion(folder.id);
                    if (!isExpanded && !isLoading) {
                      onBrowseFolder(folder.id);
                    }
                  }
                }}
                className="flex items-center gap-2 flex-1 text-left"
                disabled={isLoading}
              >
                {hasChildren || isLoading ? (
                  isExpanded ? (
                    <FolderOpen className="h-4 w-4 text-blue-600" />
                  ) : (
                    <Folder className="h-4 w-4 text-gray-400" />
                  )
                ) : (
                  <Folder className="h-4 w-4 text-gray-400" />
                )}
                <span className="text-sm">{folder.name}</span>
                {isLoading && (
                  <Loader2 className="h-3 w-3 animate-spin text-gray-400" />
                )}
              </button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSelectFolder(folder)}
              >
                Select
              </Button>
            </div>
            {isExpanded && (
              <FolderTree
                folders={folders}
                parentId={folder.id}
                expandedFolders={expandedFolders}
                loadingBrowse={loadingBrowse}
                onToggleExpansion={onToggleExpansion}
                onSelectFolder={onSelectFolder}
                onBrowseFolder={onBrowseFolder}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

