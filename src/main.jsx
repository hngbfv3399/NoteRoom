import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import store from './store/store.js';
import App from './App.jsx';
import './styles/index.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 30, // 30분
      cacheTime: 1000 * 60 * 60, // 1시간
      refetchOnWindowFocus: false, // 윈도우 포커스 시 refetch 비활성화
      refetchOnMount: false, // 마운트 시 refetch 비활성화
      refetchInterval: false, // 자동 refetch 비활성화
      retry: false, // 에러 시 재시도 비활성화
    },
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <App />
        <ReactQueryDevtools initialIsOpen={false} />
      </Provider>
    </QueryClientProvider>
  </StrictMode>
);
