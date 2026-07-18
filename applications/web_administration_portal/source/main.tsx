/**
 * Raahi Web Administration Portal — Application entry point.
 *
 * Mounts the React application with authentication context,
 * TanStack Query provider, and toast notifications.
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthenticationContextProvider } from './shared_user_interface_infrastructure/authentication_state/AuthenticationContextProvider';
import { ApplicationRouter } from './ApplicationRouter';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthenticationContextProvider>
        <ApplicationRouter />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#ffffff',
              color: '#17251b',
              border: '1px solid #e1e7e2',
              borderRadius: '8px',
            },
          }}
        />
      </AuthenticationContextProvider>
    </QueryClientProvider>
  </StrictMode>
);
