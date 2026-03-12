(() => {
    const BTN_CLASS = 'pw-hasher-btn';

    function injectStyles() {
        if (document.getElementById('pw-hasher-styles')) return;
        const style = document.createElement('style');
        style.id = 'pw-hasher-styles';
        style.textContent = `
        .${BTN_CLASS} {
            position: absolute !important;
            padding: 0 10px !important;
            background: #d2ae10 !important;
            color: #fff !important;
            border: none !important;
            border-radius: 6px !important;
            cursor: pointer !important;
            font-size: 12px !important;
            font-weight: bold !important;
            font-family: Arial, sans-serif !important;
            white-space: nowrap !important;
            box-shadow: 0 1px 3px rgba(0,0,0,0.2) !important;
            transition: filter 0.1s, opacity 0.15s !important;
            z-index: 2147483647 !important;
            line-height: 1 !important;
            opacity: 0.4 !important;
            pointer-events: auto !important;
        }
        .${BTN_CLASS}:hover {
            filter: brightness(1.15) !important;
            opacity: 1 !important;
        }
        .${BTN_CLASS}:active {
            filter: brightness(0.85) !important;
        }
        .${BTN_CLASS}.hashed {
            background: #28a745 !important;
            opacity: 1 !important;
        }
        `;
        document.head.appendChild(style);
    }

    async function hashPassword(passwordField, btn) {
        const originalPassword = passwordField.value;
        if (!originalPassword) {
            btn.textContent = 'Empty!';
            setTimeout(() => { btn.textContent = '🔐 Hash'; btn.classList.remove('hashed'); }, 1500);
            return;
        }

        const domain = window.location.hostname;
        const combined = originalPassword + domain;
        const encoder = new TextEncoder();
        const data = encoder.encode(combined);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        const hashedPassword = hashHex.slice(0, 20) + 'B.2';

        passwordField.value = hashedPassword;
        passwordField.dispatchEvent(new Event('input', { bubbles: true }));
        passwordField.dispatchEvent(new Event('change', { bubbles: true }));

        btn.textContent = '✓ Done';
        btn.classList.add('hashed');
        passwordField.style.transition = 'background 0.3s';
        passwordField.style.backgroundColor = '#d4edda';
        setTimeout(() => {
            passwordField.style.backgroundColor = '';
            btn.textContent = '🔐 Hash';
            btn.classList.remove('hashed');
        }, 2000);
    }

    function positionBtn(field, btn) {
        const rect = field.getBoundingClientRect();
        const scrollX = window.scrollX;
        const scrollY = window.scrollY;
        const btnHeight = Math.max(22, rect.height * 0.75);
        btn.style.top = (rect.top + scrollY + (rect.height - btnHeight) / 2) + 'px';
        btn.style.left = (rect.right + scrollX + 6) + 'px';
        btn.style.height = btnHeight + 'px';
    }

    function attachToField(field) {
        if (field.dataset.pwHasherAttached) return;
        field.dataset.pwHasherAttached = 'true';

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = BTN_CLASS;
        btn.textContent = '🔐 Hash';
        btn.title = 'Hash this password with SHA-256 + domain';
        document.body.appendChild(btn);

        positionBtn(field, btn);

        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            hashPassword(field, btn);
        });

        const reposition = () => positionBtn(field, btn);
        window.addEventListener('scroll', reposition, { passive: true });
        window.addEventListener('resize', reposition, { passive: true });

        // Reposition if the field itself resizes or moves (dynamic layouts)
        const ro = new ResizeObserver(reposition);
        ro.observe(field);
    }

    function attachToPasswordFields() {
        document.querySelectorAll('input[type="password"]').forEach(attachToField);
    }

    function init() {
        injectStyles();
        attachToPasswordFields();

        const observer = new MutationObserver(attachToPasswordFields);
        observer.observe(document.body, { childList: true, subtree: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
