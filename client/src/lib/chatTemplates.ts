import type { LanguageCode } from "@/lib/i18n";

export type ChatTemplateRole = "customer" | "courier";

export type ChatTemplate = {
  id: string;
  label: string;
  content: string;
};

type LocalizedTemplate = Record<LanguageCode, ChatTemplate>;

const templates: Record<ChatTemplateRole, LocalizedTemplate[]> = {
  customer: [
    { tr: { id: "coming", label: "Geliyorum", content: "Geliyorum." }, en: { id: "coming", label: "I’m coming", content: "I’m coming." }, ar: { id: "coming", label: "أنا قادم", content: "أنا قادم." }, ru: { id: "coming", label: "Я иду", content: "Я иду." }, el: { id: "coming", label: "Έρχομαι", content: "Έρχομαι." }, it: { id: "coming", label: "Sto arrivando", content: "Sto arrivando." }, de: { id: "coming", label: "Ich komme", content: "Ich komme." }, fr: { id: "coming", label: "J’arrive", content: "J’arrive." } },
    { tr: { id: "at_address", label: "Adresteyim", content: "Adresteyim." }, en: { id: "at_address", label: "I’m at the address", content: "I’m at the address." }, ar: { id: "at_address", label: "أنا في العنوان", content: "أنا في العنوان." }, ru: { id: "at_address", label: "Я по адресу", content: "Я по адресу." }, el: { id: "at_address", label: "Είμαι στη διεύθυνση", content: "Είμαι στη διεύθυνση." }, it: { id: "at_address", label: "Sono all’indirizzo", content: "Sono all’indirizzo." }, de: { id: "at_address", label: "Ich bin an der Adresse", content: "Ich bin an der Adresse." }, fr: { id: "at_address", label: "Je suis à l’adresse", content: "Je suis à l’adresse." } },
    { tr: { id: "at_door", label: "Kapıdayım", content: "Kapıdayım, sizi bekliyorum." }, en: { id: "at_door", label: "I’m at the door", content: "I’m at the door, waiting for you." }, ar: { id: "at_door", label: "أنا عند الباب", content: "أنا عند الباب، أنتظرك." }, ru: { id: "at_door", label: "Я у двери", content: "Я у двери, жду вас." }, el: { id: "at_door", label: "Είμαι στην πόρτα", content: "Είμαι στην πόρτα και σας περιμένω." }, it: { id: "at_door", label: "Sono alla porta", content: "Sono alla porta, ti aspetto." }, de: { id: "at_door", label: "Ich bin an der Tür", content: "Ich bin an der Tür und warte auf Sie." }, fr: { id: "at_door", label: "Je suis à la porte", content: "Je suis à la porte, je vous attends." } },
    { tr: { id: "share_location", label: "Konum paylaşır mısınız?", content: "Konumunuzu paylaşır mısınız?" }, en: { id: "share_location", label: "Could you share your location?", content: "Could you share your location?" }, ar: { id: "share_location", label: "هل يمكنك مشاركة موقعك؟", content: "هل يمكنك مشاركة موقعك؟" }, ru: { id: "share_location", label: "Поделитесь геолокацией?", content: "Поделитесь, пожалуйста, своей геолокацией." }, el: { id: "share_location", label: "Μπορείτε να στείλετε την τοποθεσία σας;", content: "Μπορείτε να στείλετε την τοποθεσία σας;" }, it: { id: "share_location", label: "Puoi condividere la posizione?", content: "Puoi condividere la tua posizione?" }, de: { id: "share_location", label: "Können Sie den Standort teilen?", content: "Können Sie bitte Ihren Standort teilen?" }, fr: { id: "share_location", label: "Pouvez-vous partager votre position ?", content: "Pouvez-vous partager votre position ?" } },
  ],
  courier: [
    { tr: { id: "picked_up", label: "Siparişi aldım", content: "Siparişinizi teslim aldım." }, en: { id: "picked_up", label: "I picked up your order", content: "I picked up your order." }, ar: { id: "picked_up", label: "استلمت طلبك", content: "لقد استلمت طلبك." }, ru: { id: "picked_up", label: "Я забрал заказ", content: "Я забрал ваш заказ." }, el: { id: "picked_up", label: "Παρέλαβα την παραγγελία", content: "Παρέλαβα την παραγγελία σας." }, it: { id: "picked_up", label: "Ho ritirato l’ordine", content: "Ho ritirato il tuo ordine." }, de: { id: "picked_up", label: "Bestellung abgeholt", content: "Ich habe Ihre Bestellung abgeholt." }, fr: { id: "picked_up", label: "Commande récupérée", content: "J’ai récupéré votre commande." } },
    { tr: { id: "on_the_way", label: "Yoldayım", content: "Yoldayım, birazdan oradayım." }, en: { id: "on_the_way", label: "I’m on my way", content: "I’m on my way and will be there soon." }, ar: { id: "on_the_way", label: "أنا في الطريق", content: "أنا في الطريق وسأصل قريباً." }, ru: { id: "on_the_way", label: "Я в пути", content: "Я уже в пути и скоро буду." }, el: { id: "on_the_way", label: "Είμαι καθ’ οδόν", content: "Είμαι καθ’ οδόν και θα φτάσω σύντομα." }, it: { id: "on_the_way", label: "Sono in arrivo", content: "Sono in arrivo, sarò lì presto." }, de: { id: "on_the_way", label: "Ich bin unterwegs", content: "Ich bin unterwegs und bald da." }, fr: { id: "on_the_way", label: "Je suis en route", content: "Je suis en route, j’arrive bientôt." } },
    { tr: { id: "arrived", label: "Adrese geldim", content: "Adrese geldim." }, en: { id: "arrived", label: "I’ve arrived", content: "I’ve arrived at the address." }, ar: { id: "arrived", label: "وصلت إلى العنوان", content: "لقد وصلت إلى العنوان." }, ru: { id: "arrived", label: "Я приехал", content: "Я приехал по адресу." }, el: { id: "arrived", label: "Έφτασα", content: "Έφτασα στη διεύθυνση." }, it: { id: "arrived", label: "Sono arrivato", content: "Sono arrivato all’indirizzo." }, de: { id: "arrived", label: "Ich bin angekommen", content: "Ich bin an der Adresse angekommen." }, fr: { id: "arrived", label: "Je suis arrivé", content: "Je suis arrivé à l’adresse." } },
    { tr: { id: "ready_to_deliver", label: "Teslimata hazırım", content: "Teslimat için hazırım." }, en: { id: "ready_to_deliver", label: "Ready to deliver", content: "I’m ready to complete the delivery." }, ar: { id: "ready_to_deliver", label: "جاهز للتسليم", content: "أنا جاهز لإتمام التسليم." }, ru: { id: "ready_to_deliver", label: "Готов к доставке", content: "Я готов завершить доставку." }, el: { id: "ready_to_deliver", label: "Έτοιμος για παράδοση", content: "Είμαι έτοιμος να ολοκληρώσω την παράδοση." }, it: { id: "ready_to_deliver", label: "Pronto per la consegna", content: "Sono pronto a completare la consegna." }, de: { id: "ready_to_deliver", label: "Bereit zur Übergabe", content: "Ich bin bereit, die Lieferung abzuschließen." }, fr: { id: "ready_to_deliver", label: "Prêt à livrer", content: "Je suis prêt à terminer la livraison." } },
  ],
};

export function getChatTemplates(role: ChatTemplateRole, language: LanguageCode): ChatTemplate[] {
  return templates[role].map(template => template[language]);
}

export function getChatTemplate(role: ChatTemplateRole, language: LanguageCode, id: string): ChatTemplate | undefined {
  return getChatTemplates(role, language).find(template => template.id === id);
}
