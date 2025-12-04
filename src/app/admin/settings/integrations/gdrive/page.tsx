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
import { 
  Loader2, CheckCircle2, XCircle, Folder, FolderOpen, Trash2, RefreshCw,
  Cloud, Link2, Settings2, ChevronRight, Check, ArrowLeft, Info, X
} from 'lucide-react';
import Link from 'next/link';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';

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
  const [dismissedNotice, setDismissedNotice] = useState(false);
  const [disconnectDialog, setDisconnectDialog] = useState(false);
  const [removeFolderDialog, setRemoveFolderDialog] = useState<SelectedFolder | null>(null);

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

  function handleDisconnectClick() {
    setDisconnectDialog(true);
  }

  async function handleDisconnect() {
    if (!connection) return;

    try {
      setDisconnecting(true);
      setDisconnectDialog(false);
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

  function handleRemoveFolderClick(folder: SelectedFolder) {
    setRemoveFolderDialog(folder);
  }

  async function handleRemoveFolder() {
    if (!connection || !removeFolderDialog) return;

    try {
      await removeFolder('gdrive', connection.id, removeFolderDialog.folder_id);
      toast.success(`Folder "${removeFolderDialog.folder_name}" removed`);
      setRemoveFolderDialog(null);
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
    <div className="p-3 sm:p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      {/* Breadcrumb Navigation - Best-in-class SaaS pattern */}
      <nav className="flex items-center gap-2 text-sm text-gray-600 mb-4">
        <Link 
          href="/admin/settings" 
          className="hover:text-gray-900 transition-colors"
        >
          Settings
        </Link>
        <ChevronRight className="h-4 w-4 text-gray-400" />
        <Link 
          href="/admin/settings" 
          className="hover:text-gray-900 transition-colors"
        >
          Integrations
        </Link>
        <ChevronRight className="h-4 w-4 text-gray-400" />
        <span className="text-gray-900 font-medium">Google Drive</span>
      </nav>

      {/* Header - Best-in-class SaaS pattern */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <Link
            href="/admin/settings"
            className="h-10 w-10 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 flex items-center justify-center transition-colors flex-shrink-0"
            title="Back to Settings"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
            <Cloud className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Google Drive Integration</h1>
            <p className="text-sm text-gray-500 mt-1">
              Automatically sync documents from your Google Drive
            </p>
          </div>
        </div>
      </div>

      {/* Testing Mode Notice - Detailed */}
      {!dismissedNotice && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="h-5 w-5 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Info className="h-4 w-4 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-amber-900 mb-1">
                    Google Drive Integration (Testing Mode)
                  </h3>
                  <p className="text-sm text-amber-800 leading-relaxed">
                    This integration is currently in Google's testing mode. When you connect your Google account, you may see a warning from Google about an unverified app. This is expected and safe—you can proceed by clicking <strong>"Advanced"</strong> and then <strong>"Go to Ask Abilitix (unsafe)"</strong>.
                  </p>
                  <p className="text-sm text-amber-700 mt-2">
                    We're working on Google verification to remove this notice. Your data remains secure and private.
                  </p>
                </div>
                <button
                  onClick={() => setDismissedNotice(true)}
                  className="text-amber-600 hover:text-amber-800 transition-colors flex-shrink-0"
                  aria-label="Dismiss notice"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Connection Status Card - Best-in-class design */}
      <Card className="border-2">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Link2 className="h-5 w-5 text-blue-600" />
                Connection Status
              </CardTitle>
              <CardDescription className="mt-1">
                Manage your Google Drive account connection
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {connection ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-4 flex-1">
                  <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900">Connected</span>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                        Active
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-700 font-medium mb-1">
                      {connection.provider_account_name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {connection.provider_account_id}
                    </div>
                    <div className="text-xs text-gray-400 mt-2">
                      Connected on {new Date(connection.created_at).toLocaleDateString('en-US', { 
                        month: 'long', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={handleDisconnectClick}
                  disabled={disconnecting}
                  className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                >
                  {disconnecting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Disconnecting...
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 mr-2" />
                      Disconnect
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-6 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Cloud className="h-6 w-6 text-gray-400" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 mb-1">Not Connected</div>
                    <div className="text-sm text-gray-600 max-w-md">
                      Connect your Google Drive account to automatically sync documents to Ask Abilitix. Your files will be securely synced and available for AI-powered search.
                    </div>
                  </div>
                </div>
                <Button
                  onClick={handleConnect}
                  disabled={connecting}
                  className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                >
                  {connecting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Link2 className="h-4 w-4 mr-2" />
                      Connect Google Drive
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Folder Selection */}
      {connection && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Folder className="h-5 w-5 text-blue-600" />
                Browse Folders
              </CardTitle>
              <CardDescription>
                Select folders from your Google Drive to automatically sync documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Browse and select folders to sync. Documents in selected folders will be automatically imported.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBrowseFolder('root')}
                    disabled={loadingBrowse['root']}
                    className="border-blue-200 text-blue-700 hover:bg-blue-50"
                  >
                    {loadingBrowse['root'] ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh Folders
                      </>
                    )}
                  </Button>
                </div>
                <div className="border rounded-lg bg-gray-50 p-4 max-h-96 overflow-y-auto">
                  {browsingFolders.length === 0 && !loadingBrowse['root'] ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Folder className="h-12 w-12 text-gray-300 mb-3" />
                      <p className="text-sm font-medium text-gray-900 mb-1">No folders loaded</p>
                      <p className="text-xs text-gray-500">
                        Click "Refresh Folders" to browse your Google Drive
                      </p>
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
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Selected Folders - Best-in-class design */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="h-5 w-5 text-blue-600" />
                Synced Folders
                {selectedFolders.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {selectedFolders.length}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Folders that are currently syncing documents to Ask Abilitix
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingFolders ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                </div>
              ) : selectedFolders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
                  <Folder className="h-12 w-12 text-gray-300 mb-3" />
                  <p className="text-sm font-medium text-gray-900 mb-1">No folders selected</p>
                  <p className="text-xs text-gray-500 max-w-sm">
                    Browse folders above and click "Select" to start syncing documents automatically
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedFolders.map((folder) => (
                    <div
                      key={folder.id}
                      className="group flex items-center justify-between p-4 border rounded-lg bg-white hover:border-blue-300 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          folder.sync_enabled ? 'bg-blue-100' : 'bg-gray-100'
                        }`}>
                          <Folder className={`h-5 w-5 ${
                            folder.sync_enabled ? 'text-blue-600' : 'text-gray-400'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-gray-900 truncate">
                              {folder.folder_name}
                            </span>
                            {folder.sync_enabled && (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 text-xs">
                                <Check className="h-3 w-3 mr-1" />
                                Syncing
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            Added {new Date(folder.created_at).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric', 
                              year: 'numeric' 
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          variant={folder.sync_enabled ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleToggleSync(folder)}
                          className={folder.sync_enabled 
                            ? 'bg-blue-600 hover:bg-blue-700' 
                            : 'border-gray-300'
                          }
                        >
                          {folder.sync_enabled ? (
                            <>
                              <Check className="h-3 w-3 mr-1.5" />
                              Enabled
                            </>
                          ) : (
                            'Enable Sync'
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveFolderClick(folder)}
                          className="text-gray-400 hover:text-red-600 hover:bg-red-50"
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

      {/* Disconnect Confirmation Dialog */}
      <ConfirmationDialog
        open={disconnectDialog}
        onClose={() => setDisconnectDialog(false)}
        onConfirm={handleDisconnect}
        title="Disconnect Google Drive"
        message="Are you sure you want to disconnect Google Drive? This will also remove all selected folders and stop syncing documents."
        confirmText="Disconnect"
        cancelText="Cancel"
        variant="destructive"
        loading={disconnecting}
        loadingText="Disconnecting..."
      />

      {/* Remove Folder Confirmation Dialog */}
      {removeFolderDialog && (
        <ConfirmationDialog
          open={!!removeFolderDialog}
          onClose={() => setRemoveFolderDialog(null)}
          onConfirm={handleRemoveFolder}
          title="Remove Folder"
          message={`Remove "${removeFolderDialog.folder_name}" from syncing? Documents from this folder will no longer be automatically imported.`}
          confirmText="Remove"
          cancelText="Cancel"
          variant="destructive"
        />
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
            <div className="flex items-center gap-2 py-2 px-2 hover:bg-blue-50 rounded-lg group transition-colors">
              <button
                onClick={() => {
                  if (hasChildren || isLoading) {
                    onToggleExpansion(folder.id);
                    if (!isExpanded && !isLoading) {
                      onBrowseFolder(folder.id);
                    }
                  }
                }}
                className="flex items-center gap-2 flex-1 text-left min-w-0"
                disabled={isLoading}
              >
                {hasChildren || isLoading ? (
                  isExpanded ? (
                    <FolderOpen className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  )
                ) : (
                  <div className="h-4 w-4 flex-shrink-0" />
                )}
                {!hasChildren && !isLoading && (
                  <Folder className="h-4 w-4 text-gray-400 flex-shrink-0" />
                )}
                <span className="text-sm text-gray-700 font-medium truncate">{folder.name}</span>
                {isLoading && (
                  <Loader2 className="h-3 w-3 animate-spin text-blue-600 flex-shrink-0" />
                )}
              </button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSelectFolder(folder)}
                className="flex-shrink-0 border-blue-200 text-blue-700 hover:bg-blue-100"
              >
                <Check className="h-3 w-3 mr-1.5" />
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

