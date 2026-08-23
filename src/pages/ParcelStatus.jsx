import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import {
  MapContainer,
  Marker,
  Popup,
  Polyline,
  TileLayer,
  useMap,
} from "react-leaflet";

import L from "leaflet";

import "leaflet/dist/leaflet.css";

import { db } from "../firebase";

/* =========================================================
   GEOAPIFY
========================================================= */

const GEOAPIFY_API_KEY =
  import.meta.env.VITE_GEOAPIFY_API_KEY;

/* =========================================================
   DEFAULT MAP LOCATION
   Mumbai
========================================================= */

const DEFAULT_CENTER = [19.076, 72.8777];

/* =========================================================
   LEAFLET ICONS
========================================================= */

const pickupIcon = new L.DivIcon({
  className: "custom-map-icon",

  html: `
    <div style="
      width:42px;
      height:42px;
      border-radius:14px;
      background:#22c55e;
      border:3px solid white;
      display:flex;
      align-items:center;
      justify-content:center;
      font-size:22px;
      box-shadow:0 5px 20px rgba(0,0,0,.35);
    ">
      📍
    </div>
  `,

  iconSize: [42, 42],
  iconAnchor: [21, 21],
  popupAnchor: [0, -21],
});

const destinationIcon = new L.DivIcon({
  className: "custom-map-icon",

  html: `
    <div style="
      width:42px;
      height:42px;
      border-radius:14px;
      background:#3b82f6;
      border:3px solid white;
      display:flex;
      align-items:center;
      justify-content:center;
      font-size:22px;
      box-shadow:0 5px 20px rgba(0,0,0,.35);
    ">
      🏠
    </div>
  `,

  iconSize: [42, 42],
  iconAnchor: [21, 21],
  popupAnchor: [0, -21],
});

const driverIcon = new L.DivIcon({
  className: "custom-map-icon",

  html: `
    <div style="
      width:54px;
      height:54px;
      border-radius:18px;
      background:#FFBE0B;
      border:3px solid #111827;
      display:flex;
      align-items:center;
      justify-content:center;
      font-size:28px;
      box-shadow:
        0 0 0 6px rgba(255,190,11,.18),
        0 8px 25px rgba(0,0,0,.4);
    ">
      🚗
    </div>
  `,

  iconSize: [54, 54],
  iconAnchor: [27, 27],
  popupAnchor: [0, -27],
});

/* =========================================================
   COORDINATE HELPERS
========================================================= */

const getCoordinates = (location) => {
  if (!location) {
    return {
      lat: NaN,
      lng: NaN,
    };
  }

  let lat = Number(
    location?.lat ??
      location?.latitude ??
      location?.properties?.lat
  );

  let lng = Number(
    location?.lng ??
      location?.lon ??
      location?.longitude ??
      location?.properties?.lon
  );

  /*
    GeoJSON:
    coordinates = [longitude, latitude]
  */

  if (
    (!Number.isFinite(lat) ||
      !Number.isFinite(lng)) &&
    Array.isArray(location?.geometry?.coordinates)
  ) {
    const coordinates =
      location.geometry.coordinates;

    /*
      Only use a direct coordinate pair.
      Do not accidentally treat a LineString
      as one location.
    */

    if (
      coordinates.length >= 2 &&
      !Array.isArray(coordinates[0])
    ) {
      lng = Number(coordinates[0]);
      lat = Number(coordinates[1]);
    }
  }

  return {
    lat,
    lng,
  };
};

/* =========================================================
   VALID LAT/LNG
========================================================= */

const isValidLatLng = (point) => {
  if (!Array.isArray(point) || point.length < 2) {
    return false;
  }

  const lat = Number(point[0]);
  const lng = Number(point[1]);

  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
};

/* =========================================================
   DISTANCE FORMAT
========================================================= */

const formatDistance = (distance) => {
  const value = Number(distance);

  if (!Number.isFinite(value)) {
    return "Calculating...";
  }

  if (value < 1) {
    return `${Math.round(value * 1000)} m`;
  }

  return `${value.toFixed(2)} km`;
};

/* =========================================================
   TIME FORMAT
========================================================= */

const formatTime = (minutes) => {
  const value = Number(minutes);

  if (!Number.isFinite(value) || value <= 0) {
    return "Calculating...";
  }

  if (value < 60) {
    return `${Math.ceil(value)} min`;
  }

  const hours = Math.floor(value / 60);
  const mins = Math.ceil(value % 60);

  if (mins === 0) {
    return `${hours} hr`;
  }

  return `${hours} hr ${mins} min`;
};

/* =========================================================
   CONVERT GEOAPIFY GEOMETRY
   GeoJSON coordinates are [lng, lat]
   Leaflet requires [lat, lng]
========================================================= */

const convertGeometryToLatLng = (geometry) => {
  if (!geometry) {
    return [];
  }

  let parsedGeometry = geometry;

  if (typeof geometry === "string") {
    try {
      parsedGeometry = JSON.parse(geometry);
    } catch (error) {
      console.error(
        "Unable to parse route geometry:",
        error
      );

      return [];
    }
  }

  let coordinates = [];

  /* -----------------------------------------
     LineString
  ----------------------------------------- */

  if (
    parsedGeometry?.type === "LineString" &&
    Array.isArray(parsedGeometry.coordinates)
  ) {
    coordinates = parsedGeometry.coordinates;
  }

  /* -----------------------------------------
     Feature
  ----------------------------------------- */

  else if (
    parsedGeometry?.type === "Feature" &&
    parsedGeometry?.geometry
  ) {
    const geometryType =
      parsedGeometry.geometry.type;

    if (
      geometryType === "LineString" &&
      Array.isArray(
        parsedGeometry.geometry.coordinates
      )
    ) {
      coordinates =
        parsedGeometry.geometry.coordinates;
    }

    /*
      Support MultiLineString as well.
    */

    else if (
      geometryType === "MultiLineString" &&
      Array.isArray(
        parsedGeometry.geometry.coordinates
      )
    ) {
      coordinates =
        parsedGeometry.geometry.coordinates.flat();
    }
  }

  /* -----------------------------------------
     FeatureCollection
  ----------------------------------------- */

  else if (
    parsedGeometry?.type ===
      "FeatureCollection" &&
    Array.isArray(parsedGeometry.features)
  ) {
    const lineFeatures =
      parsedGeometry.features.filter(
        (feature) => {
          const type =
            feature?.geometry?.type;

          return (
            type === "LineString" ||
            type === "MultiLineString"
          );
        }
      );

    if (lineFeatures.length > 0) {
      const firstGeometry =
        lineFeatures[0]?.geometry;

      if (
        firstGeometry?.type ===
        "MultiLineString"
      ) {
        coordinates =
          firstGeometry.coordinates.flat();
      } else {
        coordinates =
          firstGeometry.coordinates;
      }
    }
  }

  /* -----------------------------------------
     MultiLineString
  ----------------------------------------- */

  else if (
    parsedGeometry?.type ===
      "MultiLineString" &&
    Array.isArray(parsedGeometry.coordinates)
  ) {
    coordinates =
      parsedGeometry.coordinates.flat();
  }

  /* -----------------------------------------
     Direct coordinate array
  ----------------------------------------- */

  else if (
    Array.isArray(parsedGeometry)
  ) {
    coordinates = parsedGeometry;
  }

  return coordinates
    .filter(
      (coordinate) =>
        Array.isArray(coordinate) &&
        coordinate.length >= 2
    )
    .map((coordinate) => [
      Number(coordinate[1]),
      Number(coordinate[0]),
    ])
    .filter(isValidLatLng);
};

/* =========================================================
   MAP CONTROLLER
========================================================= */

function MapController({
  pickup,
  destination,
  route,
  driverPosition,
}) {
  const map = useMap();

  const hasFittedRoute =
    useRef(false);

  /* -----------------------------------------
     Fit map to route / locations
  ----------------------------------------- */

  useEffect(() => {
    if (!map) {
      return;
    }

    if (route.length >= 2) {
      const bounds =
        L.latLngBounds(route);

      if (bounds.isValid()) {
        map.fitBounds(bounds, {
          padding: [50, 50],
          maxZoom: 15,
          animate: true,
        });

        hasFittedRoute.current = true;
      }

      return;
    }

    if (pickup && destination) {
      const bounds =
        L.latLngBounds([
          pickup,
          destination,
        ]);

      if (bounds.isValid()) {
        map.fitBounds(bounds, {
          padding: [50, 50],
          maxZoom: 15,
          animate: true,
        });
      }

      return;
    }

    if (pickup) {
      map.setView(pickup, 14);
    } else if (destination) {
      map.setView(destination, 14);
    }
  }, [
    map,
    pickup,
    destination,
    route,
  ]);

  /* -----------------------------------------
     Keep driver visible
  ----------------------------------------- */

  useEffect(() => {
    if (!map || !driverPosition) {
      return;
    }

    /*
      Do not constantly zoom.
      Just pan to driver.
    */

    map.panTo(driverPosition, {
      animate: true,
      duration: 0.6,
    });
  }, [
    map,
    driverPosition,
  ]);

  return null;
}

/* =========================================================
   STATUS MESSAGE
========================================================= */

function getStatusMessage(
  status,
  driverName
) {
  if (status === "Driver Assigned") {
    return `${
      driverName || "Your driver"
    } has been assigned to your parcel.`;
  }

  if (status === "Driver Coming") {
    return `${
      driverName || "Your driver"
    } is on the way to pick up your parcel.`;
  }

  if (status === "Parcel Picked Up") {
    return "Your parcel has been picked up successfully.";
  }

  if (status === "In Transit") {
    return "Your parcel is on the way to the destination.";
  }

  if (status === "Delivered") {
    return "Your parcel has reached the destination.";
  }

  if (status === "Cancelled") {
    return "This parcel delivery was cancelled.";
  }

  return "Your parcel delivery is being processed.";
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

function ParcelStatus() {
  const navigate = useNavigate();

  const params = useParams();

  /*
    Supports both:

    /parcel-status/:parcelId

    and old:

    /parcel-status/:id
  */

  const parcelId =
    params.parcelId ||
    params.id ||
    "";

  /* =======================================================
     STATE
  ======================================================= */

  const [parcel, setParcel] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [route, setRoute] =
    useState([]);

  const [routeLoading, setRouteLoading] =
    useState(false);

  const [driverPosition, setDriverPosition] =
    useState(null);

  const [routeIndex, setRouteIndex] =
    useState(0);

  const [isMoving, setIsMoving] =
    useState(false);

  const [cancelled, setCancelled] =
    useState(false);

  /*
    Prevent repeated initialization
    when Firestore updates.
  */

  const driverInitializedRef =
    useRef(false);

  const routeCreationRef =
    useRef(false);

  /* =======================================================
     FIRESTORE LISTENER
  ======================================================= */

  useEffect(() => {
    setLoading(true);
    setError("");
    setParcel(null);

    driverInitializedRef.current = false;

    if (!parcelId) {
      console.error(
        "PARCEL STATUS: Parcel ID is missing."
      );

      setError(
        "Parcel ID is missing."
      );

      setLoading(false);

      return;
    }

    console.log(
      "PARCEL STATUS: Loading parcel:",
      parcelId
    );

    const parcelRef =
      doc(
        db,
        "parcelDeliveries",
        parcelId
      );

    const unsubscribe =
      onSnapshot(
        parcelRef,
        (snapshot) => {
          if (!snapshot.exists()) {
            console.error(
              "PARCEL STATUS: Parcel not found:",
              parcelId
            );

            setError(
              "Parcel delivery not found."
            );

            setParcel(null);
            setLoading(false);

            return;
          }

          const data =
            snapshot.data();

          console.log(
            "PARCEL STATUS: Parcel loaded:",
            snapshot.id,
            data
          );

          const nextParcel = {
            id: snapshot.id,
            ...data,
          };

          setParcel(nextParcel);

          const isCancelled =
            data.status ===
              "Cancelled" ||
            data.status ===
              "Delivery Cancelled";

          setCancelled(
            isCancelled
          );

          setLoading(false);
          setError("");
        },
        (firebaseError) => {
          console.error(
            "PARCEL STATUS FIREBASE ERROR:",
            firebaseError
          );

          setError(
            firebaseError?.message ||
              "Unable to load parcel delivery."
          );

          setLoading(false);
        }
      );

    return () => {
      unsubscribe();
    };
  }, [parcelId]);

  /* =======================================================
     PICKUP
  ======================================================= */

  const pickup = useMemo(() => {
    if (!parcel) {
      return null;
    }

    const coordinates =
      getCoordinates(
        parcel.pickup
      );

    if (
      Number.isFinite(
        coordinates.lat
      ) &&
      Number.isFinite(
        coordinates.lng
      )
    ) {
      return [
        coordinates.lat,
        coordinates.lng,
      ];
    }

    const lat = Number(
      parcel.pickupLat
    );

    const lng = Number(
      parcel.pickupLng
    );

    if (
      Number.isFinite(lat) &&
      Number.isFinite(lng)
    ) {
      return [lat, lng];
    }

    /*
      Support nested coordinates
    */

    const nested =
      getCoordinates(
        parcel.pickupLocation
      );

    if (
      Number.isFinite(
        nested.lat
      ) &&
      Number.isFinite(
        nested.lng
      )
    ) {
      return [
        nested.lat,
        nested.lng,
      ];
    }

    return null;
  }, [parcel]);

  /* =======================================================
     DESTINATION
  ======================================================= */

  const destination = useMemo(() => {
    if (!parcel) {
      return null;
    }

    const coordinates =
      getCoordinates(
        parcel.destination
      );

    if (
      Number.isFinite(
        coordinates.lat
      ) &&
      Number.isFinite(
        coordinates.lng
      )
    ) {
      return [
        coordinates.lat,
        coordinates.lng,
      ];
    }

    const lat = Number(
      parcel.destinationLat
    );

    const lng = Number(
      parcel.destinationLng
    );

    if (
      Number.isFinite(lat) &&
      Number.isFinite(lng)
    ) {
      return [lat, lng];
    }

    const nested =
      getCoordinates(
        parcel.destinationLocation
      );

    if (
      Number.isFinite(
        nested.lat
      ) &&
      Number.isFinite(
        nested.lng
      )
    ) {
      return [
        nested.lat,
        nested.lng,
      ];
    }

    return null;
  }, [parcel]);

  /* =======================================================
     LOAD SAVED ROUTE
  ======================================================= */

  useEffect(() => {
    if (!parcel) {
      setRoute([]);
      return;
    }

    const savedRoute =
      convertGeometryToLatLng(
        parcel.routeGeometry
      );

    if (savedRoute.length >= 2) {
      console.log(
        "PARCEL STATUS: Saved route loaded:",
        savedRoute.length,
        "points"
      );

      setRoute(savedRoute);
      return;
    }

    setRoute([]);
  }, [
    parcel?.routeGeometry,
    parcel,
  ]);

  /* =======================================================
     CREATE ROAD ROUTE
========================================================= */

  useEffect(() => {
    if (
      !parcelId ||
      !pickup ||
      !destination
    ) {
      return;
    }

    /*
      If a valid saved route exists,
      do not request another route.
    */

    const existingRoute =
      convertGeometryToLatLng(
        parcel?.routeGeometry
      );

    if (existingRoute.length >= 2) {
      return;
    }

    /*
      Prevent duplicate API calls while
      Firestore is updating.
    */

    if (routeCreationRef.current) {
      return;
    }

    if (!GEOAPIFY_API_KEY) {
      setError(
        "Geoapify API key is missing. Add VITE_GEOAPIFY_API_KEY to your .env file."
      );

      console.error(
        "VITE_GEOAPIFY_API_KEY is missing."
      );

      return;
    }

    if (
      !isValidLatLng(pickup) ||
      !isValidLatLng(destination)
    ) {
      setError(
        "Pickup or destination coordinates are invalid."
      );

      console.error(
        "Invalid route coordinates:",
        {
          pickup,
          destination,
        }
      );

      return;
    }

    let cancelledRequest = false;

    const createRoute =
      async () => {
        try {
          routeCreationRef.current =
            true;

          setRouteLoading(true);
          setError("");

          /*
            IMPORTANT:

            Leaflet:
              [latitude, longitude]

            Geoapify:
              longitude,latitude

            Therefore we REVERSE the order here.
          */

          const pickupLng =
            Number(pickup[1]);

          const pickupLat =
            Number(pickup[0]);

          const destinationLng =
            Number(destination[1]);

          const destinationLat =
            Number(destination[0]);

          const waypointString =
            `${pickupLng},${pickupLat}|${destinationLng},${destinationLat}`;

          console.log(
            "GEOAPIFY ROUTE WAYPOINTS:",
            waypointString
          );

          const url =
            `https://api.geoapify.com/v1/routing?waypoints=${encodeURIComponent(
              waypointString
            )}&mode=drive&details=instruction_details&apiKey=${encodeURIComponent(
              GEOAPIFY_API_KEY
            )}`;

          console.log(
            "GEOAPIFY ROUTING REQUEST STARTED"
          );

          const response =
            await fetch(url);

          if (!response.ok) {
            const responseText =
              await response.text().catch(
                () => ""
              );

            throw new Error(
              `Geoapify routing failed (${response.status}). ${
                responseText
                  ? responseText.slice(
                      0,
                      200
                    )
                  : ""
              }`
            );
          }

          const data =
            await response.json();

          console.log(
            "GEOAPIFY ROUTING RESPONSE:",
            data
          );

          if (
            !Array.isArray(
              data?.features
            ) ||
            data.features.length === 0
          ) {
            throw new Error(
              "Geoapify could not find a driving route between these locations."
            );
          }

          const feature =
            data.features[0];

          const geometry =
            feature?.geometry;

          const calculatedRoute =
            convertGeometryToLatLng(
              geometry
            );

          if (
            calculatedRoute.length < 2
          ) {
            throw new Error(
              "Geoapify returned a route, but no usable road coordinates were found."
            );
          }

          if (cancelledRequest) {
            return;
          }

          console.log(
            "ROAD ROUTE CREATED:",
            calculatedRoute.length,
            "points"
          );

          setRoute(
            calculatedRoute
          );

          /* ---------------------------------------
             ROUTE INFORMATION
          --------------------------------------- */

          const properties =
            feature?.properties || {};

          const distanceMeters =
            Number(
              properties.distance
            );

          const timeSeconds =
            Number(
              properties.time
            );

          const distanceKm =
            Number.isFinite(
              distanceMeters
            )
              ? distanceMeters / 1000
              : 0;

          const routeTimeMinutes =
            Number.isFinite(
              timeSeconds
            )
              ? timeSeconds / 60
              : 0;

          /* ---------------------------------------
             SAVE ROUTE TO FIRESTORE
          --------------------------------------- */

          const parcelRef =
            doc(
              db,
              "parcelDeliveries",
              parcelId
            );

          await updateDoc(
            parcelRef,
            {
              routeGeometry:
                geometry,

              distanceKm,

              routeTimeMinutes,

              routeReady: true,

              gpsStatus:
                "Live",

              updatedAt:
                serverTimestamp(),
            }
          );

          console.log(
            "ROUTE SAVED TO FIRESTORE"
          );
        } catch (routeError) {
          console.error(
            "PARCEL ROUTE ERROR:",
            routeError
          );

          if (!cancelledRequest) {
            setError(
              routeError?.message ||
                "Unable to calculate the road route."
            );
          }
        } finally {
          if (!cancelledRequest) {
            setRouteLoading(false);
          }

          routeCreationRef.current =
            false;
        }
      };

    createRoute();

    return () => {
      cancelledRequest = true;
    };
  }, [
    parcelId,
    parcel?.routeGeometry,
    pickup,
    destination,
  ]);

  /* =======================================================
     INITIAL DRIVER POSITION
  ======================================================= */

  useEffect(() => {
    if (!parcel) {
      return;
    }

    /*
      Once a driver position has been initialized,
      don't reset it every Firestore snapshot.
    */

    if (driverInitializedRef.current) {
      return;
    }

    const existingLat =
      Number(parcel.driverLat);

    const existingLng =
      Number(parcel.driverLng);

    /*
      1. Existing driver location
    */

    if (
      Number.isFinite(
        existingLat
      ) &&
      Number.isFinite(
        existingLng
      ) &&
      existingLat >= -90 &&
      existingLat <= 90 &&
      existingLng >= -180 &&
      existingLng <= 180
    ) {
      const existingPosition = [
        existingLat,
        existingLng,
      ];

      setDriverPosition(
        existingPosition
      );

      /*
        Find closest route point.
      */

      if (route.length > 0) {
        let nearestIndex = 0;
        let nearestDistance =
          Infinity;

        route.forEach(
          (point, index) => {
            const distance =
              Math.pow(
                point[0] -
                  existingLat,
                2
              ) +
              Math.pow(
                point[1] -
                  existingLng,
                2
              );

            if (
              distance <
              nearestDistance
            ) {
              nearestDistance =
                distance;

              nearestIndex =
                index;
            }
          }
        );

        setRouteIndex(
          nearestIndex
        );
      }

      driverInitializedRef.current =
        true;

      return;
    }

    /*
      2. If no driver coordinates exist,
      start at pickup / first route point.
    */

    if (route.length >= 2) {
      setRouteIndex(0);

      setDriverPosition(
        route[0]
      );

      driverInitializedRef.current =
        true;

      return;
    }

    if (pickup) {
      setDriverPosition(
        pickup
      );

      driverInitializedRef.current =
        true;
    }
  }, [
    parcel,
    route,
    pickup,
  ]);

  /* =======================================================
     START DRIVER MOVEMENT
  ======================================================= */

  useEffect(() => {
    if (
      !parcel ||
      route.length < 2
    ) {
      return;
    }

    if (
      cancelled ||
      parcel.status ===
        "Cancelled" ||
      parcel.status ===
        "Delivered"
    ) {
      setIsMoving(false);
      return;
    }

    if (
      routeIndex >=
      route.length - 1
    ) {
      setIsMoving(false);
      return;
    }

    /*
      Start movement shortly after
      the route appears.
    */

    const timer =
      setTimeout(() => {
        setIsMoving(true);
      }, 3000);

    return () => {
      clearTimeout(timer);
    };
  }, [
    parcel,
    route.length,
    routeIndex,
    cancelled,
  ]);

  /* =======================================================
     MOVE DRIVER ALONG ROAD ROUTE
  ======================================================= */

  useEffect(() => {
    if (!isMoving) {
      return;
    }

    if (
      route.length < 2 ||
      routeIndex >=
        route.length - 1
    ) {
      setIsMoving(false);
      return;
    }

    /*
      Move one route point at a time.
    */

    const timer =
      setTimeout(() => {
        const nextIndex =
          routeIndex + 1;

        setRouteIndex(
          nextIndex
        );

        setDriverPosition(
          route[nextIndex]
        );

        if (
          nextIndex >=
          route.length - 1
        ) {
          setIsMoving(false);
        }
      }, 1200);

    return () => {
      clearTimeout(timer);
    };
  }, [
    isMoving,
    route,
    routeIndex,
  ]);

  /* =======================================================
     UPDATE DRIVER LOCATION
  ======================================================= */

  useEffect(() => {
    if (
      !parcelId ||
      !driverPosition
    ) {
      return;
    }

    if (
      !isValidLatLng(
        driverPosition
      )
    ) {
      return;
    }

    /*
      Don't write after cancellation.
    */

    if (cancelled) {
      return;
    }

    const [
      driverLat,
      driverLng,
    ] = driverPosition;

    const parcelRef =
      doc(
        db,
        "parcelDeliveries",
        parcelId
      );

    updateDoc(
      parcelRef,
      {
        driverLat:
          Number(driverLat),

        driverLng:
          Number(driverLng),

        driverOnline: true,

        gpsStatus: "Live",

        updatedAt:
          serverTimestamp(),
      }
    ).catch((firebaseError) => {
      console.error(
        "DRIVER LOCATION UPDATE ERROR:",
        firebaseError
      );
    });
  }, [
    driverPosition,
    parcelId,
    cancelled,
  ]);

  /* =======================================================
     STATUS UPDATE
  ======================================================= */

  useEffect(() => {
    if (
      !parcel ||
      !parcelId ||
      route.length < 2
    ) {
      return;
    }

    if (
      parcel.status ===
        "Cancelled" ||
      parcel.status ===
        "Delivered"
    ) {
      return;
    }

    const progress =
      routeIndex /
      Math.max(
        route.length - 1,
        1
      );

    let newStatus =
      "Driver Assigned";

    let newStep = 1;

    if (progress >= 0.1) {
      newStatus =
        "Driver Coming";

      newStep = 2;
    }

    if (progress >= 0.3) {
      newStatus =
        "Parcel Picked Up";

      newStep = 3;
    }

    if (progress >= 0.5) {
      newStatus =
        "In Transit";

      newStep = 4;
    }

    if (
      routeIndex >=
      route.length - 1
    ) {
      newStatus =
        "Delivered";

      newStep = 5;
    }

    if (
      parcel.status ===
        newStatus &&
      Number(
        parcel.statusStep
      ) === newStep
    ) {
      return;
    }

    const parcelRef =
      doc(
        db,
        "parcelDeliveries",
        parcelId
      );

    const historyEntry = {
      status:
        newStatus,

      message:
        getStatusMessage(
          newStatus,
          parcel.driver
        ),

      timestamp:
        new Date().toISOString(),
    };

    const oldHistory =
      Array.isArray(
        parcel.statusHistory
      )
        ? parcel.statusHistory
        : [];

    updateDoc(
      parcelRef,
      {
        status:
          newStatus,

        statusStep:
          newStep,

        gpsStatus:
          newStatus ===
          "Delivered"
            ? "Completed"
            : "Live",

        driverOnline:
          newStatus !==
          "Delivered",

        statusHistory:
          [
            ...oldHistory,
            historyEntry,
          ],

        ...(newStatus ===
          "Delivered"
          ? {
              deliveredAt:
                serverTimestamp(),
            }
          : {}),

        updatedAt:
          serverTimestamp(),
      }
    ).catch((firebaseError) => {
      console.error(
        "STATUS UPDATE ERROR:",
        firebaseError
      );
    });
  }, [
    routeIndex,
    route,
    parcel,
    parcelId,
  ]);

  /* =======================================================
     STOP AT DESTINATION
  ======================================================= */

  useEffect(() => {
    if (
      route.length < 2
    ) {
      return;
    }

    if (
      routeIndex >=
      route.length - 1
    ) {
      setIsMoving(false);
    }
  }, [
    routeIndex,
    route,
  ]);

  /* =======================================================
     CANCEL DELIVERY
  ======================================================= */

  const cancelDelivery =
    async () => {
      if (!parcel) {
        return;
      }

      if (
        currentStatus ===
          "Delivered" ||
        currentStatus ===
          "Cancelled"
      ) {
        return;
      }

      const confirmed =
        window.confirm(
          "Are you sure you want to cancel this parcel delivery?"
        );

      if (!confirmed) {
        return;
      }

      try {
        const parcelRef =
          doc(
            db,
            "parcelDeliveries",
            parcelId
          );

        const historyEntry = {
          status:
            "Cancelled",

          message:
            "Parcel delivery was cancelled by the customer.",

          timestamp:
            new Date().toISOString(),
        };

        await updateDoc(
          parcelRef,
          {
            status:
              "Cancelled",

            statusStep:
              0,

            gpsStatus:
              "Cancelled",

            driverOnline:
              false,

            cancelledAt:
              serverTimestamp(),

            updatedAt:
              serverTimestamp(),

            statusHistory:
              [
                ...(Array.isArray(
                  parcel.statusHistory
                )
                  ? parcel.statusHistory
                  : []),
                historyEntry,
              ],
          }
        );

        setCancelled(true);
        setIsMoving(false);

        alert(
          "Parcel delivery cancelled."
        );
      } catch (cancelError) {
        console.error(
          "CANCEL PARCEL ERROR:",
          cancelError
        );

        setError(
          cancelError?.message ||
            "Unable to cancel parcel delivery."
        );
      }
    };

  /* =======================================================
     CHAT DRIVER
  ======================================================= */

  const chatWithDriver =
    () => {
      if (!parcel?.driverPhone) {
        setError(
          "Driver phone number is not available."
        );

        return;
      }

      const rawPhone =
        String(
          parcel.driverPhone
        ).replace(
          /\D/g,
          ""
        );

      let cleanPhone =
        rawPhone;

      /*
        If number already contains
        India's 91 prefix, don't add
        another 91.
      */

      if (
        cleanPhone.startsWith(
          "91"
        ) &&
        cleanPhone.length === 12
      ) {
        cleanPhone =
          cleanPhone.slice(2);
      }

      if (
        cleanPhone.length !==
        10
      ) {
        setError(
          "The driver's phone number is invalid."
        );

        return;
      }

      const message =
        encodeURIComponent(
          `Hello ${
            parcel.driver ||
            "Driver"
          }, I am contacting you regarding my RYDO parcel delivery ${
            parcel.parcelId ||
            parcel.id ||
            ""
          }.`
        );

      window.open(
        `https://wa.me/91${cleanPhone}?text=${message}`,
        "_blank",
        "noopener,noreferrer"
      );
    };

  /* =======================================================
     CALL DRIVER
  ======================================================= */

  const callDriver =
    () => {
      if (!parcel?.driverPhone) {
        setError(
          "Driver phone number is not available."
        );

        return;
      }

      const rawPhone =
        String(
          parcel.driverPhone
        ).replace(
          /\D/g,
          ""
        );

      let cleanPhone =
        rawPhone;

      if (
        cleanPhone.startsWith(
          "91"
        ) &&
        cleanPhone.length === 12
      ) {
        cleanPhone =
          cleanPhone.slice(2);
      }

      if (
        cleanPhone.length !==
        10
      ) {
        setError(
          "The driver's phone number is invalid."
        );

        return;
      }

      window.location.href =
        `tel:+91${cleanPhone}`;
    };

  /* =======================================================
     HOME
  ======================================================= */

  const goHome = () => {
    navigate("/");
  };

  /* =======================================================
     CURRENT STATUS
  ======================================================= */

  const currentStatus =
    parcel?.status ||
    "Loading...";

  const statusStep =
    Number(
      parcel?.statusStep
    ) || 1;

  /* =======================================================
     MAP CENTER
  ======================================================= */

  const mapCenter =
    driverPosition ||
    pickup ||
    destination ||
    DEFAULT_CENTER;

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070A11] text-white flex items-center justify-center">
        <div className="text-center">

          <div className="w-16 h-16 rounded-full border-4 border-white/10 border-t-[#FFBE0B] animate-spin mx-auto" />

          <p className="text-gray-400 mt-5 font-bold">
            Loading parcel delivery...
          </p>

        </div>
      </div>
    );
  }

  /* =======================================================
     NOT FOUND
  ======================================================= */

  if (!parcel) {
    return (
      <div className="min-h-screen bg-[#070A11] text-white flex items-center justify-center px-5">

        <div className="max-w-lg w-full rounded-[2rem] border border-red-500/20 bg-red-500/10 p-8 text-center">

          <div className="text-5xl">
            ⚠️
          </div>

          <h1 className="text-3xl font-black mt-5">
            Parcel Not Found
          </h1>

          <p className="text-gray-400 mt-3">
            {error ||
              "We could not find this parcel delivery."}
          </p>

          {parcelId && (
            <p className="text-xs text-gray-600 mt-4 break-all">
              Parcel ID: {parcelId}
            </p>
          )}

          {!parcelId && (
            <p className="text-xs text-red-400/70 mt-4">
              No parcel ID was provided in the URL.
            </p>
          )}

          <button
            type="button"
            onClick={goHome}
            className="mt-7 w-full bg-[#FFBE0B] text-black py-4 rounded-2xl font-black hover:bg-[#ffd45a] transition"
          >
            Back to Home
          </button>

        </div>
      </div>
    );
  }

  /* =======================================================
     MAIN UI
  ======================================================= */

  return (
    <div className="min-h-screen bg-[#070A11] text-white">

      {/* BACKGROUND */}

      <div className="fixed inset-0 pointer-events-none overflow-hidden">

        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-[#FFBE0B]/10 blur-3xl" />

        <div className="absolute top-[45%] -right-40 w-96 h-96 rounded-full bg-blue-500/5 blur-3xl" />

        <div className="absolute bottom-0 left-[35%] w-96 h-96 rounded-full bg-green-500/5 blur-3xl" />

      </div>

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-16">

        {/* HEADER */}

        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-8">

          <div>

            <p className="text-[#FFBE0B] text-xs font-black uppercase tracking-[0.25em]">
              RYDO Express
            </p>

            <h1 className="text-4xl sm:text-5xl font-black mt-2">
              Track your parcel
            </h1>

            <p className="text-gray-500 mt-3">
              Follow your parcel from pickup to
              delivery in real time.
            </p>

          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4">

            <p className="text-xs text-gray-500 uppercase tracking-widest">
              Parcel ID
            </p>

            <p className="font-black text-[#FFBE0B] mt-1">
              {parcel.parcelId ||
                parcel.id}
            </p>

          </div>

        </div>

        {/* ERROR */}

        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4">

            <p className="text-red-400 font-bold">
              ⚠️ {error}
            </p>

          </div>
        )}

        {/* ROUTE CALCULATING */}

        {routeLoading && (
          <div className="mb-6 rounded-2xl border border-[#FFBE0B]/20 bg-[#FFBE0B]/10 px-5 py-4">

            <div className="flex items-center gap-3">

              <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-[#FFBE0B] animate-spin" />

              <p className="text-[#FFBE0B] font-bold">
                Calculating driving route...
              </p>

            </div>

          </div>
        )}

        {/* STATUS BANNER */}

        <div
          className={`rounded-[2rem] border p-6 mb-7 ${
            currentStatus ===
              "Delivered"
              ? "border-emerald-500/30 bg-emerald-500/10"
              : currentStatus ===
                "Cancelled"
              ? "border-red-500/30 bg-red-500/10"
              : "border-[#FFBE0B]/30 bg-[#FFBE0B]/10"
          }`}
        >

          <div className="flex flex-col sm:flex-row sm:items-center gap-5">

            <div className="w-16 h-16 rounded-2xl bg-black/30 flex items-center justify-center text-3xl">
              {currentStatus ===
              "Delivered"
                ? "✅"
                : currentStatus ===
                  "Cancelled"
                ? "❌"
                : "📦"}
            </div>

            <div className="flex-1">

              <p className="text-xs text-gray-500 uppercase tracking-widest font-black">
                Current status
              </p>

              <h2 className="text-2xl sm:text-3xl font-black mt-1">
                {currentStatus}
              </h2>

              <p className="text-gray-400 mt-1">
                {getStatusMessage(
                  currentStatus,
                  parcel.driver
                )}
              </p>

            </div>

            <div className="text-left sm:text-right">

              <p className="text-xs text-gray-500 uppercase tracking-widest">
                GPS
              </p>

              <p
                className={`font-black mt-1 ${
                  parcel.gpsStatus ===
                    "Cancelled"
                    ? "text-red-400"
                    : parcel.gpsStatus ===
                      "Completed"
                    ? "text-emerald-400"
                    : "text-emerald-400"
                }`}
              >
                {parcel.gpsStatus ||
                  "Waiting"}
              </p>

            </div>

          </div>

        </div>

        {/* =================================================
            LIVE MAP
        ================================================= */}

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.035] overflow-hidden">

          <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

            <div>

              <p className="text-[#FFBE0B] text-xs font-black uppercase tracking-widest">
                Live Map
              </p>

              <h2 className="text-2xl font-black mt-1">
                Driver location
              </h2>

              <p className="text-gray-500 text-sm mt-1">
                Your delivery vehicle follows the
                road route from pickup to destination.
              </p>

            </div>

            <div className="flex items-center gap-2">

              <span
                className={`w-3 h-3 rounded-full ${
                  isMoving
                    ? "bg-emerald-400 animate-pulse"
                    : currentStatus ===
                      "Delivered"
                    ? "bg-emerald-400"
                    : "bg-gray-500"
                }`}
              />

              <span className="text-sm font-bold text-gray-400">
                {isMoving
                  ? "Driver moving"
                  : currentStatus ===
                    "Delivered"
                  ? "Delivery complete"
                  : routeLoading
                  ? "Calculating route"
                  : "Driver waiting"}
              </span>

            </div>

          </div>

          {/* MAP */}

          <div className="h-[430px] w-full relative">

            <MapContainer
              center={mapCenter}
              zoom={13}
              scrollWheelZoom={true}
              zoomControl={true}
              className="h-full w-full"
            >

              <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <MapController
                pickup={pickup}
                destination={destination}
                route={route}
                driverPosition={
                  driverPosition
                }
              />

              {/* FULL ROAD ROUTE */}

              {route.length >= 2 && (
                <Polyline
                  positions={route}
                  pathOptions={{
                    color:
                      "#FFBE0B",
                    weight: 6,
                    opacity: 0.85,
                    lineCap: "round",
                    lineJoin: "round",
                  }}
                />
              )}

              {/* COMPLETED ROUTE */}

              {route.length >= 2 &&
                routeIndex > 0 && (
                  <Polyline
                    positions={route.slice(
                      0,
                      Math.min(
                        routeIndex + 1,
                        route.length
                      )
                    )}
                    pathOptions={{
                      color:
                        "#22c55e",
                      weight: 8,
                      opacity: 0.95,
                      lineCap: "round",
                      lineJoin: "round",
                    }}
                  />
                )}

              {/* PICKUP */}

              {pickup && (
                <Marker
                  position={pickup}
                  icon={
                    pickupIcon
                  }
                >
                  <Popup>

                    <strong>
                      📍 Pickup
                    </strong>

                    <br />

                    {parcel.pickupAddress ||
                      parcel.pickupShortName ||
                      "Pickup location"}

                  </Popup>
                </Marker>
              )}

              {/* DESTINATION */}

              {destination && (
                <Marker
                  position={
                    destination
                  }
                  icon={
                    destinationIcon
                  }
                >
                  <Popup>

                    <strong>
                      🏠 Destination
                    </strong>

                    <br />

                    {parcel.destinationAddress ||
                      parcel.destinationShortName ||
                      "Delivery destination"}

                  </Popup>
                </Marker>
              )}

              {/* DRIVER */}

              {driverPosition && (
                <Marker
                  position={
                    driverPosition
                  }
                  icon={driverIcon}
                >
                  <Popup>

                    <strong>
                      🚗{" "}
                      {parcel.driver ||
                        "RYDO Driver"}
                    </strong>

                    <br />

                    {parcel.vehicle ||
                      "Delivery vehicle"}

                    <br />

                    <span>
                      {isMoving
                        ? "🟢 Driver is moving"
                        : currentStatus ===
                          "Delivered"
                        ? "✅ Delivery completed"
                        : "🟡 Driver is waiting"}
                    </span>

                  </Popup>
                </Marker>
              )}

            </MapContainer>

            {/* MAP OVERLAY */}

            {routeLoading && (
              <div className="absolute top-4 left-4 right-4 z-[1000] pointer-events-none">

                <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-3 shadow-xl">

                  <div className="flex items-center gap-3">

                    <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-[#FFBE0B] animate-spin" />

                    <p className="text-sm font-bold text-white">
                      🛣️ Finding road route...
                    </p>

                  </div>

                </div>

              </div>
            )}

            {/* NO COORDINATES */}

            {!pickup &&
              !destination && (
                <div className="absolute inset-0 z-[900] flex items-center justify-center pointer-events-none">

                  <div className="bg-black/80 backdrop-blur-xl border border-red-500/20 rounded-2xl px-6 py-5 text-center">

                    <p className="text-red-400 font-black">
                      📍 Location unavailable
                    </p>

                    <p className="text-gray-500 text-sm mt-1">
                      Pickup and destination coordinates
                      are missing from this parcel.
                    </p>

                  </div>

                </div>
              )}

          </div>

          {/* MAP INFO */}

          <div className="grid sm:grid-cols-3 gap-4 p-5 sm:p-6 border-t border-white/10">

            <div className="rounded-2xl bg-black/20 border border-white/10 p-4">

              <p className="text-xs text-gray-500 uppercase tracking-widest">
                Distance
              </p>

              <p className="text-xl font-black text-[#FFBE0B] mt-1">
                {formatDistance(
                  parcel.distanceKm
                )}
              </p>

            </div>

            <div className="rounded-2xl bg-black/20 border border-white/10 p-4">

              <p className="text-xs text-gray-500 uppercase tracking-widest">
                Route duration
              </p>

              <p className="text-xl font-black mt-1">
                {formatTime(
                  parcel.routeTimeMinutes
                )}
              </p>

            </div>

            <div className="rounded-2xl bg-black/20 border border-white/10 p-4">

              <p className="text-xs text-gray-500 uppercase tracking-widest">
                Driver
              </p>

              <p className="text-xl font-black mt-1">
                {parcel.driver ||
                  "RYDO Driver"}
              </p>

            </div>

          </div>

        </section>

        {/* =================================================
            STATUS TIMELINE
        ================================================= */}

        <section className="mt-8 rounded-[2rem] border border-white/10 bg-white/[0.035] p-6 sm:p-8">

          <p className="text-[#FFBE0B] text-xs font-black uppercase tracking-widest">
            Delivery journey
          </p>

          <h2 className="text-2xl sm:text-3xl font-black mt-2">
            Parcel status
          </h2>

          <div className="mt-8">

            {[
              {
                step: 1,
                title:
                  "Driver Assigned",
                description:
                  "A RYDO driver has been assigned.",
                icon: "👨‍✈️",
              },

              {
                step: 2,
                title:
                  "Driver Coming",
                description:
                  "Your driver is travelling to pickup.",
                icon: "🚗",
              },

              {
                step: 3,
                title:
                  "Parcel Picked Up",
                description:
                  "Your parcel has been collected.",
                icon: "📦",
              },

              {
                step: 4,
                title:
                  "In Transit",
                description:
                  "Your parcel is travelling to the destination.",
                icon: "🛣️",
              },

              {
                step: 5,
                title:
                  "Delivered",
                description:
                  "Your parcel has reached the receiver.",
                icon: "🏠",
              },
            ].map(
              (
                item,
                index,
                array
              ) => {
                const completed =
                  currentStatus ===
                    "Cancelled"
                    ? false
                    : statusStep >=
                      item.step;

                const active =
                  statusStep ===
                  item.step;

                return (
                  <div
                    key={
                      item.step
                    }
                    className="flex gap-4"
                  >

                    <div className="flex flex-col items-center">

                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl border ${
                          completed
                            ? "bg-[#FFBE0B] text-black border-[#FFBE0B]"
                            : "bg-black/30 text-gray-600 border-white/10"
                        } ${
                          active
                            ? "shadow-[0_0_25px_rgba(255,190,11,.2)]"
                            : ""
                        }`}
                      >
                        {
                          item.icon
                        }
                      </div>

                      {index <
                        array.length -
                          1 && (
                        <div
                          className={`w-px h-12 ${
                            statusStep >
                            item.step &&
                            currentStatus !==
                              "Cancelled"
                              ? "bg-[#FFBE0B]"
                              : "bg-white/10"
                          }`}
                        />
                      )}

                    </div>

                    <div className="pb-8">

                      <p
                        className={`font-black ${
                          completed
                            ? "text-white"
                            : "text-gray-600"
                        }`}
                      >
                        {
                          item.title
                        }
                      </p>

                      <p className="text-sm text-gray-500 mt-1">
                        {
                          item.description
                        }
                      </p>

                    </div>

                  </div>
                );
              }
            )}

          </div>

          {/* CANCELLED MESSAGE */}

          {currentStatus ===
            "Cancelled" && (
            <div className="mt-2 rounded-2xl border border-red-500/20 bg-red-500/10 p-4">

              <p className="text-red-400 font-black">
                ✕ Delivery Cancelled
              </p>

              <p className="text-gray-500 text-sm mt-1">
                This parcel delivery is no longer
                active.
              </p>

            </div>
          )}

        </section>

        {/* =================================================
            PARCEL DETAILS
        ================================================= */}

        <section className="mt-8 grid lg:grid-cols-2 gap-6">

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-6">

            <p className="text-[#FFBE0B] text-xs font-black uppercase tracking-widest">
              Parcel information
            </p>

            <h2 className="text-2xl font-black mt-2">
              Delivery details
            </h2>

            <div className="mt-6 space-y-4">

              <InfoRow
                label="Parcel"
                value={
                  parcel.parcelDetails ||
                  parcel.parcelType ||
                  "Parcel"
                }
              />

              <InfoRow
                label="Sender"
                value={
                  parcel.senderName ||
                  "Not available"
                }
              />

              <InfoRow
                label="Sender phone"
                value={
                  parcel.senderPhone ||
                  "Not available"
                }
              />

              <InfoRow
                label="Receiver"
                value={
                  parcel.receiverName ||
                  "Not available"
                }
              />

              <InfoRow
                label="Receiver phone"
                value={
                  parcel.receiverPhone ||
                  "Not available"
                }
              />

              <InfoRow
                label="Payment"
                value={
                  parcel.paymentStatus ||
                  "Paid"
                }
              />

            </div>

          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-6">

            <p className="text-blue-400 text-xs font-black uppercase tracking-widest">
              Route information
            </p>

            <h2 className="text-2xl font-black mt-2">
              Pickup & delivery
            </h2>

            <div className="mt-6 space-y-5">

              <div className="flex gap-4">

                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
                  📍
                </div>

                <div className="flex-1 min-w-0">

                  <p className="text-xs text-gray-500 uppercase tracking-widest">
                    Pickup
                  </p>

                  <p className="font-bold mt-1 break-words">
                    {parcel.pickupAddress ||
                      parcel.pickupShortName ||
                      "Pickup location"}
                  </p>

                </div>

              </div>

              <div className="ml-5 h-8 border-l border-dashed border-[#FFBE0B]/40" />

              <div className="flex gap-4">

                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                  🏠
                </div>

                <div className="flex-1 min-w-0">

                  <p className="text-xs text-gray-500 uppercase tracking-widest">
                    Destination
                  </p>

                  <p className="font-bold mt-1 break-words">
                    {parcel.destinationAddress ||
                      parcel.destinationShortName ||
                      "Delivery destination"}
                  </p>

                </div>

              </div>

            </div>

          </div>

        </section>

        {/* =================================================
            DRIVER CARD
        ================================================= */}

        <section className="mt-8 rounded-[2rem] border border-white/10 bg-white/[0.035] p-6 sm:p-8">

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

            <div className="flex items-center gap-5">

              <div className="w-16 h-16 rounded-2xl bg-[#FFBE0B]/10 border border-[#FFBE0B]/20 flex items-center justify-center text-3xl">
                👨‍✈️
              </div>

              <div>

                <p className="text-xs text-[#FFBE0B] uppercase tracking-widest font-black">
                  Your Driver
                </p>

                <h3 className="text-2xl font-black mt-1">
                  {parcel.driver ||
                    "RYDO Driver"}
                </h3>

                <p className="text-gray-500 mt-1">
                  {parcel.vehicle ||
                    "Delivery vehicle"}
                </p>

              </div>

            </div>

            <div className="flex flex-col sm:flex-row gap-3">

              <button
                type="button"
                onClick={
                  chatWithDriver
                }
                disabled={
                  currentStatus ===
                    "Delivered" ||
                  currentStatus ===
                    "Cancelled"
                }
                className="px-6 py-4 rounded-2xl border border-green-500/30 bg-green-500/10 text-green-400 font-black hover:bg-green-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                💬 Chat with Driver
              </button>

              <button
                type="button"
                onClick={
                  callDriver
                }
                disabled={
                  currentStatus ===
                    "Delivered" ||
                  currentStatus ===
                    "Cancelled"
                }
                className="px-6 py-4 rounded-2xl border border-blue-500/30 bg-blue-500/10 text-blue-400 font-black hover:bg-blue-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                📞 Call Driver
              </button>

            </div>

          </div>

        </section>

        {/* =================================================
            ACTIONS
        ================================================= */}

        <section className="mt-8 grid sm:grid-cols-2 gap-4">

          <button
            type="button"
            onClick={goHome}
            className="w-full py-5 rounded-2xl border border-white/10 bg-white/[0.04] text-white font-black hover:bg-white/[0.08] transition"
          >
            🏠 Back to Home
          </button>

          <button
            type="button"
            onClick={
              cancelDelivery
            }
            disabled={
              cancelled ||
              currentStatus ===
                "Delivered" ||
              currentStatus ===
                "Cancelled"
            }
            className="w-full py-5 rounded-2xl border border-red-500/30 bg-red-500/10 text-red-400 font-black hover:bg-red-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            {currentStatus ===
              "Delivered"
              ? "✓ Delivery Completed"
              : currentStatus ===
                "Cancelled"
              ? "✕ Delivery Cancelled"
              : "✕ Cancel Delivery"}
          </button>

        </section>

        {/* FOOTER */}

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4 text-xs text-gray-600">

          <span>
            🔒 Secure delivery
          </span>

          <span>•</span>

          <span>
            📍 GPS tracking
          </span>

          <span>•</span>

          <span>
            🚗 Live driver location
          </span>

          <span>•</span>

          <span>
            ⚡ RYDO Express
          </span>

        </div>

      </main>

    </div>
  );
}

/* =========================================================
   INFO ROW
========================================================= */

function InfoRow({
  label,
  value,
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-xl bg-black/20 border border-white/10 px-4 py-3">

      <span className="text-gray-500 text-sm">
        {label}
      </span>

      <span className="font-bold text-right break-words">
        {value}
      </span>

    </div>
  );
}

export default ParcelStatus;