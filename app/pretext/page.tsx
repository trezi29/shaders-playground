'use client';

import { prepare, layout } from '@chenglou/pretext';
import { useState, useEffect } from 'react';

export default function Page() {
  const [result, setResult] = useState<{ height: number; lineCount: number } | null>(null);

  useEffect(() => {
    const prepared = prepare('Your text', '16px Inter');
    const { height, lineCount } = layout(prepared, 400, 24);
    console.log(prepared);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setResult({ height, lineCount });
  }, []);

  return (
    <div>
      <h1>Pretext</h1>
      <p>Height: {result?.height ?? '—'}px</p>
      <p>Line count: {result?.lineCount ?? '—'}</p>
    </div>
  );
}
