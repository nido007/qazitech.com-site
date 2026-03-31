const form    = document.getElementById('contactForm');
const btnEl   = form.querySelector('button[type="submit"]');
const success = document.getElementById('form-success');
const error   = document.getElementById('form-error');

form.addEventListener('submit', async function(e) {
  e.preventDefault();

  success.style.display = 'none';
  error.style.display   = 'none';

  const originalText   = btnEl.textContent;
  btnEl.textContent    = 'Sending…';
  btnEl.disabled       = true;

  try {
    const res = await fetch(form.action, {
      method:  'POST',
      body:    new FormData(form),
      headers: { 'Accept': 'application/json' }
    });

    if (res.ok) {
      success.style.display = 'block';
      form.reset();
    } else {
      error.style.display = 'block';
    }
  } catch (err) {
    error.style.display = 'block';
  } finally {
    btnEl.textContent = originalText;
    btnEl.disabled    = false;
  }
});