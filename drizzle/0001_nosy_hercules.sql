PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_audit_logs` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random())%4+1,1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))) NOT NULL,
	`tenant_id` text,
	`user_id` text,
	`action` text NOT NULL,
	`resource` text,
	`metadata` text,
	`ip_address` text,
	`user_agent` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_audit_logs`("id", "tenant_id", "user_id", "action", "resource", "metadata", "ip_address", "user_agent", "created_at") SELECT "id", "tenant_id", "user_id", "action", "resource", "metadata", "ip_address", "user_agent", "created_at" FROM `audit_logs`;--> statement-breakpoint
DROP TABLE `audit_logs`;--> statement-breakpoint
ALTER TABLE `__new_audit_logs` RENAME TO `audit_logs`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `audit_logs_tenant_created_idx` ON `audit_logs` (`tenant_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `__new_order_tests` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random())%4+1,1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))) NOT NULL,
	`tenant_id` text NOT NULL,
	`order_id` text NOT NULL,
	`test_id` text NOT NULL,
	`sample_id` text,
	`status` text DEFAULT 'registered' NOT NULL,
	`price_paise` integer NOT NULL,
	`barcode` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`order_id`) REFERENCES `test_orders`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`test_id`) REFERENCES `tests`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_order_tests`("id", "tenant_id", "order_id", "test_id", "sample_id", "status", "price_paise", "barcode", "created_at", "updated_at") SELECT "id", "tenant_id", "order_id", "test_id", "sample_id", "status", "price_paise", "barcode", "created_at", "updated_at" FROM `order_tests`;--> statement-breakpoint
DROP TABLE `order_tests`;--> statement-breakpoint
ALTER TABLE `__new_order_tests` RENAME TO `order_tests`;--> statement-breakpoint
CREATE UNIQUE INDEX `order_tests_tenant_barcode_idx` ON `order_tests` (`tenant_id`,`barcode`);--> statement-breakpoint
CREATE INDEX `order_tests_tenant_order_idx` ON `order_tests` (`tenant_id`,`order_id`);--> statement-breakpoint
CREATE TABLE `__new_patients` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random())%4+1,1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))) NOT NULL,
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
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`ref_doctor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_patients`("id", "tenant_id", "patient_code", "full_name", "age", "age_unit", "sex", "phone", "email", "address", "ref_doctor_id", "notes", "created_at", "updated_at") SELECT "id", "tenant_id", "patient_code", "full_name", "age", "age_unit", "sex", "phone", "email", "address", "ref_doctor_id", "notes", "created_at", "updated_at" FROM `patients`;--> statement-breakpoint
DROP TABLE `patients`;--> statement-breakpoint
ALTER TABLE `__new_patients` RENAME TO `patients`;--> statement-breakpoint
CREATE UNIQUE INDEX `patients_tenant_code_idx` ON `patients` (`tenant_id`,`patient_code`);--> statement-breakpoint
CREATE INDEX `patients_tenant_phone_idx` ON `patients` (`tenant_id`,`phone`);--> statement-breakpoint
CREATE TABLE `__new_reports` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random())%4+1,1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))) NOT NULL,
	`tenant_id` text NOT NULL,
	`order_id` text NOT NULL,
	`report_code` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`pdf_url` text,
	`validated_by_id` text,
	`validated_at` integer,
	`delivered_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`order_id`) REFERENCES `test_orders`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`validated_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_reports`("id", "tenant_id", "order_id", "report_code", "status", "pdf_url", "validated_by_id", "validated_at", "delivered_at", "created_at") SELECT "id", "tenant_id", "order_id", "report_code", "status", "pdf_url", "validated_by_id", "validated_at", "delivered_at", "created_at" FROM `reports`;--> statement-breakpoint
DROP TABLE `reports`;--> statement-breakpoint
ALTER TABLE `__new_reports` RENAME TO `reports`;--> statement-breakpoint
CREATE UNIQUE INDEX `reports_tenant_order_idx` ON `reports` (`tenant_id`,`order_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `reports_tenant_code_idx` ON `reports` (`tenant_id`,`report_code`);--> statement-breakpoint
CREATE TABLE `__new_results` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random())%4+1,1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))) NOT NULL,
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
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`order_test_id`) REFERENCES `order_tests`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`entered_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`validated_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_results`("id", "tenant_id", "order_test_id", "value", "numeric_value", "unit", "reference_range", "is_abnormal", "is_critical", "remarks", "entered_by_id", "validated_by_id", "validated_at", "created_at", "updated_at") SELECT "id", "tenant_id", "order_test_id", "value", "numeric_value", "unit", "reference_range", "is_abnormal", "is_critical", "remarks", "entered_by_id", "validated_by_id", "validated_at", "created_at", "updated_at" FROM `results`;--> statement-breakpoint
DROP TABLE `results`;--> statement-breakpoint
ALTER TABLE `__new_results` RENAME TO `results`;--> statement-breakpoint
CREATE INDEX `results_tenant_order_test_idx` ON `results` (`tenant_id`,`order_test_id`);--> statement-breakpoint
CREATE TABLE `__new_tenants` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random())%4+1,1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))) NOT NULL,
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
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_tenants`("id", "name", "slug", "address", "city", "phone", "email", "logo_url", "nabl_accredited", "plan", "plan_expires_at", "is_active", "created_at", "updated_at") SELECT "id", "name", "slug", "address", "city", "phone", "email", "logo_url", "nabl_accredited", "plan", "plan_expires_at", "is_active", "created_at", "updated_at" FROM `tenants`;--> statement-breakpoint
DROP TABLE `tenants`;--> statement-breakpoint
ALTER TABLE `__new_tenants` RENAME TO `tenants`;--> statement-breakpoint
CREATE UNIQUE INDEX `tenants_slug_idx` ON `tenants` (`slug`);--> statement-breakpoint
CREATE TABLE `__new_test_orders` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random())%4+1,1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))) NOT NULL,
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
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`phlebotomist_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`ordered_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_test_orders`("id", "tenant_id", "order_code", "patient_id", "collection_center", "collection_type", "home_address", "scheduled_at", "phlebotomist_id", "collection_status", "total_amount_paise", "paid_amount_paise", "payment_status", "ordered_by_id", "created_at", "updated_at") SELECT "id", "tenant_id", "order_code", "patient_id", "collection_center", "collection_type", "home_address", "scheduled_at", "phlebotomist_id", "collection_status", "total_amount_paise", "paid_amount_paise", "payment_status", "ordered_by_id", "created_at", "updated_at" FROM `test_orders`;--> statement-breakpoint
DROP TABLE `test_orders`;--> statement-breakpoint
ALTER TABLE `__new_test_orders` RENAME TO `test_orders`;--> statement-breakpoint
CREATE UNIQUE INDEX `test_orders_tenant_order_idx` ON `test_orders` (`tenant_id`,`order_code`);--> statement-breakpoint
CREATE INDEX `test_orders_tenant_patient_idx` ON `test_orders` (`tenant_id`,`patient_id`);--> statement-breakpoint
CREATE TABLE `__new_tests` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random())%4+1,1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))) NOT NULL,
	`tenant_id` text NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`department` text,
	`sample_type` text,
	`price_paise` integer NOT NULL,
	`tat_hours` integer DEFAULT 24,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_tests`("id", "tenant_id", "code", "name", "department", "sample_type", "price_paise", "tat_hours", "is_active", "created_at") SELECT "id", "tenant_id", "code", "name", "department", "sample_type", "price_paise", "tat_hours", "is_active", "created_at" FROM `tests`;--> statement-breakpoint
DROP TABLE `tests`;--> statement-breakpoint
ALTER TABLE `__new_tests` RENAME TO `tests`;--> statement-breakpoint
CREATE UNIQUE INDEX `tests_tenant_code_idx` ON `tests` (`tenant_id`,`code`);--> statement-breakpoint
CREATE TABLE `__new_users` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random())%4+1,1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))) NOT NULL,
	`tenant_id` text,
	`email` text NOT NULL,
	`password_hash` text,
	`full_name` text NOT NULL,
	`phone` text,
	`role` text NOT NULL,
	`mci_number` text,
	`is_active` integer DEFAULT true NOT NULL,
	`last_login_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_users`("id", "tenant_id", "email", "password_hash", "full_name", "phone", "role", "mci_number", "is_active", "last_login_at", "created_at", "updated_at") SELECT "id", "tenant_id", "email", "password_hash", "full_name", "phone", "role", "mci_number", "is_active", "last_login_at", "created_at", "updated_at" FROM `users`;--> statement-breakpoint
DROP TABLE `users`;--> statement-breakpoint
ALTER TABLE `__new_users` RENAME TO `users`;--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_idx` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `users_tenant_idx` ON `users` (`tenant_id`);