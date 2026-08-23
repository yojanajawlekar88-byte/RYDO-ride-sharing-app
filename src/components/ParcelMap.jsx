import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/*
============================================================
RYDO PARCEL DELIVERY MAP

IMPORTANT:
- Latitude / longitude are the source of truth.
- Supports:
    lat / lng
    latitude / longitude
    lat / lon
    nested coordinates
- Map does NOT depend on the routing API to render.
- OSRM is optional.
- If OSRM fails, the map immediately uses a fallback line.
- Driver position is always rendered using real coordinates.
============================================================
*/

const DEFAULT_CENTER = [19.2183, 72.9781];

const OSRM_URL =
  "https://router.project-osrm.org/route/v1/driving";

/* ============================================================
   COORDINATE HELPER
============================================================ */

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

  return {
    lat,
    lng,
  };
}

/* ============================================================
   ICONS
============================================================ */

function createIcon({
  emoji,
  background,
  border,
  size = 48,
}) {
  return L.divIcon({
    className: "rydo-parcel-marker",
    html: `
      <div
        style="
          width:${size}px;
          height:${size}px;
          border-radius:50%;
          background:${background};
          border:3px solid ${border};
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:${Math.round(size * 0.48)}px;
          box-shadow:
            0 8px 24px rgba(0,0,0,.45),
            0 0 0 5px rgba(255,255,255,.06);
        "
      >
        ${emoji}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

const pickupIcon = createIcon({
  emoji: "📦",
  background: "#10B981",
  border: "#07110D",
  size: 50,
});

const destinationIcon = createIcon({
  emoji: "🏁",
  background: "#EF4444",
  border: "#170708",
  size: 50,
});

const driverIcon = createIcon({
  emoji: "🚚",
  background: "#FFBE0B",
  border: "#11151F",
  size: 54,
});

/* ============================================================
   ROUTE HELPERS
============================================================ */

function fallbackRoute(from, to) {
  if (!from || !to) return [];

  return [
    {
      lat: from.lat,
      lng: from.lng,
    },
    {
      lat:
        from.lat +
        (to.lat - from.lat) * 0.25,
      lng:
        from.lng +
        (to.lng - from.lng) * 0.25,
    },
    {
      lat:
        from.lat +
        (to.lat - from.lat) * 0.5,
      lng:
        from.lng +
        (to.lng - from.lng) * 0.5,
    },
    {
      lat:
        from.lat +
        (to.lat - from.lat) * 0.75,
      lng:
        from.lng +
        (to.lng - from.lng) * 0.75,
    },
    {
      lat: to.lat,
      lng: to.lng,
    },
  ];
}

async function getRoadRoute(from, to, signal) {
  if (!from || !to) return [];

  const url =
    `${OSRM_URL}/` +
    `${from.lng},${from.lat};` +
    `${to.lng},${to.lat}` +
    `?overview=full&geometries=geojson`;

  try {
    const response = await fetch(url, {
      signal,
    });

    if (!response.ok) {
      throw new Error(
        `OSRM request failed: ${response.status}`
      );
    }

    const data = await response.json();

    const coordinates =
      data?.routes?.[0]?.geometry?.coordinates;

    if (
      !Array.isArray(coordinates) ||
      coordinates.length < 2
    ) {
      throw new Error("No route returned.");
    }

    return coordinates.map(([lng, lat]) => ({
      lat: Number(lat),
      lng: Number(lng),
    }));
  } catch (error) {
    if (error?.name !== "AbortError") {
      console.warn(
        "RYDO parcel road route unavailable:",
        error
      );
    }

    return [];
  }
}

/* ============================================================
   ROUTE DISTANCE
============================================================ */

function calculateDistanceKm(from, to) {
  if (!from || !to) return 0;

  const R = 6371;

  const dLat =
    ((to.lat - from.lat) * Math.PI) / 180;

  const dLng =
    ((to.lng - from.lng) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) *
      Math.sin(dLat / 2) +
    Math.cos(
      (from.lat * Math.PI) / 180
    ) *
      Math.cos(
        (to.lat * Math.PI) / 180
      ) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return R * c;
}

/* ============================================================
   ROUTE INTERPOLATION

   Used when we don't have a live GPS location.
============================================================ */

function interpolateRoute(route, progress) {
  if (!route || route.length === 0) {
    return null;
  }

  if (route.length === 1) {
    return route[0];
  }

  const safeProgress = Math.max(
    0,
    Math.min(1, progress)
  );

  const scaled =
    safeProgress * (route.length - 1);

  const index = Math.min(
    route.length - 2,
    Math.floor(scaled)
  );

  const localProgress =
    scaled - index;

  const a = route[index];
  const b = route[index + 1];

  return {
    lat:
      a.lat +
      (b.lat - a.lat) *
        localProgress,

    lng:
      a.lng +
      (b.lng - a.lng) *
        localProgress,
  };
}

/* ============================================================
   STATUS NORMALIZER
============================================================ */

function normalizeStatus(status, journeyStage) {
  const value = String(
    status || ""
  ).toLowerCase();

  if (
    value.includes("delivered") ||
    value.includes("completed") ||
    journeyStage >= 5
  ) {
    return "Delivered";
  }

  if (
    value.includes("picked") ||
    value.includes("pickup")
  ) {
    return "Parcel Picked Up";
  }

  if (
    value.includes("transit") ||
    value.includes("out for delivery") ||
    journeyStage === 4
  ) {
    return "Out for Delivery";
  }

  if (
    value.includes("arrived") ||
    journeyStage === 3
  ) {
    return "Driver Arrived";
  }

  if (
    value.includes("arriving") ||
    journeyStage === 2
  ) {
    return "Driver Arriving";
  }

  if (
    value.includes("assigned") ||
    journeyStage === 1
  ) {
    return "Delivery Assigned";
  }

  return status || "Finding Driver";
}

/* ============================================================
   COMPONENT
============================================================ */

export default function ParcelMap({
  pickup = null,
  destination = null,

  driverLocation = null,

  journeyStage = 1,
  journeyProgress = 0,

  status = "Delivery Assigned",

  distanceKm = 0,
  duration = "",

  driverName = "RYDO Driver",

  setDriverLocation,
}) {
  const mapContainerRef =
    useRef(null);

  const mapRef = useRef(null);

  const pickupMarkerRef =
    useRef(null);

  const destinationMarkerRef =
    useRef(null);

  const driverMarkerRef =
    useRef(null);

  const routeLineRef =
    useRef(null);

  const animationFrameRef =
    useRef(null);

  const routeRequestRef =
    useRef(null);

  const displayedDriverRef =
    useRef(null);

  const targetDriverRef =
    useRef(null);

  const [roadRoute, setRoadRoute] =
    useState([]);

  const [routeLoading, setRouteLoading] =
    useState(false);

  const [routeSource, setRouteSource] =
    useState("fallback");

  /* ============================================================
     COORDINATES
  ============================================================ */

  const pickupCoordinates =
    useMemo(
      () =>
        getCoordinates(pickup),
      [pickup]
    );

  const destinationCoordinates =
    useMemo(
      () =>
        getCoordinates(destination),
      [destination]
    );

  const liveDriverCoordinates =
    useMemo(
      () =>
        getCoordinates(driverLocation),
      [driverLocation]
    );

  const straightDistance = useMemo(
    () =>
      calculateDistanceKm(
        pickupCoordinates,
        destinationCoordinates
      ),
    [
      pickupCoordinates,
      destinationCoordinates,
    ]
  );

  const displayDistance =
    Number(distanceKm) > 0
      ? Number(distanceKm)
      : straightDistance;

  const displayStatus =
    normalizeStatus(
      status,
      journeyStage
    );

  /* ============================================================
     CREATE MAP
  ============================================================ */

  useEffect(() => {
    if (
      !mapContainerRef.current ||
      mapRef.current
    ) {
      return undefined;
    }

    const map = L.map(
      mapContainerRef.current,
      {
        zoomControl: true,
        attributionControl: true,
        scrollWheelZoom: true,
        preferCanvas: true,
      }
    );

    map.setView(
      DEFAULT_CENTER,
      12
    );

    L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        maxZoom: 19,
        attribution:
          "&copy; OpenStreetMap contributors",
      }
    ).addTo(map);

    mapRef.current = map;

    const resizeTimer =
      setTimeout(() => {
        map.invalidateSize();
      }, 250);

    return () => {
      clearTimeout(resizeTimer);

      if (
        routeRequestRef.current
      ) {
        routeRequestRef.current.abort();
      }

      if (
        animationFrameRef.current
      ) {
        cancelAnimationFrame(
          animationFrameRef.current
        );
      }

      map.remove();

      mapRef.current = null;
      pickupMarkerRef.current = null;
      destinationMarkerRef.current = null;
      driverMarkerRef.current = null;
      routeLineRef.current = null;
    };
  }, []);

  /* ============================================================
     LOAD ROUTE

     IMPORTANT:
     Fallback route is installed FIRST.
     Therefore the UI can NEVER remain stuck on
     "Finding road route..."
  ============================================================ */

  useEffect(() => {
    const map = mapRef.current;

    if (
      !map ||
      !pickupCoordinates ||
      !destinationCoordinates
    ) {
      return undefined;
    }

    const fallback =
      fallbackRoute(
        pickupCoordinates,
        destinationCoordinates
      );

    setRoadRoute(fallback);
    setRouteSource("fallback");
    setRouteLoading(true);

    if (
      routeRequestRef.current
    ) {
      routeRequestRef.current.abort();
    }

    const controller =
      new AbortController();

    routeRequestRef.current =
      controller;

    const timeout = setTimeout(() => {
      controller.abort();
      setRouteLoading(false);
    }, 7000);

    getRoadRoute(
      pickupCoordinates,
      destinationCoordinates,
      controller.signal
    )
      .then((route) => {
        if (
          controller.signal.aborted
        ) {
          return;
        }

        if (
          Array.isArray(route) &&
          route.length >= 2
        ) {
          setRoadRoute(route);
          setRouteSource("road");
        }
      })
      .finally(() => {
        clearTimeout(timeout);

        if (
          !controller.signal.aborted
        ) {
          setRouteLoading(false);
        }
      });

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [
    pickupCoordinates,
    destinationCoordinates,
  ]);

  /* ============================================================
     MARKERS + ROUTE
  ============================================================ */

  useEffect(() => {
    const map = mapRef.current;

    if (
      !map ||
      !pickupCoordinates ||
      !destinationCoordinates
    ) {
      return;
    }

    const pickupPoint = [
      pickupCoordinates.lat,
      pickupCoordinates.lng,
    ];

    const destinationPoint = [
      destinationCoordinates.lat,
      destinationCoordinates.lng,
    ];

    /* PICKUP */

    if (
      !pickupMarkerRef.current
    ) {
      pickupMarkerRef.current =
        L.marker(
          pickupPoint,
          {
            icon: pickupIcon,
            zIndexOffset: 800,
          }
        ).addTo(map);
    } else {
      pickupMarkerRef.current.setLatLng(
        pickupPoint
      );
    }

    pickupMarkerRef.current.bindTooltip(
      "📦 Pickup",
      {
        direction: "top",
        offset: [0, -20],
      }
    );

    /* DESTINATION */

    if (
      !destinationMarkerRef.current
    ) {
      destinationMarkerRef.current =
        L.marker(
          destinationPoint,
          {
            icon: destinationIcon,
            zIndexOffset: 800,
          }
        ).addTo(map);
    } else {
      destinationMarkerRef.current.setLatLng(
        destinationPoint
      );
    }

    destinationMarkerRef.current.bindTooltip(
      "🏁 Destination",
      {
        direction: "top",
        offset: [0, -20],
      }
    );

    /* ROUTE */

    if (
      Array.isArray(roadRoute) &&
      roadRoute.length >= 2
    ) {
      const routePoints =
        roadRoute.map(
          (point) => [
            point.lat,
            point.lng,
          ]
        );

      if (
        !routeLineRef.current
      ) {
        routeLineRef.current =
          L.polyline(
            routePoints,
            {
              color: "#FFBE0B",
              weight: 7,
              opacity: 0.92,
              lineCap: "round",
              lineJoin: "round",
            }
          ).addTo(map);
      } else {
        routeLineRef.current.setLatLngs(
          routePoints
        );
      }

      /* Outer glow */

      if (
        routeLineRef.current._rydoGlow
      ) {
        routeLineRef.current._rydoGlow.setLatLngs(
          routePoints
        );
      } else {
        const glow =
          L.polyline(
            routePoints,
            {
              color: "#FFBE0B",
              weight: 13,
              opacity: 0.12,
              lineCap: "round",
              lineJoin: "round",
            }
          ).addTo(map);

        routeLineRef.current._rydoGlow =
          glow;

        routeLineRef.current.bringToFront();
      }
    }

    const bounds =
      L.latLngBounds([
        pickupPoint,
        destinationPoint,
      ]);

    if (
      liveDriverCoordinates
    ) {
      bounds.extend([
        liveDriverCoordinates.lat,
        liveDriverCoordinates.lng,
      ]);
    }

    map.fitBounds(
      bounds,
      {
        padding: [80, 80],
        maxZoom: 15,
        animate: true,
      }
    );

    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  }, [
    pickupCoordinates,
    destinationCoordinates,
    roadRoute,
    liveDriverCoordinates,
  ]);

  /* ============================================================
     DRIVER LOCATION
  ============================================================ */

  useEffect(() => {
    const map = mapRef.current;

    if (!map) return;

    let target =
      liveDriverCoordinates;

    /*
      If Firebase doesn't yet provide a driver location,
      create a coordinate along the actual route.
    */

    if (
      !target &&
      roadRoute.length >= 2
    ) {
      target =
        interpolateRoute(
          roadRoute,
          journeyProgress
        );
    }

    if (!target) return;

    targetDriverRef.current =
      target;

    if (
      !displayedDriverRef.current
    ) {
      displayedDriverRef.current =
        target;
    }

    if (
      !driverMarkerRef.current
    ) {
      driverMarkerRef.current =
        L.marker(
          [
            target.lat,
            target.lng,
          ],
          {
            icon: driverIcon,
            zIndexOffset: 1200,
          }
        ).addTo(map);

      driverMarkerRef.current.bindTooltip(
        `🚚 ${driverName}`,
        {
          direction: "top",
          offset: [0, -22],
        }
      );
    }

    driverMarkerRef.current.setTooltipContent(
      `🚚 ${driverName}`
    );

    if (
      animationFrameRef.current
    ) {
      return;
    }

    const animate = () => {
      const current =
        displayedDriverRef.current;

      const destination =
        targetDriverRef.current;

      if (
        !current ||
        !destination
      ) {
        animationFrameRef.current =
          null;
        return;
      }

      const latDifference =
        destination.lat -
        current.lat;

      const lngDifference =
        destination.lng -
        current.lng;

      const distance =
        Math.sqrt(
          latDifference *
            latDifference +
            lngDifference *
            lngDifference
        );

      const easing =
        distance > 0.01
          ? 0.3
          : 0.16;

      const next =
        distance <
        0.0000001
          ? destination
          : {
              lat:
                current.lat +
                latDifference *
                  easing,

              lng:
                current.lng +
                lngDifference *
                  easing,
            };

      displayedDriverRef.current =
        next;

      if (
        driverMarkerRef.current
      ) {
        driverMarkerRef.current.setLatLng(
          [
            next.lat,
            next.lng,
          ]
        );
      }

      setDriverLocation?.({
        lat: next.lat,
        lng: next.lng,
      });

      if (
        distance >=
        0.0000001
      ) {
        animationFrameRef.current =
          requestAnimationFrame(
            animate
          );
      } else {
        animationFrameRef.current =
          null;
      }
    };

    animationFrameRef.current =
      requestAnimationFrame(
        animate
      );

    return () => {
      if (
        animationFrameRef.current
      ) {
        cancelAnimationFrame(
          animationFrameRef.current
        );

        animationFrameRef.current =
          null;
      }
    };
  }, [
    liveDriverCoordinates,
    roadRoute,
    journeyProgress,
    driverName,
    setDriverLocation,
  ]);

  /* ============================================================
     MAP STATUS
  ============================================================ */

  const progress =
    Math.max(
      0,
      Math.min(
        1,
        Number(journeyProgress) || 0
      )
    );

  return (
    <div className="relative w-full overflow-hidden rounded-[2rem] border border-white/10 bg-[#090D14] shadow-2xl">

      {/* MAP */}

      <div
        ref={mapContainerRef}
        className="h-[560px] w-full"
      />

      {/* TOP STATUS */}

      <div className="pointer-events-none absolute left-4 right-4 top-4 z-[1000] flex flex-col gap-3 md:flex-row md:items-start md:justify-between">

        <div className="rounded-2xl border border-white/10 bg-[#080C13]/95 px-5 py-4 shadow-xl backdrop-blur-xl">

          <div className="flex items-center gap-3">

            <span
              className={`h-3 w-3 rounded-full ${
                displayStatus === "Delivered"
                  ? "bg-emerald-400"
                  : "bg-[#FFBE0B] animate-pulse"
              }`}
            />

            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">
                Parcel Tracking
              </p>

              <p className="mt-1 text-base font-black text-white">
                {displayStatus}
              </p>
            </div>

          </div>

        </div>

        <div className="rounded-2xl border border-white/10 bg-[#080C13]/95 px-5 py-4 shadow-xl backdrop-blur-xl">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFBE0B]/10 text-xl">
              🚚
            </div>

            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                Delivery Driver
              </p>

              <p className="mt-1 font-black text-white">
                {driverName}
              </p>
            </div>

          </div>

        </div>

      </div>

      {/* ROUTE STATUS */}

      <div className="pointer-events-none absolute bottom-24 left-4 right-4 z-[1000]">

        <div className="rounded-2xl border border-white/10 bg-[#080C13]/95 p-4 shadow-xl backdrop-blur-xl">

          <div className="mb-3 flex items-center justify-between gap-4">

            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                Delivery Route
              </p>

              <p className="mt-1 text-sm font-black text-white">
                {routeLoading
                  ? "Loading road route..."
                  : routeSource === "road"
                  ? "Road route active"
                  : "Live route active"}
              </p>
            </div>

            <span className="text-2xl">
              {routeSource === "road"
                ? "🛣️"
                : "📍"}
            </span>

          </div>

          <div className="h-2 overflow-hidden rounded-full bg-white/10">

            <div
              className="h-full rounded-full bg-[#FFBE0B] transition-all duration-500"
              style={{
                width: `${progress * 100}%`,
              }}
            />

          </div>

          <div className="mt-2 flex justify-between text-[10px] font-bold text-gray-500">

            <span>
              Pickup
            </span>

            <span className="text-[#FFBE0B]">
              {Math.round(
                progress * 100
              )}
              %
            </span>

            <span>
              Destination
            </span>

          </div>

        </div>

      </div>

      {/* BOTTOM INFORMATION */}

      <div className="pointer-events-none absolute bottom-4 left-4 right-4 z-[1000]">

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">

          <div className="rounded-2xl border border-white/10 bg-[#080C13]/95 px-4 py-3 shadow-xl backdrop-blur-xl">

            <p className="text-[9px] font-black uppercase tracking-widest text-gray-500">
              Distance
            </p>

            <p className="mt-1 text-lg font-black text-[#FFBE0B]">
              {Number.isFinite(
                displayDistance
              )
                ? displayDistance.toFixed(1)
                : "0.0"}{" "}
              km
            </p>

          </div>

          <div className="rounded-2xl border border-white/10 bg-[#080C13]/95 px-4 py-3 shadow-xl backdrop-blur-xl">

            <p className="text-[9px] font-black uppercase tracking-widest text-gray-500">
              Duration
            </p>

            <p className="mt-1 text-lg font-black text-white">
              {duration || "Calculating"}
            </p>

          </div>

          <div className="rounded-2xl border border-white/10 bg-[#080C13]/95 px-4 py-3 shadow-xl backdrop-blur-xl">

            <p className="text-[9px] font-black uppercase tracking-widest text-gray-500">
              Status
            </p>

            <p className="mt-1 truncate text-sm font-black text-emerald-400">
              Live
            </p>

          </div>

          <div className="rounded-2xl border border-white/10 bg-[#080C13]/95 px-4 py-3 shadow-xl backdrop-blur-xl">

            <p className="text-[9px] font-black uppercase tracking-widest text-gray-500">
              Vehicle
            </p>

            <p className="mt-1 text-sm font-black text-white">
              🚚 RYDO
            </p>

          </div>

        </div>

      </div>

      {/* LEGEND */}

      <div className="pointer-events-none absolute left-5 top-24 z-[1000] hidden rounded-2xl border border-white/10 bg-[#080C13]/90 px-4 py-3 shadow-xl backdrop-blur-xl md:block">

        <div className="space-y-2 text-xs font-bold text-gray-300">

          <div className="flex items-center gap-2">
            <span className="text-base">
              📦
            </span>
            Pickup
          </div>

          <div className="flex items-center gap-2">
            <span className="text-base">
              🚚
            </span>
            Delivery Vehicle
          </div>

          <div className="flex items-center gap-2">
            <span className="text-base">
              🏁
            </span>
            Destination
          </div>

        </div>

      </div>

    </div>
  );
}