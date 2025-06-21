import React, { useEffect, useRef } from 'react';

export default function SoundNotification({ play }) {
  const audioRef = useRef();

  useEffect(() => {
    const unlockAudio = () => {
      if (audioRef.current) {
        audioRef.current.muted = true;
        audioRef.current.play().catch(() => {});
        window.removeEventListener('click', unlockAudio);
        window.removeEventListener('keydown', unlockAudio);
      }
    };
    
    window.addEventListener('click', unlockAudio);
    window.addEventListener('keydown', unlockAudio);
    
    return () => {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
  }, []);

  useEffect(() => {
    if (play && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.muted = false;
      audioRef.current.play().catch(error => {
        console.warn("Sound playback failed:", error);
      });
    }
  }, [play]);

  return (
    <audio 
      ref={audioRef} 
      preload="auto" 
      src="/notification.mp3" 
      style={{ display: 'none' }}
    />
  );
}