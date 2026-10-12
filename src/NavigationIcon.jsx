import React from 'react';

// A single rounded, monochrome stroke system for the application navigation.
export default function NavigationIcon({ name }) {
  const shapes = {
    audio: <><path d="M9 18V5l11-2v13M9 8l11-2" /><ellipse cx="6" cy="18" rx="3" ry="2" /><ellipse cx="17" cy="16" rx="3" ry="2" /></>,
    video: <><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m10 9 5 3-5 3Z" /></>,
    papers: <><rect x="6" y="3" width="15" height="17" rx="2" /><path d="M3 7v14h14M10 8h7m-7 4h7m-7 4h4" /></>,
    questions: <><rect x="4" y="3" width="16" height="18" rx="3" /><path d="M8 8h8m-8 4h8m-8 4h5" /></>,
    language: <><circle cx="12" cy="12" r="9" /><ellipse cx="12" cy="12" rx="4" ry="9" /><path d="M3 12h18M5 6.5h14M5 17.5h14" /></>,
    dashboard: <><rect x="3" y="3" width="18" height="18" rx="4" /><path d="M7 16v-4m5 4V7m5 9v-6" /></>,
    home: <><rect x="3" y="3" width="7" height="7" rx="2" /><rect x="14" y="3" width="7" height="7" rx="2" /><rect x="3" y="14" width="7" height="7" rx="2" /><path d="M17.5 14v7M14 17.5h7" /></>,
    schedule: <><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M7 3v5m10-5v5M3 11h18" /></>,
    requests: <><circle cx="6" cy="5" r="2" /><circle cx="6" cy="19" r="2" /><circle cx="18" cy="19" r="2" /><path d="M6 7v10m12 0V9a4 4 0 0 0-4-4h-2m3-3-3 3 3 3" /></>,
    teachers: <><circle cx="12" cy="12" r="9" /><path d="M12 6v6l-4 3" /></>,
    students: <><circle cx="9" cy="8" r="3" /><path d="M3 21v-2a6 6 0 0 1 12 0v2M16 5a3 3 0 0 1 0 6m2 4a5 5 0 0 1 3 4v2" /></>,
    courses: <><path d="M12 6c-3-2-6-2-9-1v15c3-1 6-1 9 1 3-2 6-2 9-1V5c-3-1-6-1-9 1Zm0 0v15" /><path d="M6 9h3m6 0h3" /></>,
    attendance: <><rect x="4" y="5" width="16" height="16" rx="3" /><rect x="8" y="3" width="8" height="4" rx="2" /><path d="m8 14 3 3 5-6" /></>,
    billing: <><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6Z" /><path d="M14 3v6h6M8 13h8m-8 4h5" /></>,
    settings: <><path d="m10 3-.5 2a7 7 0 0 0-2 1.2L5.5 6l-2 3.5L5 11v2l-1.5 1.5 2 3.5 2-.2a7 7 0 0 0 2 1.2l.5 2h4l.5-2a7 7 0 0 0 2-1.2l2 .2 2-3.5L19 13v-2l1.5-1.5-2-3.5-2 .2a7 7 0 0 0-2-1.2L14 3Z" /><circle cx="12" cy="12" r="3" /></>
  };
  return <svg className="navigation-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{shapes[name] || shapes.home}</svg>;
}
