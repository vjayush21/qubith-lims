import {
  sqliteTable,
  text,
  integer,
  real,
  index,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

// ============= Tenants (labs) =============
export const tenants = sqliteTable(
  "tenants",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    address: text("address"),
    city: text("city"),
    phone: text("phone"),
    email: text("email"),
    logoUrl: text("logo_url"),
    nablAccredited: integer("nabl_accredited", { mode: "boolean" }).notNull().default(false),
    plan: text("plan").notNull().default("trial"),
    planExpiresAt: integer("plan_expires_at", { mode: "timestamp" }),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  },
  (t) => ({
    slugIdx: uniqueIndex("tenants_slug_idx").on(t.slug),
  })
);

// ============= Users (lab staff, doctors, patients, phlebotomists) =============
export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    tenantId: text("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    passwordHash: text("password_hash"),
    fullName: text("full_name").notNull(),
    phone: text("phone"),
    role: text("role", { enum: ["lab_admin", "lab_tech", "pathologist", "doctor", "patient", "phlebotomist"] }).notNull(),
    mciNumber: text("mci_number"),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    lastLoginAt: integer("last_login_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  },
  (t) => ({
    emailIdx: uniqueIndex("users_email_idx").on(t.email),
    tenantIdx: index("users_tenant_idx").on(t.tenantId),
  })
);

// ============= Patients =============
export const patients = sqliteTable(
  "patients",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    patientCode: text("patient_code").notNull(),
    fullName: text("full_name").notNull(),
    age: integer("age"),
    ageUnit: text("age_unit").default("years"),
    sex: text("sex"),
    phone: text("phone"),
    email: text("email"),
    address: text("address"),
    refDoctorId: text("ref_doctor_id").references(() => users.id),
    notes: text("notes"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  },
  (t) => ({
    tenantCodeIdx: uniqueIndex("patients_tenant_code_idx").on(t.tenantId, t.patientCode),
    tenantPhoneIdx: index("patients_tenant_phone_idx").on(t.tenantId, t.phone),
  })
);

// ============= Test catalog =============
export const tests = sqliteTable(
  "tests",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    name: text("name").notNull(),
    department: text("department"),
    sampleType: text("sample_type"),
    pricePaise: integer("price_paise").notNull(),
    tatHours: integer("tat_hours").default(24),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  },
  (t) => ({
    tenantCodeIdx: uniqueIndex("tests_tenant_code_idx").on(t.tenantId, t.code),
  })
);

// ============= Test orders =============
export const testOrders = sqliteTable(
  "test_orders",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    orderCode: text("order_code").notNull(),
    patientId: text("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
    collectionCenter: text("collection_center"),
    collectionType: text("collection_type").notNull().default("walk_in"),
    homeAddress: text("home_address"),
    scheduledAt: integer("scheduled_at", { mode: "timestamp" }),
    phlebotomistId: text("phlebotomist_id").references(() => users.id),
    collectionStatus: text("collection_status").notNull().default("pending"),
    totalAmountPaise: integer("total_amount_paise").notNull(),
    paidAmountPaise: integer("paid_amount_paise").notNull().default(0),
    paymentStatus: text("payment_status").notNull().default("pending"),
    orderedById: text("ordered_by_id").references(() => users.id),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  },
  (t) => ({
    tenantOrderIdx: uniqueIndex("test_orders_tenant_order_idx").on(t.tenantId, t.orderCode),
    tenantPatientIdx: index("test_orders_tenant_patient_idx").on(t.tenantId, t.patientId),
  })
);

// ============= Order test items =============
export const orderTests = sqliteTable(
  "order_tests",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    orderId: text("order_id").notNull().references(() => testOrders.id, { onDelete: "cascade" }),
    testId: text("test_id").notNull().references(() => tests.id),
    sampleId: text("sample_id"),
    status: text("status", { enum: ["registered", "collected", "received", "in_progress", "completed", "validated", "rejected"] }).notNull().default("registered"),
    pricePaise: integer("price_paise").notNull(),
    barcode: text("barcode").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  },
  (t) => ({
    tenantBarcodeIdx: uniqueIndex("order_tests_tenant_barcode_idx").on(t.tenantId, t.barcode),
    tenantOrderIdx: index("order_tests_tenant_order_idx").on(t.tenantId, t.orderId),
  })
);

// ============= Results =============
export const results = sqliteTable(
  "results",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    orderTestId: text("order_test_id").notNull().references(() => orderTests.id, { onDelete: "cascade" }),
    value: text("value"),
    numericValue: text("numeric_value"),
    unit: text("unit"),
    referenceRange: text("reference_range"),
    isAbnormal: integer("is_abnormal", { mode: "boolean" }).notNull().default(false),
    isCritical: integer("is_critical", { mode: "boolean" }).notNull().default(false),
    remarks: text("remarks"),
    enteredById: text("entered_by_id").references(() => users.id),
    validatedById: text("validated_by_id").references(() => users.id),
    validatedAt: integer("validated_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  },
  (t) => ({
    tenantOrderTestIdx: index("results_tenant_order_test_idx").on(t.tenantId, t.orderTestId),
  })
);

// ============= Reports =============
export const reports = sqliteTable(
  "reports",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    orderId: text("order_id").notNull().references(() => testOrders.id, { onDelete: "cascade" }),
    reportCode: text("report_code").notNull(),
    status: text("status", { enum: ["draft", "pending_validation", "validated", "critical", "delivered"] }).notNull().default("draft"),
    pdfUrl: text("pdf_url"),
    validatedById: text("validated_by_id").references(() => users.id),
    validatedAt: integer("validated_at", { mode: "timestamp" }),
    deliveredAt: integer("delivered_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  },
  (t) => ({
    tenantOrderIdx: uniqueIndex("reports_tenant_order_idx").on(t.tenantId, t.orderId),
    tenantCodeIdx: uniqueIndex("reports_tenant_code_idx").on(t.tenantId, t.reportCode),
  })
);

// ============= Audit log =============
export const auditLogs = sqliteTable(
  "audit_logs",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    tenantId: text("tenant_id").references(() => tenants.id),
    userId: text("user_id").references(() => users.id),
    action: text("action").notNull(),
    resource: text("resource"),
    metadata: text("metadata"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  },
  (t) => ({
    tenantCreatedIdx: index("audit_logs_tenant_created_idx").on(t.tenantId, t.createdAt),
  })
);

export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Patient = typeof patients.$inferSelect;
export type NewPatient = typeof patients.$inferInsert;
export type Test = typeof tests.$inferSelect;
export type NewTest = typeof tests.$inferInsert;
export type TestOrder = typeof testOrders.$inferSelect;
export type NewTestOrder = typeof testOrders.$inferInsert;
export type OrderTest = typeof orderTests.$inferSelect;
export type NewOrderTest = typeof orderTests.$inferInsert;
export type Result = typeof results.$inferSelect;
export type NewResult = typeof results.$inferInsert;
export type Report = typeof reports.$inferSelect;
export type NewReport = typeof reports.$inferInsert;
