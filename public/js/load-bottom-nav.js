const container = document.getElementById('bottom-nav');

    // ❗ ถ้ามี nav อยู่แล้ว ไม่ต้องโหลดซ้ำ
    if (!container || container.children.length > 0) {
        console.warn("bottom-nav already loaded");
    } else {
        fetch('components/bottom-nav.html')
            .then(res => res.text())
            .then(html => {
                container.innerHTML = html;

                // set active menu
                const currentPage = location.pathname.split('/').pop();

                document.querySelectorAll('.nav-item').forEach(item => {
                    const href = item.getAttribute('href');
                    if (href === currentPage) {
                        item.classList.add('active');
                    }
                });
            })
            .catch(err => console.error("โหลด bottom-nav ไม่ได้", err));
    }