import React, { useState, useMemo } from 'react';
import { useActivityLogs, useUsers } from '../hooks/useApiData';
import { usePagination } from '../hooks/usePagination';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';
import Select from './ui/Select';
import { Loader2, PlusCircle, Pencil, Trash2 } from './icons';
import Pagination from './Pagination';
import ConfirmationDialog from './ConfirmationDialog';
import type { ActivityLog } from '../types';
import { apiClient } from '@/lib/api/client';

type AugmentedActivity = ActivityLog & { userName: string };

const formatDistanceToNow = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
    const minutes = Math.round(seconds / 60);
    const hours = Math.round(minutes / 60);
    const days = Math.round(hours / 24);

    if (seconds < 60) return `${seconds}s ago`;
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
};

const ActionIcon: React.FC<{ action: ActivityLog['action'], className?: string }> = ({ action, className }) => {
    switch (action) {
        case 'create': return <PlusCircle className={`h-5 w-5 text-green-500 ${className}`} />;
        case 'update': return <Pencil className={`h-5 w-5 text-blue-500 ${className}`} />;
        case 'delete': return <Trash2 className={`h-5 w-5 text-red-500 ${className}`} />;
        default: return null;
    }
};

const getActionText = (log: AugmentedActivity) => {
    const actionVerb = {
        create: 'created',
        update: 'updated',
        delete: 'deleted'
    }[log.action];

    return (
        <>
            <span className="font-semibold text-gray-900 dark:text-gray-100">{log.userName}</span> {actionVerb} the {log.entityType.toLowerCase()} <span className="font-semibold text-gray-900 dark:text-gray-100">{log.entityName}</span>.
        </>
    )
};

const groupLogsByDay = (logs: AugmentedActivity[]) => {
    const groups = new Map<string, AugmentedActivity[]>();
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const todayStr = today.toDateString();
    const yesterdayStr = yesterday.toDateString();
    
    logs.forEach(log => {
        const logDate = new Date(log.createdAt);
        const logDateStr = logDate.toDateString();
        let key: string;

        if (logDateStr === todayStr) {
            key = 'Today';
        } else if (logDateStr === yesterdayStr) {
            key = 'Yesterday';
        } else {
            key = logDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }

        if (!groups.has(key)) {
            groups.set(key, []);
        }
        groups.get(key)!.push(log);
    });

    return groups;
};


const Activity: React.FC = () => {
    const { data: logsData, isLoading: logsLoading, refetch: refetchLogs } = useActivityLogs();
    const { data: usersData, isLoading: usersLoading } = useUsers();
    
    const [searchTerm, setSearchTerm] = useState('');
    const [userFilter, setUserFilter] = useState('');
    const [entityFilter, setEntityFilter] = useState('');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [showClearDialog, setShowClearDialog] = useState(false);

    const userMap = useMemo(() => new Map(usersData?.map(u => [u.id, u.name])), [usersData]);

    const augmentedLogs = useMemo(() => {
        if (!logsData) return [];
        return logsData.map(log => ({
            ...log,
            userName: userMap.get(log.userId) ?? 'Unknown User',
        })).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [logsData, userMap]);

    const filteredLogs = useMemo(() => {
        return augmentedLogs.filter(log => {
            const searchCorpus = `${log.userName} ${log.action} ${log.entityType} ${log.entityName} ${log.details?.field || ''} ${log.details?.from || ''} ${log.details?.to || ''}`.toLowerCase();
            const matchesSearch = searchCorpus.includes(searchTerm.toLowerCase());
            const matchesUser = !userFilter || log.userId === userFilter;
            const matchesEntity = !entityFilter || log.entityType === entityFilter;
            return matchesSearch && matchesUser && matchesEntity;
        });
    }, [augmentedLogs, searchTerm, userFilter, entityFilter]);

    const groupedLogs = useMemo(() => groupLogsByDay(filteredLogs), [filteredLogs]);
    const groupedEntries = useMemo(() => Array.from(groupedLogs.entries()), [groupedLogs]);
    const { paginatedData: paginatedGroups, ...paginationProps } = usePagination({ data: groupedEntries, itemsPerPage: 3 });


    const clearAllActivityLogs = async () => {
        console.log('clearAllActivityLogs - Starting to clear all activity logs');
        try {
            console.log('clearAllActivityLogs - Making API call to delete /activity-logs/clear');
            const result = await apiClient.delete('activity-logs/clear');
            console.log('clearAllActivityLogs - API call successful, result:', result);
            // After clearing, we need to trigger a re-fetch of the activity logs
            setShowClearDialog(false);
            await refetchLogs(); // Refresh the activity logs data instead of reloading the page
        } catch (error) {
            console.error('clearAllActivityLogs - Error clearing activity logs:', error);
            alert('Failed to clear activity logs: ' + (error as Error).message);
        }
    };

    const isLoading = logsLoading || usersLoading;

    return (
        <>
            <h1 className="text-3xl font-bold mb-6">Activity Log</h1>
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Recent Changes</CardTitle>
                            <CardDescription>A timeline of all changes made across the system.</CardDescription>
                        </div>
                        <Button 
                            variant="destructive" 
                            onClick={() => setShowClearDialog(true)}
                            disabled={isLoading || (augmentedLogs && augmentedLogs.length === 0)}
                        >
                            Clear All
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 mb-6">
                        <Input
                            placeholder="Search activities..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full sm:max-w-sm"
                        />
                        <Select value={userFilter} onChange={(e) => setUserFilter(e.target.value)} className="w-full sm:w-auto">
                            <option value="">All Users</option>
                            {usersData?.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </Select>
                        <Select value={entityFilter} onChange={(e) => setEntityFilter(e.target.value)} className="w-full sm:w-auto">
                            <option value="">All Types</option>
                            <option value="Product">Product</option>
                            <option value="Plan">Plan</option>
                            <option value="License">License</option>
                            <option value="User">User</option>
                            <option value="Company">Company</option>
                            <option value="Invoice">Invoice</option>
                            <option value="Device">Device</option>
                        </Select>
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center items-center h-64">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {groupedEntries.length > 0 ? paginatedGroups.map(([day, logs]) => (
                                <div key={day}>
                                    <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">{day}</h3>
                                    <div className="relative pl-8 border-l-2 border-gray-200 dark:border-gray-700">
                                        {logs.map((log, index) => (
                                            <div key={log.id} className="mb-8">
                                                <div className="absolute -left-[1.3rem] top-1 flex items-center justify-center bg-white dark:bg-gray-900">
                                                  <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center ring-4 ring-white dark:ring-gray-900">
                                                    <ActionIcon action={log.action} />
                                                  </div>
                                                </div>
                                                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex-grow text-sm text-gray-600 dark:text-gray-400">
                                                           {getActionText(log)}
                                                           <p className="text-xs text-muted-foreground mt-1">
                                                                {formatDistanceToNow(log.createdAt)}
                                                            </p>
                                                        </div>
                                                        {log.details && (
                                                            <Button variant="ghost" size="sm" onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}>
                                                                {expandedId === log.id ? 'Hide Details' : 'View Details'}
                                                            </Button>
                                                        )}
                                                    </div>
                                                    {expandedId === log.id && log.details && (
                                                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 text-xs">
                                                            <p className="font-semibold mb-1">Change Details:</p>
                                                            <div className="flex items-center">
                                                                <p className="w-20 text-muted-foreground">{log.details.field}:</p>
                                                                <p className="line-through text-red-500 mr-2">{log.details.from}</p>
                                                                <p className="text-green-500">{log.details.to}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-10 text-muted-foreground">
                                    <p>No activity found for the selected filters.</p>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
                <CardFooter>
                    <Pagination {...paginationProps} />
                </CardFooter>
            </Card>
            
            <ConfirmationDialog
                isOpen={showClearDialog}
                onClose={() => setShowClearDialog(false)}
                onConfirm={clearAllActivityLogs}
                title="Clear All Activity Logs"
                description="Are you sure you want to delete all activity logs? This action cannot be undone."
            />
        </>
    );
};

export default Activity;