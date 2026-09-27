window.APP_CONFIG = {
  appName: 'Sanguinet – Délibérations',
  version: '0.5.2',
  mode: 'grist-widget'
};

window.addEventListener('grist-status', (e) => {
  const bar = document.getElementById('connectionStatus');
  if (!bar) return;
  const {type='demo', message=''} = e.detail || {};
  bar.className = `connection-status ${type}`;
  bar.textContent = message;
});

window.addEventListener('DOMContentLoaded', async () => {
  const version = document.getElementById('appVersion');
  if (version) version.textContent = `v${window.APP_CONFIG.version}`;
  await window.GristBridge?.init();
});
