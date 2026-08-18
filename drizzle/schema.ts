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
  pickupAddressDetail: varchar("pickupAddressDetail", { length: 240 }).notNull(),
  deliveryAddress: text("deliveryAddress").notNull(),
  deliveryProvince: varchar("deliveryProvince", { length: 80 }).notNull(),
  deliveryDistrict: varchar("deliveryDistrict", { length: 100 }).notNull(),
  deliveryNeighborhood: varchar("deliveryNeighborhood", { length: 140 }).notNull(),
  deliveryStreet: varchar("deliveryStreet", { length: 180 }).notNull(),
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
  commission: decimal("commission", { precision: 10, scale: 2 }).notNull(),
  courierEarning: decimal("courierEarning", { precision: 10, scale: 2 }).notNull(),
  companyRevenue: decimal("companyRevenue", { precision: 10, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["received", "on_the_way", "delivered", "cancelled"]).default("received").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
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
  createdAt: timestamp("createdAt").defaultNow().notNull(),
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
export type Order = typeof orders.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
