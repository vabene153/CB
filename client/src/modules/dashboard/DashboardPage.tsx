import React from 'react';

const DashboardPage: React.FC = () => {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
      <p className="text-sm text-slate-600">
        Willkommen im Baustellen-CRM. Hier werden später aktive Baustellen, Mitarbeiter im Einsatz, offene Tagesberichte und
        anstehende Wartungen angezeigt.
      </p>
    </div>
  );
};

export default DashboardPage;

