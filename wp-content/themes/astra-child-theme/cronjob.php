<?php

require_once('/opt/bitnami/wordpress/wp-load.php');
	
function update_healthcheck_status_callback() {
	global $dronedb;
	$result = $dronedb->query("UPDATE healthchecks SET Status = 'Unhealthy', updated_at = NOW() WHERE updated_at <= NOW() - INTERVAL 5 MINUTE" );
	if ($dronedb->last_error) {
		error_log($dronedb->last_error);
	}
}

update_healthcheck_status_callback();