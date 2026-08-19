import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "courier", "accountant"]).default("user").notNull(),
  phone: varchar("phone", { length: 32 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const savedAddresses = mysqlTable("savedAddresses", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  label: varchar("label", { length: 80 }).notNull(),
  province: varchar("province", { length: 80 }).notNull(),
  district: varchar("district", { length: 100 }).notNull(),
  neighborhood: varchar("neighborhood", { length: 140 }).notNull(),
  street: varchar("street", { length: 180 }).notNull(),
  buildingNo: varchar("buildingNo", { length: 30 }).notNull(),
  apartmentNo: varchar("apartmentNo", { length: 30 }).default("").notNull(),
  floor: varchar("floor", { length: 20 }).default("").notNull(),
  courierNote: varchar("courierNote", { length: 500 }).default("").notNull(),
  addressDetail: varchar("addressDetail", { length: 240 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  trackingCode: varchar("trackingCode", { length: 24 }).notNull().unique(),
  customerId: int("customerId").notNull(),
  courierId: int("courierId"),
  pickupAddress: text("pickupAddress").notNull(),
  pickupProvince: varchar("pickupProvince", { length: 80 }).notNull(),
  pickupDistrict: varchar("pickupDistrict", { length: 100 }).notNull(),
  pickupNeighborhood: varchar("pickupNeighborhood", { length: 140 }).notNull(),
  pickupStreet: varchar("pickupStreet", { length: 180 }).notNull(),
  pickupBuildingNo: varchar("pickupBuildingNo", { length: 30 }).default("").notNull(),
  pickupApartmentNo: varchar("pickupApartmentNo", { length: 30 }).default("").notNull(),
  pickupFloor: varchar("pickupFloor", { length: 20 }).default("").notNull(),
  pickupCourierNote: varchar("pickupCourierNote", { length: 500 }).default("").notNull(),
  pickupAddressDetail: varchar("pickupAddressDetail", { length: 240 }).notNull(),
  deliveryAddress: text("deliveryAddress").notNull(),
  deliveryProvince: varchar("deliveryProvince", { length: 80 }).notNull(),
  deliveryDistrict: varchar("deliveryDistrict", { length: 100 }).notNull(),
  deliveryNeighborhood: varchar("deliveryNeighborhood", { length: 140 }).notNull(),
  deliveryStreet: varchar("deliveryStreet", { length: 180 }).notNull(),
  deliveryBuildingNo: varchar("deliveryBuildingNo", { length: 30 }).default("").notNull(),
  deliveryApartmentNo: varchar("deliveryApartmentNo", { length: 30 }).default("").notNull(),
  deliveryFloor: varchar("deliveryFloor", { length: 20 }).default("").notNull(),
  deliveryCourierNote: varchar("deliveryCourierNote", { length: 500 }).default("").notNull(),
  deliveryAddressDetail: varchar("deliveryAddressDetail", { length: 240 }).notNull(),
  productDescription: text("productDescription").notNull(),
  customerPhone: varchar("customerPhone", { length: 32 }).notNull(),
  distanceKm: decimal("distanceKm", { precision: 8, scale: 2 }).notNull(),
  routeDurationMinutes: decimal("routeDurationMinutes", { precision: 8, scale: 1 }).notNull(),
  routeStatus: mysqlEnum("routeStatus", ["verified", "unavailable"]).default("verified").notNull(),
  routeProvider: varchar("routeProvider", { length: 40 }).default("google_driving").notNull(),
  pickupLatitude: decimal("pickupLatitude", { precision: 10, scale: 7 }),
  pickupLongitude: decimal("pickupLongitude", { precision: 10, scale: 7 }),
  deliveryLatitude: decimal("deliveryLatitude", { precision: 10, scale: 7 }),
  deliveryLongitude: decimal("deliveryLongitude", { precision: 10, scale: 7 }),
  totalPrice: decimal("totalPrice", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: mysqlEnum("paymentMethod", ["sandbox_card", "cash_on_delivery"]).default("sandbox_card").notNull(),
  paymentStatus: mysqlEnum("paymentStatus", ["pending", "paid", "collect_on_delivery", "failed", "refunded"]).default("pending").notNull(),
  paymentReference: varchar("paymentReference", { length: 80 }),
  commission: decimal("commission", { precision: 10, scale: 2 }).notNull(),
  courierEarning: decimal("courierEarning", { precision: 10, scale: 2 }).notNull(),
  companyRevenue: decimal("companyRevenue", { precision: 10, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["received", "on_the_way", "delivered", "cancelled"]).default("received").notNull(),
  deliveryOtpHash: varchar("deliveryOtpHash", { length: 64 }).default("").notNull(),
  deliveryPhotoKey: varchar("deliveryPhotoKey", { length: 360 }),
  deliveryPhotoUrl: varchar("deliveryPhotoUrl", { length: 480 }),
  assignedAt: timestamp("assignedAt"),
  deliveredAt: timestamp("deliveredAt"),
  cancelledAt: timestamp("cancelledAt"),
  cancelledByRole: varchar("cancelledByRole", { length: 20 }),
  cancellationReason: varchar("cancellationReason", { length: 300 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const pricingSettings = mysqlTable("pricingSettings", {
  id: int("id").primaryKey(),
  openingFeeTl: decimal("openingFeeTl", { precision: 10, scale: 2 }).notNull(),
  ratePerKmTl: decimal("ratePerKmTl", { precision: 10, scale: 2 }).notNull(),
  commissionRate: decimal("commissionRate", { precision: 5, scale: 4 }).notNull(),
  updatedBy: int("updatedBy"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const courierOperations = mysqlTable("courierOperations", {
  courierId: int("courierId").primaryKey(),
  availability: mysqlEnum("availability", ["offline", "available", "busy", "break"]).default("offline").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  accuracy: decimal("accuracy", { precision: 8, scale: 2 }),
  lastLocationAt: timestamp("lastLocationAt"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  senderId: int("senderId"),
  senderRole: mysqlEnum("senderRole", ["customer", "courier", "operator", "bot"]).notNull(),
  content: text("content").notNull(),
  detectedLanguage: varchar("detectedLanguage", { length: 16 }).default("tr").notNull(),
  translatedContent: text("translatedContent"),
  attachmentKey: varchar("attachmentKey", { length: 360 }),
  attachmentUrl: varchar("attachmentUrl", { length: 480 }),
  attachmentContentType: varchar("attachmentContentType", { length: 80 }),
  attachmentName: varchar("attachmentName", { length: 180 }),
  attachmentSizeBytes: int("attachmentSizeBytes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const courierContracts = mysqlTable("courierContracts", {
  id: int("id").autoincrement().primaryKey(),
  courierId: int("courierId").notNull().unique(),
  contractVersion: varchar("contractVersion", { length: 40 }).notNull(),
  courierFullName: varchar("courierFullName", { length: 160 }).notNull(),
  identityNumber: varchar("identityNumber", { length: 32 }).notNull(),
  residenceAddress: varchar("residenceAddress", { length: 320 }).notNull(),
  taxOffice: varchar("taxOffice", { length: 120 }).notNull(),
  taxNumber: varchar("taxNumber", { length: 40 }).notNull(),
  vehiclePlate: varchar("vehiclePlate", { length: 20 }).notNull(),
  iban: varchar("iban", { length: 34 }).notNull(),
  acceptedAt: timestamp("acceptedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const courierDocuments = mysqlTable("courierDocuments", {
  id: int("id").autoincrement().primaryKey(),
  courierId: int("courierId").notNull(),
  documentType: mysqlEnum("documentType", ["identity", "license", "vehicle_registration"]).notNull(),
  storageKey: varchar("storageKey", { length: 320 }).notNull(),
  storageUrl: varchar("storageUrl", { length: 420 }).notNull(),
  originalName: varchar("originalName", { length: 180 }).notNull(),
  contentType: varchar("contentType", { length: 80 }).notNull(),
  sizeBytes: int("sizeBytes").notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  reviewNote: varchar("reviewNote", { length: 500 }),
  uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
  reviewedAt: timestamp("reviewedAt"),
});

export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  orderId: int("orderId"),
  title: varchar("title", { length: 160 }).notNull(),
  content: text("content").notNull(),
  isRead: int("isRead").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type SavedAddress = typeof savedAddresses.$inferSelect;
export type InsertSavedAddress = typeof savedAddresses.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type PricingSettings = typeof pricingSettings.$inferSelect;
export type CourierOperation = typeof courierOperations.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type CourierContract = typeof courierContracts.$inferSelect;
export type CourierDocument = typeof courierDocuments.$inferSelect;
