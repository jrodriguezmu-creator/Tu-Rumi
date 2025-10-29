import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ==============================
// CONFIG AXIOS
// ==============================
axios.defaults.baseURL = "https://turumiapi.onrender.com";
axios.defaults.withCredentials = true;

// ==============================
// CREAR MATCH (POST /match)
// ==============================
export const createMatch = async (targetUserId) => {
  try {
    const token = await AsyncStorage.getItem("accessToken");
    console.log("🔍 TOKEN A ENVIAR:", token);

    const body = { targetUserId }; // 👈 el backend espera este campo
    const config = {
      headers: {
        accesstoken: token, // 👈 en minúsculas exactas
        "Content-Type": "application/json",
      },
      withCredentials: true,
    };

    console.log("📤 Configuración del request:", {
      endpoint: "/match",
      body,
      headers: config.headers,
    });

    const res = await axios.post("/match", body, config);

    console.log("📬 Respuesta completa del servidor:", res);
    return res.data;
  } catch (err) {
    console.error("❌ Error al crear match:", err.response?.data || err.message);
    console.error("🧱 Detalle del error:", err.response || err);
    throw err;
  }
};

// ==============================
// OBTENER MATCHES (GET /match)
// ==============================
export const getMatches = async () => {
  try {
    const token = await AsyncStorage.getItem("accessToken");
    if (!token) throw new Error("No se encontró accessToken en AsyncStorage");

    const config = {
      headers: {
        accesstoken: token,
      },
      withCredentials: true,
    };

    const res = await axios.get("/match", config);
    console.log("📬 Matches recibidos:", res.data);

    const matches = Array.isArray(res.data.matches) ? res.data.matches : [];
    // Para cada match, obtener el usuario destino usando to_id_user
    const enriched = await Promise.all(
      matches.map(async (m) => {
        const toId = m.to_id_user;
        if (!toId) return m;

        try {
          const userRes = await axios.get(`/user/${toId}`, config);
          // adjuntamos los datos del usuario bajo la propiedad `to_user`
          return { ...m, to_user: userRes.data };
        } catch (userErr) {
          console.warn(
            `⚠️ No se pudo obtener usuario ${toId} para match ${m.id || m.matchId || ''}:`,
            userErr.response?.data || userErr.message
          );
          return { ...m, to_user: null };
        }
      })
    );
    return enriched;
  } catch (err) {
    console.error("❌ Error al obtener matches:", err.response?.data || err.message);
    throw err;
  }
};

// ==============================
// ACTUALIZAR ESTADO DEL MATCH (PUT /match)
// ==============================
export const updateMatchStatus = async (matchId, like) => {
  try {
    const token = await AsyncStorage.getItem("accessToken");
    if (!token) throw new Error("No hay token guardado");

    const body = { matchId, like };
    const config = {
      headers: {
        accesstoken: token,
        "Content-Type": "application/json",
      },
      withCredentials: true,
    };

    console.log("📝 Actualizando match:", body);

    const res = await axios.put("/match", body, config);

    console.log("✅ Match actualizado:", res.data);
    return res.data;
  } catch (err) {
    console.error("❌ Error al actualizar match:", err.response?.data || err.message);
    throw err;
  }
};
