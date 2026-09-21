import React from 'react';
import { Empty } from '../uis/empty';

export const App: React.FC = () => {
  return (
    <main style={{ flex: 1, width: '100%', height: '100%' }}>
      <Empty />
    </main>
  );
};
