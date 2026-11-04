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

    // Logo power-on: one random tube flickers on first; the rest power on (staggered) once it's lit
    const BLINK_DELAY = 150
    const BLINK_DURATION = 600
    const POWER_ON_SPREAD = 200
    const tubes = document.documentElement.classList.contains('logo-lit') ? [] : document.querySelectorAll('.logo-tube')
    const blinker = Math.floor(Math.random() * tubes.length)

    tubes.forEach((el, i) => {
      el.classList.toggle('logo-blinker', i === blinker)
      el.style.setProperty('--delay', `${i === blinker
        ? BLINK_DELAY
        : BLINK_DELAY + BLINK_DURATION + Math.random() * POWER_ON_SPREAD}ms`)
    })

    document.querySelector('.logo')?.style.setProperty('--blink-duration', `${BLINK_DURATION}ms`)

    // Wait for font to load before showing logo effects
    if (document.fonts) {
      document.fonts.load('1em Beon').then(() => {
        document.documentElement.classList.add('fonts-loaded')
      })
    } else {
      document.documentElement.classList.add('fonts-loaded')
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

    // Open image links in a modal lightbox (Escape closes natively)
    const lightbox = document.getElementById('lightbox')

    if (lightbox && typeof lightbox.showModal === 'function') {
      const img = lightbox.querySelector('img')

      document.querySelectorAll('a.lightbox-link').forEach(link => {
        link.addEventListener('click', e => {
          e.preventDefault()
          const thumb = link.querySelector('img')
          img.src = link.href
          img.alt = thumb ? thumb.alt : ''
          lightbox.showModal()
        })
      })

      lightbox.addEventListener('click', () => lightbox.close())
      lightbox.addEventListener('close', () => img.removeAttribute('src'))
    }
  })
})();
