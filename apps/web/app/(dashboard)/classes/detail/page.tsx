import React, { Suspense } from 'react';
import ClassDetailClient from './ClassDetailClient';

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ClassDetailClient />
    </Suspense>
  );
}
