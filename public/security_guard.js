// ==============================================================================
// STALKER PRO & AETHERIS CLIENT INPUT SHIELD
// Protects keyboard shortcuts and context menus without breaking mobile or tablet devices.
// ==============================================================================
(function() {
    'use strict';

    if (window.__stalkerSecurityGuardActive) return;
    window.__stalkerSecurityGuardActive = true;

    // Completely bypass on mobile, touch, and tablet devices
    var isTouchOrTablet = (
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Tablet|Mobile|Silk|Kindle/i.test(navigator.userAgent) ||
        (navigator.maxTouchPoints && navigator.maxTouchPoints > 1) ||
        (window.matchMedia && window.matchMedia('(pointer: coarse)').matches)
    );

    function isAdminExempt() {
        try {
            var isAdminAuth = document.cookie.indexOf('admin_auth=') !== -1;
            var isHariPath = window.location.pathname.startsWith('/hari');
            var isLocalAdmin = localStorage.getItem('admin_token') || sessionStorage.getItem('admin_token');
            return isAdminAuth || isHariPath || !!isLocalAdmin;
        } catch (e) {
            return false;
        }
    }

    if (isAdminExempt() || isTouchOrTablet) {
        return;
    }

    // 1. Block Keyboard Shortcuts for Developer Tools & Source Inspection on Desktop
    window.addEventListener('keydown', function(e) {
        if (isAdminExempt()) return;

        var key = e.key ? e.key.toUpperCase() : '';
        var keyCode = e.keyCode || e.which;

        // F12 key
        if (key === 'F12' || keyCode === 123) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }

        // Ctrl + Shift + I (Inspect) or Cmd + Option + I (Mac)
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && (key === 'I' || keyCode === 73)) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }

        // Ctrl + Shift + J (Console) or Cmd + Option + J (Mac)
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && (key === 'J' || keyCode === 74)) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }

        // Ctrl + Shift + C (Element Inspector) or Cmd + Option + C (Mac)
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && (key === 'C' || keyCode === 67)) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }

        // Ctrl + U or Cmd + U (View Source)
        if ((e.ctrlKey || e.metaKey) && (key === 'U' || keyCode === 85)) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }

        // Ctrl + S (Save Page)
        if ((e.ctrlKey || e.metaKey) && (key === 'S' || keyCode === 83)) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
    }, true);

    // 2. Disable Right-Click Context Menu (stops 'Inspect' from context menu on desktop)
    document.addEventListener('contextmenu', function(e) {
        if (isAdminExempt()) return;
        var target = e.target;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
            return;
        }
        e.preventDefault();
        e.stopPropagation();
        return false;
    }, true);
})();
