fetch('components/bottom-nav.html')
  .then(res => res.text())
  .then(html => {
    document.getElementById('bottom-nav').innerHTML = html;

    // set active menu อัตโนมัติ
    const currentPage = location.pathname.split('/').pop();
    document.querySelectorAll('.nav-item').forEach(item => {
      if (item.getAttribute('href') === currentPage) {
        item.classList.add('active');
      }
    });
  });
