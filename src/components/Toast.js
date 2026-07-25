export class Toast {
  constructor(container) {
    this.container = container;
    this.container.innerHTML = `<div class="toast" id="toast" role="status" aria-live="polite"></div>`;
    this.el = this.container.querySelector('#toast');
    this.hideTimer = null;
  }

  show({ message, type = 'info' }) {
    clearTimeout(this.hideTimer);
    this.el.textContent = message;
    this.el.className = `toast show toast-${type}`;
    this.hideTimer = setTimeout(() => {
      this.el.classList.remove('show');
    }, 3200);
  }
}
