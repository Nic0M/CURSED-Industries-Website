<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}
?>
<?php
function create_custom_footer() {
	?>
	<footer class="site-footer-content" role="contentinfo">
		<div class="footer-content">
			<ul class="footer-links">
				<li class="footer-links-item"><a href="/privacy">Privacy Policy</a></li>
				<li class="footer-links-item"><a href="/terms">Terms of Service</a></li>
				<li class="footer-links-item"><a href="/sitemap">Sitemap</a></li>
			</ul>
			<div class="footer-copyright">
				<p>© <?php echo date("Y"); ?> CURSED</p>
			</div>
			<!-- Language Selector -->
			<div class="language-selector">
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

}
add_action('astra_footer_content', 'create_custom_footer');