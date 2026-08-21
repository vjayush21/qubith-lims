import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  index,
  uniqueIndex,
  pgEnum,
  bigint,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ============= Enums =============
export const userRoleEnum = pgEnum("user_role", [
  "lab_admin",
  "lab_tech",
  "pathologist",
  "doctor",
  "patient",
  "phlebotomist",
]);

export const sampleStatusEnum = pgEnum("sample_status", [
  "registered",
  "collected",
  "received",
  "in_progress",
  "completed",
  "validated",
  "rejected",
]);

export const reportStatusEnum = pgEnum("report_status", [
  "draft",
  "pending_validation",
  "validated",
  "critical",
  "delivered",
]);

// ============= Tenants (labs) =============
export const tenants = pgTable(
  "tenants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    address: text("address"),
    city: text("city"),
    phone: text("phone"),
    email: text("email"),
    logoUrl: text("logo_url"),
    nablAccredited: boolean("nabl_accredited").notNull().default(false),
    plan: text("plan").notNull().default("trial"), // trial | starter | pro | premium
    planExpiresAt: timestamp("plan_expires_at"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    slugIdx: uniqueIndex("tenants_slug_idx").on(t.slug),
  })
);

// ============= Users (lab staff, doctors, patients, phlebotomists) =============
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    passwordHash: text("password_hash"),
    fullName: text("full_name").notNull(),
    phone: text("phone"),
    role: userRoleEnum("role").notNull(),
    mciNumber: text("mci_number"), // for doctors
    isActive: boolean("is_active").notNull().default(true),
    lastLoginAt: timestamp("last_login_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    emailIdx: uniqueIndex("users_email_idx").on(t.email),
    tenantIdx: index("users_tenant_idx").on(t.tenantId),
  })
);

// ============= Patients =============
export const patients = pgTable(
  "patients",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    patientCode: text("patient_code").notNull(), // internal lab code
    fullName: text("full_name").notNull(),
    age: integer("age"),
    ageUnit: text("age_unit").default("years"), // years | months | days
    sex: text("sex"), // male | female | other
    phone: text("phone"),
    email: text("email"),
    address: text("address"),
    refDoctorId: uuid("ref_doctor_id").references(() => users.id),
    notes: text("notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    tenantCodeIdx: uniqueIndex("patients_tenant_code_idx").on(t.tenantId, t.patientCode),
    tenantPhoneIdx: index("patients_tenant_phone_idx").on(t.tenantId, t.phone),
  })
);

// ============= Test catalog (master list per lab) =============
export const tests = pgTable(
  "tests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    name: text("name").notNull(),
    department: text("department"), // hematology | biochemistry | immuno | etc
    sampleType: text("sample_type"), // blood | urine | stool
    pricePaise: bigint("price_paise", { mode: "number" }).notNull(),
    tatHours: integer("tat_hours").default(24),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    tenantCodeIdx: uniqueIndex("tests_tenant_code_idx").on(t.tenantId, t.code),
  })
);

// ============= Test orders =============
export const testOrders = pgTable(
  "test_orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    orderCode: text("order_code").notNull(), // e.g. ORD-2026-00001
    patientId: uuid("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
    collectionCenter: text("collection_center"), // for multi-centre: which center
    collectionType: text("collection_type").notNull().default("walk_in"), // walk_in | home
    homeAddress: text("home_address"),
    scheduledAt: timestamp("scheduled_at"),
    phlebotomistId: uuid("phlebotomist_id").references(() => users.id),
    collectionStatus: text("collection_status").notNull().default("pending"),
    totalAmountPaise: bigint("total_amount_paise", { mode: "number" }).notNull(),
    paidAmountPaise: bigint("paid_amount_paise", { mode: "number" }).notNull().default(0),
    paymentStatus: text("payment_status").notNull().default("pending"), // pending | partial | paid
    orderedById: uuid("ordered_by_id").references(() => users.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    tenantOrderIdx: uniqueIndex("test_orders_tenant_order_idx").on(t.tenantId, t.orderCode),
    tenantPatientIdx: index("test_orders_tenant_patient_idx").on(t.tenantId, t.patientId),
  })
);

// ============= Order test items (which tests are in an order) =============
export const orderTests = pgTable(
  "order_tests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    orderId: uuid("order_id").notNull().references(() => testOrders.id, { onDelete: "cascade" }),
    testId: uuid("test_id").notNull().references(() => tests.id),
    sampleId: uuid("sample_id"),
    status: sampleStatusEnum("status").notNull().default("registered"),
    pricePaise: bigint("price_paise", { mode: "number" }).notNull(),
    barcode: text("barcode").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    tenantBarcodeIdx: uniqueIndex("order_tests_tenant_barcode_idx").on(t.tenantId, t.barcode),
    tenantOrderIdx: index("order_tests_tenant_order_idx").on(t.tenantId, t.orderId),
  })
);

// ============= Results (one row per test result) =============
export const results = pgTable(
  "results",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    orderTestId: uuid("order_test_id").notNull().references(() => orderTests.id, { onDelete: "cascade" }),
    value: text("value"), // text for flexibility
    numericValue: text("numeric_value"), // for numeric results
    unit: text("unit"),
    referenceRange: text("reference_range"),
    isAbnormal: boolean("is_abnormal").notNull().default(false),
    isCritical: boolean("is_critical").notNull().default(false),
    remarks: text("remarks"),
    enteredById: uuid("entered_by_id").references(() => users.id),
    validatedById: uuid("validated_by_id").references(() => users.id),
    validatedAt: timestamp("validated_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    tenantOrderTestIdx: index("results_tenant_order_test_idx").on(t.tenantId, t.orderTestId),
  })
);

// ============= Reports (one per order, generated when all results are in) =============
export const reports = pgTable(
  "reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    orderId: uuid("order_id").notNull().references(() => testOrders.id, { onDelete: "cascade" }),
    reportCode: text("report_code").notNull(),
    status: reportStatusEnum("status").notNull().default("draft"),
    pdfUrl: text("pdf_url"),
    validatedById: uuid("validated_by_id").references(() => users.id),
    validatedAt: timestamp("validated_at"),
    deliveredAt: timestamp("delivered_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    tenantOrderIdx: uniqueIndex("reports_tenant_order_idx").on(t.tenantId, t.orderId),
    tenantCodeIdx: uniqueIndex("reports_tenant_code_idx").on(t.tenantId, t.reportCode),
  })
);

// ============= Audit log (DPDP compliance) =============
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").references(() => tenants.id),
    userId: uuid("user_id").references(() => users.id),
    action: text("action").notNull(), // e.g. "read_patient", "update_result", "login"
    resource: text("resource"), // e.g. "patient:abc-123"
    metadata: jsonb("metadata"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    tenantCreatedIdx: index("audit_logs_tenant_created_idx").on(t.tenantId, t.createdAt),
  })
);

// ============= Relations =============
export const tenantsRelations = relations(tenants, ({ many }) => ({
  users: many(users),
  patients: many(patients),
  tests: many(tests),
  testOrders: many(testOrders),
}));

export const patientsRelations = relations(patients, ({ many, one }) => ({
  tenant: one(tenants, { fields: [patients.tenantId], references: [tenants.id] }),
  orders: many(testOrders),
  refDoctor: one(users, { fields: [patients.refDoctorId], references: [users.id] }),
}));

export const testOrdersRelations = relations(testOrders, ({ many, one }) => ({
  patient: one(patients, { fields: [testOrders.patientId], references: [patients.id] }),
  tenant: one(tenants, { fields: [testOrders.tenantId], references: [tenants.id] }),
  orderTests: many(orderTests),
  report: one(reports, { fields: [testOrders.id], references: [reports.orderId] }),
}));

export const orderTestsRelations = relations(orderTests, ({ one }) => ({
  order: one(testOrders, { fields: [orderTests.orderId], references: [testOrders.id] }),
  test: one(tests, { fields: [orderTests.testId], references: [tests.id] }),
  result: one(results, { fields: [orderTests.id], references: [results.orderTestId] }),
}));

// ============= Types =============
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
