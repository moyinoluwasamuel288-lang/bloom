export class ConfirmDialog {
  constructor(container) {
    this.container = container;
    this.pendingConfirm = null;
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="modal-overlay" id="confirm-overlay" aria-hidden="true">
        <div class="modal-sheet confirm-sheet" role="alertdialog" aria-labelledby="confirm-title">
          <h2 id="confirm-title"></h2>
          <p id="confirm-message"></p>
          <div class="confirm-actions">
            <button id="confirm-cancel-btn" class="btn btn-secondary">Cancel</button>
            <button id="confirm-ok-btn" class="btn btn-danger">Confirm</button>
          </div>
        </div>
      </div>
    `;

    const overlay = this.container.querySelector('#confirm-overlay');
    const cancelBtn = this.container.querySelector('#confirm-cancel-btn');
    const okBtn = this.container.querySelector('#confirm-ok-btn');

    cancelBtn.addEventListener('click', () => this.close());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) this.close(); });
    okBtn.addEventListener('click', () => {
      const cb = this.pendingConfirm;
      this.close();
      if (cb) cb();
    });
  }

  open({ title, message, confirmLabel = 'Confirm', onConfirm }) {
    this.container.querySelector('#confirm-title').textContent = title;
    this.container.querySelector('#confirm-message').textContent = message;
    this.container.querySelector('#confirm-ok-btn').textContent = confirmLabel;
    this.pendingConfirm = onConfirm;

    const overlay = this.container.querySelector('#confirm-overlay');
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
  }

  close() {
    const overlay = this.container.querySelector('#confirm-overlay');
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    this.pendingConfirm = null;
  }
}
