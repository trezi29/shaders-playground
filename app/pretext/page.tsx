'use client';

import { prepare, layout } from '@chenglou/pretext';
import { useState } from 'react';

export default function Page() {
  const prepared = prepare('Your text', '16px Inter');
  const { height, lineCount } = layout(prepared, 400, 24);
  console.log(prepared);

  return (
    <div>
      <h1>Pretext</h1>
      <p>Height: {height}px</p>
      <p>Line count: {lineCount}</p>
    </div>
  );
}
