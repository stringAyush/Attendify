import React, { Suspense } from 'react';
import StudentDetailClient from './StudentDetailClient';

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <StudentDetailClient />
    </Suspense>
  );
}
