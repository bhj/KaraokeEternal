(function () {
  'use strict';

  const segs = new URL(document.URL).pathname.split('/').filter(s => !!s)
  let btn, nav

  function toggleNav() {
    btn.classList.toggle('active')
    nav.classList.toggle('active')
  }

  document.addEventListener("DOMContentLoaded", e => {
    btn = document.getElementById('btn-nav')
    nav = document.getElementsByTagName('nav')[0]

    if (btn) {
      btn.addEventListener('click', toggleNav)
    }

    if (btn && nav) {
      toggleNav()
    }

    // init nav highlighter if we're in docs
    if (segs[0] === 'docs' && typeof Gumshoe !== 'undefined') {
      new Gumshoe(`#${segs[1]}-toc a`)
    }

    // Open FAQ details if hash is present
    const openFaq = () => {
      if (window.location.hash) {
        const id = window.location.hash.substring(1)
        const el = document.getElementById(id)
        if (el && el.tagName === 'DETAILS') {
          el.open = true
        }
      }
    }
    openFaq()
    window.addEventListener('hashchange', openFaq)

    // Dismiss screenshot overlay with Escape key
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && window.location.hash) {
        try {
          const el = document.querySelector(window.location.hash)
          if (el && el.classList.contains('overlay')) {
            window.location.hash = "_"
          }
        } catch (err) { /* ignore invalid selectors */ }
      }
    })
  })
})();
