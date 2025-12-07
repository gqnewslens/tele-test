'use client';

import { useState, useEffect, useCallback } from 'react';
import { Task, TaskStatus, TaskAttachment } from '@/lib/supabase/client';

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: '할 일',
  in_progress: '진행중',
  review: '검토',
  done: '완료',
};

const STATUS_COLORS: Record<TaskStatus, string> = {
  todo: 'bg-slate-600',
  in_progress: 'bg-amber-600',
  review: 'bg-purple-600',
  done: 'bg-emerald-600',
};

const PROGRESS_VALUES: Record<TaskStatus, number> = {
  todo: 0,
  in_progress: 25,
  review: 75,
  done: 100,
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<TaskStatus | 'all'>('all');
  const [isAdmin, setIsAdmin] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedAttachments, setSelectedAttachments] = useState<TaskAttachment[]>([]);

  // Form states
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');

  useEffect(() => {
    const storedToken = localStorage.getItem('adminToken');
    if (storedToken) {
      setToken(storedToken);
      setIsAdmin(true);
    }
  }, []);

  const fetchTasks = useCallback(async () => {
    try {
      const url = filter === 'all' ? '/api/tasks' : `/api/tasks?status=${filter}`;
      const res = await fetch(url);
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleCreateTask = async () => {
    if (!newTitle.trim() || !token) return;

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newTitle,
          description: newDescription || undefined,
        }),
      });

      if (res.ok) {
        setNewTitle('');
        setNewDescription('');
        setShowCreateModal(false);
        fetchTasks();
      }
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const handleStatusChange = async (taskId: number, newStatus: TaskStatus) => {
    if (!token) return;

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        fetchTasks();
        if (selectedTask?.id === taskId) {
          setSelectedTask({ ...selectedTask, status: newStatus, progress: PROGRESS_VALUES[newStatus] });
        }
      }
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (!token || !confirm('정말 삭제하시겠습니까?')) return;

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setShowDetailModal(false);
        setSelectedTask(null);
        fetchTasks();
      }
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const handleOpenDetail = async (task: Task) => {
    setSelectedTask(task);
    setShowDetailModal(true);

    // Fetch attachments
    try {
      const res = await fetch(`/api/tasks/${task.id}/attachments`);
      const data = await res.json();
      setSelectedAttachments(data.attachments || []);
    } catch (error) {
      console.error('Failed to fetch attachments:', error);
    }
  };

  const handleAddAttachment = async () => {
    if (!attachmentName.trim() || !attachmentUrl.trim() || !token || !selectedTask) return;

    try {
      const res = await fetch(`/api/tasks/${selectedTask.id}/attachments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: attachmentName,
          url: attachmentUrl,
          file_type: 'link',
        }),
      });

      if (res.ok) {
        setAttachmentName('');
        setAttachmentUrl('');
        // Refresh attachments
        const attachRes = await fetch(`/api/tasks/${selectedTask.id}/attachments`);
        const data = await attachRes.json();
        setSelectedAttachments(data.attachments || []);
      }
    } catch (error) {
      console.error('Failed to add attachment:', error);
    }
  };

  const handleDeleteAttachment = async (attachmentId: number) => {
    if (!token || !selectedTask) return;

    try {
      const res = await fetch(`/api/tasks/${selectedTask.id}/attachments/${attachmentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setSelectedAttachments(selectedAttachments.filter((a) => a.id !== attachmentId));
      }
    } catch (error) {
      console.error('Failed to delete attachment:', error);
    }
  };

  const filteredTasks = tasks;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-100">Tasks</h1>
        {isAdmin && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors text-sm font-medium"
          >
            + 새 태스크
          </button>
        )}
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'todo', 'in_progress', 'review', 'done'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === status
                ? 'bg-cyan-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {status === 'all' ? '전체' : STATUS_LABELS[status]}
          </button>
        ))}
      </div>

      {/* Hint */}
      <p className="text-xs text-slate-500">
        텔레그램에서 <span className="text-cyan-400">[task] 제목</span> 형식으로 메시지를 보내면 자동으로 태스크가 생성됩니다
      </p>

      {/* Task List */}
      <div className="grid gap-2">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12 text-slate-500">태스크가 없습니다</div>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              onClick={() => handleOpenDetail(task)}
              className="bg-slate-900 border border-slate-700 rounded-lg p-4 hover:border-cyan-600 hover:bg-slate-800 cursor-pointer transition-all"
            >
              <div className="flex items-center gap-3">
                {/* Status badge */}
                <span
                  className={`px-2.5 py-1 rounded text-xs font-semibold ${STATUS_COLORS[task.status]}`}
                >
                  {STATUS_LABELS[task.status]}
                </span>

                {/* Title */}
                <span className="flex-1 text-slate-100 font-medium truncate">{task.title}</span>

                {/* Progress */}
                <div className="flex items-center gap-2 w-36">
                  <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-500 transition-all"
                      style={{ width: `${task.progress}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-400 w-10 text-right">{task.progress}%</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md mx-4 border border-slate-700">
            <h2 className="text-lg font-semibold text-slate-100 mb-4">새 태스크</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">제목</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-600"
                  placeholder="태스크 제목"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">설명 (선택)</label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-600 resize-none"
                  rows={3}
                  placeholder="상세 설명"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleCreateTask}
                disabled={!newTitle.trim()}
                className="flex-1 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                생성
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-lg mx-4 border border-slate-700 max-h-[80vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-100">{selectedTask.title}</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-slate-500 hover:text-slate-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Description */}
            <div className="mb-4">
              <label className="block text-sm text-slate-400 mb-2">내용</label>
              {isAdmin ? (
                <textarea
                  value={selectedTask.description || ''}
                  onChange={(e) => setSelectedTask({ ...selectedTask, description: e.target.value })}
                  onBlur={async () => {
                    try {
                      await fetch(`/api/tasks/${selectedTask.id}`, {
                        method: 'PUT',
                        headers: {
                          'Content-Type': 'application/json',
                          'x-admin-token': adminToken,
                        },
                        body: JSON.stringify({ description: selectedTask.description }),
                      });
                      setTasks(tasks.map(t => t.id === selectedTask.id ? { ...t, description: selectedTask.description } : t));
                    } catch (error) {
                      console.error('Failed to update description:', error);
                    }
                  }}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-cyan-600 resize-none min-h-[100px]"
                  placeholder="태스크 내용을 입력하세요..."
                />
              ) : (
                <p className="text-slate-300 text-sm whitespace-pre-wrap bg-slate-900/50 rounded-lg p-3 min-h-[60px]">
                  {selectedTask.description || '내용 없음'}
                </p>
              )}
            </div>

            {/* Progress bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-slate-400">진도율</span>
                <span className="text-sm text-cyan-400">{selectedTask.progress}%</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-500 transition-all"
                  style={{ width: `${selectedTask.progress}%` }}
                />
              </div>
            </div>

            {/* Status selector */}
            {isAdmin && (
              <div className="mb-6">
                <label className="block text-sm text-slate-400 mb-2">상태 변경</label>
                <div className="flex gap-2 flex-wrap">
                  {(['todo', 'in_progress', 'review', 'done'] as TaskStatus[]).map((status) => (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(selectedTask.id!, status)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        selectedTask.status === status
                          ? `${STATUS_COLORS[status]} text-white`
                          : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                      }`}
                    >
                      {STATUS_LABELS[status]} ({PROGRESS_VALUES[status]}%)
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Attachments */}
            <div className="border-t border-slate-700 pt-4">
              <h3 className="text-sm font-medium text-slate-300 mb-3">첨부 파일</h3>

              {selectedAttachments.length > 0 ? (
                <ul className="space-y-2 mb-4">
                  {selectedAttachments.map((att) => (
                    <li key={att.id} className="flex items-center gap-2 text-sm">
                      <a
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-400 hover:underline truncate flex-1"
                      >
                        {att.name}
                      </a>
                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteAttachment(att.id!)}
                          className="text-slate-500 hover:text-red-400"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-500 text-sm mb-4">첨부 파일이 없습니다</p>
              )}

              {/* Add attachment form */}
              {isAdmin && (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={attachmentName}
                    onChange={(e) => setAttachmentName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-cyan-600"
                    placeholder="파일명"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={attachmentUrl}
                      onChange={(e) => setAttachmentUrl(e.target.value)}
                      className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-cyan-600"
                      placeholder="URL"
                    />
                    <button
                      onClick={handleAddAttachment}
                      disabled={!attachmentName.trim() || !attachmentUrl.trim()}
                      className="px-4 py-2 bg-cyan-600 text-white rounded-lg text-sm hover:bg-cyan-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      추가
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Delete button */}
            {isAdmin && (
              <div className="border-t border-slate-700 pt-4 mt-4">
                <button
                  onClick={() => handleDeleteTask(selectedTask.id!)}
                  className="w-full px-4 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors text-sm"
                >
                  태스크 삭제
                </button>
              </div>
            )}

            {/* Meta info */}
            <div className="border-t border-slate-700 pt-4 mt-4 text-xs text-slate-500">
              <p>생성: {new Date(selectedTask.created_at!).toLocaleString('ko-KR')}</p>
              {selectedTask.created_by && <p>생성자: {selectedTask.created_by}</p>}
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
