export type OrderProgressInput = {
  addressesReady: boolean;
  routeConfirmed: boolean;
  paymentApproved: boolean;
};

export type OrderProgressStep = {
  id: "addresses" | "route" | "payment";
  label: string;
  complete: boolean;
};

export function getOrderProgressSteps(input: OrderProgressInput): OrderProgressStep[] {
  return [
    { id: "addresses", label: "Adresler", complete: input.addressesReady },
    { id: "route", label: "Rota", complete: input.routeConfirmed },
    { id: "payment", label: "Ödeme", complete: input.paymentApproved },
  ];
}

export function getOrderProgressPercent(input: OrderProgressInput): number {
  return Math.round((getOrderProgressSteps(input).filter(step => step.complete).length / 3) * 100);
}
