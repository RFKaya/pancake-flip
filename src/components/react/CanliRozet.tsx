import { useState } from 'react';

interface Props {
  etiket?: string;
}

export default function CanliRozet({ etiket = "React Bileşeni" }: Props) {
  const [tikSayisi, setTikSayisi] = useState(0);

  return (
    <button
      onClick={() => setTikSayisi((prev) => prev + 1)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 12px',
        borderRadius: '999px',
        border: '1px solid #3b82f6',
        background: '#eff6ff',
        color: '#1d4ed8',
        fontSize: '13px',
        fontWeight: 600,
        cursor: 'pointer',
      }}
      title="React ile yazılmış etkileşimli bileşen"
    >
      <span>⚛️ {etiket}</span>
      {tikSayisi > 0 && (
        <span
          style={{
            background: '#1d4ed8',
            color: '#fff',
            borderRadius: '999px',
            padding: '1px 6px',
            fontSize: '11px',
          }}
        >
          {tikSayisi}
        </span>
      )}
    </button>
  );
}
