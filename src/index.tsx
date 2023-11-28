import React from 'react';
import axios from 'axios';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ReactDOM from 'react-dom/client';
import App from './app/App';
import SessionProvider from './components/sessionContext/SessionProvider';

if (process.env.NODE_ENV !== 'production') {
  const config = {
    rules: [
      {
        id: 'color-contrast',
        enabled: false
      }
    ]
  };
  // eslint-disable-next-line @typescript-eslint/no-var-requires, no-undef,global-require
  const axe = require('react-axe');
  axe(React, ReactDOM, 1000, config);
}

const root = ReactDOM.createRoot(document.getElementById('root') as Element);
const queryClient = new QueryClient();

      //just to get token manually
      axios.post('https://0.0.0.0:9443/api/v1/token/', {
          username: 'admin',
          password: 'pleasechangethispassword'
        }
      ).then(res => { console.log({res})});

root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient} >
      <SessionProvider>
        <App />
      </SessionProvider>
      <ReactQueryDevtools />
    </QueryClientProvider>
  </React.StrictMode>
);
