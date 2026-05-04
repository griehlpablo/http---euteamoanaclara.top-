// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore"; 
import { getStorage } from "firebase/storage";     
import { getDatabase } from "firebase/database"; // 1. Adicione este import para a Galeria!

const firebaseConfig = {
  apiKey: "AIzaSyDS1YA0FRvCIryjreFVzRMZyaHhYtm-pUU",
  authDomain: "euteamoanaclaraks.firebaseapp.com",
  databaseURL: "https://euteamoanaclaraks-default-rtdb.firebaseio.com",
  projectId: "euteamoanaclaraks",
  storageBucket: "euteamoanaclaraks.firebasestorage.app",
  messagingSenderId: "972847187116",
  appId: "1:972847187116:web:016a7b8a3dd7a688320b09",
  measurementId: "G-7LN9PKSCW3"
};

// Inicializa o Firebase e os serviços
const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);

// Exporta os serviços para o projeto
export const db = getFirestore(app);
export const storage = getStorage(app);
export const rtdb = getDatabase(app); // 2. Adicione esta exportação!