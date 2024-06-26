<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

add_action('wp_footer', 'create_custom_footer');

function create_custom_footer() {
	ob_start();
	?>
	<footer class="site-footer" role="contentinfo">
		<div class="custom-footer-content">
			<ul class="custom-footer-links">
				<li class="custom-footer-links-item"><a href="/privacy">Privacy Policy</a></li>
				<li class="custom-footer-links-item"><a href="/terms">Terms of Service</a></li>
				<li class="custom-footer-links-item"><a href="/sitemap">Sitemap</a></li>
			</ul>
			<div class="custom-footer-copyright">
				<p>Copyright © <?php echo date("Y"); ?> CURSED</p>
			</div>
			<!-- Language Selector -->
			<div class="custom-footer-language-selector">
				<select id="language-selector">
					<option value="en">English</option>
					<option value="es">Español</option>
					<option value="fr">Français</option>
					<option value="de">Deutsch</option>
					<option value="it">Italiano</option>
					<option value="pt">Português</option>
					<option value="ru">Русский</option>
					<option value="zh">中文</option>
					<option value="ja">日本語</option>
					<option value="ko">한국어</option>
				</select>
				<script>
					document.getElementById('language-selector').addEventListener('change', function() {
						window.location.href
							= window.location.href.replace(/\/[a-z]{2}\//, '/' + this.value + '/');
					});
				</script>
			</div>
		</div>
	</footer><!-- .site-footer -->
	<?php
	return ob_get_clean();
}
