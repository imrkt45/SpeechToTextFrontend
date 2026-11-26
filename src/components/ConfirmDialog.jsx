import Modal from './Modal.jsx';

const ConfirmDialog = ({ title, message, confirmLabel = 'Delete', busy = false, onConfirm, onCancel }) => (
  <Modal
    title={title}
    onClose={busy ? () => {} : onCancel}
    size="sm"
    footer={
      <>
        <button type="button" className="button button-ghost" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
        <button type="button" className="button button-danger" onClick={onConfirm} disabled={busy}>
          {busy ? 'Deleting...' : confirmLabel}
        </button>
      </>
    }
  >
    <p className="muted">{message}</p>
  </Modal>
);

export default ConfirmDialog;
