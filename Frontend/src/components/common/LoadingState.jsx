export default function LoadingState({ label = "Loading..." }) {
  return (
    <div className="panel-box text-center py-5">
      <div
        className="spinner-border text-primary"
        role="status"
        aria-hidden="true"
      />
      <p className="text-muted mt-3 mb-0">{label}</p>
    </div>
  );
}
