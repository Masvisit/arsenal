import PageHeader from '../components/PageHeader.jsx';

export default function Soon({ title }) {
  return (
    <div>
      <PageHeader title={title} back={{ to: '/', label: 'Inici' }} />
      <div className="card mx-4 p-6 text-center text-ink-soft sm:mx-6">
        <div className="chip mx-auto mb-3">Properament</div>
        <p>Aquesta secció arribarà en una fase posterior.</p>
      </div>
    </div>
  );
}
