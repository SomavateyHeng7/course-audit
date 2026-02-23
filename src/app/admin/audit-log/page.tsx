'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  ClipboardList, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  LogIn, 
  LogOut, 
  Pencil, 
  Trash2, 
  Plus, 
  RefreshCw,
  Filter,
  User,
  Clock,
  Globe
} from 'lucide-react';
import { getAuditLogs } from '@/lib/api/laravel';

interface AuditLogEntry {
  id: string;
  user_id: string;
  entity_type: string | null;
  entity_id: string | null;
  action: string;
  changes: Record<string, any> | null;
  description: string | null;
  ip_address: string | null;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

const actionColors: Record<string, string> = {
  LOGIN: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  LOGOUT: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
  CREATE: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  UPDATE: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  DELETE: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  ASSIGN: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  UNASSIGN: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  IMPORT: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300',
  EXPORT: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300',
};

const actionIcons: Record<string, typeof LogIn> = {
  LOGIN: LogIn,
  LOGOUT: LogOut,
  CREATE: Plus,
  UPDATE: Pencil,
  DELETE: Trash2,
};

const roleColors: Record<string, string> = {
  SUPER_ADMIN: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  CHAIRPERSON: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  ADVISOR: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  STUDENT: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
};

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 25, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterEntityType, setFilterEntityType] = useState('');

  const fetchLogs = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params: any = { limit: 25, page };
      if (filterAction) params.action = filterAction;
      if (filterEntityType) params.entity_type = filterEntityType;

      const data = await getAuditLogs(params);
      setLogs(data.logs || []);
      setPagination(data.pagination || { page: 1, limit: 25, total: 0, pages: 0 });
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  }, [filterAction, filterEntityType]);

  useEffect(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const filteredLogs = logs.filter((log) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (log.user?.name || '').toLowerCase().includes(term) ||
      (log.user?.email || '').toLowerCase().includes(term) ||
      (log.action || '').toLowerCase().includes(term) ||
      (log.entity_type || '').toLowerCase().includes(term) ||
      (log.description || '').toLowerCase().includes(term)
    );
  });

  if (loading && logs.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1F3A93]" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Audit Log</h2>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
            Track user logins, edits, and system changes
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => fetchLogs(pagination.page)}
          disabled={loading}
          className="w-full sm:w-auto"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by user, action, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm bg-white dark:bg-gray-800 dark:border-gray-700"
              >
                <option value="">All Actions</option>
                <option value="LOGIN">Login</option>
                <option value="LOGOUT">Logout</option>
                <option value="CREATE">Create</option>
                <option value="UPDATE">Update</option>
                <option value="DELETE">Delete</option>
                <option value="ASSIGN">Assign</option>
                <option value="UNASSIGN">Unassign</option>
                <option value="IMPORT">Import</option>
                <option value="EXPORT">Export</option>
              </select>
              <select
                value={filterEntityType}
                onChange={(e) => setFilterEntityType(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm bg-white dark:bg-gray-800 dark:border-gray-700"
              >
                <option value="">All Types</option>
                <option value="AUTH">Auth</option>
                <option value="CURRICULUM">Curriculum</option>
                <option value="COURSE">Course</option>
                <option value="USER">User</option>
                <option value="CONCENTRATION">Concentration</option>
                <option value="BLACKLIST">Blacklist</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Log Entries */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <ClipboardList className="h-4 w-4 sm:h-5 sm:w-5" />
            Activity Log ({pagination.total} entries)
          </CardTitle>
          <CardDescription className="text-sm">
            Recent system activity and user actions
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-lg font-medium">No audit logs found</p>
              <p className="text-sm mt-1">Activity will appear here as users interact with the system.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLogs.map((log) => {
                const ActionIcon = actionIcons[log.action] || Filter;
                return (
                  <div
                    key={log.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 sm:p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    {/* Icon */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                        actionColors[log.action] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                      }`}>
                        <ActionIcon className="h-4 w-4" />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <Badge className={actionColors[log.action] || 'bg-gray-100 text-gray-800'}>
                          {log.action}
                        </Badge>
                        {log.entity_type && (
                          <Badge variant="outline" className="text-xs">
                            {log.entity_type}
                          </Badge>
                        )}
                        {log.user?.role && (
                          <Badge className={`text-xs ${roleColors[log.user.role] || ''}`}>
                            {log.user.role}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-900 dark:text-white font-medium truncate">
                        {log.description || `${log.action} on ${log.entity_type || 'unknown'}`}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {log.user && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {log.user.name} ({log.user.email})
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(log.created_at)}
                        </span>
                        {log.ip_address && (
                          <span className="flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            {log.ip_address}
                          </span>
                        )}
                      </div>
                      {log.changes && Object.keys(log.changes).length > 0 && (
                        <details className="mt-2">
                          <summary className="text-xs text-blue-600 dark:text-blue-400 cursor-pointer hover:underline">
                            View changes
                          </summary>
                          <pre className="mt-1 text-xs bg-gray-50 dark:bg-gray-900 p-2 rounded border overflow-x-auto max-h-40">
                            {JSON.stringify(log.changes, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Page {pagination.page} of {pagination.pages} ({pagination.total} total)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchLogs(pagination.page - 1)}
                  disabled={pagination.page <= 1 || loading}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchLogs(pagination.page + 1)}
                  disabled={pagination.page >= pagination.pages || loading}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
