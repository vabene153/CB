import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';

const ProjekteListPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const tenantId = searchParams.get('tenantId');

  return (
    <div className="module-page">
      <div className="module-header">
        <h1 className="module-title">Projekte</h1>
        <p className="module-subtitle">Baustellen und Projekte{tenantId ? ` (Mandant ${tenantId})` : ''}.</p>
      </div>
      <div className="placeholder-page">
        <p className="module-muted">Dieser Bereich wird noch ausgebaut. Hier erscheinen später die Projekte des Mandanten.</p>
        {tenantId && <Link to={`/mandanten/${tenantId}`} className="link-action">← Zurück zum Mandanten-Dashboard</Link>}
        <Link to="/" className="link-action" style={{ marginLeft: '1rem' }}>Zum Dashboard</Link>
      </div>
    </div>
  );
};

export default ProjekteListPage;
