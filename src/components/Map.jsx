import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/* ============================================================
   RYDO COLORFUL LIVE DRIVER MAP

   IMPORTANT:
   - BookRide remains the journey controller.
   - driverLocation is the source of truth for the car position.
   - Latitude / longitude are never replaced by screen percentages.
   - The car is smoothly animated between real coordinates.
   - OSRM gives the road route; if it fails, a safe straight-line
     fallback is used so the map still works.
============================================================ */

const DEFAULT_CENTER = [19.2183, 72.9781];
const ROUTER_URL = "https://router.project-osrm.org/route/v1/driving";

function getCoordinates(location) {
  if (!location) return null;

  const lat = Number(
    location.lat ??
      location.latitude ??
      location.position?.lat ??
      location.coordinates?.lat ??
      location.coords?.lat
  );

  const lng = Number(
    location.lng ??
      location.lon ??
      location.longitude ??
      location.position?.lng ??
      location.coordinates?.lng ??
      location.coords?.lng
  );

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    return null;
  }

  return { lat, lng };
}

function distanceSquared(a, b) {
  if (!a || !b) return Infinity;
  const latScale = Math.cos((a.lat * Math.PI) / 180);
  const dx = (b.lng - a.lng) * latScale;
  const dy = b.lat - a.lat;
  return dx * dx + dy * dy;
}

function pointKey(point) {
  return `${point.lat.toFixed(6)},${point.lng.toFixed(6)}`;
}

function projectPointToSegment(point, a, b) {
  const cosLat = Math.cos((point.lat * Math.PI) / 180);
  const px = point.lng * cosLat;
  const py = point.lat;
  const ax = a.lng * cosLat;
  const ay = a.lat;
  const bx = b.lng * cosLat;
  const by = b.lat;

  const dx = bx - ax;
  const dy = by - ay;
  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared === 0) {
    return { point: a, distance: distanceSquared(point, a) };
  }

  const t = Math.max(
    0,
    Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lengthSquared)
  );

  const projected = {
    lat: a.lat + (b.lat - a.lat) * t,
    lng: a.lng + (b.lng - a.lng) * t,
  };

  return {
    point: projected,
    distance: distanceSquared(point, projected),
  };
}

function snapToRoute(point, route) {
  if (!point || !route || route.length < 2) return point;

  let best = null;

  for (let i = 0; i < route.length - 1; i += 1) {
    const result = projectPointToSegment(
      point,
      route[i],
      route[i + 1]
    );

    if (!best || result.distance < best.distance) {
      best = result;
    }
  }

  return best?.point || point;
}

async function fetchRoute(from, to, signal) {
  if (!from || !to) return [];

  const url = `${ROUTER_URL}/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson&steps=false`;

  const response = await fetch(url, { signal });

  if (!response.ok) {
    throw new Error(`Routing service returned ${response.status}`);
  }

  const data = await response.json();
  const coordinates = data?.routes?.[0]?.geometry?.coordinates;

  if (!Array.isArray(coordinates) || coordinates.length < 2) {
    return [];
  }

  return coordinates
    .map(([lng, lat]) => ({
      lat: Number(lat),
      lng: Number(lng),
    }))
    .filter((point) => getCoordinates(point));
}

function getStageText(stage) {
  switch (stage) {
    case 1:
      return "Driver is assigned";
    case 2:
      return "Driver is travelling to pickup";
    case 3:
      return "Driver has arrived at pickup";
    case 4:
      return "Ride is moving to destination";
    case 5:
      return "You have reached your destination";
    default:
      return "Waiting for booking";
  }
}

function getStageShort(stage) {
  switch (stage) {
    case 1:
      return "ASSIGNED";
    case 2:
      return "ON THE WAY";
    case 3:
      return "AT PICKUP";
    case 4:
      return "IN TRANSIT";
    case 5:
      return "ARRIVED";
    default:
      return "READY";
  }
}

function getStageColor(stage) {
  if (stage >= 5) return "#22C55E";
  if (stage === 3) return "#00D4A0";
  if (stage === 4) return "#8B5CF6";
  return "#FFBE0B";
}

function getFallbackProgress(stage) {
  switch (stage) {
    case 1:
      return 0.05;
    case 2:
      return 0.2;
    case 3:
      return 0.38;
    case 4:
      return 0.65;
    case 5:
      return 1;
    default:
      return 0;
  }
}

/* ============================================================
   COLORFUL SVG MARKERS
============================================================ */

function createDriverIcon() {
  return L.divIcon({
    className: "rydo-colorful-marker",
    html: `
      <div class="rydo-driver-wrap">
        <div class="rydo-driver-pulse"></div>
        <div class="rydo-driver-logo">
          <svg viewBox="0 0 64 64" aria-hidden="true">
            <rect x="7" y="24" width="50" height="23" rx="8" fill="#FFD21F"/>
            <path d="M17 24l7-12h17l8 12" fill="#FFE77A"/>
            <path d="M24 16h17l5 8H19z" fill="#66D9FF"/>
            <circle cx="19" cy="49" r="6" fill="#172033"/>
            <circle cx="47" cy="49" r="6" fill="#172033"/>
            <circle cx="19" cy="49" r="2.5" fill="#E9F2FF"/>
            <circle cx="47" cy="49" r="2.5" fill="#E9F2FF"/>
            <path d="M12 31h8M44 31h8" stroke="#172033" stroke-width="3" stroke-linecap="round"/>
            <circle cx="32" cy="31" r="3" fill="#FF4D91"/>
          </svg>
        </div>
        <div class="rydo-driver-badge">RYDO</div>
      </div>
    `,
    iconSize: [92, 92],
    iconAnchor: [46, 46],
  });
}

function createPickupIcon() {
  return L.divIcon({
    className: "rydo-colorful-marker",
    html: `
      <div class="rydo-location-wrap pickup-location">
        <div class="rydo-location-pin">
          <svg viewBox="0 0 48 60" aria-hidden="true">
            <path d="M24 57S5 37 5 23C5 11.95 13.5 3 24 3s19 8.95 19 20c0 14-19 34-19 34z" fill="#16D98B"/>
            <circle cx="24" cy="23" r="9" fill="#EFFFF8"/>
            <circle cx="24" cy="23" r="4" fill="#16D98B"/>
          </svg>
        </div>
        <div class="rydo-location-label pickup-label">PICKUP</div>
      </div>
    `,
    iconSize: [105, 82],
    iconAnchor: [52, 58],
  });
}

function createDestinationIcon() {
  return L.divIcon({
    className: "rydo-colorful-marker",
    html: `
      <div class="rydo-location-wrap destination-location">
        <div class="rydo-location-pin">
          <svg viewBox="0 0 48 60" aria-hidden="true">
            <path d="M24 57S5 37 5 23C5 11.95 13.5 3 24 3s19 8.95 19 20c0 14-19 34-19 34z" fill="#FF4F91"/>
            <circle cx="24" cy="23" r="9" fill="#FFF2F8"/>
            <circle cx="24" cy="23" r="4" fill="#FF4F91"/>
          </svg>
        </div>
        <div class="rydo-location-label destination-label">DROP</div>
      </div>
    `,
    iconSize: [105, 82],
    iconAnchor: [52, 58],
  });
}

const driverIcon = createDriverIcon();
const pickupIcon = createPickupIcon();
const destinationIcon = createDestinationIcon();

export default function Map({
  pickup,
  drop,
  journeyStage = 0,
  journeyProgress = null,
  driverStartLocation = null,
  driverLocation = null,
  rideStatus = "Waiting for booking",
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);

  const pickupMarkerRef = useRef(null);
  const destinationMarkerRef = useRef(null);
  const driverMarkerRef = useRef(null);

  const tripRouteRef = useRef([]);
  const pickupRouteRef = useRef([]);
  const routeGlowRef = useRef(null);
  const routeLineRef = useRef(null);
  const arrivalRouteRef = useRef(null);

  const displayedDriverRef = useRef(null);
  const targetDriverRef = useRef(null);
  const animationFrameRef = useRef(null);

  const hasInitialViewRef = useRef(false);
  const lastViewKeyRef = useRef("");

  const [routeReady, setRouteReady] = useState(false);
  const [routeError, setRouteError] = useState(false);

  const pickupCoordinates = useMemo(
    () => getCoordinates(pickup),
    [pickup]
  );

  const destinationCoordinates = useMemo(
    () => getCoordinates(drop),
    [drop]
  );

  const driverStartCoordinates = useMemo(
    () => getCoordinates(driverStartLocation),
    [driverStartLocation]
  );

  const progressValue =
    journeyProgress === null || journeyProgress === undefined
      ? getFallbackProgress(journeyStage)
      : Math.max(0, Math.min(1, Number(journeyProgress) || 0));

  const percent = Math.round(progressValue * 100);
  const statusColor = getStageColor(journeyStage);

  /* ============================================================
     CREATE MAP ONCE
  ============================================================ */
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) {
      return undefined;
    }

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      dragging: true,
      minZoom: 11,
      maxZoom: 19,
      preferCanvas: true,
    });

    /* COLORFUL MAP TILE */
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
      {
        maxZoom: 20,
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        subdomains: "abcd",
      }
    ).addTo(map);

    L.control.zoom({ position: "bottomright" }).addTo(map);

    map.setView(DEFAULT_CENTER, 13);
    mapRef.current = map;

    const timer = window.setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      window.clearTimeout(timer);

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      map.remove();
      mapRef.current = null;
      pickupMarkerRef.current = null;
      destinationMarkerRef.current = null;
      driverMarkerRef.current = null;
      routeGlowRef.current = null;
      routeLineRef.current = null;
      arrivalRouteRef.current = null;
    };
  }, []);

  /* ============================================================
     LOAD REAL ROAD ROUTES
  ============================================================ */
  useEffect(() => {
    if (!pickupCoordinates || !destinationCoordinates) {
      tripRouteRef.current = [];
      pickupRouteRef.current = [];
      setRouteReady(false);
      return undefined;
    }

    const controller = new AbortController();
    let active = true;

    setRouteReady(false);
    setRouteError(false);

    async function loadRoutes() {
      try {
        const tripRoute = await fetchRoute(
          pickupCoordinates,
          destinationCoordinates,
          controller.signal
        );

        let arrivalRoute = [];

        if (driverStartCoordinates) {
          arrivalRoute = await fetchRoute(
            driverStartCoordinates,
            pickupCoordinates,
            controller.signal
          );
        }

        if (!active) return;

        tripRouteRef.current =
          tripRoute.length >= 2
            ? tripRoute
            : [pickupCoordinates, destinationCoordinates];

        pickupRouteRef.current = arrivalRoute;
        setRouteReady(true);
      } catch (error) {
        if (error?.name === "AbortError") return;

        console.warn("RYDO routing fallback:", error);

        if (!active) return;

        tripRouteRef.current = [
          pickupCoordinates,
          destinationCoordinates,
        ];

        pickupRouteRef.current = driverStartCoordinates
          ? [driverStartCoordinates, pickupCoordinates]
          : [];

        setRouteError(true);
        setRouteReady(true);
      }
    }

    loadRoutes();

    return () => {
      active = false;
      controller.abort();
    };
  }, [
    pickupCoordinates?.lat,
    pickupCoordinates?.lng,
    destinationCoordinates?.lat,
    destinationCoordinates?.lng,
    driverStartCoordinates?.lat,
    driverStartCoordinates?.lng,
  ]);

  /* ============================================================
     MARKERS + ROUTES
  ============================================================ */
  useEffect(() => {
    const map = mapRef.current;

    if (!map || !pickupCoordinates || !destinationCoordinates) {
      return undefined;
    }

    const pickupLatLng = [
      pickupCoordinates.lat,
      pickupCoordinates.lng,
    ];

    const destinationLatLng = [
      destinationCoordinates.lat,
      destinationCoordinates.lng,
    ];

    if (!pickupMarkerRef.current) {
      pickupMarkerRef.current = L.marker(pickupLatLng, {
        icon: pickupIcon,
        zIndexOffset: 900,
      }).addTo(map);
    } else {
      pickupMarkerRef.current.setLatLng(pickupLatLng);
    }

    if (!destinationMarkerRef.current) {
      destinationMarkerRef.current = L.marker(destinationLatLng, {
        icon: destinationIcon,
        zIndexOffset: 900,
      }).addTo(map);
    } else {
      destinationMarkerRef.current.setLatLng(destinationLatLng);
    }

    const tripRoute = tripRouteRef.current;
    const arrivalRoute = pickupRouteRef.current;

    if (tripRoute.length >= 2) {
      const latLngs = tripRoute.map((point) => [point.lat, point.lng]);

      if (!routeGlowRef.current) {
        routeGlowRef.current = L.polyline(latLngs, {
          color: "#FFB800",
          weight: 18,
          opacity: 0.22,
          lineCap: "round",
          lineJoin: "round",
          interactive: false,
        }).addTo(map);
      } else {
        routeGlowRef.current.setLatLngs(latLngs);
      }

      if (!routeLineRef.current) {
        routeLineRef.current = L.polyline(latLngs, {
          color: "#FFC400",
          weight: 7,
          opacity: 1,
          lineCap: "round",
          lineJoin: "round",
          className: "rydo-color-route",
          interactive: false,
        }).addTo(map);
      } else {
        routeLineRef.current.setLatLngs(latLngs);
      }
    }

    if (arrivalRoute.length >= 2) {
      const latLngs = arrivalRoute.map((point) => [
        point.lat,
        point.lng,
      ]);

      if (!arrivalRouteRef.current) {
        arrivalRouteRef.current = L.polyline(latLngs, {
          color: "#7C5CFF",
          weight: 5,
          opacity: 0.85,
          dashArray: "7 12",
          lineCap: "round",
          lineJoin: "round",
          interactive: false,
        }).addTo(map);
      } else {
        arrivalRouteRef.current.setLatLngs(latLngs);
      }
    } else if (arrivalRouteRef.current) {
      arrivalRouteRef.current.remove();
      arrivalRouteRef.current = null;
    }

    if (routeReady) {
      const viewKey = [
        pointKey(pickupCoordinates),
        pointKey(destinationCoordinates),
      ].join("|");

      if (
        !hasInitialViewRef.current ||
        lastViewKeyRef.current !== viewKey
      ) {
        const bounds = L.latLngBounds([
          pickupLatLng,
          destinationLatLng,
        ]);

        map.fitBounds(bounds, {
          paddingTopLeft: [115, 110],
          paddingBottomRight: [115, 130],
          maxZoom: 16,
          animate: false,
        });

        if (map.getZoom() < 13) {
          map.setView(bounds.getCenter(), 13, {
            animate: false,
          });
        }

        hasInitialViewRef.current = true;
        lastViewKeyRef.current = viewKey;
      }
    }

    window.setTimeout(() => map.invalidateSize(), 80);

    return undefined;
  }, [
    pickupCoordinates?.lat,
    pickupCoordinates?.lng,
    destinationCoordinates?.lat,
    destinationCoordinates?.lng,
    routeReady,
  ]);

  /* ============================================================
     DRIVER MOVEMENT

     This is the important part:
     BookRide -> real driverLocation { lat, lng }
     -> snap to road route
     -> requestAnimationFrame
     -> smooth Leaflet marker movement
  ============================================================ */
  useEffect(() => {
    const map = mapRef.current;
    const coordinates = getCoordinates(driverLocation);

    if (!map || !coordinates) return undefined;

    let visualCoordinates = coordinates;

    if (
      journeyStage === 2 &&
      pickupRouteRef.current.length >= 2
    ) {
      visualCoordinates = snapToRoute(
        coordinates,
        pickupRouteRef.current
      );
    }

    if (
      journeyStage >= 4 &&
      tripRouteRef.current.length >= 2
    ) {
      visualCoordinates = snapToRoute(
        coordinates,
        tripRouteRef.current
      );
    }

    targetDriverRef.current = visualCoordinates;

    if (!displayedDriverRef.current) {
      displayedDriverRef.current = visualCoordinates;
    }

    if (!driverMarkerRef.current) {
      driverMarkerRef.current = L.marker(
        [visualCoordinates.lat, visualCoordinates.lng],
        {
          icon: driverIcon,
          zIndexOffset: 1600,
        }
      ).addTo(map);
    }

    if (animationFrameRef.current) {
      return undefined;
    }

    const animate = () => {
      const current = displayedDriverRef.current;
      const target = targetDriverRef.current;

      if (!current || !target || !driverMarkerRef.current) {
        animationFrameRef.current = null;
        return;
      }

      const distance = distanceSquared(current, target);

      if (distance < 0.00000000001) {
        displayedDriverRef.current = target;
        driverMarkerRef.current.setLatLng([
          target.lat,
          target.lng,
        ]);
        animationFrameRef.current = null;
        return;
      }

      const easing = 0.18;

      const next = {
        lat:
          current.lat +
          (target.lat - current.lat) * easing,
        lng:
          current.lng +
          (target.lng - current.lng) * easing,
      };

      displayedDriverRef.current = next;

      driverMarkerRef.current.setLatLng([
        next.lat,
        next.lng,
      ]);

      animationFrameRef.current =
        requestAnimationFrame(animate);
    };

    animationFrameRef.current =
      requestAnimationFrame(animate);

    return undefined;
  }, [driverLocation, journeyStage]);

  useEffect(() => {
    if (!mapRef.current || !driverLocation) return;

    if (journeyStage === 5) {
      const destination = getCoordinates(drop);

      if (destination) {
        mapRef.current.panTo(
          [destination.lat, destination.lng],
          {
            animate: true,
            duration: 0.6,
          }
        );
      }
    }
  }, [journeyStage, drop, driverLocation]);

  return (
    <div className="rydo-color-map-shell relative overflow-hidden rounded-[2.2rem] border border-white/20 bg-[#07111F] shadow-[0_30px_90px_rgba(0,0,0,.35)]">
      <style>{`
        .rydo-color-map-shell .leaflet-container {
          background:#DCEEFF;
          font-family:inherit;
        }

        .rydo-color-map-shell .leaflet-tile {
          filter:saturate(1.12) contrast(1.02) brightness(1.02);
        }

        .rydo-color-map-shell .leaflet-control-zoom {
          border:0 !important;
          margin:0 18px 76px 0 !important;
          overflow:hidden;
          border-radius:18px !important;
          box-shadow:0 14px 40px rgba(12,25,50,.28) !important;
        }

        .rydo-color-map-shell .leaflet-control-zoom a {
          width:42px !important;
          height:42px !important;
          line-height:42px !important;
          background:rgba(255,255,255,.94) !important;
          color:#172033 !important;
          border:1px solid rgba(23,32,51,.08) !important;
          font-weight:900;
        }

        .rydo-color-map-shell .leaflet-control-attribution {
          background:rgba(255,255,255,.86) !important;
          color:#64748B !important;
          border-radius:10px 0 0 0;
        }

        .rydo-color-map-shell .leaflet-control-attribution a {
          color:#475569 !important;
        }

        .rydo-color-route {
          filter:drop-shadow(0 0 6px rgba(255,190,0,.72));
        }

        .rydo-colorful-marker {
          background:transparent !important;
          border:0 !important;
        }

        .rydo-driver-wrap {
          position:relative;
          width:92px;
          height:92px;
        }

        .rydo-driver-pulse {
          position:absolute;
          left:10px;
          top:10px;
          width:72px;
          height:72px;
          border-radius:50%;
          background:rgba(255,190,11,.20);
          border:2px solid rgba(255,190,11,.65);
          animation:rydoDriverPulse 1.8s ease-out infinite;
        }

        .rydo-driver-logo {
          position:absolute;
          left:20px;
          top:20px;
          width:52px;
          height:52px;
          display:flex;
          align-items:center;
          justify-content:center;
          border-radius:17px;
          background:linear-gradient(145deg,#FFF5A6 0%,#FFD21F 45%,#FF9F1C 100%);
          border:4px solid #fff;
          box-shadow:0 10px 28px rgba(255,161,28,.42),0 0 0 4px rgba(255,255,255,.55);
        }

        .rydo-driver-logo svg {
          width:39px;
          height:39px;
          filter:drop-shadow(0 2px 2px rgba(0,0,0,.15));
        }

        .rydo-driver-badge {
          position:absolute;
          left:22px;
          top:76px;
          padding:4px 9px;
          border-radius:999px;
          background:#172033;
          color:#FFD21F;
          border:2px solid #fff;
          font-size:8px;
          font-weight:1000;
          letter-spacing:.15em;
          box-shadow:0 7px 18px rgba(23,32,51,.28);
        }

        .rydo-location-wrap {
          position:relative;
          width:105px;
          height:82px;
          display:flex;
          justify-content:center;
        }

        .rydo-location-pin {
          width:48px;
          height:60px;
          filter:drop-shadow(0 7px 12px rgba(0,0,0,.22));
        }

        .rydo-location-label {
          position:absolute;
          top:55px;
          left:50%;
          transform:translateX(-50%);
          padding:6px 12px;
          border-radius:999px;
          color:#fff;
          font-size:9px;
          font-weight:1000;
          letter-spacing:.12em;
          white-space:nowrap;
          box-shadow:0 7px 18px rgba(0,0,0,.22);
        }

        .pickup-label {
          background:linear-gradient(135deg,#13D58B,#00A86B);
        }

        .destination-label {
          background:linear-gradient(135deg,#FF5A9D,#E92F74);
        }

        @keyframes rydoDriverPulse {
          0% { transform:scale(.72); opacity:.9; }
          70% { transform:scale(1.34); opacity:0; }
          100% { transform:scale(1.34); opacity:0; }
        }

        @media (max-width:700px) {
          .rydo-color-map-shell .leaflet-control-zoom {
            margin-right:10px !important;
            margin-bottom:82px !important;
          }
        }
      `}</style>

      <div className="relative">
        <div
          ref={mapContainerRef}
          className="h-[600px] w-full sm:h-[640px]"
        />

        {/* TOP LEFT */}
        <div className="pointer-events-none absolute left-4 top-4 z-[1000] sm:left-6 sm:top-6">
          <div className="relative overflow-hidden rounded-[1.5rem] border border-white/60 bg-white/90 px-4 py-3 shadow-[0_18px_45px_rgba(17,31,54,.20)] backdrop-blur-xl sm:min-w-[360px] sm:px-5 sm:py-4">
            <div
              className="absolute -right-8 -top-10 h-28 w-28 rounded-full blur-2xl"
              style={{ background: `${statusColor}22` }}
            />

            <div className="relative flex items-center gap-3">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-lg shadow-sm"
                style={{
                  background: `${statusColor}18`,
                  color: statusColor,
                  border: `1px solid ${statusColor}55`,
                }}
              >
                {journeyStage >= 5 ? "✓" : "●"}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 animate-pulse rounded-full"
                    style={{
                      background: statusColor,
                      boxShadow: `0 0 12px ${statusColor}`,
                    }}
                  />
                  <p className="text-[9px] font-black uppercase tracking-[.22em] text-slate-500">
                    Live Driver Tracking
                  </p>
                </div>

                <p className="mt-1 truncate text-sm font-black text-[#172033] sm:text-[15px]">
                  {getStageText(journeyStage)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CENTER RYDO BRAND */}
        <div className="pointer-events-none absolute left-1/2 top-5 z-[1000] hidden -translate-x-1/2 md:block">
          <div className="rounded-full border border-white/70 bg-white/90 px-5 py-2.5 shadow-[0_12px_30px_rgba(17,31,54,.16)] backdrop-blur-xl">
            <div className="flex items-center gap-2">
              <span className="text-base font-black italic tracking-[-.06em] text-[#172033]">
                RYDO
              </span>
              <span className="h-2 w-2 rounded-full bg-[#FFBE0B] shadow-[0_0_10px_#FFBE0B]" />
              <span className="text-[8px] font-black uppercase tracking-[.2em] text-slate-500">
                Live Route
              </span>
            </div>
          </div>
        </div>

        {/* TOP RIGHT JOURNEY */}
        <div className="pointer-events-none absolute right-4 top-4 z-[1000] sm:right-6 sm:top-6">
          <div className="flex items-center gap-3 rounded-[1.5rem] border border-white/60 bg-white/90 px-3 py-3 shadow-[0_18px_45px_rgba(17,31,54,.20)] backdrop-blur-xl sm:px-4">
            <div
              className="relative flex h-14 w-14 items-center justify-center rounded-full"
              style={{
                background: `conic-gradient(${statusColor} ${percent * 3.6}deg, #E8EDF5 0deg)`,
              }}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white">
                <span className="text-[11px] font-black text-[#172033]">
                  {percent}%
                </span>
              </div>
            </div>

            <div className="hidden sm:block">
              <p className="text-[9px] font-black uppercase tracking-[.2em] text-slate-500">
                Journey
              </p>
              <p className="mt-0.5 text-xs font-black text-[#172033]">
                {getStageShort(journeyStage)}
              </p>
            </div>
          </div>
        </div>

        {/* BOTTOM HUD */}
        <div className="pointer-events-none absolute bottom-4 left-4 right-4 z-[1000] sm:bottom-6 sm:left-6 sm:right-6">
          <div className="flex flex-col gap-3 rounded-[1.6rem] border border-white/60 bg-white/92 p-3 shadow-[0_18px_45px_rgba(17,31,54,.22)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:p-4">
            <div className="flex items-center gap-4 overflow-x-auto">
              <div className="flex shrink-0 items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-lg">
                  📍
                </span>
                <span className="text-[10px] font-black uppercase tracking-[.12em] text-[#172033]">
                  Pickup
                </span>
              </div>

              <div className="h-px w-8 shrink-0 bg-slate-300" />

              <div className="flex shrink-0 items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#FFBE0B] shadow-[0_0_10px_#FFBE0B]" />
                <span className="text-[10px] font-black uppercase tracking-[.12em] text-[#172033]">
                  Route
                </span>
              </div>

              <div className="h-px w-8 shrink-0 bg-slate-300" />

              <div className="flex shrink-0 items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100 text-lg">
                  🚕
                </span>
                <span className="text-[10px] font-black uppercase tracking-[.12em] text-[#172033]">
                  Driver
                </span>
              </div>

              <div className="h-px w-8 shrink-0 bg-slate-300" />

              <div className="flex shrink-0 items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-pink-100 text-lg">
                  📍
                </span>
                <span className="text-[10px] font-black uppercase tracking-[.12em] text-[#172033]">
                  Destination
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 border-t border-slate-200 pt-3 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
              <div>
                <p className="text-[8px] font-black uppercase tracking-[.18em] text-slate-500">
                  Status
                </p>
                <p className="mt-0.5 text-xs font-black text-[#172033]">
                  {getStageShort(journeyStage)}
                </p>
              </div>

              <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-200 sm:w-32">
                <div
                  className="h-full rounded-full transition-[width] duration-200"
                  style={{
                    width: `${percent}%`,
                    background: `linear-gradient(90deg,#FFBE0B,${statusColor})`,
                    boxShadow: `0 0 14px ${statusColor}`,
                  }}
                />
              </div>

              <span
                className="text-xs font-black"
                style={{ color: statusColor }}
              >
                {percent}%
              </span>
            </div>
          </div>
        </div>

        {/* ROUTING LOADER */}
        {!routeReady && pickupCoordinates && destinationCoordinates && (
          <div className="pointer-events-none absolute inset-0 z-[1100] flex items-center justify-center bg-white/20 backdrop-blur-[2px]">
            <div className="rounded-2xl border border-white/70 bg-white/95 px-6 py-5 text-center shadow-2xl">
              <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-[#FFBE0B]" />
              <p className="mt-3 text-xs font-black uppercase tracking-[.16em] text-[#172033]">
                Building your route
              </p>
              <p className="mt-1 text-[9px] font-bold text-slate-500">
                Finding the best road path…
              </p>
            </div>
          </div>
        )}

        {routeError && (
          <div className="pointer-events-none absolute right-5 top-24 z-[1000] rounded-xl border border-white/70 bg-white/90 px-3 py-2 text-[9px] font-bold text-slate-500 shadow-xl backdrop-blur-xl">
            Live route fallback
          </div>
        )}
      </div>
    </div>
  );
}