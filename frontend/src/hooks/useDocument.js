import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentsApi } from '../services/api';
import toast from 'react-hot-toast';

export const useDocuments = (params) => {
  return useQuery({
    queryKey: ['documents', params],
    queryFn: () => documentsApi.getAll(params).then(r => r.data.documents),
  });
};

export const useDocument = (id) => {
  return useQuery({
    queryKey: ['document', id],
    queryFn: () => documentsApi.getOne(id).then(r => r.data),
    enabled: !!id,
  });
};

export const useCreateDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => documentsApi.create(data).then(r => r.data.document),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || 'Failed to create document');
    },
  });
};

export const useUpdateDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => documentsApi.update(id, data).then(r => r.data.document),
    onSuccess: (doc) => {
      queryClient.setQueryData(['document', doc._id], (old) => ({ ...old, document: doc }));
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
};

export const useDeleteDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => documentsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Document deleted');
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || 'Failed to delete document');
    },
  });
};

export const useShareDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => documentsApi.share(id, data).then(r => r.data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['document', variables.id] });
      toast.success(data.message || 'Document shared');
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || 'Failed to share document');
    },
  });
};
