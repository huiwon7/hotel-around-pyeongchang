/**
 * Firebase Configuration - Hotel Around Pyeongchang
 */
const firebaseConfig = {
  apiKey: "AIzaSyAThvLKVG1asR5Qh4dnQRtejhkCXQLH9Oc",
  authDomain: "hotel-around-pyeongchang.firebaseapp.com",
  projectId: "hotel-around-pyeongchang",
  storageBucket: "hotel-around-pyeongchang.firebasestorage.app",
  messagingSenderId: "835651267582",
  appId: "1:835651267582:web:a8c5e3b0813c5425af6eaf"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
