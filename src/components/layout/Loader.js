import React, { useEffect, useState } from 'react';

export default function Loader({ children }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#fff',
        zIndex: 9999,
      }}>
        <div className="loader" />
        <style>{`
          .loader{
            width: 40px;
            aspect-ratio: 1;
            --c:no-repeat linear-gradient(#000 0 0);
            background: 
              var(--c) 0    0,
              var(--c) 0    100%, 
              var(--c) 50%  0,  
              var(--c) 50%  100%, 
              var(--c) 100% 0, 
              var(--c) 100% 100%;
            background-size: 8px 50%;
            animation: l7-0 1s infinite;
            position: relative;
            overflow: hidden;
          }
          .loader:before {
            content: "";
            position: absolute;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #000;
            top: calc(50% - 4px);
            left: -8px;
            animation: inherit;
            animation-name: l7-1;
          }
          @keyframes l7-0 {
           16.67% {background-size:8px 30%, 8px 30%, 8px 50%, 8px 50%, 8px 50%, 8px 50%}
           33.33% {background-size:8px 30%, 8px 30%, 8px 30%, 8px 30%, 8px 50%, 8px 50%}
           50%    {background-size:8px 30%, 8px 30%, 8px 30%, 8px 30%, 8px 30%, 8px 30%}
           66.67% {background-size:8px 50%, 8px 50%, 8px 30%, 8px 30%, 8px 30%, 8px 30%}
           83.33% {background-size:8px 50%, 8px 50%, 8px 50%, 8px 50%, 8px 30%, 8px 30%}
          }
          @keyframes l7-1 {
           20%  {left:0px}
           40%  {left:calc(50%  - 4px)}
           60%  {left:calc(100% - 8px)}
           80%,
           100% {left:100%}
          }
        `}</style>
      </div>
    );
  }
  return children;
} 