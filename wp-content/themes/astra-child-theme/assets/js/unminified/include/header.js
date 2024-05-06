goog.module('header');

function adjustHeader() {
    const header = document.querySelector('.header-main-layout-1');
    const content = document.querySelector('.site-content'); // The content element whose padding you want to adjust
    if (header && content) {
        const headerHeight = header.offsetHeight;
        content.style.paddingTop = headerHeight + 'px'; // Set padding-top to match header height
    }
}

// Initial adjustment and on window resize
window.addEventListener('load', adjustHeader);
window.addEventListener('resize', adjustHeader);
