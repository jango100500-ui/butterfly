import React from 'react';
import { Head } from '../uis/head';
import { Empty } from '../uis/empty';
import { Tabs } from '../uis/tabs';

export const App: React.FC = () => {
  return (
    <main style={{ position: 'relative', flex: 1, width: '100%', height: '100%' }}>
      <Head />
      <Empty />
      <Tabs />
    </main>
  );
};
