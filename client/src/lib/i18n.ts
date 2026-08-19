export const supportedLanguages = [
  { code: "tr", label: "Türkçe", nativeLabel: "Türkçe", dir: "ltr" },
  { code: "en", label: "English", nativeLabel: "English", dir: "ltr" },
  { code: "ar", label: "العربية", nativeLabel: "العربية", dir: "rtl" },
  { code: "ru", label: "Русский", nativeLabel: "Русский", dir: "ltr" },
  { code: "el", label: "Ελληνικά", nativeLabel: "Ελληνικά", dir: "ltr" },
  { code: "it", label: "Italiano", nativeLabel: "Italiano", dir: "ltr" },
  { code: "de", label: "Deutsch", nativeLabel: "Deutsch", dir: "ltr" },
  { code: "fr", label: "Français", nativeLabel: "Français", dir: "ltr" },
] as const;

export type LanguageCode = (typeof supportedLanguages)[number]["code"];
export type TranslationKey = "services" | "tracking" | "support" | "account" | "operations" | "login" | "logout" | "greeting" | "fastOrder" | "trackOrder" | "cityDelivery" | "heroTitle" | "heroDescription" | "activeTracking" | "routeStatus" | "live" | "offlinePackages" | "orderTracking" | "liveTracking" | "follow" | "trackingNumber" | "notifications" | "notificationDescription" | "emptyNotifications" | "language" | "delivered" | "onTheWay" | "received" | "cancelled";

type TranslationStrings = Record<TranslationKey, string>;

export const translations = {
  tr: {
    services: "Hizmetler", tracking: "Sipariş Takibi", support: "Canlı Destek", account: "Hesabım", operations: "Operasyon",
    login: "Giriş yap", logout: "Çıkış", greeting: "Merhaba", fastOrder: "Hızlı sipariş oluştur", trackOrder: "Siparişimi takip et",
    cityDelivery: "Türkiye geneli hızlı teslimat", heroTitle: "Şehrin hızını kapınıza taşıyoruz.",
    heroDescription: "Ürünü sizin için alır, güvenle teslim ederiz. Tek panelden sipariş, takip, destek ve kazanç yönetimi.",
    activeTracking: "Aktif takip", routeStatus: "Rota durumu", live: "Canlı", offlinePackages: "Offline şehir paketleri",
    orderTracking: "Siparişiniz nerede?", liveTracking: "Canlı takip", follow: "Takip et", trackingNumber: "Takip numarası",
    notifications: "Bildirimler", notificationDescription: "Sipariş ve hesap güncellemeleri burada görünür.", emptyNotifications: "Henüz yeni bildirim yok.",
    language: "Dil", delivered: "Teslim Edildi", onTheWay: "Yolda", received: "Alındı", cancelled: "İptal Edildi",
  },
  en: {
    services: "Services", tracking: "Track order", support: "Live support", account: "My account", operations: "Operations",
    login: "Sign in", logout: "Sign out", greeting: "Hello", fastOrder: "Create a fast order", trackOrder: "Track my order",
    cityDelivery: "Fast delivery across Türkiye", heroTitle: "We bring the city’s speed to your door.",
    heroDescription: "We pick up and deliver your items safely. Manage orders, tracking, support and earnings in one panel.",
    activeTracking: "Active tracking", routeStatus: "Route status", live: "Live", offlinePackages: "Offline city packages",
    orderTracking: "Where is your order?", liveTracking: "Live tracking", follow: "Track", trackingNumber: "Tracking number",
    notifications: "Notifications", notificationDescription: "Order and account updates appear here.", emptyNotifications: "No new notifications yet.",
    language: "Language", delivered: "Delivered", onTheWay: "On the way", received: "Received", cancelled: "Cancelled",
  },
  ar: {
    services: "الخدمات", tracking: "تتبع الطلب", support: "الدعم المباشر", account: "حسابي", operations: "العمليات",
    login: "تسجيل الدخول", logout: "تسجيل الخروج", greeting: "مرحباً", fastOrder: "إنشاء طلب سريع", trackOrder: "تتبع طلبي",
    cityDelivery: "توصيل سريع في جميع أنحاء تركيا", heroTitle: "نوصّل سرعة المدينة إلى بابك.",
    heroDescription: "نستلم منتجاتك ونسلّمها بأمان. أدر الطلبات والتتبع والدعم والأرباح من لوحة واحدة.",
    activeTracking: "تتبع نشط", routeStatus: "حالة المسار", live: "مباشر", offlinePackages: "خرائط المدن دون اتصال",
    orderTracking: "أين طلبك؟", liveTracking: "تتبع مباشر", follow: "تتبع", trackingNumber: "رقم التتبع",
    notifications: "الإشعارات", notificationDescription: "تظهر تحديثات الطلب والحساب هنا.", emptyNotifications: "لا توجد إشعارات جديدة بعد.",
    language: "اللغة", delivered: "تم التسليم", onTheWay: "في الطريق", received: "تم الاستلام", cancelled: "ملغى",
  },
  ru: {
    services: "Сервисы", tracking: "Отследить заказ", support: "Поддержка", account: "Мой аккаунт", operations: "Операции",
    login: "Войти", logout: "Выйти", greeting: "Здравствуйте", fastOrder: "Создать быстрый заказ", trackOrder: "Отследить заказ",
    cityDelivery: "Быстрая доставка по всей Турции", heroTitle: "Доставляем скорость города к вашей двери.",
    heroDescription: "Заберём и безопасно доставим товар. Заказы, отслеживание, поддержка и доходы в одной панели.",
    activeTracking: "Активное отслеживание", routeStatus: "Статус маршрута", live: "Онлайн", offlinePackages: "Офлайн-пакеты карт",
    orderTracking: "Где мой заказ?", liveTracking: "Онлайн-отслеживание", follow: "Отследить", trackingNumber: "Номер отслеживания",
    notifications: "Уведомления", notificationDescription: "Здесь появятся обновления заказа и аккаунта.", emptyNotifications: "Новых уведомлений пока нет.",
    language: "Язык", delivered: "Доставлено", onTheWay: "В пути", received: "Получено", cancelled: "Отменено",
  },
  el: {
    services: "Υπηρεσίες", tracking: "Παρακολούθηση παραγγελίας", support: "Ζωντανή υποστήριξη", account: "Ο λογαριασμός μου", operations: "Λειτουργίες",
    login: "Σύνδεση", logout: "Αποσύνδεση", greeting: "Γεια σας", fastOrder: "Νέα γρήγορη παραγγελία", trackOrder: "Παρακολούθηση παραγγελίας",
    cityDelivery: "Γρήγορη παράδοση σε όλη την Τουρκία", heroTitle: "Φέρνουμε την ταχύτητα της πόλης στην πόρτα σας.",
    heroDescription: "Παραλαμβάνουμε και παραδίδουμε με ασφάλεια. Διαχειριστείτε παραγγελίες, παρακολούθηση, υποστήριξη και έσοδα από ένα πάνελ.",
    activeTracking: "Ενεργή παρακολούθηση", routeStatus: "Κατάσταση διαδρομής", live: "Ζωντανά", offlinePackages: "Πακέτα χαρτών εκτός σύνδεσης",
    orderTracking: "Πού είναι η παραγγελία σας;", liveTracking: "Ζωντανή παρακολούθηση", follow: "Παρακολούθηση", trackingNumber: "Αριθμός παρακολούθησης",
    notifications: "Ειδοποιήσεις", notificationDescription: "Οι ενημερώσεις παραγγελίας και λογαριασμού εμφανίζονται εδώ.", emptyNotifications: "Δεν υπάρχουν νέες ειδοποιήσεις.",
    language: "Γλώσσα", delivered: "Παραδόθηκε", onTheWay: "Σε διαδρομή", received: "Παραλήφθηκε", cancelled: "Ακυρώθηκε",
  },
  it: {
    services: "Servizi", tracking: "Traccia ordine", support: "Assistenza live", account: "Il mio account", operations: "Operazioni",
    login: "Accedi", logout: "Esci", greeting: "Ciao", fastOrder: "Crea un ordine rapido", trackOrder: "Traccia il mio ordine",
    cityDelivery: "Consegna rapida in tutta la Turchia", heroTitle: "Portiamo la velocità della città alla tua porta.",
    heroDescription: "Ritiriamo e consegniamo i tuoi prodotti in sicurezza. Ordini, tracking, assistenza e guadagni in un unico pannello.",
    activeTracking: "Tracking attivo", routeStatus: "Stato del percorso", live: "Live", offlinePackages: "Mappe offline",
    orderTracking: "Dov’è il tuo ordine?", liveTracking: "Tracking live", follow: "Traccia", trackingNumber: "Numero di tracking",
    notifications: "Notifiche", notificationDescription: "Qui vedrai gli aggiornamenti dell’ordine e dell’account.", emptyNotifications: "Nessuna nuova notifica.",
    language: "Lingua", delivered: "Consegnato", onTheWay: "In consegna", received: "Ricevuto", cancelled: "Annullato",
  },
  de: {
    services: "Dienste", tracking: "Bestellung verfolgen", support: "Live-Support", account: "Mein Konto", operations: "Operationen",
    login: "Anmelden", logout: "Abmelden", greeting: "Hallo", fastOrder: "Schnelle Bestellung erstellen", trackOrder: "Meine Bestellung verfolgen",
    cityDelivery: "Schnelle Lieferung in der ganzen Türkei", heroTitle: "Wir bringen die Geschwindigkeit der Stadt vor Ihre Tür.",
    heroDescription: "Wir holen Ihre Produkte ab und liefern sie sicher. Bestellungen, Tracking, Support und Einnahmen in einem Panel.",
    activeTracking: "Aktives Tracking", routeStatus: "Routenstatus", live: "Live", offlinePackages: "Offline-Kartenpakete",
    orderTracking: "Wo ist Ihre Bestellung?", liveTracking: "Live-Tracking", follow: "Verfolgen", trackingNumber: "Trackingnummer",
    notifications: "Benachrichtigungen", notificationDescription: "Bestell- und Kontoaktualisierungen erscheinen hier.", emptyNotifications: "Noch keine neuen Benachrichtigungen.",
    language: "Sprache", delivered: "Geliefert", onTheWay: "Unterwegs", received: "Erhalten", cancelled: "Storniert",
  },
  fr: {
    services: "Services", tracking: "Suivre la commande", support: "Assistance en direct", account: "Mon compte", operations: "Opérations",
    login: "Se connecter", logout: "Se déconnecter", greeting: "Bonjour", fastOrder: "Créer une commande rapide", trackOrder: "Suivre ma commande",
    cityDelivery: "Livraison rapide dans toute la Turquie", heroTitle: "Nous apportons la vitesse de la ville à votre porte.",
    heroDescription: "Nous récupérons et livrons vos produits en toute sécurité. Gérez commandes, suivi, assistance et revenus depuis un seul panneau.",
    activeTracking: "Suivi actif", routeStatus: "État du trajet", live: "En direct", offlinePackages: "Cartes hors ligne",
    orderTracking: "Où est votre commande ?", liveTracking: "Suivi en direct", follow: "Suivre", trackingNumber: "Numéro de suivi",
    notifications: "Notifications", notificationDescription: "Les mises à jour de commande et de compte apparaissent ici.", emptyNotifications: "Aucune nouvelle notification.",
    language: "Langue", delivered: "Livré", onTheWay: "En route", received: "Reçu", cancelled: "Annulé",
  },
} satisfies Record<LanguageCode, TranslationStrings>;

export const getStoredLanguage = (): LanguageCode => {
  if (typeof window === "undefined") return "tr";
  const stored = window.localStorage.getItem("run-kurye-language");
  return supportedLanguages.some(language => language.code === stored) ? (stored as LanguageCode) : "tr";
};
