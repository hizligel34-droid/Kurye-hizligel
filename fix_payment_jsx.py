from pathlib import Path

path = Path("client/src/pages/Home.tsx")
text = path.read_text()
start_marker = '{paymentMethod === "sandbox_card" && <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_100px_80px]">'
start = text.index(start_marker)
end_marker = '<Button disabled={createOrder.isPending || !paymentApproved'
end = text.index(end_marker, start)
replacement = '''{paymentMethod === "sandbox_card" && <div className="mt-3">
  <div className="grid gap-2 sm:grid-cols-[1fr_100px_80px]"><Input aria-label="Kart numarası" placeholder="4242 4242 4242 4242" value={paymentForm.cardNumber} onChange={e => { setPaymentApproved(false); setPaymentReference(null); setPaymentForm({...paymentForm, cardNumber: e.target.value}); }}/><Input aria-label="Son kullanma" placeholder="12/30" value={paymentForm.expiry} onChange={e => { setPaymentApproved(false); setPaymentReference(null); setPaymentForm({...paymentForm, expiry: e.target.value}); }}/><Input aria-label="CVV" placeholder="123" value={paymentForm.cvv} onChange={e => { setPaymentApproved(false); setPaymentReference(null); setPaymentForm({...paymentForm, cvv: e.target.value}); }}/></div>
  <Button type="button" variant="outline" disabled={!orderFormComplete || !canConfirmOrder(routeEstimate.data?.routeStatus) || sandboxPayment.isPending} onClick={() => routeEstimate.data && sandboxPayment.mutate({ ...paymentForm, amount: routeEstimate.data.total })} className="mt-3 w-full">{sandboxPayment.isPending ? "Ödeme test ediliyor…" : "Sandbox ödemeyi test et"}</Button>
</div>}
{paymentMethod === "cash_on_delivery" && <p className="mt-3 rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-700">Kapıda nakit seçildi. Tutar, kurye teslimatı tamamladığında müşteriden nakit tahsil edilecektir.</p>}
'''
path.write_text(text[:start] + replacement + text[end:])
