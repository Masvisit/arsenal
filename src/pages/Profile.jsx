import PageHeader from '../components/PageHeader.jsx';
import { APP_VERSION, BUILD_DATE } from '../version.js';

export default function Profile() {
  return (
    <div>
      <PageHeader title="Perfil" />
      <footer className="px-4 py-6 text-center text-xs text-ink-soft">Arsenal v{APP_VERSION} · {BUILD_DATE}</footer>
    </div>
  );
}
