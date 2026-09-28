(function (window, document) {
  "use strict";

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    attrs = attrs || {};
    Object.keys(attrs).forEach(function (key) {
      if (key === "class") node.className = attrs[key];
      else if (key === "html") node.innerHTML = attrs[key];
      else if (key === "text") node.textContent = attrs[key];
      else node.setAttribute(key, attrs[key]);
    });
    (children || []).forEach(function (child) {
      if (child) node.appendChild(child);
    });
    return node;
  }

  var ICON_SOUND_ON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="4 9 8 9 13 4 13 20 8 15 4 15" fill="currentColor" stroke="none"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/><path d="M19 6a9 9 0 0 1 0 12"/></svg>';
  var ICON_SOUND_OFF = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="4 9 8 9 13 4 13 20 8 15 4 15" fill="currentColor" stroke="none"/><line x1="17" y1="9" x2="22" y2="14"/><line x1="22" y1="9" x2="17" y2="14"/></svg>';

  /**
   *
   * @param {string|Element} target  Selector o contenedor donde se renderiza.
   * @param {Object} options
   * @param {Array<{
   *   label: string,
   *   description?: string,
   *   image: string,        // imagen en estado normal
   *   imageHover: string,   // imagen en estado hover/activo
   *   sound?: string        // ruta a un archivo de audio corto
   * }>} options.items
   * @param {boolean} [options.soundToggle=true]  Muestra un botón global de silenciar.
   * @param {boolean} [options.muted=false]       Inicia en silencio.
   */
  function Ecos(target, options) {
    var container = typeof target === "string" ? document.querySelector(target) : target;
    if (!container) throw new Error("Ecos: contenedor no encontrado: " + target);

    var opts = Object.assign({ items: [], soundToggle: true, muted: false }, options || {});
    var muted = !!opts.muted;
    var audioCache = {};

    function getAudio(src) {
      if (!src) return null;
      if (!audioCache[src]) {
        var audio = new Audio(src);
        audio.preload = "auto";
        audioCache[src] = audio;
      }
      return audioCache[src];
    }

    function playSound(src) {
      if (muted || !src) return;
      var base = getAudio(src);
      if (!base) return;
      var instance = base.cloneNode(true);
      instance.volume = 0.55;
      instance.play().catch(function () {
      });
    }

    var wrap = el("div", { class: "ec-wrap" });

    var toggleBtn = null;
    if (opts.soundToggle) {
      toggleBtn = el("button", {
        class: "ec-sound-toggle",
        type: "button",
        html: (muted ? ICON_SOUND_OFF : ICON_SOUND_ON) + "<span>" + (muted ? "Sonido desactivado" : "Sonido activado") + "</span>"
      });
      toggleBtn.addEventListener("click", function () {
        muted = !muted;
        toggleBtn.innerHTML = (muted ? ICON_SOUND_OFF : ICON_SOUND_ON) + "<span>" + (muted ? "Sonido desactivado" : "Sonido activado") + "</span>";
      });
      wrap.appendChild(toggleBtn);
    }

    var series = el("div", { class: "ec-series", role: "listbox", "aria-label": "Selector de opciones" });

    var cards = opts.items.map(function (item, index) {
      var card = el("div", {
        class: "ec-card",
        tabindex: "0",
        role: "option",
        "aria-selected": "false"
      }, [
        el("div", { class: "ec-card-visual" }, [
          el("img", { class: "ec-card-img-base", src: item.image, alt: item.label }),
          el("img", { class: "ec-card-img-hover", src: item.imageHover, alt: "", "aria-hidden": "true" })
        ]),
        el("div", { class: "ec-card-label", text: item.label }),
        item.description ? el("div", { class: "ec-card-desc", text: item.description }) : null
      ]);

      function activate() {
        card.classList.add("is-active");
        card.setAttribute("aria-selected", "true");
        playSound(item.sound);
      }
      function deactivate() {
        card.classList.remove("is-active");
        card.setAttribute("aria-selected", "false");
      }

      card.addEventListener("mouseenter", activate);
      card.addEventListener("mouseleave", deactivate);
      card.addEventListener("focus", activate);
      card.addEventListener("blur", deactivate);
      // soporte táctil: toca para activar, toca fuera para desactivar
      card.addEventListener("touchstart", function (e) {
        e.preventDefault();
        activate();
      }, { passive: false });

      card.addEventListener("click", function () {
        if (typeof opts.onSelect === "function") opts.onSelect(item, index);
      });

      series.appendChild(card);
      return card;
    });

    wrap.appendChild(series);
    container.innerHTML = "";
    container.appendChild(wrap);

    this.element = container;
    this.cards = cards;
    this.setMuted = function (value) {
      muted = !!value;
      if (toggleBtn) {
        toggleBtn.innerHTML = (muted ? ICON_SOUND_OFF : ICON_SOUND_ON) + "<span>" + (muted ? "Sonido desactivado" : "Sonido activado") + "</span>";
      }
    };
  }

  window.Ecos = Ecos;
})(window, document);
