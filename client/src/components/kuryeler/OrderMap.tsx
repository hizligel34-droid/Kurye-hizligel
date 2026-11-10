import { RouteMap } from "@/components/kuryeler/RouteMap";
import type { DeliveryOrder } from "@shared/kuryeler";
import { parseRouteGeometry } from "@shared/kuryelerRouting";

export function OrderMap({ order }: { order: DeliveryOrder }) {
  const pickup =
    order.pickupLat != null && order.pickupLng != null
      ? { lat: order.pickupLat, lng: order.pickupLng }
      : null;
  const dropoff =
    order.dropoffLat != null && order.dropoffLng != null
      ? { lat: order.dropoffLat, lng: order.dropoffLng }
      : null;
  if (!pickup && !dropoff) return null;
  return (
    <RouteMap
      className="mt-3 h-44"
      pickup={pickup}
      dropoff={dropoff}
      geometry={parseRouteGeometry(order.routeGeojson)}
      interactive={false}
    />
  );
}
