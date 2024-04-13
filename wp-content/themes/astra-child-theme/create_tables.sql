CREATE TABLE drones (
    src_addr CHAR(21) PRIMARY KEY, /* Source address MAC-00:00:00:00:00:00 */
    mfr CHAR(12) NULL /* Manufacturer */
);
CREATE TABLE flights (
    flight_num INT AUTO_INCREMENT PRIMARY KEY,
    src_addr CHAR(21) NOT NULL,
    uas_id CHAR(20),
    start_time DATETIME(3),
    end_time DATETIME(3),
    active BOOL,
	CONSTRAINT flights_fk_src_addr FOREIGN KEY (src_addr) REFERENCES drones(src_addr)
);
CREATE TABLE packets (
	src_addr CHAR(21) NOT NULL,
	rx_utc_time DATETIME(3), /* UTC time packet was received */
	msg_counter TINYINT UNSIGNED, /* 0-255 */
	tx_time_since_hour SMALLINT UNSIGNED, /* 0-36000 (in tenths of seconds) */
	timestamp_acc TINYINT UNSIGNED, /* Accuracy of time since hour (in tenths of seconds) */
	uas_id CHAR(20),
	flight_num INT NOT NULL,
	id_type TINYINT UNSIGNED,
	uas_type TINYINT UNSIGNED,
	uas_status TINYINT UNSIGNED,
	geo_alt DECIMAL(6,1), /* Geodetic altitude (WGS-84 ellipsoid) in meters */
	geo_alt_acc TINYINT UNSIGNED,
	heading SMALLINT UNSIGNED, /* Heading in degrees */
	gnd_speed DECIMAL(5,2),
	vert_speed DECIMAL(5,2),
	speed_acc TINYINT UNSIGNED,
	lat DECIMAL(10,7),
	lon DECIMAL(10,7),
	CONSTRAINT packets_fk_src_addr FOREIGN KEY (src_addr) REFERENCES drones(src_addr),
	CONSTRAINT packets_fk_flight_num FOREIGN KEY (flight_num) REFERENCES flights(flight_num),
	CONSTRAINT ck_id_type CHECK (id_type BETWEEN 0 AND 15),
	CONSTRAINT ck_uas_type CHECK (uas_type BETWEEN 0 AND 15),
	CONSTRAINT ck_uas_status CHECK (uas_status BETWEEN 0 AND 15),
	CONSTRAINT ck_geo_alt_acc CHECK (geo_alt_acc BETWEEN 0 AND 15),
	CONSTRAINT ck_heading CHECK (heading BETWEEN 0 AND 361), /* 361 is Invalid, Unknown, or No Value */
	CONSTRAINT ck_speed_acc CHECK (speed_acc BETWEEN 0 AND 15),
	UNIQUE (src_addr, msg_counter, rx_utc_time)
);
DELIMITER //

/* Requires necessary permission to create triggers log_bin_trust_function_creators=1 */
CREATE TRIGGER update_flight_number BEFORE INSERT ON packets
FOR EACH ROW
BEGIN
	DECLARE last_time DATETIME(3);
	DECLARE active_flight_num INT;

	SELECT rx_utc_time, flight_num INTO last_time, active_flight_num
	FROM packets
	WHERE src_addr = NEW.src_addr AND flight_num = (
		-- Get the flight number of the most recent active flight (if one exists)
		SELECT flight_num
		FROM flights
		WHERE src_addr = NEW.src_addr AND active = TRUE
		ORDER BY start_time DESC
		LIMIT 1
	)
	ORDER BY rx_utc_time DESC
	LIMIT 1;

	-- If there is an active flight
	IF last_time is NOT NULL THEN
		-- If the most recent flight was over 10 minutes ago, end it and start a new one
		IF TIMESTAMPDIFF(MINUTE, last_time, NEW.rx_utc_time) > 10 THEN
			-- End the most recent flight
			UPDATE flights
			SET end_time = last_time, active = FALSE
			WHERE src_addr = NEW.src_addr AND active = TRUE;

			-- Start a new flight
			INSERT INTO flights (src_addr, uas_id, start_time, active)
			VALUES (NEW.src_addr, NEW.uas_id, NEW.rx_utc_time, TRUE);

			-- Set the flight number of the new packet to the new flight number which is the primary key
			SET NEW.flight_num = LAST_INSERT_ID();
		-- Otherwise continue the most recent flight
		ELSE
			-- Check if timestamp is within 30 seconds of the most recent packet and has same message counter
			IF EXISTS (
				SELECT 1
				FROM packets
				WHERE uas_id = NEW.uas_id
				AND msg_counter = NEW.msg_counter
				AND TIMESTAMPDIFF(SECOND, rx_utc_time, NEW.rx_utc_time) < 30
			) THEN
				SIGNAL SQLSTATE '45000'
				SET MESSAGE_TEXT = 'Duplicate packet with same UAS ID and message counter within 30 seconds of previous packet.';
			ELSE
				SET NEW.flight_num = active_flight_num;
			END IF;
		END IF;
	-- Otherwise this is the first time the drone has been seen or flight was inactive
	ELSE
		IF NOT EXISTS (
			SELECT 1
			FROM drones
			WHERE src_addr = NEW.src_addr
		) THEN
			-- Create new entry in drones table
			INSERT INTO drones (src_addr, mfr)
			VALUES (NEW.src_addr, null);
		END IF;

		-- Start a new flight
		INSERT INTO flights (src_addr, uas_id, start_time, active)
		VALUES (NEW.src_addr, NEW.uas_id, NEW.rx_utc_time, TRUE);

		-- Set the flight number of the new packet to the new flight number which is the primary key
		SET NEW.flight_num = LAST_INSERT_ID();
	END IF;
END;

//
DELIMITER ;

/* SET GLOBAL event_scheduler = ON; -- Set with RDS parameter group */

CREATE EVENT IF NOT EXISTS deactivate_inactive_flights
ON SCHEDULE EVERY 5 MINUTE
DO
  UPDATE flights f
  LEFT JOIN packets p ON f.src_addr = p.src_addr AND p.rx_utc_time > NOW() - INTERVAL 10 MINUTE
  SET f.active = FALSE, 
      f.end_time = (SELECT MAX(rx_utc_time) FROM packets WHERE src_addr = f.src_addr AND flight_num = f.flight_num)
  WHERE f.active = TRUE AND p.src_addr IS NULL;


CREATE INDEX packets_idx_src_addr ON packets (src_addr);
CREATE INDEX packets_idx_rx_utc_time ON packets (rx_utc_time);
CREATE INDEX packets_idx_unique_constraint ON packets (uas_id, msg_counter, rx_utc_time);

CREATE INDEX flights_idx_src_addr ON flights (src_addr);
CREATE INDEX flights_idx_active_src_addr ON flights (active, src_addr);
