export default function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <div className="spinner-wrapper">
      <div className="spinner" />
      <p className="spinner-text">{message}</p>
    </div>
  );
}
