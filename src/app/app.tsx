import React from 'react';

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    padding: '0 28px',
    textAlign: 'center' as const,
  },
  image: {
    width: '280px',
    height: '280px',
    objectFit: 'contain' as const,
    marginBottom: '28px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#000000',
    marginBottom: '10px',
    letterSpacing: '-0.5px',
  },
  subtitle: {
    fontSize: '17px',
    fontWeight: 400,
    color: '#8E8E93',
    lineHeight: 1.45,
    maxWidth: '320px',
    letterSpacing: '-0.2px',
  }
};

export const App: React.FC = () => {
  return (
    <main style={styles.container}>
      <img 
        src="/mocs/empty.png" 
        alt="Empty Inbox" 
        style={styles.image} 
      />
      <h1 style={styles.title}>
        Это твой личный инбокс
      </h1>
      <p style={styles.subtitle}>
        Бросай сюда всё, что хочешь — фото, видео, тексты, ссылки, файлы
      </p>
    </main>
  );
};
