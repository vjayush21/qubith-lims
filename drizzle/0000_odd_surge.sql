CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text,
	`user_id` text,
	`action` text NOT NULL,
	`resource` text,
	`metadata` text,
	`ip_address` text,
	`user_agent` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `audit_logs_tenant_created_idx` ON `audit_logs` (`tenant_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `order_tests` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`order_id` text NOT NULL,
	`test_id` text NOT NULL,
	`sample_id` text,
	`status` text DEFAULT 'registered' NOT NULL,
	`price_paise` integer NOT NULL,
	`barcode` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`order_id`) REFERENCES `test_orders`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`test_id`) REFERENCES `tests`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `order_tests_tenant_barcode_idx` ON `order_tests` (`tenant_id`,`barcode`);--> statement-breakpoint
CREATE INDEX `order_tests_tenant_order_idx` ON `order_tests` (`tenant_id`,`order_id`);--> statement-breakpoint
CREATE TABLE `patients` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`patient_code` text NOT NULL,
	`full_name` text NOT NULL,
	`age` integer,
	`age_unit` text DEFAULT 'years',
	`sex` text,
	`phone` text,
	`email` text,
	`address` text,
	`ref_doctor_id` text,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`ref_doctor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `patients_tenant_code_idx` ON `patients` (`tenant_id`,`patient_code`);--> statement-breakpoint
CREATE INDEX `patients_tenant_phone_idx` ON `patients` (`tenant_id`,`phone`);--> statement-breakpoint
CREATE TABLE `reports` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`order_id` text NOT NULL,
	`report_code` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`pdf_url` text,
	`validated_by_id` text,
	`validated_at` integer,
	`delivered_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`order_id`) REFERENCES `test_orders`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`validated_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `reports_tenant_order_idx` ON `reports` (`tenant_id`,`order_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `reports_tenant_code_idx` ON `reports` (`tenant_id`,`report_code`);--> statement-breakpoint
CREATE TABLE `results` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`order_test_id` text NOT NULL,
	`value` text,
	`numeric_value` text,
	`unit` text,
	`reference_range` text,
	`is_abnormal` integer DEFAULT false NOT NULL,
	`is_critical` integer DEFAULT false NOT NULL,
	`remarks` text,
	`entered_by_id` text,
	`validated_by_id` text,
	`validated_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`order_test_id`) REFERENCES `order_tests`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`entered_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`validated_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `results_tenant_order_test_idx` ON `results` (`tenant_id`,`order_test_id`);--> statement-breakpoint
CREATE TABLE `tenants` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`address` text,
	`city` text,
	`phone` text,
	`email` text,
	`logo_url` text,
	`nabl_accredited` integer DEFAULT false NOT NULL,
	`plan` text DEFAULT 'trial' NOT NULL,
	`plan_expires_at` integer,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tenants_slug_idx` ON `tenants` (`slug`);--> statement-breakpoint
CREATE TABLE `test_orders` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`order_code` text NOT NULL,
	`patient_id` text NOT NULL,
	`collection_center` text,
	`collection_type` text DEFAULT 'walk_in' NOT NULL,
	`home_address` text,
	`scheduled_at` integer,
	`phlebotomist_id` text,
	`collection_status` text DEFAULT 'pending' NOT NULL,
	`total_amount_paise` integer NOT NULL,
	`paid_amount_paise` integer DEFAULT 0 NOT NULL,
	`payment_status` text DEFAULT 'pending' NOT NULL,
	`ordered_by_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`phlebotomist_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`ordered_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `test_orders_tenant_order_idx` ON `test_orders` (`tenant_id`,`order_code`);--> statement-breakpoint
CREATE INDEX `test_orders_tenant_patient_idx` ON `test_orders` (`tenant_id`,`patient_id`);--> statement-breakpoint
CREATE TABLE `tests` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`department` text,
	`sample_type` text,
	`price_paise` integer NOT NULL,
	`tat_hours` integer DEFAULT 24,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tests_tenant_code_idx` ON `tests` (`tenant_id`,`code`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text,
	`email` text NOT NULL,
	`password_hash` text,
	`full_name` text NOT NULL,
	`phone` text,
	`role` text NOT NULL,
	`mci_number` text,
	`is_active` integer DEFAULT true NOT NULL,
	`last_login_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_idx` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `users_tenant_idx` ON `users` (`tenant_id`);