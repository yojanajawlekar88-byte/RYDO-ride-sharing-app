import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAOP2GS4ngLTD03q6j9bf2vcQhWHL0Skms",
  authDomain: "rydo-246aa.firebaseapp.com",
  projectId: "rydo-246aa",
  storageBucket: "rydo-246aa.firebasestorage.app",
  messagingSenderId: "37015193896",
  appId: "1:37015193896:web:c9a080ad8b0be5297a681d",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;