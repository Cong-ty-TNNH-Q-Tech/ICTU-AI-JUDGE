import { useState, useCallback, useEffect, useRef } from 'react';
import axios from 'axios';
import { challengeService } from '../services/challengeService';
import { submissionService } from '../services/submissionService';
import { useToastStore } from '../store/toastStore';
import type { Submission } from '../models/api.types';

export function useSubmissionVM(challengeId: string) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const [rateLimitCountdown, setRateLimitCountdown] = useState<number | null>(null);
  const [togglingPrivateId, setTogglingPrivateId] = useState<string | null>(null);
  
  // Source code state
  const [sourceCodeUploading, setSourceCodeUploading] = useState(false);
  const [sourceCodeError, setSourceCodeError] = useState<string | null>(null);
  const [sourceCodeSuccess, setSourceCodeSuccess] = useState<string | null>(null);
  const [sourceCodeProgress, setSourceCodeProgress] = useState(0);

  // Expose polling status
  const [isPolling, setIsPolling] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Keep track of latest state for visibility listener
  const hasPendingRef = useRef(false);
  hasPendingRef.current = (submissions ?? []).some(
    (s) => s.status === 'PENDING' || s.status === 'PROCESSING'
  );

  const fetchSubmissions = useCallback(async (showLoading = true) => {
    if (!challengeId) return;
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const result = await challengeService.listSubmissions(challengeId);
      setSubmissions(result?.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi tải lịch sử nộp bài');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [challengeId]);

  // Initial fetch
  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  // Polling logic with Page Visibility API
  useEffect(() => {
    const startPolling = () => {
      if (!intervalRef.current) {
        setIsPolling(true);
        intervalRef.current = setInterval(() => {
          fetchSubmissions(false);
        }, 5000);
      }
    };

    const stopPolling = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        setIsPolling(false);
      }
    };

    if (hasPendingRef.current && !document.hidden) {
      startPolling();
    } else {
      stopPolling();
    }

    return () => stopPolling();
  }, [submissions, fetchSubmissions]);

  // Handle visibility change separately to avoid stale closures
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          setIsPolling(false);
        }
      } else {
        if (hasPendingRef.current) {
          fetchSubmissions(false); // Fetch immediately on return
          if (!intervalRef.current) {
            setIsPolling(true);
            intervalRef.current = setInterval(() => {
              fetchSubmissions(false);
            }, 5000);
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [fetchSubmissions]);

  // Countdown timer for rate limit
  useEffect(() => {
    if (rateLimitCountdown === null || rateLimitCountdown <= 0) {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      return;
    }

    if (!countdownIntervalRef.current) {
      countdownIntervalRef.current = setInterval(() => {
        setRateLimitCountdown((prev) => {
          if (prev && prev > 1) return prev - 1;
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
          return null;
        });
      }, 1000);
    }
  }, [rateLimitCountdown]);

  const submitFile = useCallback(async (file: File, maxFileSizeMb: number) => {
    if (!challengeId) return;
    
    // Client-side validation fallback
    const ext = file.name.toLowerCase();
    if ((!ext.endsWith('.csv') && !ext.endsWith('.zip')) || file.size > maxFileSizeMb * 1024 * 1024) {
      return; // Handled by UI component
    }

    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);
    setUploadProgress(0);

    try {
      await submissionService.submitFileWithProgress(
        challengeId,
        file,
        (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        }
      );
      
      setSubmitSuccess('Nộp bài thành công! Đang chờ chấm điểm...');
      await fetchSubmissions(false);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        if (err.response.status === 429) {
          const waitMinutes = err.response.data?.wait_minutes || 1;
          setRateLimitCountdown(waitMinutes * 60);
          setSubmitError(`Vi phạm Rate Limit. Vui lòng thử lại sau.`);
        } else if (err.response.status === 409) {
          setSubmitError('File này đã được nộp trước đó. Vui lòng không nộp trùng lặp.');
        } else {
          setSubmitError(err.response.data?.detail || err.message || 'Lỗi nộp bài');
        }
      } else {
        setSubmitError(err instanceof Error ? err.message : 'Lỗi nộp bài');
      }
    } finally {
      setSubmitting(false);
      // Giữ upload progress full khoảng nửa giây rồi reset nếu thành công
      setTimeout(() => setUploadProgress(0), 1000);
    }
  }, [challengeId, fetchSubmissions]);

  const toggleSelectForPrivate = useCallback(async (submissionId: string, currentValue: boolean) => {
    setTogglingPrivateId(submissionId);
    try {
      await submissionService.selectForPrivate(submissionId, !currentValue);
      // Cập nhật optimistic
      setSubmissions(prev => 
        prev.map(s => s.id === submissionId ? { ...s, is_selected_for_private: !currentValue } : s)
      );
    } catch (err) {
      useToastStore.getState().showToast(
        err instanceof Error ? err.message : 'Lỗi cập nhật trạng thái',
        'error'
      );
      // Fetch lại để revert trạng thái
      fetchSubmissions(false);
    } finally {
      setTogglingPrivateId(null);
    }
  }, [fetchSubmissions]);

  const clearSubmitMessages = useCallback(() => {
    setSubmitError(null);
    setSubmitSuccess(null);
  }, []);

  const uploadSourceCode = useCallback(async (submissionId: string, file: File, maxFileSizeMb: number) => {
    // Basic validation
    const ext = file.name.toLowerCase();
    if (!ext.endsWith('.zip') && !ext.endsWith('.rar') && file.size > maxFileSizeMb * 1024 * 1024) {
      return; 
    }

    setSourceCodeUploading(true);
    setSourceCodeError(null);
    setSourceCodeSuccess(null);
    setSourceCodeProgress(0);

    try {
      await submissionService.uploadSourceCodeWithProgress(
        submissionId,
        file,
        (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setSourceCodeProgress(percentCompleted);
          }
        }
      );
      
      setSourceCodeSuccess('Nộp Source Code thành công! Bạn đã hoàn thành bài thi.');
      await fetchSubmissions(false);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        setSourceCodeError(err.response.data?.detail || err.message || 'Lỗi nộp source code');
      } else {
        setSourceCodeError(err instanceof Error ? err.message : 'Lỗi nộp source code');
      }
    } finally {
      setSourceCodeUploading(false);
      setTimeout(() => setSourceCodeProgress(0), 1000);
    }
  }, [fetchSubmissions]);

  const clearSourceCodeMessages = useCallback(() => {
    setSourceCodeError(null);
    setSourceCodeSuccess(null);
  }, []);

  return { 
    submissions, 
    loading, 
    error, 
    submitting, 
    submitError, 
    submitSuccess,
    uploadProgress,
    rateLimitCountdown,
    togglingPrivateId,
    isPolling,
    sourceCodeUploading,
    sourceCodeError,
    sourceCodeSuccess,
    sourceCodeProgress,
    submitFile, 
    toggleSelectForPrivate,
    clearSubmitMessages,
    uploadSourceCode,
    clearSourceCodeMessages,
    refetch: fetchSubmissions 
  };
}
