/**
 * Shared manual behavior (embedded in SP Builder iframe).
 * - Collapsible left sidebar
 * - Expand/collapse sections without layout flash
 * - Notify parent to resize iframe to content height
 */
(function () {
  var MENU_COLLAPSED_KEY = 'spbuilder-manual-menu-collapsed';

  function notifyParentResize() {
    if (window.parent === window) return;
    var height = Math.max(
      document.documentElement.scrollHeight,
      document.body.scrollHeight
    );
    window.parent.postMessage({ type: 'spbuilder-manual-resize', height: height }, '*');
  }

  function setMenuCollapsed(collapsed) {
    var container = document.querySelector('.main-container');
    var toggleBtn = document.getElementById('menuToggleBtn');
    if (!container || !toggleBtn) return;

    container.classList.toggle('menu-collapsed', collapsed);
    toggleBtn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
    toggleBtn.textContent = collapsed ? 'Show menu' : 'Hide menu';
    try {
      sessionStorage.setItem(MENU_COLLAPSED_KEY, collapsed ? '1' : '0');
    } catch (e) {
      /* ignore */
    }
    requestAnimationFrame(notifyParentResize);
  }

  function initMenuToggle() {
    var toggleBtn = document.getElementById('menuToggleBtn');
    if (!toggleBtn) return;

    var collapsed = false;
    try {
      collapsed = sessionStorage.getItem(MENU_COLLAPSED_KEY) === '1';
    } catch (e) {
      collapsed = false;
    }
    setMenuCollapsed(collapsed);

    toggleBtn.addEventListener('click', function () {
      var container = document.querySelector('.main-container');
      setMenuCollapsed(container && container.classList.contains('menu-collapsed') ? false : true);
    });
  }

  function setExpanded(content, expanded) {
    if (expanded) {
      content.style.display = 'block';
      content.removeAttribute('hidden');
      content.querySelectorAll('img').forEach(function (img) {
        img.loading = 'lazy';
        img.decoding = 'async';
      });
    } else {
      content.style.display = 'none';
      content.setAttribute('hidden', '');
    }
    requestAnimationFrame(notifyParentResize);
  }

  function init() {
    initMenuToggle();

    document.querySelectorAll('.menu ul li a').forEach(function (link) {
      if (link.href === window.location.href) {
        link.classList.add('active');
      }
    });

    document.querySelectorAll('.expandable-title').forEach(function (title) {
      title.addEventListener('click', function () {
        var content = title.nextElementSibling;
        if (!content || !content.classList.contains('expandable-content')) return;
        var isOpen = content.style.display === 'block';
        setExpanded(content, !isOpen);
      });
    });

    var expandAllBtn = document.getElementById('expandAllBtn');
    if (expandAllBtn) {
      expandAllBtn.type = 'button';
      expandAllBtn.addEventListener('click', function () {
        var sections = document.querySelectorAll('.expandable-content');
        sections.forEach(function (content, index) {
          window.setTimeout(function () {
            setExpanded(content, true);
            if (index === sections.length - 1) {
              window.setTimeout(notifyParentResize, 100);
            }
          }, index * 40);
        });
      });
    }

    var collapseAllBtn = document.getElementById('collapseAllBtn');
    if (collapseAllBtn) {
      collapseAllBtn.type = 'button';
      collapseAllBtn.addEventListener('click', function () {
        document.querySelectorAll('.expandable-content').forEach(function (content) {
          setExpanded(content, false);
        });
      });
    }

    notifyParentResize();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.addEventListener('load', notifyParentResize);
  window.addEventListener('resize', notifyParentResize);
})();
