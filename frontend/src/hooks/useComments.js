import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { commentsApi } from '../services/api';
import toast from 'react-hot-toast';

export const useComments = (documentId) => {
  return useQuery({
    queryKey: ['comments', documentId],
    queryFn: () => commentsApi.getByDocument(documentId).then(r => r.data.comments),
    enabled: !!documentId,
  });
};

export const useCreateComment = (documentId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => commentsApi.create({ ...data, documentId }).then(r => r.data.comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', documentId] });
      toast.success('Comment added');
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to add comment'),
  });
};

export const useAddReply = (documentId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ commentId, content }) => commentsApi.addReply(commentId, { content }).then(r => r.data.comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', documentId] });
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to add reply'),
  });
};

export const useResolveComment = (documentId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (commentId) => commentsApi.resolve(commentId).then(r => r.data.comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', documentId] });
    },
  });
};

export const useDeleteComment = (documentId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (commentId) => commentsApi.delete(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', documentId] });
      toast.success('Comment deleted');
    },
  });
};
