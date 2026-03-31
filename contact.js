/**
 * contact.js
 * Qazitech — Contact Form Handler
 * Handles async form submission to Formspree
 * No page redirect. Clears form on success. Single click.
 */

(function () {

  /* ── 1. GRAB ELEMENTS FROM THE DOM ───────────────────────────────────────
     document.getElementById() finds an HTML element by its id="" attribute.
     We store them in variables so we don't have to search the DOM every time.
  ───────────────────────────────────────────────────────────────────────── */
  const form   = document.getElementById('contactForm');
  const btn    = document.getElementById('form-btn');
  const status = document.getElementById('form-status');

  /* Safety check — if the form doesn't exist on the page, stop here.
     Prevents errors on pages that don't have the contact form. */
  if (!form) return;


  /* ── 2. HELPER FUNCTIONS ──────────────────────────────────────────────────
     Small reusable functions. Each does one job only.
  ───────────────────────────────────────────────────────────────────────── */

  /**
   * setStatus(msg, type)
   * Shows a message box below the form.
   * type = 'success' → teal box
   * type = 'error'   → red box
   * The CSS classes 'success' and 'error' in your stylesheet do the styling.
   */
  function setStatus(msg, type) {
    status.textContent = msg;
    status.className   = type;
    /* Smoothly scrolls the status box into view so the user sees it */
    status.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /**
   * clearStatus()
   * Hides the status box by removing the class (CSS hides it when class is empty).
   */
  function clearStatus() {
    status.className   = '';
    status.textContent = '';
  }

  /**
   * setBusy(busy)
   * Disables/enables the submit button and changes its label.
   * Prevents the user clicking twice while the fetch request is in flight.
   * busy = true  → button says "Sending…" and is disabled
   * busy = false → button says "Send Message →" and is active again
   */
  function setBusy(busy) {
    btn.disabled    = busy;
    btn.textContent = busy ? 'Sending…' : 'Send Message →';
  }

  /**
   * clearErrors()
   * Removes the red border highlight from any invalid fields.
   * The 'err' CSS class adds a red border — removing the class removes the border.
   */
  function clearErrors() {
    form.querySelectorAll('.err').forEach(function (el) {
      el.classList.remove('err');
    });
  }


  /* ── 3. VALIDATION FUNCTION ───────────────────────────────────────────────
     Checks the form fields BEFORE sending anything to Formspree.
     Returns true if everything is fine, false if something is wrong.
     This runs entirely in the browser — no server involved.
  ───────────────────────────────────────────────────────────────────────── */
  function validate() {
    clearErrors();   /* reset any previous highlights */
    let ok = true;   /* assume valid, flip to false if we find a problem */

    /* Get the specific input elements */
    const name  = document.getElementById('f-name');
    const email = document.getElementById('f-email');
    const msg   = document.getElementById('f-message');

    /* Check name is not empty */
    if (!name.value.trim()) {
      name.classList.add('err');   /* add red border via CSS class */
      name.focus();                /* move cursor into the field */
      ok = false;
    }

    /* Check email looks valid using a regular expression (regex)
       The pattern /^[^\s@]+@[^\s@]+\.[^\s@]+$/ means:
       - starts with one or more non-space, non-@ characters
       - then an @
       - then one or more non-space, non-@ characters
       - then a dot
       - then one or more non-space, non-@ characters
       e.g. naveed@gmail.com passes. "notanemail" fails. */
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());
    if (!emailOk) {
      email.classList.add('err');
      if (ok) email.focus();  /* only focus if name was already valid */
      ok = false;
    }

    /* Check message has at least 10 characters */
    if (msg.value.trim().length < 10) {
      msg.classList.add('err');
      ok = false;
    }

    /* If anything failed, show a single error message */
    if (!ok) {
      setStatus('Please fill in the highlighted fields before sending.', 'error');
    }

    return ok;  /* caller uses this to decide whether to proceed */
  }


  /* ── 4. MAIN SUBMIT HANDLER ───────────────────────────────────────────────
     This is the core of the whole script.
     It fires when the user clicks "Send Message →".
  ───────────────────────────────────────────────────────────────────────── */
  form.addEventListener('submit', async function (e) {

    /* e.preventDefault() — THIS IS THE KEY LINE
       By default, when a form submits, the browser redirects to the action URL.
       preventDefault() stops that entirely. We handle everything ourselves. */
    e.preventDefault();

    clearStatus();               /* hide any previous message */
    if (!validate()) return;     /* stop here if fields are invalid */

    setBusy(true);               /* disable button, show "Sending…" */

    /* fetch() sends the form data to Formspree in the background.
       The browser stays on your page — the user sees nothing loading.
       'async' and 'await' mean: pause here until Formspree replies,
       then continue with the result. */
    try {

      const res = await fetch(form.action, {
        method:  'POST',
        /* Tell Formspree we want JSON back (so we can read the response) */
        headers: { 'Accept': 'application/json' },
        /* FormData() collects all the form fields automatically —
           every input/select/textarea with a name="" attribute */
        body: new FormData(form),
      });

      /* res.ok is true for HTTP 200–299 (success), false for 400–500 (error) */
      if (res.ok) {

        /* ✅ SUCCESS PATH */
        setStatus(
          '✓  Message sent! We\'ll be in touch within 24 hours.',
          'success'
        );
        form.reset();    /* clears every field back to empty */
        clearErrors();   /* removes any red borders */

        /* Auto-hide the success message after 8 seconds */
        setTimeout(clearStatus, 8000);

      } else {

        /* ❌ FORMSPREE RETURNED AN ERROR
           e.g. rate limit hit, spam detected, misconfigured form ID */
        const data = await res.json().catch(function () { return {}; });
        setStatus(
          data.error ||
          'Something went wrong. Please email ping@qazitech.com directly.',
          'error'
        );
      }

    } catch (networkErr) {

      /* ❌ NETWORK ERROR — couldn't reach Formspree at all
         e.g. no internet, server down */
      setStatus(
        'Network error — please check your connection or email ping@qazitech.com.',
        'error'
      );

    } finally {

      /* finally always runs — success or failure.
         Re-enables the button so the user can try again if needed. */
      setBusy(false);
    }

  });


  /* ── 5. LIVE ERROR CLEARING ───────────────────────────────────────────────
     As soon as the user starts typing in a field that had an error,
     the red border disappears. Feels more responsive and professional.
  ───────────────────────────────────────────────────────────────────────── */
  form.querySelectorAll('input, textarea, select').forEach(function (el) {
    el.addEventListener('input', function () {
      el.classList.remove('err');   /* remove red border on this field */
      clearStatus();                /* hide the error message */
    });
  });

})();
/* The whole script is wrapped in (function(){ ... })()
   This is an IIFE — Immediately Invoked Function Expression.
   It runs once immediately and keeps all variables private —
   they don't leak into the global window object and can't
   clash with other scripts on the page. */

   (function () {

  const form   = document.getElementById('contactForm');
  const btn    = document.getElementById('form-btn');
  const status = document.getElementById('form-status');

  if (!form) return;

  function setStatus(msg, type) {
    status.textContent = msg;
    status.className   = type;
    status.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function clearStatus() {
    status.className   = '';
    status.textContent = '';
  }

  function setBusy(busy) {
    btn.disabled    = busy;
    btn.textContent = busy ? 'Sending…' : 'Send Message →';
  }

  function clearErrors() {
    form.querySelectorAll('.err').forEach(function (el) {
      el.classList.remove('err');
    });
  }

  function validate() {
    clearErrors();
    let ok = true;

    const name  = document.getElementById('f-name');
    const email = document.getElementById('f-email');
    const msg   = document.getElementById('f-message');

    if (!name.value.trim()) {
      name.classList.add('err');
      name.focus();
      ok = false;
    }

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());
    if (!emailOk) {
      email.classList.add('err');
      if (ok) email.focus();
      ok = false;
    }

    if (msg.value.trim().length < 10) {
      msg.classList.add('err');
      ok = false;
    }

    if (!ok) {
      setStatus('Please fill in the highlighted fields before sending.', 'error');
    }

    return ok;
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    clearStatus();
    if (!validate()) return;

    setBusy(true);

    try {
      const res = await fetch(form.action, {
        method:  'POST',
        headers: { 'Accept': 'application/json' },
        body:    new FormData(form),
      });

      if (res.ok) {
        setStatus('✓  Message sent! We\'ll be in touch within 24 hours.', 'success');
        form.reset();
        clearErrors();
        setTimeout(clearStatus, 8000);
      } else {
        const data = await res.json().catch(function () { return {}; });
        setStatus(
          data.error || 'Something went wrong. Please email ping@qazitech.com directly.',
          'error'
        );
      }

    } catch (networkErr) {
      setStatus(
        'Network error — please check your connection or email ping@qazitech.com.',
        'error'
      );
    } finally {
      setBusy(false);
    }
  });

  form.querySelectorAll('input, textarea, select').forEach(function (el) {
    el.addEventListener('input', function () {
      el.classList.remove('err');
      clearStatus();
    });
  });

})();